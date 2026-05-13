#!/bin/bash
# Script para gestionar acceso a internet por dirección IP

# Archivos de configuración
PF_ANCHOR="/etc/pf.anchors/com.coworkia.captive"
ALLOWED_MACS_FILE="/tmp/coworkia-allowed-macs.txt"
ALLOWED_IPS_FILE="/tmp/coworkia-allowed-ips.txt"
DEFAULT_DB_PATH="$HOME/wifi-portal-coworkia/database/coworkia.db"

normalize_mac() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

sync_from_db() {
    local db_path="${1:-$DEFAULT_DB_PATH}"

    if [ ! -f "$db_path" ]; then
        echo "❌ Base de datos no encontrada: $db_path"
        return 1
    fi

    echo "🔄 Sincronizando IPs permitidas desde DB: $db_path"

    # Usar ip_address de la tabla sessions (macOS pf no soporta filtrado por MAC)
    sqlite3 "$db_path" "
      SELECT DISTINCT ip_address
      FROM sessions
      WHERE ip_address IS NOT NULL
        AND trim(ip_address) != ''
        AND ip_address != '192.168.2.2'
        AND disconnected_at IS NULL
        AND datetime(expires_at) > datetime('now')
      ORDER BY ip_address;
    " > "$ALLOWED_IPS_FILE"

    local ip_count
    ip_count=$(grep -cE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' "$ALLOWED_IPS_FILE" 2>/dev/null || echo 0)

    echo "✅ IPs activas en DB: $ip_count"
    regenerate_pf_rules
}

# Función para permitir acceso a una MAC (busca IP en arp)
allow_mac() {
    local mac=$1

    if [ -z "$mac" ]; then
        echo "❌ Error: MAC address vacía"
        return 1
    fi

    mac=$(normalize_mac "$mac")

    # Guardar MAC
    if ! grep -q "$mac" "$ALLOWED_MACS_FILE" 2>/dev/null; then
        echo "$mac" >> "$ALLOWED_MACS_FILE"
        echo "✅ MAC $mac agregada"
    else
        echo "ℹ️  MAC $mac ya estaba en la lista"
    fi

    # Buscar IP en arp y agregarla a la lista de IPs permitidas
    local ip
    ip=$(arp -a 2>/dev/null | grep -i "$mac" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)

    if [ -n "$ip" ]; then
        if ! grep -q "$ip" "$ALLOWED_IPS_FILE" 2>/dev/null; then
            echo "$ip" >> "$ALLOWED_IPS_FILE"
            echo "✅ IP $ip agregada para MAC $mac"
        fi
    else
        echo "⚠️  No se encontró IP en arp para MAC $mac — se sincronizará desde DB"
    fi

    # Regenerar reglas PF
    regenerate_pf_rules
}

# Función para remover acceso a una MAC
deny_mac() {
    local mac=$1
    
    if [ -z "$mac" ]; then
        echo "❌ Error: MAC address vacía"
        return 1
    fi
    
    mac=$(normalize_mac "$mac")

    # Remover MAC de la lista
    if [ -f "$ALLOWED_MACS_FILE" ]; then
        grep -v "$mac" "$ALLOWED_MACS_FILE" > "$ALLOWED_MACS_FILE.tmp"
        mv "$ALLOWED_MACS_FILE.tmp" "$ALLOWED_MACS_FILE"
        echo "✅ MAC $mac removida de lista de permitidos"
    fi
    
    # Regenerar reglas PF
    regenerate_pf_rules
}

# Función para regenerar las reglas del firewall
regenerate_pf_rules() {
    echo "🔄 Regenerando reglas del firewall..."

    # Escribir reglas base con sintaxis válida para macOS pf
    # NOTA: mac-src NO está soportado en macOS pf — se usan IPs
    {
        echo "# Permitir DNS siempre"
        echo "pass in quick on bridge100 proto udp from any to any port 53"
        echo "pass out quick on bridge100 proto udp from any to any port 53"
        echo ""
        echo "# Permitir acceso al portal siempre"
        echo "pass in quick on bridge100 from any to 192.168.2.2"
        echo "pass out quick on bridge100 from 192.168.2.2 to any"
        echo ""
    } > "$PF_ANCHOR"

    # Agregar reglas para cada IP autenticada
    if [ -f "$ALLOWED_IPS_FILE" ] && [ -s "$ALLOWED_IPS_FILE" ]; then
        while IFS= read -r ip; do
            if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                echo "# IP autenticada: $ip" >> "$PF_ANCHOR"
                echo "pass in quick on bridge100 from $ip to any" >> "$PF_ANCHOR"
                echo "pass out quick on bridge100 from any to $ip" >> "$PF_ANCHOR"
            fi
        done < "$ALLOWED_IPS_FILE"
        echo "" >> "$PF_ANCHOR"
    fi

    {
        echo "# Bloquear todo el resto (excepto portal)"
        echo "block drop in quick on bridge100 from any to !192.168.2.0/24"
    } >> "$PF_ANCHOR"

    # Recargar reglas PF
    if pfctl -f /etc/pf.conf 2>/dev/null; then
        echo "✅ Reglas del firewall actualizadas"
        return 0
    else
        echo "⚠️  Error recargando pf — revisa /etc/pf.anchors/com.coworkia.captive"
        return 1
    fi
}

# Función para listar IPs/MACs permitidas
list_allowed() {
    echo "📋 IPs con acceso a internet:"
    if [ -f "$ALLOWED_IPS_FILE" ] && [ -s "$ALLOWED_IPS_FILE" ]; then
        cat "$ALLOWED_IPS_FILE"
    else
        echo "  (ninguna)"
    fi
    echo ""
    echo "📋 MACs registradas:"
    if [ -f "$ALLOWED_MACS_FILE" ] && [ -s "$ALLOWED_MACS_FILE" ]; then
        cat "$ALLOWED_MACS_FILE"
    else
        echo "  (ninguna)"
    fi
}

# Función para limpiar MACs expiradas
cleanup_expired() {
    echo "🧹 Limpiando sesiones expiradas..."
    # Este comando se ejecutará desde Node.js con la lista de MACs válidas
    regenerate_pf_rules
}

# Main
case "$1" in
    sync-db)
        sync_from_db "$2"
        ;;
    allow)
        allow_mac "$2"
        ;;
    deny)
        deny_mac "$2"
        ;;
    list)
        list_allowed
        ;;
    cleanup)
        cleanup_expired
        ;;
    regenerate)
        regenerate_pf_rules
        ;;
    *)
        echo "Uso: $0 {sync-db|allow|deny|list|cleanup|regenerate} [arg]"
        echo ""
        echo "Comandos:"
        echo "  sync-db [DB]  - Sincronizar MACs permitidas desde sesiones activas de DB"
        echo "  allow MAC     - Permitir acceso a internet para una MAC"
        echo "  deny MAC      - Bloquear acceso a internet para una MAC"
        echo "  list          - Listar MACs con acceso permitido"
        echo "  cleanup       - Limpiar MACs expiradas"
        echo "  regenerate    - Regenerar reglas del firewall"
        exit 1
        ;;
esac
