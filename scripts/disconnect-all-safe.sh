#!/bin/bash

# Script SEGURO para desconectar dispositivos
# Solo marca en DB, sin tocar red ni firewall

DB_PATH=~/wifi-portal-coworkia/database/coworkia.db

echo "🔴 Desconectando todos los dispositivos..."

# Contar sesiones activas
ACTIVE=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sessions WHERE disconnected_at IS NULL;")

if [ "$ACTIVE" -eq 0 ]; then
  echo "ℹ️  No hay dispositivos conectados"
  exit 0
fi

# Mostrar lo que se va a desconectar
echo "📋 Dispositivos que serán desconectados:"
sqlite3 "$DB_PATH" "SELECT mac_address, datetime(started_at, 'localtime') FROM sessions WHERE disconnected_at IS NULL;" | while read line; do
  echo "  • $line"
done

echo ""
read -p "¿Continuar con la desconexión? (s/n): " confirm

if [ "$confirm" != "s" ]; then
  echo "❌ Operación cancelada"
  exit 0
fi

# Desconectar en DB
sqlite3 "$DB_PATH" "UPDATE sessions SET disconnected_at = datetime('now') WHERE disconnected_at IS NULL;"

echo "✅ $ACTIVE sesión(es) marcadas como desconectadas"
echo ""
echo "📱 Los dispositivos perderán internet en 30-60 segundos"
echo "   (cuando verifiquen conectividad automáticamente)"
echo ""
echo "💡 Si necesitas desconexión INMEDIATA:"
echo "   Ve a Preferencias del Sistema → Compartir → Desactiva/Activa Internet Sharing"
