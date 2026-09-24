/* Tuntematon — shared logic used by both the Home grid (js/home.js) and
   the Works archive (js/works.js): color-contrast helpers and the work
   pop-up (title/meta/description + photo carousel + fullscreen viewer).
   Both pages must include the same pop-up markup (see index.html /
   works.html) for this to work — ids are shared on purpose. */

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#0F0F0F' : '#F5F3EF';
}

/* Samples a loaded image (via a small offscreen canvas) to pick a
   readable text color for a caption sitting on top of a photo. */
function applyImageContrast(el, src) {
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width = 10; c.height = 10;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      el.style.color = contrastColor(hex);
    } catch (e) { /* local file without CORS — keep default color */ }
  };
  img.src = src;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- Work pop-up ---------------- */

const WorkPopup = (() => {
  let lastFocused = null;
  let galleryImages = [];
  let galleryIndex = 0;

  function el(id) { return document.getElementById(id); }

  function open(item) {
    lastFocused = document.activeElement;
    el('ov-title').textContent = item.t;
    el('ov-meta').textContent = item.meta || '';
    el('ov-desc').textContent = item.desc || '';

    const photo = el('ov-photo');
    const prevBtn = el('gallery-prev');
    const nextBtn = el('gallery-next');
    const dots = el('gallery-dots');

    if (item.gallery && item.gallery.length > 1) {
      galleryImages = item.gallery;
      galleryIndex = 0;
      photo.dataset.mode = 'img';
      prevBtn.classList.add('show');
      nextBtn.classList.add('show');
      dots.classList.add('show');
      renderDots();
      renderSlide();
    } else {
      galleryImages = [];
      prevBtn.classList.remove('show');
      nextBtn.classList.remove('show');
      dots.classList.remove('show');
      if (item.img) {
        photo.style.backgroundImage = "url('" + item.img + "')";
        photo.dataset.img = item.img;
        photo.dataset.mode = 'img';
      } else {
        photo.style.backgroundImage = 'none';
        photo.style.background = item.ph || '#3a3a36';
        photo.dataset.ph = item.ph || '#3a3a36';
        photo.dataset.mode = 'color';
      }
    }

    const videoEl = el('ov-video');
    if (item.videoUrl) {
      videoEl.innerHTML = '<a href="' + item.videoUrl + '" target="_blank" rel="noopener" style="color:#0F0F0F;">Watch video documentation &rarr;</a>';
      videoEl.style.display = 'block';
    } else if (item.video) {
      videoEl.textContent = 'Video documentation: in progress, coming soon';
      videoEl.style.display = 'block';
    } else {
      videoEl.style.display = 'none';
    }

    el('overlay').classList.add('open');
    el('overlay-card').focus();
    document.addEventListener('keydown', trapFocus);
  }

  function close() {
    el('overlay').classList.remove('open');
    document.removeEventListener('keydown', trapFocus);
    if (lastFocused) lastFocused.focus();
  }

  function renderSlide() {
    const photo = el('ov-photo');
    const url = galleryImages[galleryIndex];
    photo.style.backgroundImage = "url('" + url + "')";
    photo.dataset.img = url;
    document.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.classList.toggle('active', i === galleryIndex);
      d.textContent = i === galleryIndex ? '\u25CF' : '\u25CB';
    });
    syncFullscreenDots();
  }

  function renderDots() {
    const wrap = el('gallery-dots');
    wrap.innerHTML = '';
    galleryImages.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'gallery-dot' + (i === galleryIndex ? ' active' : '');
      dot.textContent = i === galleryIndex ? '\u25CF' : '\u25CB';
      dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      dot.onclick = (e) => { e.stopPropagation(); galleryIndex = i; renderSlide(); };
      wrap.appendChild(dot);
    });
  }

  function step(e, dir) {
    if (e) e.stopPropagation();
    if (!galleryImages.length) return;
    galleryIndex = (galleryIndex + dir + galleryImages.length) % galleryImages.length;
    renderSlide();
  }

  function trapFocus(e) {
    if (e.key === 'Escape') {
      if (el('photoOverlay').classList.contains('open')) { closePhoto(); return; }
      close();
      return;
    }
    if (galleryImages.length) {
      if (e.key === 'ArrowLeft') { step(null, -1); return; }
      if (e.key === 'ArrowRight') { step(null, 1); return; }
    }
    if (e.key !== 'Tab') return;
    const card = el('overlay-card');
    const focusable = card.querySelectorAll('[tabindex], button, a');
    if (!focusable.length) { e.preventDefault(); card.focus(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---- Fullscreen photo viewer (tap the photo) — same gallery, own controls ---- */

  function openPhoto(e) {
    e.stopPropagation();
    const photo = el('ov-photo');
    const po = el('photoOverlay');
    if (photo.dataset.mode === 'img') {
      po.style.backgroundImage = "url('" + photo.dataset.img + "')";
    } else {
      po.style.backgroundImage = 'none';
      po.style.background = photo.dataset.ph;
    }
    const prevBtn = el('photo-prev'), nextBtn = el('photo-next'), dots = el('photo-dots');
    if (galleryImages.length > 1) {
      prevBtn.classList.add('show');
      nextBtn.classList.add('show');
      dots.classList.add('show');
      renderFullscreenDots();
    } else {
      prevBtn.classList.remove('show');
      nextBtn.classList.remove('show');
      dots.classList.remove('show');
    }
    po.classList.add('open');
  }

  function closePhoto() {
    el('photoOverlay').classList.remove('open');
  }

  function photoStep(e, dir) {
    e.stopPropagation();
    step(null, dir);
    el('photoOverlay').style.backgroundImage = "url('" + galleryImages[galleryIndex] + "')";
    syncFullscreenDots();
  }

  function renderFullscreenDots() {
    const wrap = el('photo-dots');
    wrap.innerHTML = '';
    galleryImages.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'photo-dot' + (i === galleryIndex ? ' active' : '');
      dot.textContent = i === galleryIndex ? '\u25CF' : '\u25CB';
      dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
      dot.onclick = (e) => { e.stopPropagation(); galleryIndex = i; renderSlide(); el('photoOverlay').style.backgroundImage = "url('" + galleryImages[galleryIndex] + "')"; renderFullscreenDots(); };
      wrap.appendChild(dot);
    });
  }

  function syncFullscreenDots() {
    if (el('photoOverlay').classList.contains('open')) renderFullscreenDots();
  }

  function init() {
    // Guarded on purpose: not every page that includes common.js has the
    // full pop-up/carousel markup (e.g. shop.html has its own simpler
    // overlay and doesn't use WorkPopup at all) — skip wiring silently
    // instead of throwing on a missing element.
    const card = el('overlay-card');
    if (!card) return;
    card.tabIndex = -1;
    el('overlay-inner').onclick = close;
    card.onclick = (e) => e.stopPropagation();
    if (el('gallery-prev')) el('gallery-prev').onclick = (e) => step(e, -1);
    if (el('gallery-next')) el('gallery-next').onclick = (e) => step(e, 1);
    if (el('ov-photo')) el('ov-photo').onclick = openPhoto;
    if (el('photoOverlay')) el('photoOverlay').onclick = closePhoto;
    if (el('photo-prev')) el('photo-prev').onclick = (e) => photoStep(e, -1);
    if (el('photo-next')) el('photo-next').onclick = (e) => photoStep(e, 1);
  }

  return { init, open, close };
})();

document.addEventListener('DOMContentLoaded', WorkPopup.init);
