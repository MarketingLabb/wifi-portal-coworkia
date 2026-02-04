#!/bin/bash

# Script para desconectar todos los dispositivos del WiFi Coworkia
# Uso: sudo ./scripts/disconnect-all.sh

echo "🔴 Desconectando todos los dispositivos..."

# Eliminar todas las sesiones activas
sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

# Contar cuántos dispositivos se desconectaron
DISCONNECTED=$(sqlite3 ~/wifi-portal-coworkia/database/coworkia.db "SELECT COUNT(*) FROM sessions WHERE disconnected_at IS NOT NULL;")

echo "✅ $DISCONNECTED dispositivo(s) desconectado(s)"
echo ""
echo "Los usuarios deberán ingresar un código nuevo para reconectarse."
