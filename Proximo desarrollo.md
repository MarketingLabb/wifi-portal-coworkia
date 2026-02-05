# 🚀 Próximo Desarrollo - Sistema WiFi Coworkia

## 📍 Estado Actual (4 Feb 2026 - 19:15)

✅ **SISTEMA FUNCIONANDO AL 100%**
- Portal cautivo automático
- Validación de códigos 2 horas
- Horario 8:25am-8pm
- Bloqueo códigos duplicados
- Navegación libre post-auth
- Scripts de desconexión creados

⚠️ **PENDIENTE CONFIGURAR:**
- Cron job para desconexión automática 8pm
- Elegir script de desconexión (seguro vs agresivo)

---

## 🔧 Tareas Inmediatas (Próxima Sesión)

### 1. Configurar Cron Job de Desconexión 8pm ⏰
**Prioridad: ALTA - PENDIENTE**

**Comando a ejecutar en Mac Mini:**
```bash
# Ver cron actual
crontab -l

# Agregar desconexión automática 8pm
(crontab -l 2>/dev/null; echo "0 20 * * * ~/wifi-portal-coworkia/scripts/auto-disconnect-8pm.sh") | crontab -

# Verificar
crontab -l
```

**Resultado esperado:** 
- Todos los dispositivos se desconectan a las 8pm
- WiFi vuelve a estar disponible a las 8:25am

---

### 2. Decidir Script de Desconexión Manual 🔌
**Prioridad: MEDIA - PENDIENTE DECISIÓN**

**Opciones disponibles:**

**A) disconnect-all-safe.sh** ✅ RECOMENDADO
- Solo marca sesiones como desconectadas en DB
- NO toca red ni firewall
- Dispositivos pierden internet en 30-60 segundos
- **100% seguro, no rompe nada**

**B) disconnect-all.sh** ⚠️ AGRESIVO
- Marca sesiones + elimina entradas ARP
- Desconexión inmediata
- Puede causar problemas de red temporales

**Decisión:** Probar ambos en producción y elegir el que funcione mejor

---

## 🎯 Próximas Mejoras Priorizadas

### 1. Sistema de Notificaciones Pre-Expiración ⭐⭐⭐
**Prioridad: ALTA**

**Objetivo**: Notificar al usuario 10 minutos antes de que expire su sesión.

**Componentes necesarios:**
- [ ] Endpoint `/api/auth/check-session` que retorna tiempo restante
- [ ] JavaScript en cliente que hace polling cada 30 segundos
- [ ] Modal/notificación emergente a los 10 minutos antes
- [ ] Botón "Extender tiempo" con opciones de pago

**Tecnologías:**
- WebSocket o polling con fetch()
- Notificaciones del navegador (Notification API)
- Modal responsive CSS

**Tiempo estimado:** 2-3 horas

---

### 2. Sistema de Pagos para Extensión ⭐⭐⭐
**Prioridad: ALTA**

**Objetivo**: Permitir que usuarios paguen por 2 horas adicionales.

**Opciones de pago:**
1. **MercadoPago** (recomendado para México/Latam)
   - Integración con SDK de MercadoPago
   - Webhooks para confirmar pago
   - Auto-renovación de sesión

2. **Enlace de WhatsApp** (más simple)
   - Botón "Solicitar extensión vía WhatsApp"
   - Link pre-formateado con datos de sesión
   - Admin aprueba manualmente

3. **PayPal** (internacional)
   - PayPal Checkout SDK
   - Webhook de confirmación

**Componentes:**
- [ ] Ruta `/api/payment/create` para generar orden
- [ ] Webhook `/api/payment/confirm` para validar
- [ ] Auto-extensión de sesión al confirmar pago
- [ ] Precios configurables en archivo config

**Tiempo estimado:** 4-6 horas (MercadoPago) / 1 hora (WhatsApp)

---

### 3. Dashboard Mejorado con Gráficas 📊
**Prioridad: MEDIA**

**Objetivo**: Visualizar estadísticas de uso.

**Métricas:**
- Códigos usados por hora
- Dispositivos conectados en tiempo real
- Ingresos por día/semana (si hay pagos)
- Horarios pico de uso
- Códigos más populares

**Tecnologías:**
- Chart.js o ApexCharts
- Endpoint `/api/stats/analytics`
- Queries SQL agregadas

**Tiempo estimado:** 3-4 horas

---

### 4. Límite de Dispositivos por Código 🔒
**Prioridad: MEDIA**

**Objetivo**: Evitar que un código se comparta entre muchos dispositivos.

