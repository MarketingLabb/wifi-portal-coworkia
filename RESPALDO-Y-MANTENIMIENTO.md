# 🔒 SISTEMA DE RESPALDO Y MANTENIMIENTO 24/7

## ✅ Sistema Configurado (26 Feb 2026)

El sistema ahora funciona **24/7** sin restricción de horario mientras se compra un router dedicado.

---

## 📦 RESPALDO DE BASE DE DATOS

### Respaldo Manual
```bash
cd ~/wifi-portal-coworkia
./scripts/backup-database.sh
```

Esto crea un respaldo en: `~/wifi-portal-backups/coworkia_YYYYMMDD_HHMMSS.db`

### Respaldo Automático Diario

**En Mac Mini, ejecuta UNA SOLA VEZ:**

```bash
# Abrir crontab
crontab -e

# Agregar esta línea (presiona 'i' para insertar, ESC + :wq para guardar):
0 3 * * * /Users/coworkia/wifi-portal-coworkia/scripts/backup-database.sh >> /tmp/backup.log 2>&1
```

Esto hará respaldo todos los días a las 3:00 AM.

---

## 🚀 MANTENER SERVIDOR CORRIENDO 24/7

### Opción 1: Dejar terminal abierta
```bash
cd ~/wifi-portal-coworkia
sudo node server.js
```
⚠️ Si cierras la terminal, el servidor se detiene.

### Opción 2: Ejecutar en background (RECOMENDADO)
```bash
cd ~/wifi-portal-coworkia
nohup sudo node server.js > /tmp/coworkia-server.log 2>&1 &
```

Verificar que está corriendo:
```bash
ps aux | grep "node server.js"
```

Detener servidor:
```bash
sudo pkill -f "node server.js"
```

---

## 🔄 RESTAURAR RESPALDO

Si algo falla, restaura la base de datos:

```bash
# Ver respaldos disponibles
ls -lht ~/wifi-portal-backups/

# Restaurar (cambia la fecha por el respaldo que quieras)
cp ~/wifi-portal-backups/coworkia_20260226_103000.db ~/wifi-portal-coworkia/database/coworkia.db

# Reiniciar servidor
sudo pkill -f "node server.js"
cd ~/wifi-portal-coworkia
sudo node server.js
```

---

## 🔍 MONITOREO

### Ver logs del servidor
```bash
tail -f /tmp/coworkia-server.log
```

### Ver qué clientes están conectados
```bash
# Abrir en navegador:
http://192.168.2.2/admin
```

### Ver respaldos existentes
```bash
ls -lht ~/wifi-portal-backups/ | head -10
```

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Ver si servidor está corriendo
ps aux | grep node

# Reiniciar servidor
sudo pkill -f "node server.js" && sleep 2 && cd ~/wifi-portal-coworkia && nohup sudo node server.js > /tmp/coworkia-server.log 2>&1 &

# Hacer respaldo ahora
~/wifi-portal-coworkia/scripts/backup-database.sh

# Ver últimos logs
tail -20 /tmp/coworkia-server.log
```

---

## 📝 NOTAS IMPORTANTES

1. **Firewall deshabilitado temporalmente** - Sistema funciona sin restricción MAC hasta instalar router dedicado
2. **Sin restricción horaria** - WiFi disponible 24/7
3. **Respaldos automáticos** - Configure cron para respaldo diario
4. **Internet Sharing debe estar activo** - Verificar en System Preferences → Sharing

---

## 🎯 PRÓXIMOS PASOS (Cuando compren router)

1. Configurar portal cautivo en el router MikroTik/UniFi/pfSense
2. Restaurar restricción de horario (descomentar en `routes/auth.js`)
3. Habilitar firewall para control por MAC
4. Migrar servidor a equipo dedicado (opcional)

---

**Última actualización**: 26 de febrero de 2026
