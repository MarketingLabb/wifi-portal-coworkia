# 🌐 Sistema de Control WiFi - Coworkia

Sistema profesional para gestionar acceso WiFi temporal con códigos alfanuméricos en espacios de coworking.

## ✨ Características

- **Códigos alfanuméricos únicos** formato XXXX-XXXX
- **Límite de 2 horas** de navegación gratuita por código
- **Portal cautivo** con espacio para publicidad de aliados
- **Dashboard administrativo** para generar y monitorear códigos
- **Base de datos SQLite** (sin necesidad de servidor externo)
- **Estadísticas en tiempo real**
- **Impresión de códigos** para distribuir a clientes

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

El sistema estará disponible en:
- **Portal de acceso:** http://localhost:3000
- **Panel admin:** http://localhost:3000/admin

## 📋 Uso

### Para Administradores

1. Accede al **Dashboard Admin** en `/admin`
2. Genera códigos usando el formulario (10-100 códigos por lote)
3. Imprime los códigos disponibles
4. Distribuye los códigos a los clientes
5. Monitorea el uso en tiempo real

### Para Clientes

1. Los clientes se conectan a la red WiFi del coworking
2. Son redirigidos automáticamente al portal cautivo
3. Ingresan el código proporcionado
4. Obtienen 2 horas de navegación gratuita
5. Ven publicidad de aliados estratégicos durante el acceso

## 🏗️ Estructura del Proyecto

```
WiFi Coworkia/
├── server.js              # Servidor Express principal
├── package.json           # Dependencias
├── database/
│   └── db.js             # Configuración base de datos
├── routes/
│   ├── codes.js          # Endpoints gestión de códigos
│   └── auth.js           # Endpoints autenticación
├── utils/
│   └── codeGenerator.js  # Generador de códigos
└── public/
    ├── login.html        # Portal cautivo
    ├── admin.html        # Dashboard admin
    ├── css/              # Estilos
    ├── js/               # Lógica frontend
    └── images/           # Publicidad aliados
```

## 🔧 Integración con Router WiFi

### Opción 1: MikroTik RouterOS

1. Configura el Hotspot en tu MikroTik
2. En la sección Walled Garden, agrega tu servidor
3. Configura el Login URL apuntando a `http://TU_SERVIDOR:3000`
4. Usa la API de MikroTik para activar/desactivar usuarios

### Opción 2: pfSense/OPNsense

1. Instala el paquete Captive Portal
2. Configura el portal custom HTML
3. Redirige al servidor Node.js
4. Integra con FreeRADIUS para control de tiempo

### Opción 3: UniFi Controller

1. Activa el Guest Portal
2. Configura autenticación externa
3. Usa el API del UniFi para gestionar acceso

## 📊 API Endpoints

### Códigos
- `POST /api/codes/generate` - Generar códigos nuevos
- `GET /api/codes` - Listar todos los códigos
- `GET /api/codes/stats` - Obtener estadísticas
- `DELETE /api/codes/:code` - Eliminar código

### Autenticación
- `POST /api/auth/validate` - Validar código y crear sesión
- `GET /api/auth/ad` - Obtener publicidad activa
- `GET /api/auth/session/:code` - Verificar sesión

## 🎨 Personalización

### Cambiar publicidad

Edita la tabla `ads` en la base de datos:

```sql
INSERT INTO ads (title, image_url, link_url, active) 
VALUES ('Tu Producto', '/images/tu-imagen.jpg', 'https://tu-sitio.com', 1);
```

### Modificar duración

En `routes/auth.js` línea 51, cambia:
```javascript
const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas
```

### Personalizar diseño

Modifica los archivos CSS en `public/css/`:
- `login.css` - Portal de acceso
- `admin.css` - Dashboard administrativo

## 🔒 Seguridad

- Los códigos son de un solo uso
- Expiración automática después de 2 horas
- Base de datos local protegida
- No almacena contraseñas
- Validación de formato de códigos

## 📈 Próximas Mejoras

- [ ] Autenticación admin con contraseña
- [ ] Reportes PDF mensuales
- [ ] Integración con sistema de pagos
- [ ] Códigos con diferentes duraciones
- [ ] SMS para envío de códigos
- [ ] Dashboard de analytics
- [ ] API webhooks para notificaciones

## 🆘 Soporte

Para soporte o dudas, contacta al equipo de Coworkia.

---

**Desarrollado con ❤️ para Coworkia**
