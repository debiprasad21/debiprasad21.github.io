/* ==========================================================================
   Portfolio — interactions
   1. (removed — the circuit line is the only scroll indicator)
   2. Sticky nav + mobile menu
   3. Scroll-spy (active nav link)
   4. Scroll reveal
   5. The circuit line: path built from real section positions
   6. Footer year
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---------- 2. Nav ---------- */
  const nav      = document.getElementById('nav');
  const burger   = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  const closeMenu = () => {
    burger.classList.remove('is-open');
    navLinks.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    navLinks.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    // Stop the page scrolling behind the open menu
    document.body.classList.toggle('menu-open', open);
  });

  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 3. Scroll-spy ---------- */
  // #home sits outside .sections, so it has to be named explicitly
  const sections = [...document.querySelectorAll('#home, .sections section[id]')];

  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const link = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
      if (!link) return;
      document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(s => spy.observe(s));

  /* ---------- 4. Scroll reveal ---------- */
  const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealer.observe(el));

  /* ---------- 4b. "Show more" on each role ---------- */
  document.querySelectorAll('.role').forEach(role => {
    const btn = role.querySelector('.more-btn');
    if (!btn || !role.querySelector('.is-extra')) return;
    role.classList.add('is-collapsed');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = role.classList.toggle('is-collapsed') === false;
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ======================================================================
     5. THE CIRCUIT LINE
     Draws one continuous path down the left rail that bends at every
     section, like a simplified track map. The path is rebuilt from the
     real measured positions of the sections, so it survives any amount
     of content being added or removed.
     ====================================================================== */

  const wrap     = document.getElementById('sections');
  const track    = document.getElementById('track');
  const svg      = document.getElementById('trackSvg');
  const basePath = document.getElementById('trackBase');
  const progPath = document.getElementById('trackProgress');
  const car      = document.getElementById('trackCar');

  const BEND_RADIUS = 28;   // how rounded each corner is
  const BEND_LEAD   = 38;   // how far above a section the bend happens

  let pathLength = 0;
  let lastY      = 0;      // y of the final marker (end of the line)
  let corners    = [];      // { el, x, y, at }

  function buildTrack() {
    if (!track || !wrap) return;

    // Skip entirely on narrow screens — the rail is hidden there.
    if (getComputedStyle(track).display === 'none') {
      track.classList.remove('is-ready');
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const wrapRect  = wrap.getBoundingClientRect();
    const W = trackRect.width;
    const H = wrapRect.height;
    if (!W || !H) return;

    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    const xs = [20, W - 26];                       // the two lanes the line swings between
    const laneFor = i => xs[i % 2];

    // Remove markers from a previous build
    corners.forEach(c => c.el.remove());
    corners = [];

    const items = [...wrap.querySelectorAll('[data-corner]')];
    if (!items.length) return;

    let d = `M ${laneFor(0)} 0`;

    items.forEach((section, i) => {
      const top = section.getBoundingClientRect().top - wrapRect.top;

      if (i > 0) {
        const x0 = laneFor(i - 1);
        const x1 = laneFor(i);
        const y  = Math.max(BEND_RADIUS + 2, top - BEND_LEAD);
        // straight down, then an S-curve across to the other lane
        d += ` L ${x0} ${y - BEND_RADIUS}`;
        d += ` C ${x0} ${y}, ${x1} ${y}, ${x1} ${y + BEND_RADIUS}`;
      }

      // Numbered marker, sitting on the line beside the section number
      const numEl = section.querySelector('.section__title, .contact__title');
      const markerY = numEl
        ? numEl.getBoundingClientRect().top - wrapRect.top + numEl.offsetHeight / 2
        : top + 40;

      const marker = document.createElement('span');
      marker.className = 'corner';
      if (section.classList.contains('section--alt'))  marker.classList.add('on-alt');
      if (section.classList.contains('section--dark')) marker.classList.add('on-dark');
      marker.style.left = laneFor(i) + 'px';
      marker.style.top  = markerY + 'px';
      track.appendChild(marker);
      corners.push({ el: marker, y: markerY });
    });

    // End the line on the last marker, so the moving dot finishes on it
    lastY = corners.length ? corners[corners.length - 1].y : H;
    d += ` L ${laneFor(items.length - 1)} ${lastY}`;

    basePath.setAttribute('d', d);
    progPath.setAttribute('d', d);

    pathLength = basePath.getTotalLength();
    progPath.style.strokeDasharray  = pathLength;
    progPath.style.strokeDashoffset = pathLength;

    track.classList.add('is-ready');
    updateTrack();
  }

  function updateTrack() {
    if (!track.classList.contains('is-ready') || !pathLength) return;

    const wrapRect = wrap.getBoundingClientRect();
    // How far the middle of the viewport has travelled towards the last marker.
    // At the very bottom of the page it is forced to 1, so the dot always
    // finishes exactly on the final marker.
    const travelled = (window.innerHeight / 2) - wrapRect.top;
    const pTravel   = clamp(travelled / (lastY || wrapRect.height), 0, 1);
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const atBottom  = window.scrollY >= scrollMax - 2;
    // Over the last 300px of scrolling, glide the dot the rest of the way
    const pEnd      = clamp((window.scrollY - (scrollMax - 300)) / 300, 0, 1);
    const p         = pTravel + (1 - pTravel) * pEnd;

    progPath.style.strokeDashoffset = pathLength * (1 - p);

    const pt = basePath.getPointAtLength(pathLength * p);
    car.style.transform = `translate(${pt.x}px, ${pt.y}px)`;

    const reached = -wrapRect.top + window.innerHeight * 0.55;
    corners.forEach(c => c.el.classList.toggle('is-passed', atBottom || reached >= c.y));
  }

  /* ---------- shared scroll handler ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 10);

      updateTrack();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- build + rebuild ---------- */
  buildTrack();
  window.addEventListener('load', buildTrack);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildTrack, 150);
  });

  // Content height can change as fonts load or sections reveal
  if ('ResizeObserver' in window) {
    let roTimer;
    new ResizeObserver(() => {
      clearTimeout(roTimer);
      roTimer = setTimeout(buildTrack, 120);
    }).observe(wrap);
  }

  /* ---------- 6. Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

});
