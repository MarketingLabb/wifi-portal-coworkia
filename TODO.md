# 📝 TODO - Sistema WiFi Coworkia

## 🔴 PRIORIDAD ALTA (En progreso)

### 1. Integración con Aurora (Agente Virtual)
- [ ] Definir API endpoint para que Aurora genere códigos
- [ ] Aurora entrega código cuando usuario hace reserva
- [ ] Código se activa solo cuando se usa en la red (no expira antes)
- [ ] Conectar sistema de reservas con generación de códigos

**Preguntas pendientes:**
- ¿Cómo funciona Aurora actualmente?
- ¿Tiene API o webhook para integrarse?
- ¿Qué información tiene cuando alguien reserva? (nombre, email, etc)
- ¿Aurora puede enviar mensajes/emails automáticos?

### 2. Modificar Lógica de Expiración
- [ ] Códigos NO expiran hasta ser usados en la red
- [ ] Una vez usado: inicia timer de 2 horas
- [ ] Modificar schema de base de datos si es necesario
- [ ] Actualizar API `/api/auth/validate`

### 3. Diseño UX/UI del Portal
- [ ] Revisar diseño actual del portal de login
- [ ] Mejorar experiencia visual
- [ ] Agregar branding de Coworkia
- [ ] Optimizar para móviles
- [ ] Mejorar sección de publicidad

---

## 🟡 PENDIENTE (Después de lo anterior)

### 4. Portal Cautivo Automático
- [ ] Configurar DNS en AirPort Express
- [ ] Redirección automática al conectarse
- [ ] Walled garden (sitios permitidos sin código)

### 5. Control de Dispositivos
- [ ] Integración con AirPort Express para bloquear/desbloquear
- [ ] Seguimiento de MAC addresses
- [ ] Desconexión automática al expirar

### 6. Panel Admin Mejorado
- [ ] Dashboard con gráficas
- [ ] Exportar códigos a CSV/PDF
- [ ] Historial de uso
- [ ] Alertas de códigos por agotarse

### 7. Deployment Mac Mini
- [ ] Configurar auto-inicio del servidor
- [ ] Variables de entorno de producción
- [ ] Script de backup de base de datos
- [ ] Monitoreo y logs

---

## 🟢 FUTURAS MEJORAS

- [ ] Notificaciones por email cuando código está por expirar
- [ ] Sistema de códigos premium (más tiempo)
- [ ] Múltiples niveles de acceso
- [ ] Analytics y reportes
- [ ] App móvil para administración

---

## 📌 NOTAS TÉCNICAS

**Stack actual:**
- Node.js + Express
- SQLite database
- Vanilla JS frontend
- AirPort Express (red WiFi)
- Mac mini (servidor)

**IP Mac mini en red Coworkia:** _Pendiente obtener_

**Configuración AirPort Express:**
- Modo: Bridge (Puente) ✓
- Red: Coworkia WiFi
- DNS: _Pendiente configurar para redirección_
