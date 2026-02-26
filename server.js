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
const CAPTIVE_PROBE_PATHS = new Set([
  '/hotspot-detect.html',
  '/library/test/success.html',
  '/generate_204',
  '/gen_204',
  '/connecttest.txt',
  '/ncsi.txt'
]);

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
  if (req.isAuthenticated) {
    return res.redirect(302, '/connected.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Dashboard de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Endpoints de detección de portal cautivo
app.get(Array.from(CAPTIVE_PROBE_PATHS), (req, res) => {
  if (req.isAuthenticated) {
    // iOS/macOS esperan EXACTAMENTE esto para detectar internet libre y cerrar el popup
    res.setHeader('Content-Type', 'text/html');
    return res.send('<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>');
  }
  // No autenticado: mostrar portal de login directo (sin redirect para navegador inmersivo)
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Capturar TODAS las peticiones y redirigir al portal (portal cautivo)
app.get('*', (req, res) => {
  if (req.isAuthenticated) {
    return res.redirect(302, '/connected.html');
  }
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
// Escuchar también en 443 para capturar intentos HTTPS del portal cautivo
const httpsPort = 443;
const httpsServer = http.createServer(app);
httpsServer.listen(httpsPort, HOST, () => {
  console.log(`🔒 Portal también escuchando en puerto ${httpsPort} (redirige HTTPS a HTTP)`);
});
