// Actualizar hora
function updateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString('es-CO');
}

setInterval(updateTime, 1000);
updateTime();

// Cargar datos iniciales
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadCodes();
  setInterval(loadStats, 30000); // Actualizar stats cada 30 segundos
});

// Cargar estadísticas
async function loadStats() {
  try {
    const response = await fetch('/api/codes/stats');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalCodes').textContent = data.total;
      document.getElementById('activeSessions').textContent = data.activeSessions;
      
      const stats = data.stats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {});
      
      document.getElementById('availableCodes').textContent = stats['disponible'] || 0;
      document.getElementById('usedCodes').textContent = stats['usado'] || 0;
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// Cargar códigos
async function loadCodes() {
  try {
    const statusFilter = document.getElementById('statusFilter').value;
    const url = statusFilter ? `/api/codes?status=${statusFilter}` : '/api/codes';
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      displayCodes(data.codes);
    }
  } catch (error) {
    console.error('Error cargando códigos:', error);
  }
}

// Mostrar códigos en tabla
function displayCodes(codes) {
  const tbody = document.getElementById('codesTableBody');
  
  if (codes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay códigos generados</td></tr>';
    return;
  }
  
  tbody.innerHTML = codes.map(code => `
    <tr>
      <td><strong>${code.code}</strong></td>
      <td><span class="badge badge-${code.status}">${code.status}</span></td>
      <td>${formatDate(code.created_at)}</td>
      <td>${code.used_at ? formatDate(code.used_at) : '-'}</td>
      <td>${code.client_name || '-'}</td>
      <td>${code.expires_at ? formatDate(code.expires_at) : '-'}</td>
      <td>
        ${code.status === 'disponible' ? 
          `<button class="btn-delete" onclick="deleteCode('${code.code}')">Eliminar</button>` :
          '-'
        }
      </td>
    </tr>
  `).join('');
}

// Generar códigos
async function generateCodes() {
  const quantity = document.getElementById('quantity').value;
  const messageDiv = document.getElementById('generateMessage');
  
  if (quantity < 1 || quantity > 100) {
    showMessage(messageDiv, 'Por favor ingresa una cantidad entre 1 y 100', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/codes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quantity: parseInt(quantity) })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage(messageDiv, `✓ ${quantity} códigos generados exitosamente`, 'success');
      loadStats();
      loadCodes();
    } else {
      showMessage(messageDiv, `Error: ${data.error}`, 'error');
    }
  } catch (error) {
    showMessage(messageDiv, 'Error de conexión', 'error');
  }
}

// Eliminar código
async function deleteCode(code) {
  if (!confirm(`¿Estás seguro de eliminar el código ${code}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/codes/${code}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadStats();
      loadCodes();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert('Error de conexión');
  }
}

// Imprimir códigos disponibles
async function printAvailableCodes() {
  try {
    const response = await fetch('/api/codes?status=disponible');
    const data = await response.json();
    
    if (!data.success || data.codes.length === 0) {
      alert('No hay códigos disponibles para imprimir');
      return;
    }
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Códigos WiFi - Coworkia</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #667eea; text-align: center; }
            .code-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin-top: 30px; 
            }
            .code-card { 
              border: 2px dashed #667eea; 
              padding: 15px; 
              text-align: center; 
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .code-card h2 { 
              font-size: 24px; 
              margin: 10px 0; 
              color: #333; 
              font-family: monospace;
            }
            .code-card p { 
              font-size: 12px; 
              color: #666; 
            }
            @media print {
              .code-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <h1>🌐 Códigos WiFi Coworkia</h1>
          <p style="text-align: center; color: #666;">2 horas de navegación gratuita</p>
          <div class="code-grid">
            ${data.codes.map(code => `
              <div class="code-card">
                <p>Código de Acceso:</p>
                <h2>${code.code}</h2>
                <p style="margin-top: 10px;">✓ 2 horas gratis<br>✓ Alta velocidad</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  } catch (error) {
    alert('Error al preparar impresión');
  }
}

// Utilidades
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type} show`;
  
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}
