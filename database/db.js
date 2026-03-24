const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'coworkia.db');
const db = new Database(dbPath);

// Crear tablas
function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'disponible',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      expires_at DATETIME,
      client_name TEXT,
      client_device TEXT,
      duration_hours INTEGER DEFAULT 2
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      mac_address TEXT,
      ip_address TEXT,
      client_phone TEXT,
      consent_given INTEGER DEFAULT 0,
      consent_at TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      disconnected_at DATETIME,
      FOREIGN KEY (code) REFERENCES codes(code)
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT,
      link_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insertar anuncio de ejemplo
  const adExists = db.prepare('SELECT COUNT(*) as count FROM ads').get();
  if (adExists.count === 0) {
    db.prepare(`
      INSERT INTO ads (title, image_url, link_url, active) 
      VALUES (?, ?, ?, ?)
    `).run(
      'Bienvenido a Coworkia',
      '/images/default-ad.jpg',
      'https://coworkia.com',
      1
    );
  }

  console.log('✅ Base de datos inicializada');
  
  // Migración: agregar columna duration_hours si no existe
  try {
    db.prepare('ALTER TABLE codes ADD COLUMN duration_hours INTEGER DEFAULT 2').run();
    console.log('✅ Columna duration_hours agregada a codes');
  } catch (e) {
    // Columna ya existe, ignorar error
  }

  // Migración LOPDP: agregar columnas de consentimiento y teléfono en sessions
  try {
    db.prepare('ALTER TABLE sessions ADD COLUMN client_phone TEXT').run();
    console.log('✅ Columna client_phone agregada a sessions');
  } catch (e) { /* ya existe */ }

  try {
    db.prepare('ALTER TABLE sessions ADD COLUMN consent_given INTEGER DEFAULT 0').run();
    console.log('✅ Columna consent_given agregada a sessions');
  } catch (e) { /* ya existe */ }

  try {
    db.prepare('ALTER TABLE sessions ADD COLUMN consent_at TEXT').run();
    console.log('✅ Columna consent_at agregada a sessions');
  } catch (e) { /* ya existe */ }
}

module.exports = {
  db,
  initialize
};
