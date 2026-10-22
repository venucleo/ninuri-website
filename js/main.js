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
const onScroll = () => { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); };
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
  const show = (i) => {
    index = at(i);
    const link = links[index];
    img.src = link.href;
    img.alt = link.querySelector('img').alt;
    caption.textContent = link.dataset.caption || '';
    count.textContent = `${index + 1} / ${links.length}`;
    // Preload the neighbours so browsing feels instant
    [at(index + 1), at(index - 1)].forEach((n) => { new Image().src = links[n].href; });
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
