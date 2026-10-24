(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (event, params = {}) => {
    try { (window.dataLayer = window.dataLayer || []).push({ event, ...params }); } catch (e) {}
    try { if (typeof window.ym === 'function' && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', event, params); } catch (e) {}
  };
  window.hdTrack = track;
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');

  /* ---------- Hero theme: switch with <body data-hero="blue|light"> ---------- */
  const HERO_THEMES = {
    blue: { src: 'assets/img/hero-blue.webp', alt: 'Руки в нитриловых перчатках осматривают термостакан под стереомикроскопом с кольцевой подсветкой' },
    light: { src: 'assets/img/hero-light.webp', alt: 'Руки инспектора в нитриловых перчатках осматривают термостакан над партией на столе' }
  };
  const heroTheme = HERO_THEMES[document.body.dataset.hero] || HERO_THEMES.blue;
  const heroImg = $('.hero-still');
  if (heroImg && !heroImg.src.endsWith(heroTheme.src)) { heroImg.src = heroTheme.src; heroImg.alt = heroTheme.alt; }

  /* ---------- Reveal (toggle on every enter/leave) ---------- */
  const revealEls = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
    }, { threshold: 0, rootMargin: '0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Count-up in facts strip ---------- */
  const counters = $$('.facts [data-count]');
  const runCount = el => {
    const target = +el.dataset.count, t0 = performance.now(), D = 1200;
    const step = now => { const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const strip = $('.facts-grid');
    new IntersectionObserver(([e]) => { if (e.isIntersecting) counters.forEach(runCount); }, { threshold: .4 }).observe(strip);
  }

  /* ---------- Facts parallax staircase ---------- */
  const factsSec = $('.facts'), facts = $$('.fact');
  const mqFacts = window.matchMedia('(max-width: 960px)');
  let fTick = false;
  const factsFrame = () => {
    fTick = false;
    if (reduceMotion || mqFacts.matches) { facts.forEach(f => f.style.setProperty('--py', '0px')); return; }
    const r = factsSec.getBoundingClientRect(), vh = window.innerHeight;
    const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); // 0 → section enters, 1 → leaves
    facts.forEach(f => {
      const k = parseFloat(getComputedStyle(f).getPropertyValue('--k')) || 0;
      f.style.setProperty('--py', ((0.5 - prog) * k * 600).toFixed(1) + 'px');
    });
  };
  window.addEventListener('scroll', () => { if (!fTick) { fTick = true; requestAnimationFrame(factsFrame); } }, { passive: true });
  window.addEventListener('resize', factsFrame);
  factsFrame();

  /* ---------- Calculator background parallax ---------- */
  const calcImg = $('.calc-bg img'), calcSec = $('#screen-03');
  let cTick = false;
  const calcFrame = () => { cTick = false; if (reduceMotion || !calcImg) return; const r = calcSec.getBoundingClientRect(); calcImg.style.setProperty('--cy', (-r.top * 0.15).toFixed(1) + 'px'); };
  window.addEventListener('scroll', () => { if (!cTick) { cTick = true; requestAnimationFrame(calcFrame); } }, { passive: true });
  calcFrame();

  /* ---------- Align right column of section heads with header nav (from «Услуги» to the CTA) ---------- */
  const navAlign = () => {
    const first = $('#services-trigger'), cta = $('.header-cta');
    const ok = first && cta && getComputedStyle(first).display !== 'none' && window.innerWidth > 960 && first.getBoundingClientRect().width > 0;
    $$('.head').forEach(h => {
      if (!ok) { h.style.removeProperty('--nav-w'); return; }
      const hr = h.getBoundingClientRect(), x = first.getBoundingClientRect().left, r = cta.getBoundingClientRect().right;
      h.style.setProperty('--nav-w', Math.max(0, Math.round(r - x)) + 'px');
      h.style.paddingRight = Math.max(0, Math.round(hr.right - r)) + 'px';
    });
    const cn = $('.cases-nav');
    if (cn) {
      if (!ok) { cn.style.removeProperty('--nav-l'); cn.style.removeProperty('--nav-r'); }
      else { const cr = cn.getBoundingClientRect(); cn.style.setProperty('--nav-l', Math.round(first.getBoundingClientRect().left - cr.left) + 'px'); cn.style.setProperty('--nav-r', Math.round(cr.right - cta.getBoundingClientRect().right) + 'px'); }
    }
  };
  window.addEventListener('resize', navAlign);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(navAlign);
  navAlign();

  /* ---------- Services dropdown ---------- */
  const trigger = $('#services-trigger');
  const panel = $('#services-panel');
  const setServices = open => {
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  const hoverDev = window.matchMedia('(hover: hover)').matches;
  trigger.addEventListener('click', e => { e.stopPropagation(); setServices(hoverDev ? true : panel.hidden); });
  const svcWrap = $('.nav-services'); let svcT = null;
  if (hoverDev) {
    svcWrap.addEventListener('mouseenter', () => { clearTimeout(svcT); setServices(true); });
    svcWrap.addEventListener('mouseleave', () => { svcT = setTimeout(() => setServices(false), 180); });
  }
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('.nav-services')) setServices(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setServices(false); trigger.focus(); } });
  panel.addEventListener('click', e => { if (e.target.closest('a')) setServices(false); });

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger');
  const mMenu = $('#mobile-menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    burger.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    mMenu.hidden = !open;
    $('.header').classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(mMenu.hidden));
  mMenu.addEventListener('click', e => { if (e.target.closest('a, button.btn')) setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960 && !mMenu.hidden) setMenu(false); });

  /* ---------- Dialogs ---------- */
  const openDialog = id => {
    const d = document.getElementById(id);
    if (!d) return;
    $$('dialog[open]').forEach(x => x !== d && x.close());
    if (!d.open) d.showModal();
  };
  $$('[data-open-dialog]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openDialog(b.dataset.openDialog); }));
  $$('dialog').forEach(d => {
    d.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) d.close();
      else if (e.target === d) {
        const r = d.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) d.close();
      }
    });
  });

  const leadModes = {
    inspection: {
      eyebrow: 'Начнём с вашей партии', title: 'Заявка на инспекцию',
      copy: 'Свяжемся с вами, уточним задачу и бесплатно составим программу проверки под ваш товар.',
      field: 'О вашей партии', placeholder: 'Что заказываете, где фабрика и когда отгрузка'
    },
    consultation: {
      eyebrow: 'Консультация — бесплатно', title: 'Заявка на консультацию',
      copy: 'Расскажите о вашей задаче — мы подскажем, с чего начать.',
      field: 'Ваш вопрос', placeholder: 'Что хотите уточнить или обсудить'
    }
  };
  const leadDialog = $('#lead-dialog');
  $$('[data-lead]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const m = leadModes[b.dataset.lead] || leadModes.inspection;
    $('[data-lead-eyebrow]', leadDialog).textContent = m.eyebrow;
    $('[data-lead-title]', leadDialog).textContent = m.title;
    $('[data-lead-copy]', leadDialog).textContent = m.copy;
    $('[data-lead-field]', leadDialog).textContent = m.field;
    $('#request-product').placeholder = m.placeholder;
    $('form', leadDialog).setAttribute('aria-label', m.title);
    resetForm(leadDialog);
    openDialog('lead-dialog');
  }));

  /* ---------- Case CTA → lead dialog with situation ---------- */
  let leadSource = null;
  $$('[data-case-cta]').forEach(cta => cta.addEventListener('click', e => {
    e.preventDefault();
    const slug = cta.dataset.caseCta, name = cta.dataset.caseName;
    track('case_cta_click', { case: slug });
    const m = leadModes.inspection;
    $('[data-lead-eyebrow]', leadDialog).textContent = m.eyebrow;
    $('[data-lead-title]', leadDialog).textContent = m.title;
    $('[data-lead-copy]', leadDialog).textContent = m.copy;
    $('[data-lead-field]', leadDialog).textContent = m.field;
    $('#request-product').placeholder = m.placeholder;
    resetForm(leadDialog);
    leadDialog.querySelector('[name="situation"]').value = slug;
    $('#request-product').value = 'Ситуация: ' + name + '\n';
    leadSource = { source: 'case', case: slug };
    openDialog('lead-dialog');
  }));
  $$('[data-lead]').forEach(b => b.addEventListener('click', () => { leadSource = null; const f = leadDialog.querySelector('[name="situation"]'); if (f) f.value = ''; }, true));

  /* ---------- Lead forms (no sending) ---------- */
  const contactOk = v => {
    const s = v.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return true;
    if (/^@?[A-Za-z0-9_]{4,32}$/.test(s) && s.startsWith('@')) return true;
    const digits = s.replace(/\D/g, '');
    return /^[+\d\s()\-]+$/.test(s) && digits.length >= 10 && digits.length <= 15;
  };
  function resetForm(scope) {
    const form = $('form.lead-form', scope);
    const res = $('.lead-result', scope);
    form.hidden = false; res.hidden = true;
    $$('.f', form).forEach(f => f.classList.remove('has-error'));
    $$('.f-error', form).forEach(p => p.textContent = '');
  }
  $$('form.lead-form').forEach(form => {
    const setErr = (name, msg) => {
      const p = $(`[data-error="${name}"]`, form);
      p.textContent = msg || '';
      p.closest('.f').classList.toggle('has-error', !!msg);
      const input = form.elements[name];
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };
    const validate = () => {
      const name = form.elements.name.value.trim();
      const contact = form.elements.contact.value.trim();
      const e1 = name ? '' : 'Укажите ваше имя.';
      const e2 = !contact ? 'Укажите телефон, Telegram или email для связи.'
        : (contactOk(contact) ? '' : 'Проверьте контакт: +7 999 123-45-67, @username или name@example.com.');
      setErr('name', e1); setErr('contact', e2);
      return !e1 && !e2;
    };
    ['name', 'contact'].forEach(n => form.elements[n].addEventListener('input', () => {
      if (form.elements[n].closest('.f').classList.contains('has-error')) validate();
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate()) { const bad = $('[aria-invalid="true"]', form); bad && bad.focus(); return; }
      track('lead_submit', form.closest('#lead-dialog') && leadSource ? leadSource : { source: form.closest('#lead-dialog') ? 'dialog' : 'form' });
      const res = form.parentElement.querySelector('.lead-result');
      form.hidden = true; res.hidden = false;
      form.reset();
    });
  });

  /* ---------- Footer «Услуги» → open services menu ---------- */
  $$('[data-footer-services]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => { if (window.innerWidth > 960) setServices(true); else { setMenu(true); const d = $('.m-services'); if (d) d.open = true; } }, reduceMotion ? 0 : 500);
  }));

  /* ---------- Placeholder links ---------- */
  $$('[data-placeholder]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  /* ---------- 02 Cases: sticky card stack ---------- */
  const stack = $('.cases-stack');
  const sheets = $$('.case-sheet', stack);
  const tabsC = $$('.case-tab');
  let caseIdx = 0;
  const mqAcc = window.matchMedia('(max-width: 960px)');
  const isStatic = () => reduceMotion || mqAcc.matches;
  const stickTop = () => 124;
  const markActive = i => {
    caseIdx = (i + sheets.length) % sheets.length;
    sheets.forEach((sh, k) => sh.classList.toggle('is-active', k === caseIdx));
    tabsC.forEach((tb, k) => { tb.classList.toggle('is-active', k === caseIdx); tb.setAttribute('aria-selected', String(k === caseIdx)); });
  };
  const showCase = i => {
    const idx = (i + sheets.length) % sheets.length;
    markActive(idx);
    const target = sheets[idx];
    if (isStatic()) { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); return; }
    let y = stack.getBoundingClientRect().top + window.scrollY;
    for (let k = 0; k < idx; k++) y += sheets[k].offsetHeight; // flow height + margin (transform does not affect layout)
    window.scrollTo({ top: y - stickTop(idx) + 1, behavior: 'smooth' });
  };
  let caseTick = false;
  const caseFrame = () => {
    caseTick = false;
    if (isStatic()) return;
    let act = 0;
    sheets.forEach((sh, k) => {
      if (sh.getBoundingClientRect().top <= stickTop(k) + 2) act = k;
    });
    if (act !== caseIdx) markActive(act);
  };
  const caseLayout = () => {
    stack.classList.toggle('is-static', isStatic());
    if (isStatic()) sheets.forEach(sh => { const pn = $('.case-panel', sh); pn.style.removeProperty('--s'); pn.style.removeProperty('--o'); });
    caseFrame();
  };
  tabsC.forEach((tb, k) => tb.addEventListener('click', () => { track('case_tab_click', { case: sheets[k].dataset.slug }); showCase(k); }));
  $('.cases-next').addEventListener('click', () => { track('case_tab_click', { case: sheets[(caseIdx + 1) % sheets.length].dataset.slug, via: 'next' }); showCase(caseIdx + 1); });
  // case views (≥50% visible for ≥1 s) and completion
  if ('IntersectionObserver' in window) {
    const seen = new Set(), timers = new Map();
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      const sl = e.target.closest('.case-sheet').dataset.slug;
      if (e.isIntersecting) timers.set(sl, setTimeout(() => { if (!seen.has(sl)) { seen.add(sl); track('case_view', { case: sl }); if (seen.size === sheets.length) track('cases_complete'); } }, 1000));
      else clearTimeout(timers.get(sl));
    }), { threshold: .5 });
    sheets.forEach(sh => io2.observe($('.case-panel', sh)));
  }
  $$('[data-calc-link]').forEach(l => l.addEventListener('click', () => {
    track('calc_link_click', { source: 'cases', case: l.closest('.case-sheet') ? l.closest('.case-sheet').dataset.slug : '' });
    const d = l.dataset.defect, f = $('#cv-defect');
    if (d && f) { f.value = d; f.dispatchEvent(new Event('input', { bubbles: true })); }
  }));
  window.addEventListener('scroll', () => { if (!caseTick) { caseTick = true; requestAnimationFrame(caseFrame); } }, { passive: true });
  window.addEventListener('resize', caseLayout);
  (mqAcc.addEventListener ? mqAcc.addEventListener('change', caseLayout) : mqAcc.addListener(caseLayout));
  caseLayout(); markActive(0);

  /* ---------- Hero slider (auto + click/tap + swipe, progress bar) ---------- */
  const hs = $('.hero-slider');
  if (hs) {
    const imgs = $$('.hs-img', hs), slides = $$('.hs-slide', hs), cur = $('[data-hs-cur]', hs), bar = $('.hs-progress i', hs);
    let hi = 0, htimer = null, hpaused = false;
    const canPlay = () => !reduceMotion && !hpaused && document.body.classList.contains('on-hero');
    const hsSchedule = () => {
      clearTimeout(htimer);
      const play = canPlay();
      hs.classList.toggle('is-playing', !reduceMotion);
      hs.classList.toggle('is-paused', !play);
      if (play) htimer = setTimeout(() => showSlide(hi + 1), 6000);
    };
    const restartBar = () => { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; };
    const showSlide = i => {
      hi = (i + slides.length) % slides.length;
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === hi));
      slides.forEach((sl, k) => { sl.hidden = k !== hi; sl.classList.toggle('is-active', k === hi); });
      cur.textContent = String(hi + 1).padStart(2, '0');
      restartBar(); hsSchedule();
    };
    hs.addEventListener('click', e => { if (e.target.closest('a')) return; showSlide(hi + 1); });
    let sx = null;
    hs.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    hs.addEventListener('touchend', e => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { e.preventDefault(); showSlide(hi + (dx < 0 ? 1 : -1)); }
    });
    hs.addEventListener('mouseenter', () => { hpaused = true; hsSchedule(); });
    hs.addEventListener('mouseleave', () => { hpaused = false; restartBar(); hsSchedule(); });
    new MutationObserver(hsSchedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    $$('[data-goto-case]', hs).forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); track('hero_case_click', { case: sheets[+a.dataset.gotoCase].dataset.slug });
      showCase(+a.dataset.gotoCase);
    }));
    hsSchedule();
  }

  /* ---------- 03 Calculator ---------- */
  const calc = $('#calc');
  const ids = ['batch', 'price', 'defect', 'logistics', 'duty', 'handling', 'months'];
  const inp = Object.fromEntries(ids.map(k => [k, $('#cv-' + k)]));
  const ranges = Object.fromEntries($$('[data-range]', calc).map(r => [r.dataset.range, r]));
  const comp = $('[data-compensation]', calc);
  const out = Object.fromEntries($$('[data-output]', calc).map(o => [o.dataset.output, o]));
  const countEl = $('[data-count]', calc);
  const LETTERS = 'Введите число без знаков и букв.';

  const parse = v => {
    const s = String(v).replace(/[\s  ]/g, '').replace(',', '.');
    if (s === '' || !/^\d+(\.\d+)?$/.test(s)) return { ok: false, n: NaN };
    return { ok: true, n: parseFloat(s) };
  };
  const rules = {
    batch: p => (!p.ok || !Number.isInteger(p.n) || p.n < 1) ? 'Введите целое число от 1.' : '',
    price: p => !p.ok ? LETTERS : (p.n <= 0 ? 'Укажите цену больше 0.' : ''),
    defect: p => !p.ok ? LETTERS : (p.n > 100 ? 'Доля брака — от 0 до 100%.' : ''),
    logistics: p => !p.ok ? LETTERS : '',
    duty: p => !p.ok ? LETTERS : '',
    handling: p => !p.ok ? LETTERS : '',
    months: p => !p.ok ? LETTERS : ''
  };
  const paintRange = r => {
    const min = +r.min, max = +r.max;
    r.style.setProperty('--p', ((+r.value - min) / (max - min) * 100) + '%');
  };

  function compute() {
    const v = {}, err = {};
    ids.forEach(k => {
      const p = parse(inp[k].value);
      err[k] = rules[k](p);
      v[k] = p.n;
      const e = $('#cv-error-' + k);
      e.textContent = err[k];
      inp[k].closest('.field').classList.toggle('has-error', !!err[k]);
      if (err[k]) inp[k].setAttribute('aria-invalid', 'true'); else inp[k].removeAttribute('aria-invalid');
    });
    const invalid = ids.some(k => err[k]);
    const count = (!err.batch && !err.defect) ? Math.round(v.batch * v.defect / 100) : null;
    countEl.textContent = count === null ? '' : fmt(count) + ' шт.';

    $('.invalid', calc).hidden = !invalid;
    const goodsRow = $('[data-goods-row]', calc);
    if (invalid) {
      Object.values(out).forEach(o => o.textContent = '—');
      $('[data-compensation-note]', calc).hidden = true;
      goodsRow.classList.remove('is-compensated');
      $('[data-goods-compensated]', calc).hidden = true;
      return;
    }
    const goods = count * v.price;
    const delivery = count * v.logistics;
    const duties = Math.round(goods * v.duty / 100);
    const frozen = Math.round(goods * 0.2 * v.months / 12);
    const handling = count * v.handling;
    const total = goods + delivery + duties + frozen + handling;
    const compensated = comp.checked;
    const compensation = compensated ? goods : 0;

    out.remaining.textContent = fmt(total - compensation);
    out.compensation.textContent = fmt(compensation) + ' ₽';
    out.supplier.textContent = fmt(goods) + ' ₽';
    out.delivery.textContent = fmt(delivery) + ' ₽';
    out.duties.textContent = fmt(duties) + ' ₽';
    out.frozen.textContent = fmt(frozen) + ' ₽';
    out.handling.textContent = fmt(handling) + ' ₽';
    $('[data-compensation-note]', calc).hidden = !compensated;
    goodsRow.classList.toggle('is-compensated', compensated);
    $('[data-goods-compensated]', calc).hidden = !compensated;
  }

  ['batch', 'price', 'defect'].forEach(k => {
    const r = ranges[k];
    paintRange(r);
    r.addEventListener('input', () => { inp[k].value = r.value; paintRange(r); compute(); });
    inp[k].addEventListener('input', () => {
      const p = parse(inp[k].value);
      if (p.ok) { r.value = Math.min(+r.max, Math.max(+r.min, p.n)); paintRange(r); }
      compute();
    });
  });
  ['logistics', 'duty', 'handling', 'months'].forEach(k => inp[k].addEventListener('input', compute));
  comp.addEventListener('change', compute);

  const disc = $('.disclosure', calc);
  disc.addEventListener('click', () => {
    const open = disc.getAttribute('aria-expanded') !== 'true';
    disc.setAttribute('aria-expanded', String(open));
    $('#cv-extras').hidden = !open;
  });
  compute();

  /* ---------- Popovers ---------- */
  $$('.info').forEach(b => {
    const pop = document.getElementById(b.getAttribute('aria-controls'));
    const set = open => { b.setAttribute('aria-expanded', String(open)); pop.hidden = !open; };
    b.addEventListener('click', e => { e.stopPropagation(); set(pop.hidden); });
    b.addEventListener('mouseenter', () => set(true));
    b.addEventListener('mouseleave', () => set(false));
    b.addEventListener('blur', () => set(false));
  });
  document.addEventListener('click', () => $$('.info').forEach(b => {
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')).hidden = true;
  }));

  /* ---------- 04 Report: steps ↔ photo, auto 6 s ---------- */
  const repEl = $('.rep');
  if (repEl) {
    const slides = $$('.rep-slide', repEl), steps2 = $$('.rep-step', repEl);
    const chip = $('[data-rep-chip]', repEl), cap = $('[data-rep-cap]', repEl), cnt = $('[data-rep-count]', repEl);
    const names = ['Умный бриф', 'Инспекция на фабрике', 'Отчёт и решение'];
    const caps = ['Бриф на проверку', 'Инспекция на фабрике', 'Заключение по партии'];
    let ri = 0, rt = null, rpaused = false, rin = false;
    const rsched = () => {
      clearTimeout(rt);
      const play = !reduceMotion && !rpaused && rin;
      repEl.classList.toggle('is-playing', !reduceMotion); repEl.classList.toggle('is-paused', !play);
      if (play) rt = setTimeout(() => rshow(ri + 1), 6000);
    };
    const rshow = i => {
      ri = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === ri));
      steps2.forEach((s, k) => { s.classList.toggle('is-active', k === ri); $('button', s).setAttribute('aria-expanded', String(k === ri)); const bar = $('.rs-bar i', s); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; });
      chip.textContent = 'Шаг ' + (ri + 1) + ' · ' + names[ri]; cap.textContent = caps[ri];
      cnt.textContent = String(ri + 1).padStart(2, '0') + ' / 03';
      rsched();
    };
    $$('[data-rep-go]', repEl).forEach(b => b.addEventListener('click', () => rshow(+b.dataset.repGo)));
    $$('[data-rep]', repEl).forEach(b => b.addEventListener('click', () => rshow(ri + (+b.dataset.rep))));
    repEl.addEventListener('mouseenter', () => { rpaused = true; rsched(); });
    repEl.addEventListener('mouseleave', () => { rpaused = false; rshow(ri); });
    const ph = $('.rep-slider', repEl); let rx = null;
    ph.addEventListener('touchstart', e => { rx = e.touches[0].clientX; }, { passive: true });
    ph.addEventListener('touchend', e => { if (rx === null) return; const dx = e.changedTouches[0].clientX - rx; rx = null; if (Math.abs(dx) > 40) rshow(ri + (dx < 0 ? 1 : -1)); });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { rin = e.isIntersecting; rsched(); }, { threshold: .3 }).observe(repEl);
  }

  /* ---------- Hero videos (blue theme): 2 scenes, crossfade every 7 s ---------- */
  const hero = $('#screen-01');
  const hvs = $$('.hero-video');
  hero.dataset.scene = '0';
  const conn = navigator.connection || {};
  const allowVideo = hvs.length && !reduceMotion && !conn.saveData && document.body.dataset.hero === 'blue';
  let hvi = 0, hvTimer = null;
  const play = v => { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); };
  const loadV = v => { if (v.dataset.loaded) return; v.dataset.loaded = '1'; $$('source[data-src]', v).forEach(sr => { sr.src = sr.dataset.src; }); v.load(); };
  const swapScene = () => {
    const cur = hvs[hvi], next = hvs[(hvi + 1) % hvs.length];
    if (next.readyState < 2) { loadV(next); return; }
    next.currentTime = 0; play(next); next.classList.add('is-active'); cur.classList.remove('is-active');
    hero.dataset.scene = String((hvi + 1) % hvs.length);
    setTimeout(() => cur.pause(), 1300);
    hvi = (hvi + 1) % hvs.length;
  };
  if (allowVideo) {
    loadV(hvs[0]);
    hvs[0].addEventListener('playing', () => hvs[0].classList.add('is-active'), { once: true });
    play(hvs[0]);
    setTimeout(() => hvs[1] && loadV(hvs[1]), 2500);
    hvTimer = setInterval(swapScene, 7000);
  }
  const setOnHero = on => document.body.classList.toggle('on-hero', on);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => setOnHero(e.isIntersecting), { rootMargin: '-80px 0px 0px 0px', threshold: 0 }).observe(hero);
    if (allowVideo) new IntersectionObserver(([e]) => { const v = hvs[hvi]; if (e.isIntersecting) play(v); else v.pause(); }).observe(hero);
  }
  setOnHero(hero.getBoundingClientRect().bottom > 80);
  // header CTA turns black while the header sits over a blue section (calculator, block 04)
  // header theme = data-header of the innermost section under the header line (y≈36px)
  const hdrSecs = $$('[data-header]');
  if (document.body.dataset.hero === 'light') hero.dataset.header = 'photo-light';
  const checkHdr = () => {
    const y = 36; let theme = 'light', depth = -1;
    hdrSecs.forEach(el => { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) { let d = 0, n = el; while ((n = n.parentElement)) d++; if (d > depth) { depth = d; theme = el.dataset.header; } } });
    if (document.body.dataset.hdr !== theme) document.body.dataset.hdr = theme;
  };
  window.addEventListener('scroll', checkHdr, { passive: true });
  window.addEventListener('resize', checkHdr);
  checkHdr();

  /* ---------- 04 Sticky advantages ---------- */
  const adv = $('.adv');
  const advCards = $$('.adv-card', adv);
  const advTitle = $('.adv-title', adv);
  const advBg = $('.adv-bg img', adv);
  const mqNarrow = window.matchMedia('(max-width: 960px)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  let advTick = false;
  const advStatic = () => reduceMotion || mqNarrow.matches;
  function advLayout() {
    adv.classList.toggle('is-static', advStatic());
    advFrame();
  }
  function advFrame() { advTick = false; /* cards now scroll in normal flow over the sticky background */ }
  window.addEventListener('scroll', () => { if (!advTick) { advTick = true; requestAnimationFrame(advFrame); } }, { passive: true });
  window.addEventListener('resize', advLayout);
  (mqNarrow.addEventListener ? mqNarrow.addEventListener('change', advLayout) : mqNarrow.addListener(advLayout));
  advLayout();

  /* ---------- Block 05 rows: «Подробнее» expands sub-items ---------- */
  $$('.row-more').forEach(b => b.addEventListener('click', () => {
    const row = b.closest('.row'), open = !row.classList.contains('is-open');
    row.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Свернуть ▴' : 'Подробнее ▸';
  }));

  /* ---------- Blog rail arrows ---------- */
  const rail = $('.blog-rail');
  $$('[data-blog]').forEach(b => b.addEventListener('click', () => {
    const card = $('.blog-card', rail); const step = card ? card.getBoundingClientRect().width + 16 : 300;
    rail.scrollBy({ left: step * (+b.dataset.blog), behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  /* ---------- FAQ ---------- */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item);
    q.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });
})();
