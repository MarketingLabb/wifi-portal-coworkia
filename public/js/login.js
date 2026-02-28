// Estado del carrusel
let currentSlide = 0;
let slideTimer = null;
let carouselSlides = [];
const AD_IMPACT_LOCK_MS = 7000;

// Cargar carrusel al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const playOverlay = document.getElementById('playOverlay');
  if (playOverlay) {
    playOverlay.addEventListener('click', onPlayOverlayClick);
    playOverlay.addEventListener('touchend', (e) => { e.preventDefault(); onPlayOverlayClick(); });
  }
  initializeMobileInputExposureLock();
  loadCarousel();
  formatCodeInput();
});

function initializeMobileInputExposureLock() {
  const codeInput = document.getElementById('code');
  const nameInput = document.getElementById('clientName');
  const inputs = [codeInput, nameInput].filter(Boolean);

  if (inputs.length === 0) {
    return;
  }

  inputs.forEach((input) => input.setAttribute('readonly', 'readonly'));

  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 120);
  setTimeout(() => window.scrollTo(0, 0), 400);

  const forceBlur = () => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.id === 'code' || activeElement.id === 'clientName')) {
      activeElement.blur();
      window.scrollTo(0, 0);
    }
  };

  forceBlur();
  setTimeout(forceBlur, 100);
  setTimeout(forceBlur, 350);

  const unlockInputs = () => {
    inputs.forEach((input) => input.removeAttribute('readonly'));
    document.removeEventListener('touchstart', touchGuard, true);
  };

  const touchGuard = (event) => {
    const target = event.target;
    if (!target || (target.id !== 'code' && target.id !== 'clientName')) {
      return;
    }

    event.preventDefault();
    unlockInputs();
    setTimeout(() => target.focus(), 60);
  };

  document.addEventListener('touchstart', touchGuard, true);
  setTimeout(unlockInputs, AD_IMPACT_LOCK_MS);
}

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
    updateCarousel();
    
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
          ${slide.loop === true ? 'loop' : ''}
          ${slide.muted !== false ? 'muted' : ''}
          playsinline
          webkit-playsinline
          disablepictureinpicture
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
  clearTimeout(slideTimer);
  stopCurrentVideo();

  currentSlide += direction;
  
  if (currentSlide < 0) {
    currentSlide = carouselSlides.length - 1;
  } else if (currentSlide >= carouselSlides.length) {
    currentSlide = 0;
  }
  
  updateCarousel();
}

// Ir a slide específico
function goToSlide(index) {
  clearTimeout(slideTimer);
  stopCurrentVideo();

  currentSlide = index;
  updateCarousel();
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
  
  scheduleCurrentSlideTransition();
}

function scheduleCurrentSlideTransition() {
  clearTimeout(slideTimer);

  if (carouselSlides.length <= 1) {
    const onlyVideo = document.querySelector('.carousel-slide video');
    if (onlyVideo) {
      onlyVideo.muted = false;
      onlyVideo.currentTime = 0;
      onlyVideo.onended = () => hidePlayOverlay();
      onlyVideo.load();
      showPlayOverlay();
    }
    return;
  }

  const slide = carouselSlides[currentSlide];
  const activeSlide = document.querySelectorAll('.carousel-slide')[currentSlide];

  if (!slide || !activeSlide) {
    return;
  }

  if (slide.type === 'video') {
    const video = activeSlide.querySelector('video');
    if (!video) {
      hidePlayOverlay();
      slideTimer = setTimeout(() => changeSlide(1), 8000);
      return;
    }

    video.muted = false;
    video.currentTime = 0;
    video.onended = () => { hidePlayOverlay(); changeSlide(1); };
    video.load();
    showPlayOverlay();
    return;
  }

  hidePlayOverlay();

  const durationMs = typeof slide.durationMs === 'number' ? slide.durationMs : 6000;
  slideTimer = setTimeout(() => changeSlide(1), durationMs);
}

function getActiveVideoElement() {
  const activeSlide = document.querySelectorAll('.carousel-slide')[currentSlide];
  if (!activeSlide) return null;
  return activeSlide.querySelector('video');
}

function showPlayOverlay() {
  const overlay = document.getElementById('playOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    setOverlayState('paused'); // siempre empieza mostrando ▶
  }
}

function hidePlayOverlay() {
  const overlay = document.getElementById('playOverlay');
  if (overlay) overlay.style.display = 'none';
}

function stopCurrentVideo() {
  const video = getActiveVideoElement();
  if (video) { video.pause(); video.currentTime = 0; }
  hidePlayOverlay();
}

function onPlayOverlayClick() {
  const video = getActiveVideoElement();
  if (!video) return;

  if (video.paused) {
    // Iniciar / reanudar
    video.muted = false;
    video.play().catch(() => {
      slideTimer = setTimeout(() => changeSlide(1), 35000);
    });
    setOverlayState('playing');
  } else {
    // Pausar
    video.pause();
    setOverlayState('paused');
  }
}

function setOverlayState(state) {
  const overlay = document.getElementById('playOverlay');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  if (!overlay) return;

  if (state === 'playing') {
    overlay.classList.add('playing');
    if (iconPlay) iconPlay.style.display = 'none';
    if (iconPause) iconPause.style.display = 'block';
  } else {
    overlay.classList.remove('playing');
    if (iconPlay) iconPlay.style.display = 'block';
    if (iconPause) iconPause.style.display = 'none';
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
      
      // Redirigir a hotspot-detect para que iOS detecte Success y cierre el popup
      setTimeout(() => {
        window.location.href = '/hotspot-detect.html?auth=1';
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
