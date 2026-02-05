#!/bin/bash

# Script para sincronizar el firewall con las sesiones activas
# Bloquea todas las MACs excepto las que tienen sesión válida

DB_PATH=~/wifi-portal-coworkia/database/coworkia.db

echo "🔄 Sincronizando firewall con sesiones activas..."

# Obtener todas las MACs con sesión activa
ACTIVE_MACS=$(sqlite3 "$DB_PATH" "SELECT mac_address FROM sessions WHERE disconnected_at IS NULL AND datetime(expires_at) > datetime('now');")

# Crear archivo temporal con las MACs permitidas
TEMP_FILE="/tmp/allowed_macs.txt"
echo "$ACTIVE_MACS" > "$TEMP_FILE"

# Contar MACs activas
MAC_COUNT=$(echo "$ACTIVE_MACS" | grep -c ":")

if [ "$MAC_COUNT" -eq 0 ]; then
  echo "ℹ️  No hay sesiones activas. Bloqueando todo el tráfico."
  # Si no hay MACs activas, crear archivo vacío
  echo "" > "$TEMP_FILE"
else
  echo "✅ $MAC_COUNT dispositivo(s) con sesión activa"
fi

# Crear nueva tabla PF con las MACs permitidas
# Nota: PF en macOS no soporta tablas de MAC directamente
# Alternativa: usar bloqueo por IP

echo "🔍 Obteniendo IPs de dispositivos conectados..."

# Listar todas las IPs activas en la red WiFi
arp -an | grep "bridge100" | grep -v "incomplete" | while read -r line; do
  IP=$(echo "$line" | grep -oE "\([0-9.]+\)" | tr -d "()")
  MAC=$(echo "$line" | grep -oE "([0-9a-f]{1,2}:){5}[0-9a-f]{1,2}")
  
  if [ -n "$IP" ] && [ -n "$MAC" ]; then
    # Verificar si esta MAC tiene sesión activa
    HAS_SESSION=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sessions WHERE mac_address = '$MAC' AND disconnected_at IS NULL AND datetime(expires_at) > datetime('now');")
    
    if [ "$HAS_SESSION" -eq 0 ]; then
      echo "❌ Bloqueando $IP (MAC: $MAC) - Sin sesión válida"
      # Agregar regla para bloquear esta IP
      sudo pfctl -t blocked_devices -T add "$IP" 2>/dev/null
    else
      echo "✅ Permitiendo $IP (MAC: $MAC) - Sesión válida"
      # Asegurar que no esté bloqueada
      sudo pfctl -t blocked_devices -T delete "$IP" 2>/dev/null
    fi
  fi
done

echo ""
echo "✅ Firewall sincronizado"
