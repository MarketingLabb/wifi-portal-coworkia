// Estado del carrusel
let currentSlide = 0;
let carouselInterval = null;
let carouselSlides = [];

// Cargar carrusel al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  loadCarousel();
  formatCodeInput();
});

// Cargar carrusel multimedia
async function loadCarousel() {
  try {
    // Slides por defecto (Aurora + espacio para contenido personalizado)
    carouselSlides = [
      { type: 'image', src: '/images/aurora-ad.png', alt: 'Aurora - Tu asistente virtual' },
      // Aquí se pueden agregar más slides desde la BD o archivos locales
    ];
    
    // Intentar cargar slides adicionales desde BD o carpeta
    try {
      const response = await fetch('/api/auth/carousel-slides');
      const data = await response.json();
      
      if (data.success && data.slides && data.slides.length > 0) {
        carouselSlides = data.slides;
      }
    } catch (err) {
      console.log('Usando slides por defecto');
    }
    
    // Renderizar carrusel
    renderCarousel();
    initCarouselControls();
    startAutoPlay();
    
  } catch (error) {
    console.error('Error cargando carrusel:', error);
    // Fallback: mostrar solo imagen de Aurora
    document.getElementById('carouselInner').innerHTML = `
      <div class="carousel-slide">
        <img src="/images/aurora-ad.png" alt="Aurora">
      </div>
    `;
  }
}

// Renderizar slides del carrusel
function renderCarousel() {
  const carouselInner = document.getElementById('carouselInner');
  const indicators = document.getElementById('carouselIndicators');
  
  // Limpiar contenido previo
  carouselInner.innerHTML = '';
  indicators.innerHTML = '';
  
  // Crear slides
  carouselSlides.forEach((slide, index) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'carousel-slide';
    
    if (slide.type === 'video') {
      slideDiv.innerHTML = `
        <video 
          src="${slide.src}" 
          ${slide.autoplay !== false ? 'autoplay' : ''}
          ${slide.loop !== false ? 'loop' : ''}
          ${slide.muted !== false ? 'muted' : ''}
          playsinline
          preload="metadata"
        ></video>
      `;
    } else {
      slideDiv.innerHTML = `<img src="${slide.src}" alt="${slide.alt || 'Publicidad'}">`;
    }
    
    carouselInner.appendChild(slideDiv);
    
    // Crear indicador
    const indicator = document.createElement('div');
    indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
    indicator.addEventListener('click', () => goToSlide(index));
    indicators.appendChild(indicator);
  });
}

// Inicializar controles del carrusel
function initCarouselControls() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
  
  // Ocultar controles si solo hay un slide
  if (carouselSlides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    document.getElementById('carouselIndicators').style.display = 'none';
  }
}

// Cambiar slide
function changeSlide(direction) {
  currentSlide += direction;
  
  if (currentSlide < 0) {
    currentSlide = carouselSlides.length - 1;
  } else if (currentSlide >= carouselSlides.length) {
    currentSlide = 0;
  }
  
  updateCarousel();
  resetAutoPlay();
}

// Ir a slide específico
function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
  resetAutoPlay();
}

// Actualizar visualización del carrusel
function updateCarousel() {
  const carouselInner = document.getElementById('carouselInner');
  const indicators = document.querySelectorAll('.carousel-indicator');
  
  // Mover carrusel
  carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
  
  // Actualizar indicadores
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentSlide);
  });
  
  // Pausar videos no visibles y reproducir el actual
  const videos = carouselInner.querySelectorAll('video');
  videos.forEach((video, index) => {
    if (index === currentSlide) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

// Auto-play del carrusel
function startAutoPlay() {
  if (carouselSlides.length <= 1) return;
  
  carouselInterval = setInterval(() => {
    changeSlide(1);
  }, 5000); // Cambiar cada 5 segundos
}

// Resetear auto-play
function resetAutoPlay() {
  clearInterval(carouselInterval);
  startAutoPlay();
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
      
      // Redirigir a hotspot-detect para que iOS detecte Success y cierre el popup
      setTimeout(() => {
        window.location.href = '/hotspot-detect.html';
      }, 1500);
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
