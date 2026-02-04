#!/bin/bash

# Script de inicio para WiFi Portal Coworkia
# Debe ejecutarse en el Mac Mini como servidor permanente

echo "🚀 Iniciando WiFi Portal Coworkia..."
echo "📍 Directorio: ~/wifi-portal-coworkia"

cd ~/wifi-portal-coworkia || exit

echo "🔐 Requiere permisos sudo para puerto 80"

# Ejecutar con sudo
sudo node server.js

# Si el servidor se detiene, mostrar mensaje
echo "⚠️ Servidor detenido"
