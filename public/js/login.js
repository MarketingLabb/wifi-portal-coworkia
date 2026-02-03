// Cargar anuncio al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  loadAd();
  formatCodeInput();
});

// Cargar anuncio
async function loadAd() {
  try {
    // Mostrar imagen de Aurora por defecto
    const img = document.getElementById('adImage');
    img.src = '/images/aurora-ad.png';
    img.style.display = 'block';
    
    // Intentar cargar anuncio personalizado de la BD
    const response = await fetch('/api/auth/ad');
    const data = await response.json();
    
    if (data.success && data.ad && data.ad.image_url && data.ad.image_url !== '/images/default-ad.jpg') {
      img.src = data.ad.image_url;
      
      if (data.ad.link_url) {
        const link = document.getElementById('adLink');
        link.href = data.ad.link_url;
        link.style.display = 'inline-block';
      }
    }
  } catch (error) {
    // Si hay error, mantener imagen de Aurora por defecto
    console.log('Usando anuncio predeterminado de Aurora');
  }
}

// Formatear entrada de código automáticamente
function formatCodeInput() {
  const codeInput = document.getElementById('code');
  
  codeInput.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    
    e.target.value = value;
  });
}

// Manejar envío del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const code = document.getElementById('code').value.trim();
  const clientName = document.getElementById('clientName').value.trim();
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  
  // Deshabilitar botón
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code,
        clientName: clientName,
        deviceInfo: navigator.userAgent
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('¡Conectado exitosamente! Tienes 2 horas de acceso. Disfruta tu navegación.', 'success');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = 'https://google.com';
      }, 2000);
    } else {
      showMessage(`Error: ${data.error}`, 'error');
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  } catch (error) {
    showMessage('Error de conexión. Intenta nuevamente.', 'error');
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
});

// Mostrar mensajes
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type} show`;
  
  if (type === 'error') {
    setTimeout(() => {
      messageDiv.classList.remove('show');
    }, 5000);
  }
}
