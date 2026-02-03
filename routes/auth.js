const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { validateFormat } = require('../utils/codeGenerator');

// Validar código y crear sesión
router.post('/validate', (req, res) => {
  try {
    const { code, clientName, deviceInfo } = req.body;
    
    // Validar formato
    if (!validateFormat(code)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato de código inválido' 
      });
    }
    
    // Buscar código en base de datos
    const codeData = db.prepare('SELECT * FROM codes WHERE code = ?').get(code);
    
    if (!codeData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Código no existe' 
      });
    }
    
    if (codeData.status === 'usado') {
      return res.status(403).json({ 
        success: false, 
        error: 'Código ya fue utilizado' 
      });
    }
    
    if (codeData.status === 'expirado') {
      return res.status(403).json({ 
        success: false, 
        error: 'Código expirado' 
      });
    }
    
    // Crear sesión (2 horas = 7200000 ms)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Actualizar código
    db.prepare(`
      UPDATE codes 
      SET status = 'usado', 
          used_at = ?, 
          expires_at = ?,
          client_name = ?,
          client_device = ?
      WHERE code = ?
    `).run(now.toISOString(), expiresAt.toISOString(), clientName || null, deviceInfo || null, code);
    
    // Crear sesión
    const session = db.prepare(`
      INSERT INTO sessions (code, ip_address, mac_address, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(code, req.ip || '0.0.0.0', req.headers['x-mac-address'] || null, expiresAt.toISOString());
    
    res.json({ 
      success: true, 
      message: 'Acceso concedido',
      expiresAt: expiresAt.toISOString(),
      sessionId: session.lastInsertRowid,
      duration: '2 horas'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener anuncio activo
router.get('/ad', (req, res) => {
  try {
    const ad = db.prepare('SELECT * FROM ads WHERE active = 1 ORDER BY RANDOM() LIMIT 1').get();
    res.json({ success: true, ad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar sesión activa
router.get('/session/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    const session = db.prepare(`
      SELECT * FROM sessions 
      WHERE code = ? 
      AND disconnected_at IS NULL 
      AND datetime(expires_at) > datetime('now')
      ORDER BY started_at DESC 
      LIMIT 1
    `).get(code);
    
    if (!session) {
      return res.json({ success: false, active: false });
    }
    
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const remainingMs = expiresAt - now;
    const remainingMinutes = Math.floor(remainingMs / 60000);
    
    res.json({ 
      success: true, 
      active: true,
      session: {
        ...session,
        remainingMinutes
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
