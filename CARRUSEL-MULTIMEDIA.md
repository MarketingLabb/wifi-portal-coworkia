# 🎨 CARRUSEL MULTIMEDIA - Guía de Uso

## ✨ Qué tiene el sistema ahora

El portal de login ahora incluye un **carrusel multimedia** profesional que soporta:
- ✅ Fotos (JPG, PNG, GIF, WebP)
- ✅ Videos (MP4, WebM, MOV) hasta 200MB
- ✅ Auto-play automático cada 5 segundos
- ✅ Controles manuales (flechas izquierda/derecha)
- ✅ Indicadores de posición
- ✅ Videos con reproducción automática

---

## 📁 Estructura de Carpetas

```
public/
├── images/          # Fotos para el carrusel
│   └── aurora-ad.png (imagen por defecto)
└── videos/          # Videos para el carrusel
    └── (aquí van tus videos)
```

---

## 🎬 CÓMO AGREGAR VIDEOS/FOTOS AL CARRUSEL

### Opción 1: Archivos Locales (RECOMENDADO)

**1. Agregar el archivo:**
```bash
# Para fotos:
cp tu-foto.jpg ~/wifi-portal-coworkia/public/images/

# Para videos:
cp tu-video.mp4 ~/wifi-portal-coworkia/public/videos/
```

**2. Editar el archivo de configuración:**

Abre: `routes/auth.js` y busca la función `router.get('/carousel-slides')`

Agrega tus slides al array:

```javascript
const slides = [
  {
    type: 'image',
    src: '/images/aurora-ad.png',
    alt: 'Aurora - Tu asistente virtual'
  },
  {
    type: 'image',
    src: '/images/promo-coworkia.jpg',
    alt: 'Espacios de coworking'
  },
  {
    type: 'video',
    src: '/videos/tour-virtual.mp4',
    alt: 'Tour virtual Coworkia',
    autoplay: true,  // Auto-reproducir al mostrar
    loop: true,      // Reproducir en bucle
    muted: true      // Silenciar (recomendado para autoplay)
  },
  {
    type: 'video',
    src: '/videos/tu-video-grande.mp4',
    alt: 'Video promocional',
    autoplay: true,
    loop: false,
    muted: true
  }
];
```

**3. Reiniciar servidor:**
```bash
sudo pkill -f "node server.js"
cd ~/wifi-portal-coworkia
sudo node server.js
```

---

### Opción 2: Videos desde URL Externa

Si tu video está en YouTube, Vimeo, o servidor externo:

```javascript
{
  type: 'video',
  src: 'https://tu-servidor.com/videos/anuncio.mp4',
  alt: 'Anuncio externo',
  autoplay: true,
  loop: true,
  muted: true
}
```

---

## 🎥 SOBRE EL VIDEO DE 108.6MB

**¿Es posible usarlo? SÍ, totalmente.**

### Recomendaciones:

1. **Formato optimizado:**
   - Preferir MP4 (H.264)
   - WebM para mejor compresión
   
2. **Compresión (opcional):**
   ```bash
   # Si tienes ffmpeg instalado, puedes optimizar:
   ffmpeg -i video-original.mp4 -vcodec h264 -acodec aac -b:v 2M video-optimizado.mp4
   ```

3. **Carga inicial:**
   - El video se carga con `preload="metadata"` (solo información, no todo el video)
   - Se descarga completo cuando el usuario llega a ese slide
   - No afecta la velocidad del portal

4. **Colocarlo:**
   ```bash
   # Copiar tu video al servidor
   cp tu-video-108mb.mp4 ~/wifi-portal-coworkia/public/videos/promo-coworkia.mp4
   
   # Agregar a routes/auth.js:
   {
     type: 'video',
     src: '/videos/promo-coworkia.mp4',
     alt: 'Promoción Coworkia',
     autoplay: true,
     loop: true,
     muted: true
   }
   ```

---

## 🎨 Personalización Avanzada

### Cambiar velocidad de auto-play

En `public/js/login.js`, busca:
```javascript
carouselInterval = setInterval(() => {
  changeSlide(1);
}, 5000); // 5000 = 5 segundos
```

Cambia `5000` por la cantidad de milisegundos que quieras.

### Desactivar auto-play

En `public/js/login.js`, comenta la línea:
```javascript
// startAutoPlay();
```

---

## 📊 Capacidades Técnicas

- **Peso máximo recomendado por video:** 200MB
- **Número de slides:** Ilimitado (recomendado 3-5)
- **Formatos soportados:**
  - Imágenes: JPG, PNG, GIF, WebP, SVG
  - Videos: MP4, WebM, OGG, MOV
- **Resolución recomendada:**
  - Imágenes: 1920x1080 o 1080x1920 (vertical)
  - Videos: 1080p (1920x1080)

---

## 🔍 Troubleshooting

### Video no se reproduce
- Verificar que el formato sea MP4 (H.264)
- Agregar `muted: true` (navegadores bloquean autoplay con sonido)

### Carrusel no cambia automáticamente
- Verificar que tengas más de 1 slide
- Revisar consola del navegador (F12)

### Video muy lento
- Comprimir con ffmpeg
- Usar resolución 720p en vez de 1080p
- Subir a CDN externo (Cloudflare, AWS S3)

---

## ✅ TODO LIST para tu video de 108MB

1. [ ] Copiar video a `/public/videos/`
2. [ ] Agregar configuración en `routes/auth.js`
3. [ ] Reiniciar servidor
4. [ ] Probar en iPad/iPhone
5. [ ] Verificar que auto-play funciona

---

**Fecha de implementación:** 26 de febrero de 2026
**Desarrollado para:** Coworkia Business Center
