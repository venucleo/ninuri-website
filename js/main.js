// No right-click "save image" or dragging on photos (a deterrent, not a lock)
// (the gallery links count too: "Save link as" would fetch the full-size photo)
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('img, .lb-stage, .gallery a, .mosaic li, .cover, .photo-strip')) e.preventDefault();
});
document.addEventListener('dragstart', (e) => { if (e.target.closest('img')) e.preventDefault(); });

// Mobile menu
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
if (toggle && nav) {
  const label = toggle.querySelector('.nav-toggle-text');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Schließen' : 'Menü';
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// The header slims down and gets a hairline once the page scrolls
const onScroll = () => { document.documentElement.classList.toggle('is-scrolled', window.scrollY > 24); };
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Start page layout, picked by what fits the window height:
// 4 x 5 squares when all five rows fit, else 6 x 3 squares when those fit,
// else 6 columns with landscape top and bottom rows. Phones keep two columns.
const mosaic = document.querySelector('.mosaic');
if (mosaic) {
  const fits = (cols, rows, width, gap, top) => {
    const tile = (width - (cols - 1) * gap) / cols;
    return top + rows * tile + (rows - 1) * gap <= window.innerHeight;
  };
  const fit = () => {
    const cs = getComputedStyle(mosaic);
    const phone = window.matchMedia('(max-width: 640px)').matches;
    const gap = parseFloat(cs.columnGap);
    const width = mosaic.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const top = (header ? header.offsetHeight : 0) + parseFloat(cs.paddingTop);
    const four = !phone && fits(4, 5, width, gap, top);
    mosaic.classList.toggle('is-four', four);
    mosaic.classList.toggle('is-square', !phone && !four && fits(6, 3, width, gap, top));
  };
  fit();
  window.addEventListener('resize', fit, { passive: true });
}

// Cover bands: the photo drifts against the scroll and is centred on the band
// when the band sits in the middle of the window (or at page load for a band
// near the top, which never gets there)
const covers = [...document.querySelectorAll('.cover img')];
if (covers.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let bands = [];
  const measure = () => {
    bands = covers.map((img) => {
      const band = img.parentElement.getBoundingClientRect();
      const centre = band.top + window.scrollY + band.height / 2;
      // The photo may move 30% of the band height either way (see style.css),
      // spread over the scroll distance in which the band is on screen
      const limit = band.height * 0.3;
      return { rest: Math.max(0, centre - window.innerHeight / 2), limit, speed: limit / ((window.innerHeight + band.height) / 2) };
    });
  };
  let ticking = false;
  const drift = () => {
    ticking = false;
    covers.forEach((img, i) => {
      const { rest, limit, speed } = bands[i];
      const shift = Math.max(-limit, Math.min(limit, (window.scrollY - rest) * speed));
      img.style.transform = `translate3d(0, ${shift}px, 0)`;
    });
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } };
  measure();
  drift();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); }, { passive: true });
  window.addEventListener('load', () => { measure(); request(); });
}

// Fade content in as it scrolls into view
const revealables = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  revealables.forEach((el) => reveal.observe(el));

  // Highlight the section in view in the section switcher
  const subLinks = [...document.querySelectorAll('.subnav a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      subLinks.forEach((a) => a.classList.toggle('is-active', a.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  subLinks.forEach((a) => {
    const section = document.querySelector(a.hash);
    if (section) spy.observe(section);
  });
} else {
  revealables.forEach((el) => el.classList.add('is-in'));
}

// Lightbox for the work galleries; each section on a page browses on its own
const dialog = document.querySelector('.lightbox');
if (dialog) {
  const img = dialog.querySelector('img');
  const caption = dialog.querySelector('.lb-caption');
  const count = dialog.querySelector('.lb-count');
  let links = [];
  let index = 0;
  const at = (i) => (i + links.length) % links.length;
  // Phones get the 1080 px copy, larger screens the full 1920 px photo
  const full = (link) => (window.innerWidth * (window.devicePixelRatio || 1) <= 1300
    ? link.href.replace(/\.webp$/, '-1080.webp') : link.href);
  const loaded = new Set();
  const preload = (src) => new Promise((resolve) => {
    if (loaded.has(src)) { resolve(); return; }
    const pre = new Image();
    pre.onload = () => { loaded.add(src); resolve(); };
    pre.onerror = resolve;
    pre.src = src;
  });
  const show = (i) => {
    index = at(i);
    const link = links[index];
    const thumb = link.querySelector('img');
    const src = full(link);
    // Show the thumbnail that is already loaded at once, then swap in the sharp photo
    img.classList.remove('is-in');
    img.src = loaded.has(src) ? src : thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    requestAnimationFrame(() => img.classList.add('is-in'));
    caption.textContent = link.dataset.caption || '';
    count.textContent = `${index + 1} / ${links.length}`;
    if (!loaded.has(src)) {
      dialog.classList.add('is-loading');
      const wanted = index;
      preload(src).then(() => {
        if (wanted !== index) return;
        img.src = src;
        dialog.classList.remove('is-loading');
      });
    } else {
      dialog.classList.remove('is-loading');
    }
    // Preload the neighbours so browsing feels instant
    [at(index + 1), at(index - 1)].forEach((n) => preload(full(links[n])));
  };
  document.querySelectorAll('.gallery').forEach((gallery) => {
    const group = [...gallery.querySelectorAll('a')];
    group.forEach((a, i) => a.addEventListener('click', (e) => {
      e.preventDefault();
      links = group;
      show(i);
      dialog.showModal();
    }));
  });
  dialog.addEventListener('close', () => { if (links[index]) links[index].focus(); });
  dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.classList.contains('lb-stage')) dialog.close(); });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  // Swipe on touch screens; the arrow buttons do the same
  let startX = null;
  dialog.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}
