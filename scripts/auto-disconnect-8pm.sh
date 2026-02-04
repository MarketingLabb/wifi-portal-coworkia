#!/bin/bash

# Script para desconectar todos a las 8pm automáticamente
# Se ejecuta mediante cron cada día a las 8pm

LOG_FILE="/tmp/coworkia-shutdown.log"

echo "$(date): 🔴 Desconectando todos los dispositivos (cierre 8pm)" >> "$LOG_FILE"

# Desconectar todas las sesiones activas
sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

DISCONNECTED=$(sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "SELECT COUNT(*) FROM sessions WHERE disconnected_at = datetime('now', '-1 second');")

echo "$(date): ✅ $DISCONNECTED dispositivo(s) desconectado(s)" >> "$LOG_FILE"
echo "$(date): 🕐 Próxima apertura: 8:25am" >> "$LOG_FILE"
