#!/bin/bash
# Script para gestionar acceso a internet por IP usando pf tables
# Las tablas se actualizan atomicamente sin recargar reglas ni flushear estados TCP

PF_ANCHOR="/etc/pf.anchors/com.coworkia.captive"
DEFAULT_DB_PATH="$HOME/wifi-portal-coworkia/database/coworkia.db"
ANCHOR_NAME="com.coworkia.captive"
TABLE_NAME="coworkia_auth"

# Escribir reglas del anchor con tabla persistente
write_anchor_rules() {
    cat > "$PF_ANCHOR" << 'RULES'
table <coworkia_auth> persist

pass in quick on bridge100 proto udp from any to any port 53
pass out quick on bridge100 proto udp from any to any port 53

pass in quick on bridge100 from any to 192.168.2.2
pass out quick on bridge100 from 192.168.2.2 to any

pass in quick on bridge100 from <coworkia_auth> to any
pass out quick on bridge100 from any to <coworkia_auth>

block drop in quick on bridge100 from any to !192.168.2.0/24
RULES
}

# Cargar reglas completas — solo al inicio o regenerate
load_rules() {
    echo "Cargando reglas del firewall..."
    write_anchor_rules
    if pfctl -f /etc/pf.conf 2>/dev/null; then
        echo "Reglas del firewall cargadas correctamente"
        return 0
    else
        echo "Error cargando pf — revisa $PF_ANCHOR"
        return 1
    fi
}

# Sincronizar IPs desde DB sin recargar reglas (atomico)
sync_from_db() {
    local db_path="${1:-$DEFAULT_DB_PATH}"

    if [ ! -f "$db_path" ]; then
        echo "Base de datos no encontrada: $db_path"
        return 1
    fi

    local ips
    ips=$(sqlite3 "$db_path" "
      SELECT DISTINCT ip_address
      FROM sessions
      WHERE ip_address IS NOT NULL
        AND trim(ip_address) != ''
        AND ip_address != '192.168.2.2'
        AND disconnected_at IS NULL
        AND datetime(expires_at) > datetime('now')
      ORDER BY ip_address;
    ")

    local ip_count=0
    if [ -n "$ips" ]; then
        ip_count=$(echo "$ips" | grep -cE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' 2>/dev/null || echo 0)
        echo "$ips" | pfctl -a "$ANCHOR_NAME" -t "$TABLE_NAME" -T replace -f - 2>/dev/null
    else
        pfctl -a "$ANCHOR_NAME" -t "$TABLE_NAME" -T flush 2>/dev/null
    fi

    echo "Tabla $TABLE_NAME actualizada: $ip_count IP(s) activa(s)"
    return 0
}

allow_ip() {
    local ip=$1
    if [ -z "$ip" ]; then echo "Error: IP vacia"; return 1; fi
    pfctl -a "$ANCHOR_NAME" -t "$TABLE_NAME" -T add "$ip" 2>/dev/null
    echo "IP $ip agregada"
}

deny_ip() {
    local ip=$1
    if [ -z "$ip" ]; then echo "Error: IP vacia"; return 1; fi
    pfctl -a "$ANCHOR_NAME" -t "$TABLE_NAME" -T delete "$ip" 2>/dev/null
    echo "IP $ip removida"
}

list_allowed() {
    echo "IPs autenticadas:"
    pfctl -a "$ANCHOR_NAME" -t "$TABLE_NAME" -T show 2>/dev/null || echo "  (tabla vacia o no cargada)"
}

allow_mac() { allow_ip "$1"; }
deny_mac()  { deny_ip "$1"; }

cleanup_expired() {
    sync_from_db
}

case "$1" in
    sync-db)    sync_from_db "$2" ;;
    load)       load_rules ;;
    regenerate) load_rules ;;
    allow)      allow_ip "$2" ;;
    deny)       deny_ip "$2" ;;
    list)       list_allowed ;;
    cleanup)    cleanup_expired ;;
    *)
        echo "Uso: $0 {sync-db|load|regenerate|allow|deny|list|cleanup} [arg]"
        exit 1
        ;;
esac
