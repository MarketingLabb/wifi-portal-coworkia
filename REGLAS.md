# REGLAS DE TRABAJO - WiFi Coworkia
## Calidad Rolex 🏆

### Regla #0: Respeto y Roles
- **Diego (Sensei)**: El líder del proyecto, experto y quien toma las decisiones finales
- **Asistente**: Apoyo técnico profesional, siempre respetuoso
- **NO usar "nena" nunca** - es ofensivo
- Mantener profesionalismo en todo momento

### Regla #1: Claridad de Equipos
Siempre especificar en qué equipo se ejecutará cada acción:
- **Mac Mini (192.168.0.62)**: Servidor permanente de producción (macOS Catalina, usuario: coworkia)
- **MacBook (VS Code)**: Equipo de desarrollo y configuración

### Regla #2: Proceso de Ejecución
1. Explicar el paso que voy a dar con claridad
2. Indicar en qué equipo se ejecutará
3. Esperar confirmación **"verde nena"** antes de ejecutar
4. Nunca asumir, siempre confirmar

### Regla #3: Documentación
- Documentar cada cambio importante
- Explicar el porqué, no solo el qué
- Mantener este archivo actualizado con nuevas reglas

### Regla #4: Seguridad
- Backup antes de cambios críticos
- Verificar permisos y accesos
- Probar en desarrollo antes de producción

### Regla #5: Tracking de Tareas
- Crear TODO list en VS Code para planes de trabajo
- Mantener visibilidad del progreso
- Marcar tareas completadas una por una

### Regla #6: Workflow de Ejecución
1. Explicación corta y concisa del paso
2. Ajustes del usuario si necesario
3. "verde nena" para ejecutar

---

## PROTOCOLO DE SINCRONIZACIÓN VSC → MAC MINI 🔄

### 🎯 Objetivo
Asegurar que cambios hechos en VS Code (MacBook) lleguen correctamente al servidor de producción (Mac Mini).

### 📋 Pasos del Protocolo

#### **PASO 1: Desarrollo en MacBook (VS Code)**
```bash
# En MacBook: Guardar archivos, commitear y pushear
cd "/Users/diegovillota/WiFi Coworkia"
git add -A
git commit -m "📝 Descripción clara del cambio"
git push
```
✅ **Verificación**: Ver mensaje "To https://github.com/MarketingLabb/wifi-portal-coworkia.git"

---

#### **PASO 2: Sincronización en Mac Mini**
```bash
# En Mac Mini: Bajar cambios y reiniciar servidor
cd ~/wifi-portal-coworkia
git pull
sudo pkill -f 'node server.js'
sleep 2
sudo node server.js
```
✅ **Verificación**: Ver mensaje "🚀 Sistema WiFi Coworkia ejecutándose en http://192.168.2.2:80"

---

#### **PASO 3: Validación en Cliente**
- Reconectar dispositivo al WiFi "Coworkia WiFi"
- Verificar que los cambios se reflejen correctamente
- Observar logs en terminal de Mac Mini

✅ **Verificación**: Funcionalidad esperada operando correctamente

---

### ⚠️ ERRORES COMUNES A EVITAR

1. **Error**: Pantalla en blanco / cambios no visibles
   - **Causa**: Olvidó reiniciar el servidor Node.js
   - **Solución**: `sudo pkill -f 'node server.js' && sleep 2 && sudo node server.js`

2. **Error**: Git pull no trae cambios
   - **Causa**: Olvidó hacer git push en MacBook
   - **Solución**: Verificar con `git log --oneline -1` en ambos equipos

3. **Error**: Servidor no inicia
   - **Causa**: Puerto ocupado o error de sintaxis
   - **Solución**: Ver errores en terminal, corregir código, volver a PASO 1

4. **Error**: Cambios en dnsmasq/firewall no se aplican
   - **Causa**: Servicios no reiniciados
   - **Solución**: `sudo brew services restart dnsmasq` y recargar firewall

---

### 🔥 CHECKLIST RÁPIDO (Copiar/Pegar)

**En MacBook:**
```bash
cd "/Users/diegovillota/WiFi Coworkia" && git add -A && git commit -m "MENSAJE" && git push
```

**En Mac Mini:**
```bash
cd ~/wifi-portal-coworkia && git pull && sudo pkill -f 'node server.js' && sleep 2 && sudo node server.js
```

---

### 💡 TIPS PRO

- **Siempre** verificar commit hash con `git log --online -1` en ambos equipos
- **Nunca** asumir que el servidor se reinició automáticamente
- **Confirmar** visualmente en cliente que los cambios funcionan
- **Documentar** en commit message qué se cambió para debugging futuro

---

## 🚨 PROTOCOLO DE EMERGENCIA: SERVIDOR CAÍDO

### Síntomas de que el servidor NO está corriendo:
- ❌ No carga http://192.168.2.2/admin
- ❌ No carga http://192.168.2.2 (portal cautivo)
- ❌ Dispositivos tienen internet libre sin código
- ❌ Portal cautivo no aparece automáticamente

### 📋 Pasos de Recuperación (PASO A PASO)

#### **PASO 1: Verificar Estado del Servidor**
```bash
# En Mac Mini: Ver si el servidor está corriendo
ps aux | grep 'node server.js' | grep -v grep
```
- **Si hay resultado**: Servidor está corriendo (problema es otro)
- **Si no hay resultado**: Servidor está detenido → seguir PASO 2

---

#### **PASO 2: Ir al Directorio e Iniciar Servidor**
```bash
# En Mac Mini: Navegar al proyecto e iniciar
cd ~/wifi-portal-coworkia
sudo node server.js
```
✅ **Verificación**: Debe aparecer:
```
🚀 Sistema WiFi Coworkia ejecutándose en http://192.168.2.2:80
📊 Dashboard Admin: http://192.168.2.2:80/admin
```

---

#### **PASO 3: Verificar en Navegador**
- Abrir http://192.168.2.2/admin
- Debe cargar el dashboard de administración
- Probar portal: http://192.168.2.2

---

#### **PASO 4: Resetear Dispositivos Problemáticos**
Si hay dispositivos con internet libre (como el iPad):
```bash
# En Mac Mini: Desconectar sesiones huérfanas
sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"
```
- Los dispositivos perderán internet en 30-60 segundos
- Deben reconectarse al WiFi para ver el portal cautivo

---

### Regla #7: Trabajo Directo en Terminal del Mac Mini
Cuando se trabaja con terminal compartido directamente en el Mac Mini:
1. **Usuario proporciona comandos uno a la vez**
2. **Usuario ejecuta en el Mac Mini**
3. **Usuario copia resultado completo**
4. **Analizar resultado antes de siguiente paso**
5. **UN PASO A LA VEZ - nunca anticipar**

---

*Última actualización: 5 de febrero de 2026*
