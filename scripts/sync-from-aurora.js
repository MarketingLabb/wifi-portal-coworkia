#!/usr/bin/env node
/**
 * sync-from-aurora.js
 * 
 * Descarga códigos WiFi pendientes desde Aurora (Heroku) e inserta en SQLite local.
 * Diseñado para ejecutarse cada 5 minutos via crontab:
 *   crontab: * /5 * * * * node /path/to/sync-from-aurora.js >> /tmp/wifi-sync.log 2>&1
 *   (quitar el espacio entre asterisco y /5)
 * 
 * Variables de entorno requeridas (en .env o entorno del sistema):
 *   AURORA_API_URL    - URL base de Aurora, ej: https://coworkia-agent.herokuapp.com
 *   WIFI_SYNC_API_KEY - Clave API compartida con Aurora
 */

'use strict';

const path = require('path');
const https = require('https');
const http = require('http');

// Cargar .env si existe
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) { /* dotenv opcional */ }

const { db, initialize } = require('../database/db');

const AURORA_API_URL = (process.env.AURORA_API_URL || '').replace(/\/$/, '');
const API_KEY = process.env.WIFI_SYNC_API_KEY || '';
const SINCE_MINUTES = 10; // Buscar códigos de los últimos 10 minutos

function log(msg) {
  console.log(`[${new Date().toISOString()}] [WiFi-Sync] ${msg}`);
}

function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Wifi-Api-Key': API_KEY,
        ...(options.headers || {})
      },
      timeout: 15000
    };

    const req = transport.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`JSON parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function sync() {
  if (!AURORA_API_URL) {
    log('ERROR: AURORA_API_URL no configurada. Saliendo.');
    process.exit(1);
  }
  if (!API_KEY) {
    log('ERROR: WIFI_SYNC_API_KEY no configurada. Saliendo.');
    process.exit(1);
  }

  // 1. Inicializar base de datos local
  initialize();

  // 2. Descargar códigos pendientes desde Aurora
  log(`Descargando códigos nuevos desde ${AURORA_API_URL}...`);
  const getUrl = `${AURORA_API_URL}/api/wifi-codes/pending?since=${SINCE_MINUTES}`;
  const response = await fetchJSON(getUrl);

  if (response.status !== 200) {
    log(`ERROR: Aurora respondió ${response.status}: ${JSON.stringify(response.body)}`);
    process.exit(1);
  }

  const codes = response.body.codes || [];
  log(`Recibidos ${codes.length} código(s) desde Aurora.`);

  if (codes.length === 0) {
    log('Sin nuevos códigos. Fin.');
    return;
  }

  // 3. Insertar códigos en SQLite local (ON CONFLICT ignorar duplicados)
  const insert = db.prepare(`
    INSERT INTO codes (code, status, created_at, duration_hours)
    VALUES (?, 'disponible', ?, ?)
    ON CONFLICT (code) DO NOTHING
  `);

  let inserted = 0;
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const result = insert.run(
        item.code,
        item.created_at || new Date().toISOString(),
        item.duration_hours || 2
      );
      if (result.changes > 0) inserted++;
    }
  });

  insertMany(codes);
  log(`Insertados ${inserted} código(s) nuevos en base de datos local.`);

  // 4. Confirmar sincronización a Aurora
  const ids = codes.map(c => c.id);
  const confirmUrl = `${AURORA_API_URL}/api/wifi-codes/confirm-sync`;
  const confirmResponse = await fetchJSON(confirmUrl, {
    method: 'POST',
    body: { ids }
  });

  if (confirmResponse.status === 200) {
    log(`Confirmados ${ids.length} código(s) como sincronizados en Aurora.`);
  } else {
    log(`WARN: confirm-sync respondió ${confirmResponse.status}: ${JSON.stringify(confirmResponse.body)}`);
  }

  log('Sincronización completada.');
}

sync().catch(err => {
  log(`ERROR FATAL: ${err.message}`);
  process.exit(1);
});
