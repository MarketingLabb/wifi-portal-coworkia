const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { generateBatch } = require('../utils/codeGenerator');

// Generar códigos en lote
router.post('/generate', (req, res) => {
  try {
    const { quantity = 10 } = req.body;
    const codes = generateBatch(parseInt(quantity));
    
    const insert = db.prepare('INSERT INTO codes (code) VALUES (?)');
    const insertMany = db.transaction((codes) => {
      for (const code of codes) {
        try {
          insert.run(code);
        } catch (err) {
          // Código duplicado, continuar
        }
      }
    });
    
    insertMany(codes);
    
    res.json({ 
      success: true, 
      message: `${quantity} códigos generados exitosamente`,
      codes 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Listar todos los códigos
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM codes';
    
    if (status) {
      query += ' WHERE status = ?';
      const codes = db.prepare(query).all(status);
      return res.json({ success: true, codes });
    }
    
    const codes = db.prepare(query).all();
    res.json({ success: true, codes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM codes
      GROUP BY status
    `).all();
    
    const total = db.prepare('SELECT COUNT(*) as count FROM codes').get();
    const activeSessions = db.prepare(
      'SELECT COUNT(*) as count FROM sessions WHERE disconnected_at IS NULL'
    ).get();
    
    res.json({ 
      success: true, 
      stats,
      total: total.count,
      activeSessions: activeSessions.count
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar código
router.delete('/:code', (req, res) => {
  try {
    const { code } = req.params;
    const result = db.prepare('DELETE FROM codes WHERE code = ?').run(code);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Código no encontrado' });
    }
    
    res.json({ success: true, message: 'Código eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
