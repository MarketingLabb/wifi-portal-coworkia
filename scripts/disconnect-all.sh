#!/bin/bash

# Script para desconectar todos los dispositivos del WiFi Coworkia
# Uso: sudo ./scripts/disconnect-all.sh

DB_PATH=~/wifi-portal-coworkia/database/coworkia.db

echo "🔴 Desconectando todos los dispositivos..."

# Contar sesiones activas antes de desconectar
ACTIVE_SESSIONS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sessions WHERE disconnected_at IS NULL;")

if [ "$ACTIVE_SESSIONS" -eq 0 ]; then
  echo "ℹ️  No hay dispositivos conectados en la base de datos"
  
  # Aun así, limpiar todas las entradas ARP para forzar reautenticación
  echo "🧹 Limpiando tabla ARP de bridge100..."
  arp -an | grep "bridge100" | grep -v "incomplete" | while read -r line; do
    IP=$(echo "$line" | sed -n 's/.*(\([0-9.]*\)).*/\1/p')
    if [ -n "$IP" ] && [ "$IP" != "192.168.2.2" ]; then
      sudo arp -d "$IP" 2>/dev/null && echo "  🗑  Eliminada entrada ARP: $IP"
    fi
  done
  
  exit 0
fi

# Mostrar las sesiones que se van a desconectar
echo "📋 Sesiones que serán desconectadas:"
sqlite3 "$DB_PATH" "SELECT mac_address, datetime(started_at, 'localtime') as inicio FROM sessions WHERE disconnected_at IS NULL;" | while read -r line; do
  echo "  • $line"
done

echo ""

# Desconectar todas las sesiones activas
sqlite3 "$DB_PATH" "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

echo "✅ $ACTIVE_SESSIONS sesión(es) marcada(s) como desconectadas"
echo ""
echo "🔌 Forzando desconexión de red..."

# Limpiar tabla ARP para forzar desconexión inmediata
DISCONNECTED_COUNT=0
arp -an | grep "bridge100" | grep -v "incomplete" | while read -r line; do
  IP=$(echo "$line" | sed -n 's/.*(\([0-9.]*\)).*/\1/p')
  MAC=$(echo "$line" | awk '{print $4}')
  
  if [ -n "$IP" ] && [ "$IP" != "192.168.2.2" ]; then
    # Eliminar entrada ARP para forzar desconexión
    sudo arp -d "$IP" 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "  ❌ Desconectado: $IP (MAC: $MAC)"
      DISCONNECTED_COUNT=$((DISCONNECTED_COUNT + 1))
    fi
  fi
done

echo ""
echo "✅ Desconexión completada. Los dispositivos perderán internet inmediatamente."
echo ""
echo "Los usuarios deberán ingresar un código nuevo para reconectarse."
