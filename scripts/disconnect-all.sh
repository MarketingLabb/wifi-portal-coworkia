#!/bin/bash

# Script para desconectar todos los dispositivos del WiFi Coworkia
# Uso: sudo ./scripts/disconnect-all.sh

echo "🔴 Desconectando todos los dispositivos..."

# Contar sesiones activas antes de desconectar
ACTIVE_SESSIONS=$(sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "SELECT COUNT(*) FROM sessions WHERE disconnected_at IS NULL;")

if [ "$ACTIVE_SESSIONS" -eq 0 ]; then
  echo "ℹ️  No hay dispositivos conectados"
  exit 0
fi

# Desconectar todas las sesiones activas
sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

echo "✅ $ACTIVE_SESSIONS dispositivo(s) desconectado(s) en la base de datos"

# Reiniciar firewall para forzar desconexión inmediata
echo "🔥 Reiniciando firewall para forzar desconexión..."
sudo pfctl -d 2>/dev/null
sudo pfctl -e -f /etc/pf.conf 2>/dev/null

echo ""
echo "✅ Desconexión completada. Los dispositivos perderán internet en unos segundos."
echo "Los usuarios deberán ingresar un código nuevo para reconectarse."
