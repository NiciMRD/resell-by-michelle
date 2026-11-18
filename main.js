/* Resell by Michelle — interactions & scroll choreography (GSAP + ScrollTrigger + Lenis) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animated = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const finePointer = matchMedia('(pointer: fine)').matches;

  $('.year').textContent = new Date().getFullYear();

  /* ---------- Kundinnen-Galerie ---------- */
  const kundinnen = [
    { name: 'Danica', meta: 'Kundin aus Esslingen', img: 'assets/kundin-1.webp', tag: 'Kundinnen-Stimme',
      quote: 'Die Abwicklung war so unkompliziert und professionell – ich habe mich von Anfang bis Ende bestens betreut gefühlt. Meine Teile haben ein zweites Zuhause gefunden und das macht mich richtig glücklich.' },
    { name: 'Jacqueline', meta: 'Kleiderschrank-Drop', img: 'assets/jacqueline.webp', pos: '50% 12%', tag: '70+ Teile online',
      text: 'Ihr Kleiderschrank ist online – und es werden noch mehr Teile.' },
    { name: 'Julia', meta: 'Kundin aus München', img: 'assets/kundin-2.webp', tag: 'Kundinnen-Stimme',
      quote: 'Ich liebe, wie einfach alles ist. Tolle Kommunikation, schneller Versand und faire Preise – so macht Second Hand richtig Spaß!' },
    { name: 'Andra', meta: 'Mama zu Mama', img: 'assets/kids-rack.webp', tag: '45+ Teile online',
      text: 'Liebevoll getragene Babykleidung und Marken-Pieces für Frauen suchen ein neues Zuhause.' },
    { name: 'Sophie', meta: 'Kundin aus Freiburg', img: 'assets/kundin-3.webp', tag: 'Kundinnen-Stimme',
      quote: 'Endlich ein Resale-Service, der Mode, Qualität und Nachhaltigkeit wirklich zusammenbringt. Ich bin komplett begeistert!' },
    { name: 'Lisa', meta: 'Preloved Treasures', img: 'assets/item-bag.webp', tag: 'Preloved Treasures',
      text: 'Keine Zeit zum Verkaufen? Lisa hat ihren Schrank abgegeben – ich kümmere mich um den Rest.' }
  ];
  const kTrack = $('.kundinnen-track');
  kundinnen.forEach(k => {
    const el = document.createElement('article');
    el.className = 'k-card';
    el.innerHTML = `
      <div class="k-photo"><img src="${k.img}" alt="${k.name}" loading="lazy" style="object-position:${k.pos || '50% 25%'}"><p class="k-name">${k.name}</p></div>
      <div class="k-body">
        <span class="k-tag">${k.tag}</span>
        ${k.quote ? `<blockquote class="k-quote">„${k.quote}“</blockquote>` : `<p class="k-text">${k.text}</p>`}
        <p class="k-meta">${k.name} · ${k.meta}</p>
      </div>`;
    kTrack.appendChild(el);
  });
  const ctaCard = document.createElement('article');
  ctaCard.className = 'k-card k-cta';
  ctaCard.innerHTML = `<p class="k-cta-script">Deine Story</p><p class="k-cta-text">fehlt noch.</p><button class="btn btn-light js-open-modal" type="button">Kleiderschrank abgeben</button>`;
  kTrack.appendChild(ctaCard);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (animated && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  }
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: id === '#start' ? 0 : -40, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Modal: Kleiderschrank abgeben ---------- */
  const modal = $('#modal');
  const card = $('.modal-card', modal);
  const form = $('.request-form', modal);
  const success = $('.form-success', modal);
  const errorEl = $('.form-error', modal);
  $('.modal-body', modal).setAttribute('data-lenis-prevent', '');
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    lenis && lenis.stop();
    if (animated) {
      gsap.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: .4 });
      gsap.fromTo(card, { y: 40, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .7, ease: 'expo.out' });
      gsap.fromTo('.modal-mailer', { y: 60, rotation: 8, opacity: 0 }, { y: 0, rotation: -9, opacity: 1, duration: .9, delay: .2, ease: 'back.out(1.6)' });
    }
    setTimeout(() => $('input[name="name"]', modal).focus({ preventScroll: true }), 60);
  }
  function resetForm() {
    form.reset();
    form.hidden = false;
    success.hidden = true;
    errorEl.textContent = '';
    $$('.field.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
  }
  function closeModal() {
    const done = () => {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      lenis && lenis.start();
      if (!success.hidden) resetForm();
      lastFocus && lastFocus.focus({ preventScroll: true });
    };
    if (!animated) return done();
    gsap.to(card, { y: 30, opacity: 0, duration: .3, ease: 'power2.in' });
    gsap.to('.modal-backdrop', { opacity: 0, duration: .35, onComplete: done });
  }
  $$('.js-open-modal').forEach(b => b.addEventListener('click', openModal));
  $$('.js-close-modal', modal).forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusables = $$('button, input, textarea, [href]', card).filter(el => !el.closest('[hidden]') && el.offsetParent !== null);
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    $$('.field.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
    const data = new FormData(form);
    const invalid = [];
    ['name', 'city'].forEach(n => { if (!String(data.get(n) || '').trim()) invalid.push(n); });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get('email') || ''))) invalid.push('email');
    invalid.forEach(n => form.elements[n].closest('.field').classList.add('is-invalid'));
    if (invalid.length) { errorEl.textContent = 'Bitte fülle Name, E-Mail und Wohnort korrekt aus.'; form.elements[invalid[0]].focus(); return; }
    if (!data.get('consent')) { errorEl.textContent = 'Bitte bestätige noch die Datenschutz-Einwilligung.'; return; }
    errorEl.textContent = '';
    // TODO: an Backend / Formular-Dienst anbinden, z. B. fetch(ENDPOINT, { method: 'POST', body: data })
    form.hidden = true;
    success.hidden = false;
    if (animated) {
      gsap.fromTo(success, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
      gsap.fromTo($$('.success-heart path', success), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' });
    } else {
      $$('.success-heart path', success).forEach(p => (p.style.strokeDashoffset = 0));
    }
    $('.btn', success).focus({ preventScroll: true });
  });

  /* ---------- Kontakt: Schnellanfrage mit Vorlagen ---------- */
  const qForm = $('.quick-form');
  const qMsg = qForm.elements.qmessage;
  const qErr = $('.quick-error');
  const qSuccess = $('.quick-success');
  let qDirty = false;
  qMsg.addEventListener('input', () => { qDirty = true; });
  $$('.tpl', qForm).forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('is-on');
    btn.setAttribute('aria-pressed', btn.classList.contains('is-on'));
    const picked = $$('.tpl.is-on', qForm).map(b => b.dataset.msg);
    if (!qDirty) qMsg.value = picked.join(' ');
    else if (btn.classList.contains('is-on')) qMsg.value = (qMsg.value.trim() + ' ' + btn.dataset.msg).trim();
    if (window.gsap && !reduce) gsap.fromTo(btn, { scale: .92 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  }));
  qForm.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(qForm);
    $$('.field.is-invalid', qForm).forEach(f => f.classList.remove('is-invalid'));
    const bad = [];
    if (!String(d.get('qmessage') || '').trim()) bad.push('qmessage');
    if (!String(d.get('qname') || '').trim()) bad.push('qname');
    const c = String(d.get('qcontact') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && !/^[+\d][\d\s/()-]{5,}$/.test(c)) bad.push('qcontact');
    bad.forEach(n => qForm.elements[n].closest('.field').classList.add('is-invalid'));
    if (bad.length) { qErr.textContent = 'Bitte Nachricht, Vorname und Telefon oder E-Mail angeben.'; qForm.elements[bad[0]].focus(); return; }
    if (!d.get('qconsent')) { qErr.textContent = 'Bitte bestätige noch die Datenschutz-Einwilligung.'; return; }
    qErr.textContent = '';
    // TODO: an Backend / Formular-Dienst anbinden, z. B. fetch(ENDPOINT, { method: 'POST', body: d })
    qForm.hidden = true;
    qSuccess.hidden = false;
    if (window.gsap && !reduce) {
      gsap.fromTo(qSuccess, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' });
      gsap.fromTo($$('.success-heart path', qSuccess), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' });
    } else $$('.success-heart path', qSuccess).forEach(p => (p.style.strokeDashoffset = 0));
  });
  $('.quick-again').addEventListener('click', () => {
    qForm.reset(); qDirty = false;
    $$('.tpl.is-on', qForm).forEach(b => { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); });
    qSuccess.hidden = true; qForm.hidden = false;
  });

  /* ---------- Film ---------- */
  const film = $('.film-video');
  const caps = $$('.fcap');
  const setCap = i => caps.forEach((c, n) => c.classList.toggle('is-active', n === i));

  /* ---------- Fallback: no GSAP or reduced motion ---------- */
  if (!animated) {
    root.classList.add('no-anim');
    $$('[data-count]').forEach(el => (el.textContent = el.dataset.count));
    $('.payout-count').textContent = '490';
    film.controls = true;
    film.removeAttribute('loop');
    return;
  }

  /* ======================================================================
     Scroll choreography (created in page order — matters for pins)
     ====================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  const header = $('.site-header');
  const mm = gsap.matchMedia();
  const DESKTOP = '(min-width: 961px)';
  const MOBILE = '(max-width: 960px)';

  const scriptHidden = 'inset(-30% 100% -40% -10%)';
  const scriptShown = 'inset(-30% -10% -40% -10%)';

  function drawPaths(svgs, opts = {}) {
    const paths = (Array.isArray(svgs) ? svgs : [svgs]).filter(Boolean).flatMap(s => $$('path', s));
    return gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, stagger: .28, ease: 'power2.inOut', ...opts });
  }
  function countUp(el, opts = {}) {
    const end = +el.dataset.count;
    const o = { v: 0 };
    return gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', ...opts, onUpdate: () => (el.textContent = Math.round(o.v)) });
  }
  function revealHeading(h, trigger) {
    const lines = $$('.line > span', h);
    const scripts = $$('.script > span', h);
    const tl = gsap.timeline({ scrollTrigger: { trigger: trigger || h, start: 'top 82%' } });
    tl.from(lines, { yPercent: 110, duration: 1.1, stagger: .12, ease: 'expo.out' });
    if (scripts.length) tl.fromTo(scripts, { clipPath: scriptHidden }, { clipPath: scriptShown, duration: 1.4, ease: 'power2.inOut' }, .25);
    return tl;
  }

  /* ---------- Instagram DM button: pops in after the hero ---------- */
  gsap.set('.ig-dm', { autoAlpha: 0, y: 30, scale: .8 });
  ScrollTrigger.create({
    start: () => innerHeight * .6, end: 'max',
    onToggle: self => gsap.to('.ig-dm', self.isActive
      ? { autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: 'back.out(1.8)' }
      : { autoAlpha: 0, y: 30, scale: .8, duration: .4, ease: 'power2.in' })
  });

  /* ---------- Global: header state + progress bar ---------- */
  ScrollTrigger.create({ start: 40, end: 'max', toggleClass: { targets: header, className: 'is-scrolled' } });
  gsap.to('.scroll-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer) {
    $$('.magnetic, .cta .btn').forEach(btn => {
      const xTo = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3.out' });
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .3);
        yTo((e.clientY - r.top - r.height / 2) * .4);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- 01 Hero: intro ---------- */
  gsap.set('.hero-title .line > span', { yPercent: 110 });
  gsap.set('.hero-script > span', { clipPath: scriptHidden });
  gsap.set('.hero-rule', { scaleX: 0 });
  gsap.set('.hero .reveal-fade', { opacity: 0, y: 18 });
  gsap.set('.hero-frame', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 6px 6px)' });
  gsap.set('.hero-img', { scale: 1.25 });
  gsap.set('.fc-inner', { opacity: 0, scale: .4, rotation: i => (i % 2 ? 20 : -20) });
  gsap.set('.hero-garment', { opacity: 0, y: 120, rotation: 18 });
  gsap.set('.hero-doodle .note', { opacity: 0, y: 8 });
  gsap.set('.avatars > *', { opacity: 0, x: -14 });
  gsap.set(header, { opacity: 0, y: -20 });

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.intro-mono', { scale: .7, opacity: 0, duration: 1 })
    .to('.intro', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '+=.25')
    .set('.intro', { display: 'none' })
    .to('.hero-frame', { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 6px 6px)', duration: 1.5, ease: 'expo.inOut' }, '-=.75')
    .to('.hero-img', { scale: 1, duration: 2.2 }, '<')
    .to('.hero-title .line > span', { yPercent: 0, duration: 1.2, stagger: .14 }, '-=1.6')
    .to('.hero-script > span', { clipPath: scriptShown, duration: 1.6, ease: 'power2.inOut' }, '-=.8')
    .to('.hero-rule', { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, '-=1.3')
    .to('.hero .reveal-fade', { opacity: 1, y: 0, duration: 1, stagger: .1 }, '-=1')
    .to('.avatars > *', { opacity: 1, x: 0, duration: .7, stagger: .08 }, '-=.8')
    .to('.fc-inner', { opacity: 1, scale: 1, rotation: 0, duration: 1.3, stagger: .12, ease: 'back.out(1.4)' }, '-=1.6')
    .to('.hero-garment', { opacity: 1, y: 0, rotation: -8, duration: 1.4, ease: 'back.out(1.4)' }, '-=1.1')
    .from('.garment-tag', { rotation: 40, transformOrigin: '50% 0%', duration: 1.6, ease: 'elastic.out(1, .4)' }, '-=.6')
    .add(drawPaths($$('.hero-doodle .arrow, .hero-spark'), { duration: .9 }), '-=.6')
    .to('.hero-doodle .note', { opacity: 1, y: 0, duration: .6 }, '-=.9')
    .to(header, { opacity: 1, y: 0, duration: 1 }, '-=1.6');

  /* hero: pointer parallax on floating sold-cards */
  if (finePointer) {
    const movers = $$('.float-card').map(fc => ({
      d: +fc.dataset.depth,
      x: gsap.quickTo($('.fc-inner', fc), 'x', { duration: .9, ease: 'power3.out' }),
      y: gsap.quickTo($('.fc-inner', fc), 'y', { duration: .9, ease: 'power3.out' })
    }));
    const imgX = gsap.quickTo('.hero-img', 'x', { duration: 1.2, ease: 'power3.out' });
    $('.hero').addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      movers.forEach(m => { m.x(nx * 36 * m.d); m.y(ny * 28 * m.d); });
      imgX(nx * -14);
    });
  }

  /* hero: pinned scroll-out (desktop) / simple parallax (mobile) */
  mm.add(DESKTOP, () => {
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to('.hl-1', { xPercent: -28, opacity: .12 }, 0)
      .to('.hl-2', { xPercent: 22, opacity: .12 }, 0)
      .to('.hero-script', { y: -30, scale: 1.08, transformOrigin: 'left center' }, 0)
      .to('.hero-rule, .hero-lead, .hero-actions, .hero-proof', { y: -50, opacity: 0, stagger: .05 }, 0)
      .to('.hero-frame', { scale: 1.1, y: -20 }, 0)
      .to('.hero-img', { yPercent: -8 }, 0)
      .to('.fc-1', { x: -220, y: -180, rotation: -22, opacity: 0 }, 0)
      .to('.fc-2', { x: 240, y: 160, rotation: 18, opacity: 0 }, 0)
      .to('.fc-3', { x: 260, y: -200, rotation: 26, opacity: 0 }, 0)
      .to('.hero-garment', { y: -280, x: -90, rotation: -28 }, 0)
      .to('.hero-doodle, .hero-spark, .scroll-cue', { opacity: 0 }, 0);
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: '+=70%', pin: true, scrub: .6, animation: tl });
  });
  mm.add(MOBILE, () => {
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-img', { yPercent: -8, ease: 'none' }, 0)
      .to('.hero-garment', { y: -120, rotation: -20, ease: 'none' }, 0);
  });

  /* ---------- Statement: word-by-word scrub with inline images ---------- */
  const stText = $('.statement-text');
  (function splitWords(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('st-img')) splitWords(n);
    });
  })(stText);
  const stTl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.statement', start: 'top 78%', end: 'bottom 60%', scrub: .5 } });
  $$('.w, .st-img', stText).forEach((el, i) => {
    if (el.classList.contains('st-img')) stTl.fromTo(el, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: .6 }, i * .1);
    else stTl.fromTo(el, { opacity: .2 }, { opacity: 1, duration: .3 }, i * .1);
  });

  /* ---------- 02 Wert ---------- */
  revealHeading($('.worth .display'));
  gsap.timeline({ scrollTrigger: { trigger: '.worth-head', start: 'top 60%' } })
    .add(drawPaths($('.worth-doodle .arrow')))
    .from('.worth-doodle .note', { opacity: 0, y: 10, duration: .6 }, '-=.4');

  const cards = $$('.sale-card');
  cards.forEach(c => gsap.set(c, { rotation: +c.dataset.rot }));
  gsap.from(cards, {
    yPercent: 35, opacity: 0, rotation: i => +cards[i].dataset.rot * 4,
    duration: 1.3, ease: 'expo.out', stagger: .1,
    scrollTrigger: { trigger: '.sales-grid', start: 'top 85%' }
  });
  cards.forEach(c => {
    const tag = $('.price-tag', c);
    gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 75%' } })
      .from(tag, { scale: 0, rotation: -40, duration: .8, ease: 'back.out(2)', delay: .35 })
      .add(countUp($('b', tag), { duration: 1.1 }), '<');
  });
  mm.add(DESKTOP, () => {
    cards.forEach(c => gsap.to(c, { y: (1 - +c.dataset.speed) * 220, ease: 'none', scrollTrigger: { trigger: '.sales-grid', start: 'top bottom', end: 'bottom top', scrub: true } }));
  });
  gsap.timeline({ scrollTrigger: { trigger: '.worth-total', start: 'top 85%' } })
    .from('.worth-total > *', { opacity: 0, y: 24, stagger: .12, duration: .9, ease: 'power3.out' })
    .add(countUp($('.total-num span'), { duration: 1.8 }), .1);

  /* ---------- Film: pinned, frame opens up, video scrubs with scroll ---------- */
  mm.add(DESKTOP, () => {
    film.pause();
    film.removeAttribute('loop');
    const proxy = { t: 0 };
    let wanted = 0, raf = 0;
    const seek = () => {
      raf = 0;
      if (film.readyState >= 1 && film.duration) {
        const time = Math.min(wanted * film.duration, film.duration - .05);
        if (Math.abs(film.currentTime - time) > .02) film.currentTime = time;
      }
    };
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.fromTo('.film-frame', { clipPath: 'inset(32% 22% 7% 22% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut', immediateRender: true }, 0)
      .to('.film-title', { yPercent: -80, opacity: 0, duration: .6 }, .15)
      .fromTo('.film-video', { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
      .fromTo('.film-shade, .film-caps, .film-bar', { opacity: 0 }, { opacity: 1, duration: .3 }, .75)
      .to(proxy, {
        t: 1, duration: 4,
        onUpdate: () => {
          wanted = proxy.t;
          if (!raf) raf = requestAnimationFrame(seek);
          setCap(Math.min(2, Math.floor(proxy.t * 3)));
          gsap.set('.film-bar span', { scaleX: proxy.t });
        }
      }, .8)
      .to({}, { duration: .3 });
    ScrollTrigger.create({ trigger: '.film', start: 'top top', end: '+=320%', pin: true, scrub: .6, animation: tl, anticipatePin: 1 });
    return () => { film.setAttribute('loop', ''); };
  });
  mm.add(MOBILE, () => {
    revealHeading($('.film-title'));
    const onTime = () => film.duration && setCap(Math.min(2, Math.floor(film.currentTime / film.duration * 3)));
    film.addEventListener('timeupdate', onTime);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? film.play().catch(() => {}) : film.pause()), { threshold: .4 });
    io.observe(film);
    gsap.from('.film-frame', { clipPath: 'inset(10% 10% 10% 10% round 24px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.film-frame', start: 'top 85%' } });
    return () => { io.disconnect(); film.removeEventListener('timeupdate', onTime); film.pause(); };
  });

  /* ---------- 03 So funktioniert's (pinned transformation) ---------- */
  const steps = $$('.step');
  const listing = $('.listing');
  const payoutCount = $('.payout-count');

  mm.add(DESKTOP, () => {
    const frames = $$('.frame');
    gsap.set(frames.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set($$('.frame img'), { scale: 1.14 });
    gsap.set(listing, { opacity: 0, y: 40 });
    gsap.set('.payout', { opacity: 0, y: 30, scale: .95 });
    const pay = { v: 0 };

    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to($('img', frames[0]), { scale: 1, duration: 1 }, 0)
      .from('.n1', { opacity: 0, rotation: -20, duration: .4 }, .3)
      .to(frames[1], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 1)
      .to($('img', frames[1]), { scale: 1, duration: 1.2 }, 1)
      .from('.n2', { opacity: 0, y: 20, duration: .4 }, 1.7)
      .to(frames[2], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 2.1)
      .to($('img', frames[2]), { scale: 1, duration: 1.2 }, 2.1)
      .to(listing, { opacity: 1, y: 0, duration: .5 }, 2.7)
      .to(frames[3], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 3.5)
      .to($('img', frames[3]), { scale: 1, duration: 1.2 }, 3.5)
      .to(frames[4], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 }, 4.6)
      .to($('img', frames[4]), { scale: 1, duration: 1.2 }, 4.6)
      .to(listing, { opacity: 0, y: 30, duration: .4 }, 4.9)
      .to('.payout', { opacity: 1, y: 0, scale: 1, duration: .5 }, 5.2)
      .to(pay, { v: 490, duration: .9, onUpdate: () => (payoutCount.textContent = Math.round(pay.v)) }, 5.3)
      .from('.n5', { opacity: 0, x: -20, duration: .4 }, 5.4)
      .to({}, { duration: .5 });

    const total = tl.duration();
    const stepStarts = [0, 1 / total, 3.5 / total];
    let current = -1;
    ScrollTrigger.create({
      trigger: '.process', start: 'top top', end: '+=360%',
      pin: true, scrub: .8, animation: tl, anticipatePin: 1,
      onUpdate: self => {
        const p = self.progress;
        let s = 0;
        stepStarts.forEach((v, i) => { if (p >= v) s = i; });
        if (s !== current) { current = s; steps.forEach((el, i) => el.classList.toggle('is-active', i === s)); }
        listing.classList.toggle('is-sold', p > 3.2 / total);
        gsap.set('.step-progress span', { scaleX: p });
      }
    });
    return () => { payoutCount.textContent = '0'; };
  });
  mm.add(MOBILE, () => {
    steps.forEach(s => {
      s.classList.add('is-active');
      gsap.from(s, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 85%' } });
    });
  });
  gsap.from('.process-title', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.process', start: 'top 70%' } });

  /* ---------- 04 Drops ---------- */
  revealHeading($('.drops-title'));
  gsap.from('.drops-intro, .drops-steps li', { opacity: 0, y: 24, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.drops-explain', start: 'top 82%' } });
  gsap.from('.drop-label', { opacity: 0, x: -16, duration: .7, stagger: .1, scrollTrigger: { trigger: '.drops-feature', start: 'top 75%' } });
  gsap.from('.drop-lisa', { y: 120, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.drops-feature', start: 'top 85%' } });
  gsap.from('.drops-grid .drop', { y: 120, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: '.drops-grid', start: 'top 85%' } });
  $$('.drop-title').forEach(h => revealHeading(h, h.closest('.drop')));
  gsap.from('.phone', { y: 200, rotation: 6, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.drop-jac', start: 'top 60%' } });
  gsap.to('.app-grid', {
    y: () => -($('.app-grid').scrollHeight - $('.app-scroll').clientHeight + 10),
    ease: 'none',
    scrollTrigger: { trigger: '.drop-jac', start: 'top 40%', end: 'bottom 30%', scrub: 1, invalidateOnRefresh: true }
  });
  gsap.fromTo('.drop-jac .drop-photo', { yPercent: 6 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.drop-jac', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.drop-kids .drop-photo', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.drop-kids', start: 'top bottom', end: 'bottom 40%', scrub: true } });
  gsap.from('.badge-neu', { scale: 0, rotation: -200, duration: 1.2, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.drop-kids', start: 'top 55%' } });
  $$('.drop-count').forEach(el => gsap.from(el, { opacity: 0, y: 14, duration: .8, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  ScrollTrigger.create({ trigger: '.drop-jac', start: 'top 45%', once: true, onEnter: () => drawPaths($('.jac-doodle .arrow')) });
  ScrollTrigger.create({ trigger: '.drop-kids .drop-media', start: 'top 70%', once: true, onEnter: () => drawPaths($$('.kids-doodle .draw')) });
  gsap.from('.lisa-items img', { y: 80, opacity: 0, rotation: i => (i % 2 ? 12 : -12), duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.drop-lisa', start: 'top 75%' } });
  ScrollTrigger.create({ trigger: '.drop-lisa', start: 'top 65%', once: true, onEnter: () => drawPaths($('.lisa-heart')) });

  /* ---------- 05 Kundinnen: horizontal pinned gallery ---------- */
  ScrollTrigger.create({ trigger: '.stories', start: 'top 70px', end: 'bottom 70px', toggleClass: { targets: header, className: 'is-dark' } });
  revealHeading($('.stories-title'));
  gsap.from('.k-card', { y: 100, opacity: 0, rotation: i => (i % 2 ? 3 : -3), duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.kundinnen-viewport', start: 'top 85%' } });
  mm.add(DESKTOP, () => {
    const dist = () => Math.max(0, kTrack.scrollWidth - innerWidth);
    const skewTo = gsap.quickTo(kTrack, 'skewX', { duration: .5, ease: 'power3.out' });
    const slide = gsap.to(kTrack, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.stories', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => {
          gsap.set('.kundinnen-bar span', { scaleX: self.progress });
          skewTo(gsap.utils.clamp(-4, 4, self.getVelocity() / -400));
        },
        onScrubComplete: () => skewTo(0)
      }
    });
    $$('.k-photo img').forEach(img => {
      gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: img.closest('.k-card'), containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } });
    });
  });

  /* ---------- 06 Über mich ---------- */
  revealHeading($('.about-title'));
  gsap.from('.about .reveal-up', { opacity: 0, y: 28, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.about-copy', start: 'top 70%' } });
  gsap.timeline({ scrollTrigger: { trigger: '.about-media', start: 'top 72%' } })
    .from('.about-frame', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
    .from('.about-frame img', { scale: 1.3, duration: 1.8, ease: 'expo.out' }, '<.2')
    .from('.about-mailer', { y: 120, rotation: 40, opacity: 0, duration: 1.2, ease: 'back.out(1.4)' }, '-=1')
    .add(drawPaths($('.anno-home .arrow')), '-=.6')
    .from('.anno-home .note', { opacity: 0, scale: .6, duration: .6, ease: 'back.out(2)' }, '-=.5')
    .add(drawPaths($('.anno-me .arrow')), '-=.2')
    .from('.anno-me .note', { opacity: 0, scale: .6, duration: .6, ease: 'back.out(2)' }, '-=.5')
    .add(drawPaths($('.anno-cat .arrow')), '-=.2')
    .from('.anno-cat .note', { opacity: 0, scale: .6, duration: .6, ease: 'back.out(2)' }, '-=.5')
    .add(drawPaths($('.anno-bag .arrow')), '-=.2')
    .from('.anno-bag .note', { opacity: 0, scale: .6, duration: .6, ease: 'back.out(2)' }, '-=.5');
  gsap.fromTo('.signature', { clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 92%' } });

  /* ---------- Hinter den Kulissen ---------- */
  revealHeading($('.bts-title'));
  gsap.from('.bts-tile', { y: 90, opacity: 0, rotation: i => (i % 2 ? 4 : -4), duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.bts-track', start: 'top 85%' } });
  gsap.fromTo('.bts-track', { x: () => innerWidth * .08 }, {
    x: () => Math.min(0, innerWidth - $('.bts-track').scrollWidth - innerWidth * .04),
    ease: 'none',
    scrollTrigger: { trigger: '.bts', start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true }
  });

  /* ---------- CTA: blush circle opens up ---------- */
  gsap.fromTo('.cta', { clipPath: 'circle(16% at 50% 55%)' }, { clipPath: 'circle(85% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'top 15%', scrub: true } });
  revealHeading($('.cta-title'));
  gsap.from('.cta-lead, .cta .btn', { opacity: 0, y: 24, stagger: .12, duration: .9, scrollTrigger: { trigger: '.cta', start: 'top 60%' } });
  gsap.fromTo('.cta-mailer', { y: 160, rotation: 20 }, { y: -60, rotation: -22, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Kontakt ---------- */
  revealHeading($('.contact-title'));
  gsap.from('.contact-lead, .contact-facts li', { opacity: 0, y: 20, stagger: .08, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 72%' } });
  gsap.from('.contact-card', { y: 80, opacity: 0, rotation: 1.5, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 72%' } });
  gsap.from('.tpl', { opacity: 0, y: 14, stagger: .05, duration: .6, ease: 'back.out(2)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.contact-card', start: 'top 80%' } });

  /* ---------- Footer wordmark: letters rise ---------- */
  const word = $('.footer-word');
  word.innerHTML = [...word.textContent].map(ch => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  gsap.from($$('span', word), { yPercent: 110, duration: 1.2, stagger: .035, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 92%' } });

  /* ---------- Active nav link ---------- */
  $$('.nav a').forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top center', end: 'bottom center',
      onToggle: self => a.classList.toggle('is-active', self.isActive)
    });
  });

  /* fonts / images change layout → re-measure */
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
