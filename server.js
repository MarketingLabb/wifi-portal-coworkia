const express = require('express');
const path = require('path');
const cors = require('cors');
const { initialize, db } = require('./database/db');
const codeRoutes = require('./routes/codes');
const authRoutes = require('./routes/auth');
const { getClientInfo } = require('./utils/macHelper');

const app = express();
const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para verificar si el cliente ya está autenticado
app.use(async (req, res, next) => {
  try {
    // Obtener MAC del cliente
    const { ip, mac } = await getClientInfo(req);
    
    console.log(`🔍 Cliente conectando: IP=${ip}, MAC=${mac || 'desconocida'}`);
    
    if (mac) {
      // Verificar si tiene sesión activa
      const session = db.prepare(`
        SELECT * FROM sessions 
        WHERE mac_address = ? 
        AND disconnected_at IS NULL 
        AND datetime(expires_at) > datetime('now')
        ORDER BY started_at DESC 
        LIMIT 1
      `).get(mac);
      
      if (session) {
        console.log(`✅ Cliente autenticado: MAC=${mac}, expira en ${session.expires_at}`);
        
        // Cliente autenticado - responder con HTML simple inline
        if (req.path === '/hotspot-detect.html' || 
            req.path === '/library/test/success.html' ||
            req.path === '/generate_204' ||
            req.path === '/gen_204') {
          
          const expiresAt = new Date(session.expires_at);
          const now = new Date();
          const diffMs = expiresAt - now;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conectado - Coworkia WiFi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: #0d9488;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      color: white;
    }
    h1 { color: #1f2937; font-size: 28px; margin-bottom: 10px; }
    .status { color: #22c55e; font-size: 18px; font-weight: 600; margin-bottom: 30px; }
    .info-box { background: #f3f4f6; border-radius: 15px; padding: 25px; margin-bottom: 20px; }
    .timer { font-size: 48px; font-weight: bold; color: #0d9488; margin-bottom: 10px; }
    .timer-label { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .disconnect-time { color: #374151; font-size: 16px; line-height: 1.6; }
    .disconnect-time strong { color: #1f2937; }
    .footer { margin-top: 20px; color: #9ca3af; font-size: 14px; }
    .close-btn {
      margin-top: 20px;
      background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      text-decoration: none;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✓</div>
    <h1>¡Ya estás conectado!</h1>
    <p class="status">Navegación activa</p>
    <div class="info-box">
      <div class="timer">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</div>
      <div class="timer-label">Tiempo restante aproximado</div>
      <div class="disconnect-time">
        <strong>Tu sesión finalizará:</strong><br>
        ${expiresAt.toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
    <div class="footer">Disfruta tu navegación en Coworkia WiFi</div>
    <a href="done" class="close-btn">Cerrar</a>
  </div>
</body>
</html>`);
        }
        
        if (req.path === '/connecttest.txt' || req.path === '/ncsi.txt') {
          return res.send('Microsoft Connect Test');
        }
        
        // Para otras peticiones, marcar como autenticado
        req.isAuthenticated = true;
        req.clientMAC = mac;
        req.sessionExpires = session.expires_at;
      } else {
        console.log(`❌ Cliente NO autenticado: MAC=${mac}`);
        req.isAuthenticated = false;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    next();
  }
});

// Log todas las peticiones
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - Host: ${req.headers.host}`);
  next();
});

app.use(express.static('public'));

// Endpoint para obtener info de sesión actual
app.get('/api/auth/session-info', async (req, res) => {
  try {
    const { mac } = await getClientInfo(req);
    
    if (mac) {
      const session = db.prepare(`
        SELECT * FROM sessions 
        WHERE mac_address = ? 
        AND disconnected_at IS NULL 
        AND datetime(expires_at) > datetime('now')
        ORDER BY started_at DESC 
        LIMIT 1
      `).get(mac);
      
      if (session) {
        return res.json({
          connected: true,
          expiresAt: session.expires_at,
          startedAt: session.started_at
        });
      }
    }
    
    res.json({ connected: false });
  } catch (error) {
    console.error('Error obteniendo info de sesión:', error);
    res.status(500).json({ error: 'Error obteniendo información' });
  }
});

// Routes
app.use('/api/codes', codeRoutes);
app.use('/api/auth', authRoutes);

// Servir el portal de autenticación
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Detección de portal cautivo para iOS
app.get('/hotspot-detect.html', (req, res) => {
  res.redirect(302, '/');
});

app.get('/library/test/success.html', (req, res) => {
  res.redirect(302, '/');
});

// Detección de portal cautivo para Android
app.get('/generate_204', (req, res) => {
  res.redirect(302, '/');
});

app.get('/gen_204', (req, res) => {
  res.redirect(302, '/');
});

// Detección de portal cautivo para Windows
app.get('/ncsi.txt', (req, res) => {
  res.redirect(302, '/');
});

app.get('/connecttest.txt', (req, res) => {
  res.redirect(302, '/');
});

// Capturar TODAS las peticiones y redirigir al portal (portal cautivo)
app.get('*', (req, res) => {
  // Si no es una ruta API, mostrar el portal
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Inicializar base de datos
initialize();

// Escuchar en puerto 80 (HTTP)
app.listen(PORT, HOST, () => {
  console.log(`🚀 Sistema WiFi Coworkia ejecutándose en http://192.168.2.2:${PORT}`);
  console.log(`📊 Dashboard Admin: http://192.168.2.2:${PORT}/admin`);
  console.log(`🌐 Accesible desde toda la red en puerto ${PORT}`);
});

// Escuchar también en puerto 443 (HTTPS) redirigiendo a HTTP
const http = require('http');
const https = require('https');
const fs = require('fs');

// Crear servidor HTTPS con certificado autofirmado (para que Safari no se queje)
// Por ahora, simplemente redirigir 443 a 80
const httpsPort = 443;
const httpsServer = http.createServer(app);
httpsServer.listen(httpsPort, HOST, () => {
  console.log(`🔒 Portal también escuchando en puerto ${httpsPort} (redirige HTTPS a HTTP)`);
});
