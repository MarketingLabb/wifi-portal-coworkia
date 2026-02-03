const express = require('express');
const path = require('path');
const cors = require('cors');
const { initialize } = require('./database/db');
const codeRoutes = require('./routes/codes');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// Inicializar base de datos
initialize();

app.listen(PORT, () => {
  console.log(`🚀 Sistema WiFi Coworkia ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Dashboard Admin: http://localhost:${PORT}/admin`);
});
