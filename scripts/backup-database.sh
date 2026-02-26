#!/bin/bash
# Script de respaldo automático de la base de datos

DB_PATH="$HOME/wifi-portal-coworkia/database/coworkia.db"
BACKUP_DIR="$HOME/wifi-portal-backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/coworkia_$DATE.db"

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Hacer respaldo
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_FILE"
    echo "✅ Respaldo creado: $BACKUP_FILE"
    
    # Mantener solo los últimos 30 respaldos
    cd "$BACKUP_DIR"
    ls -t coworkia_*.db | tail -n +31 | xargs rm -f 2>/dev/null
    
    echo "📊 Respaldos actuales: $(ls -1 coworkia_*.db 2>/dev/null | wc -l)"
else
    echo "❌ Base de datos no encontrada: $DB_PATH"
    exit 1
fi
