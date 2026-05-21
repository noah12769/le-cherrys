// Scroll-triggered fade-in
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll('.fi').forEach(el => io.observe(el));

// Sticky nav shade
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.background = scrollY > 80
    ? 'rgba(255,255,255,.97)'
    : 'rgba(255,255,255,.82)';
}, { passive: true });

// FAB mobile nav
const fabBtn  = document.getElementById('fabBtn');
const fabWrap = fabBtn && fabBtn.closest('.fab-wrap');
if (fabBtn && fabWrap) {
  fabBtn.addEventListener('click', () => fabWrap.classList.toggle('open'));
  document.querySelectorAll('.fab-item').forEach(a => {
    a.addEventListener('click', () => fabWrap.classList.remove('open'));
  });
}

// Smooth anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ─── Ambiance gallery ───────────────────────────────────────────────────────
let cleanupAmbiance = null;

function setupAmbiance() {
  // Tear down previous setup if any
  if (cleanupAmbiance) { cleanupAmbiance(); cleanupAmbiance = null; }

  const wrapper = document.querySelector('.ambiance-scroll-wrapper');
  const strip   = document.querySelector('.gal-strip');
  if (!wrapper || !strip) return;

  // Reset
  wrapper.classList.remove('is-active');
  wrapper.style.height = '';
  strip.scrollLeft = 0;
  strip.classList.remove('no-overflow', 'dragging');

  // Measure actual overflow after layout settles
  const maxHScroll = strip.scrollWidth - strip.clientWidth;

  if (maxHScroll <= 0) {
    // All photos visible → centre them, no scroll effect
    strip.classList.add('no-overflow');
    return;
  }

  // Photos overflow → scroll-jacking
  wrapper.classList.add('is-active');
  const wrapperH = window.innerHeight + maxHScroll;
  wrapper.style.height = wrapperH + 'px';

  function onScroll() {
    const top      = wrapper.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, -top / (wrapperH - window.innerHeight)));
    strip.scrollLeft = progress * maxHScroll;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Manual drag still works as fallback when not in sticky mode
  let dragging = false, startX, scrollStart;
  function onMouseDown(e) {
    if (wrapper.classList.contains('is-active')) return;
    dragging = true; startX = e.pageX; scrollStart = strip.scrollLeft;
    strip.classList.add('dragging');
  }
  function onMouseMove(e) {
    if (!dragging) return;
    e.preventDefault();
    strip.scrollLeft = scrollStart - (e.pageX - startX);
  }
  function onMouseUp() { dragging = false; strip.classList.remove('dragging'); }

  strip.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  strip.addEventListener('mousemove', onMouseMove);

  // Touch
  let touchStartX, touchScrollStart;
  function onTouchStart(e) { touchStartX = e.touches[0].pageX; touchScrollStart = strip.scrollLeft; }
  function onTouchMove(e) {
    if (wrapper.classList.contains('is-active')) return;
    strip.scrollLeft = touchScrollStart - (e.touches[0].pageX - touchStartX);
  }
  strip.addEventListener('touchstart', onTouchStart, { passive: true });
  strip.addEventListener('touchmove', onTouchMove, { passive: true });

  cleanupAmbiance = () => {
    window.removeEventListener('scroll', onScroll);
    strip.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    strip.removeEventListener('mousemove', onMouseMove);
    strip.removeEventListener('touchstart', onTouchStart);
    strip.removeEventListener('touchmove', onTouchMove);
  };
}

// Debounced resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setupAmbiance, 200);
});

// Run after images load so scrollWidth is accurate
window.addEventListener('load', setupAmbiance);

// ─── Modal téléphone (desktop uniquement) ──────────────────────────────────
const phModal    = document.getElementById('phoneModal');
const phBackdrop = document.getElementById('phBackdrop');
const phClose    = document.getElementById('phClose');
const phCopy     = document.getElementById('phCopy');

function isTouch() { return navigator.maxTouchPoints > 0; }

function openPhModal(e) {
  if (isTouch()) return; // sur mobile, le lien tel: ouvre directement l'appel
  e.preventDefault();
  phModal.classList.add('open');
}

function closePhModal() { phModal.classList.remove('open'); }

document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', openPhModal);
});

if (phBackdrop) phBackdrop.addEventListener('click', closePhModal);
if (phClose)    phClose.addEventListener('click', closePhModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePhModal(); });

if (phCopy) {
  phCopy.addEventListener('click', () => {
    navigator.clipboard.writeText('+590590928665').then(() => {
      phCopy.textContent = 'Copié !';
      setTimeout(() => { phCopy.textContent = 'Copier le numéro'; }, 2000);
    }).catch(() => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('phNumber'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      phCopy.textContent = 'Sélectionné — copiez avec Cmd+C';
      setTimeout(() => { phCopy.textContent = 'Copier le numéro'; }, 3000);
    });
  });
}
