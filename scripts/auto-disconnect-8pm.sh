#!/bin/bash

# Script para desconectar todos a las 8pm automáticamente
# Se ejecuta mediante cron cada día a las 8pm

LOG_FILE="/tmp/coworkia-shutdown.log"
PROJECT_DIR="$HOME/wifi-portal-coworkia"
DB_PATH="$PROJECT_DIR/database/coworkia.db"
FIREWALL_SCRIPT="$PROJECT_DIR/scripts/manage-firewall.sh"

echo "$(date): 🔴 Desconectando todos los dispositivos (cierre 8pm)" >> "$LOG_FILE"

# Contar y desconectar todas las sesiones activas
ACTIVE_BEFORE=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sessions WHERE disconnected_at IS NULL;")
sqlite3 "$DB_PATH" "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

# Sincronizar firewall con DB ya desconectada
if [ -x "$FIREWALL_SCRIPT" ]; then
  sudo "$FIREWALL_SCRIPT" sync-db "$DB_PATH" >> "$LOG_FILE" 2>&1
fi

echo "$(date): ✅ $ACTIVE_BEFORE dispositivo(s) desconectado(s)" >> "$LOG_FILE"
echo "$(date): 🕐 Próxima apertura: 8:25am" >> "$LOG_FILE"
