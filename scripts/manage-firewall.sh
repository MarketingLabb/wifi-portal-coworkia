#!/bin/bash
# Script para gestionar acceso a internet por dirección MAC

# Archivos de configuración
PF_ANCHOR="/etc/pf.anchors/com.coworkia.captive"
ALLOWED_MACS_FILE="/tmp/coworkia-allowed-macs.txt"

# Función para permitir acceso a una MAC
allow_mac() {
    local mac=$1
    
    if [ -z "$mac" ]; then
        echo "❌ Error: MAC address vacía"
        return 1
    fi
    
    # Agregar MAC a la lista si no existe
    if ! grep -q "$mac" "$ALLOWED_MACS_FILE" 2>/dev/null; then
        echo "$mac" >> "$ALLOWED_MACS_FILE"
        echo "✅ MAC $mac agregada a lista de permitidos"
    else
        echo "ℹ️  MAC $mac ya estaba en la lista"
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
    
    # Crear nuevo archivo de reglas
    cat > "$PF_ANCHOR" << 'EOF'
# Redirigir HTTPS a HTTP para portal cautivo
rdr pass on bridge100 inet proto tcp from any to 192.168.2.2 port 443 -> 192.168.2.2 port 80

# Permitir DNS siempre
pass quick on bridge100 proto udp port 53

# Permitir acceso al portal siempre
pass quick on bridge100 to 192.168.2.2

EOF
    
    # Agregar reglas para cada MAC permitida
    if [ -f "$ALLOWED_MACS_FILE" ]; then
        while IFS= read -r mac; do
            if [ -n "$mac" ]; then
                # Permitir TODO el tráfico de MACs autenticadas
                echo "# Permitir MAC autenticada: $mac" >> "$PF_ANCHOR"
                echo "pass quick on bridge100 from any to any mac-src $mac" >> "$PF_ANCHOR"
            fi
        done < "$ALLOWED_MACS_FILE"
    fi
    
    # Bloquear todo lo demás
    cat >> "$PF_ANCHOR" << 'EOF'

# Bloquear todo el resto (excepto portal)
block drop on bridge100 from any to !192.168.2.0/24
EOF
    
    # Recargar reglas PF
    pfctl -f /etc/pf.conf 2>/dev/null
    
    echo "✅ Reglas del firewall actualizadas"
}

# Función para listar MACs permitidas
list_allowed() {
    echo "📋 MACs con acceso a internet:"
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
        echo "Uso: $0 {allow|deny|list|cleanup|regenerate} [mac-address]"
        echo ""
        echo "Comandos:"
        echo "  allow MAC     - Permitir acceso a internet para una MAC"
        echo "  deny MAC      - Bloquear acceso a internet para una MAC"
        echo "  list          - Listar MACs con acceso permitido"
        echo "  cleanup       - Limpiar MACs expiradas"
        echo "  regenerate    - Regenerar reglas del firewall"
        exit 1
        ;;
esac