**Configuración:**
- 1 dispositivo por código (default)
- Configurable en admin

**Componentes:**
- [ ] Validar que código no esté en uso en otra MAC
- [ ] Mensaje: "Este código ya está siendo usado en otro dispositivo"
- [ ] Opción de "desconectar otro dispositivo"

**Tiempo estimado:** 1-2 horas

---

### 5. Notificaciones Push al Admin 📱
**Prioridad: BAJA**

**Objetivo**: Alertar al admin de eventos importantes.

**Eventos:**
- Servidor caído
- Muchos intentos fallidos de códigos
- Dispositivo alcanzó límite de tiempo
- Pago recibido

**Tecnologías:**
- Telegram Bot API (más fácil)
- Firebase Cloud Messaging
- Email con Nodemailer

**Tiempo estimado:** 2-3 horas

---

### 6. Página de Estadísticas Públicas 📈
**Prioridad: BAJA**

**Objetivo**: Mostrar a usuarios info general sin exponer datos privados.

**Info a mostrar:**
- Dispositivos conectados actualmente: XX
- Promedio de tiempo de uso: Xh Xm
- Horario de mayor demanda: Xpm

**Ruta:** `/stats` (público)

**Tiempo estimado:** 1-2 horas

---

### 7. Sistema de Cupones/Promociones 🎁
**Prioridad: BAJA**

**Objetivo**: Códigos especiales con beneficios extra.

**Tipos:**
- Código de 4 horas (doble tiempo)
- Código multi-dispositivo
- Código VIP (sin límite de tiempo por 24h)

**Componentes:**
- Campo `type` en tabla codes
- Validación especial para cada tipo
- Interface en admin para crear cupones

**Tiempo estimado:** 3-4 horas

---

## 🛠️ Mejoras Técnicas

### Seguridad 🔐
- [ ] Rate limiting en validación de códigos
- [ ] Logs de intentos fallidos
- [ ] Encriptación de MAC addresses en DB
- [ ] HTTPS con certificado SSL

### Performance ⚡
- [ ] Caché de sesiones activas en memoria
- [ ] Índices en base de datos
- [ ] Compresión de respuestas HTTP

### Monitoreo 📊
- [ ] Health check endpoint `/health`
- [ ] Logs estructurados con Winston
- [ ] Alertas automáticas

---

## 📝 Guía de Continuación

### Para retomar el desarrollo:

1. **Revisar logs:**
   ```bash
   tail -f /tmp/dnsmasq.log
   tail -f /tmp/coworkia-shutdown.log
   ```

2. **Verificar estado:**
   ```bash
   cd ~/wifi-portal-coworkia
   git status
   git log --oneline -5
   ```

3. **Actualizar código:**
   ```bash
   git pull
   npm install  # si hay nuevas dependencias
   ```

4. **Reiniciar servicios:**
   ```bash
   sudo brew services restart dnsmasq
   sudo pfctl -f /etc/pf.conf
   sudo pkill -f 'node server.js'
   sudo node server.js
   ```

5. **Verificar funcionamiento:**
   - Conectar dispositivo de prueba
   - Validar código
   - Navegar en internet

---

## 🎨 Mejoras de UI/UX Pendientes

- [ ] Animaciones en portal de login
- [ ] Modo oscuro
- [ ] Soporte multiidioma (ES/EN)
- [ ] Logo de Coworkia en lugar de ✓
- [ ] Página de éxito más elaborada
- [ ] Timer visual (cuenta regresiva)

---

## 📚 Documentación Pendiente

- [ ] Video tutorial para administradores
- [ ] Manual de troubleshooting
- [ ] Guía de instalación paso a paso con capturas
- [ ] Diagrama de arquitectura del sistema

---

## 🚨 Notas Importantes

### Contexto de Desarrollo
- Sistema desarrollado 100% en Mac Mini (macOS 11 Big Sur)
- Node.js v18.20.5
- Puerto 80 (requiere sudo)
- Firewall PF (no iptables)
- Internet Sharing nativo de macOS

### Limitaciones Actuales
- No hay filtrado MAC real en firewall (PF no soporta mac-src en macOS)
- Validación de sesiones es por software, no por firewall
- DNS hijacking solo para dominios de detección de portal

### Backup
Hacer backup regular de:
- `/Users/coworkia/wifi-portal-coworkia/database/coworkia.db`
- `/etc/pf.conf`
- `/etc/pf.anchors/com.coworkia.captive`
- `/usr/local/etc/dnsmasq.conf`

---

**Última actualización**: 4 de febrero de 2026
**Próxima revisión**: Al continuar desarrollo
