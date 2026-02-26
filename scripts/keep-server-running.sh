#!/bin/bash
# Script para mantener el servidor corriendo 24/7

SERVER_DIR="$HOME/wifi-portal-coworkia"
LOG_FILE="/tmp/coworkia-server.log"

cd "$SERVER_DIR"

# Matar proceso anterior si existe
pkill -f 'node server.js'
sleep 2

# Iniciar servidor
echo "🚀 Iniciando servidor WiFi Coworkia - $(date)" >> "$LOG_FILE"
sudo node server.js >> "$LOG_FILE" 2>&1
