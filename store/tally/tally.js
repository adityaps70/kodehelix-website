/* Tally — a three-tier pricing section with odometer prices and a Monthly/Yearly switch.
   Kodehelix UI · kodehelix.in
   Usage:
     <section class="tally" data-tally> ... <div class="tally__price" data-monthly="29" data-yearly="278"></div> ... </section>
     const t = Tally.mount(document.querySelector('.tally'), { yearly: false });
     t.set(true);  el.addEventListener('tally:change', e => e.detail.yearly);
   Elements with data-tally auto-mount on DOMContentLoaded unless they carry data-tally-manual. */
(function (global) {
  const RM = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  const c01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const out = t => 1 - Math.pow(1 - t, 3);
  const pop = t => (t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(11 * t));   // springy, ~13% overshoot
  const roll = t => (t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(4.6 * t)); // wheels, soft settle
  const DIGITS = Array.from({ length: 50 }, (_, i) => i % 10).join('\n');
  const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" pathLength="1"/><path d="M8 12.4l2.7 2.7 5.5-5.5" pathLength="1"/></svg>';
  const isD = c => c >= '0' && c <= '9';

  function mount(root, opts = {}) {
    if (root._tally) return root._tally;
    const ds = root.dataset, reduce = RM && RM.matches, $$ = s => [...root.querySelectorAll(s)];
    const cur = ds.currency || '$';
    let yearly = opts.yearly != null ? !!opts.yearly : ds.yearly === 'true';

    // one rAF ticker for every tween; a new tween on the same key replaces the old one
    const jobs = new Map(); let raf = 0;
    function job(key, dur, delay, fn) {
      jobs.set(key, { t0: performance.now() + delay * 1000, dur: dur * 1000, fn });
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      const now = performance.now();
      jobs.forEach((j, k) => {
        const p = (now - j.t0) / j.dur; if (p < 0) return;
        j.fn(Math.min(1, p)); if (p >= 1) jobs.delete(k);
      });
      raf = jobs.size ? requestAnimationFrame(tick) : 0;
    }
    // animate el._v from its current value to v
    function tw(el, v, dur, delay, ez, draw, anim) {
      const f = el._v == null ? v : el._v;
      if (!anim || reduce) { el._v = v; draw(v); return; }
      job(el, dur, delay, p => { el._v = f + (v - f) * ez(p); draw(el._v); });
    }

    // two stacked labels that slide past each other
    function swap(el, a, b) {
      el.textContent = ''; const x = document.createElement('span'), y = document.createElement('span');
      x.textContent = a; y.textContent = b; el.append(x, y); el.classList.add('tally__swap');
      return q => {
        const a = c01(q * 2), b = c01(q * 2 - 1);
        x.style.cssText = `opacity:${1 - a};transform:translateY(${(-a * 60).toFixed(1)}%)`;
        y.style.cssText = `opacity:${b};transform:translateY(${((1 - b) * 60).toFixed(1)}%)`;
      };
    }

    // prices: one digit wheel per character, right aligned
    const prices = $$('.tally__price[data-monthly]').map(el => {
      const m = el.dataset.monthly, y = el.dataset.yearly, L = Math.max(m.length, y.length);
      const M = m.padStart(L), Y = y.padStart(L);
      el.innerHTML = '<span class="tally__cur" aria-hidden="true"></span><span class="tally__num" aria-hidden="true"></span><span class="tally__per" aria-hidden="true"></span><span class="tally__sr"></span>';
      const [c, num, per, sr] = el.children;
      c.textContent = cur;
      const slots = [...M].map((mc, i) => {
        const s = { m: mc, y: Y[i], d: isD(mc) || isD(Y[i]), el: document.createElement('span') };
        if (s.d) {
          s.el.className = 'tally__wheel'; s.el.innerHTML = '<span></span>';
          s.strip = s.el.firstChild; s.strip.textContent = DIGITS; s.pos = 20; s.on = 1;
        } else s.el.className = 'tally__sep';
        num.append(s.el); return s;
      });
      return { el, sr, slots, m, y, per, swap: swap(per, el.dataset.perMonth || ds.perMonth || '/mo', el.dataset.perYear || ds.perYear || '/yr') };
    });
    const notes = $$('.tally__note[data-monthly]').map(el => ({ el, swap: swap(el, el.dataset.monthly, el.dataset.yearly) }));
    let dw = 0.6; // digit width in em
    if (prices[0]) {
      const n = prices[0].el.querySelector('.tally__num'), t = document.createElement('span');
      t.textContent = '0'; t.style.display = 'inline-block'; n.append(t);
      dw = t.getBoundingClientRect().width / parseFloat(getComputedStyle(n).fontSize) || 0.6; t.remove();
    }
    const place = (s, pos) => { s.pos = pos; s.strip.style.transform = `translateY(${(-pos * 1.2).toFixed(3)}em)`; };
    const size = (s, on) => { s.on = on; s.el.style.width = (on * dw).toFixed(3) + 'em'; s.el.style.opacity = on.toFixed(3); };

    // switch, thumb and save badge
    const tog = root.querySelector('[data-tally-toggle]'), thumb = root.querySelector('.tally__thumb');
    const opts2 = $$('[data-tally-opt]'), badge = root.querySelector('[data-tally-save]');
    function moveThumb(anim) {
      if (!thumb || !opts2.length) return;
      const a = opts2[0], b = opts2[opts2.length - 1];
      tw(thumb, yearly ? 1 : 0, 0.6, 0, pop, q => {
        thumb.style.left = (a.offsetLeft + (b.offsetLeft - a.offsetLeft) * q).toFixed(2) + 'px';
        thumb.style.width = (a.offsetWidth + (b.offsetWidth - a.offsetWidth) * q).toFixed(2) + 'px';
      }, anim);
    }

    function render(anim) {
      if (tog) tog.setAttribute('aria-checked', yearly);
      opts2.forEach(o => o.classList.toggle('is-on', (o.dataset.tallyOpt === 'yearly') === yearly));
      moveThumb(anim);
      if (badge) {
        badge.setAttribute('aria-hidden', !yearly);
        tw(badge, yearly ? 1 : 0, yearly ? 0.75 : 0.25, yearly ? 0.12 : 0, yearly ? pop : out, q => {
          badge.style.opacity = c01(q * 1.5).toFixed(3);
          badge.style.transform = `scale(${Math.max(0, q).toFixed(3)}) rotate(${((1 - q) * -14).toFixed(2)}deg)`;
        }, anim);
      }
      prices.forEach((P, pi) => {
        const dir = yearly ? 1 : -1; let k = 0;
        P.sr.textContent = `${cur}${yearly ? P.y : P.m} per ${yearly ? 'year' : 'month'}`;
        P.slots.forEach(s => {
          const c = yearly ? s.y : s.m;
          if (!s.d) { s.el.textContent = c.trim(); return; }
          const on = isD(c) ? 1 : 0, digit = on ? +c : 0;
          if (!anim || reduce) { place(s, 20 + digit); size(s, on); return; }
          if (!on && !s.on) return;
          const from = 20 + (((s.pos % 10) + 10) % 10), now = Math.round(from) % 10;
          const to = 20 + now + dir * ((((digit - now) * dir) % 10 + 10) % 10 + 10);
          const on0 = s.on;
          place(s, from);
          job(s, 1.1, pi * 0.09 + k++ * 0.075, p => { place(s, from + (to - from) * roll(p)); size(s, on0 + (on - on0) * out(p)); });
        });
        tw(P.per, yearly ? 1 : 0, 0.5, pi * 0.09 + 0.1, t => t, P.swap, anim);
      });
      notes.forEach((N, i) => tw(N.el, yearly ? 1 : 0, 0.5, i * 0.09 + 0.2, t => t, N.swap, anim));
    }

    function set(v) {
      v = !!v; if (v === yearly) return;
      yearly = v; render(true);
      root.dispatchEvent(new CustomEvent('tally:change', { detail: { yearly } }));
    }
    if (tog) {
      tog.addEventListener('click', e => { const o = e.target.closest('[data-tally-opt]'); set(o ? o.dataset.tallyOpt === 'yearly' : !yearly); });
      tog.addEventListener('keydown', e => {
        const v = { ArrowRight: true, ArrowLeft: false }[e.key];
        if (v != null) { e.preventDefault(); set(v); }
      });
    }
    addEventListener('resize', () => moveThumb(false));

    // ticks draw on, cards rise, the first time the section is seen
    const cards = $$('.tally__plan');
    const items = cards.map(c => [...c.querySelectorAll('.tally__list li')]);
    items.flat().forEach(li => li.insertAdjacentHTML('afterbegin', TICK));
    const intro = !reduce && opts.intro !== false;
    if (intro) {
      cards.forEach(c => { c.style.opacity = 0; c.style.translate = '0 26px'; });
      items.flat().forEach(li => { li.style.opacity = 0.3; [...li.firstChild.children].forEach(p => (p.style.strokeDashoffset = 1)); });
    }
    let seen = false;
    function reveal() {
      if (seen || !intro) return; seen = true;
      cards.forEach((c, i) => {
        job(c, 0.8, i * 0.1, p => { const e = out(p); c.style.opacity = e.toFixed(3); c.style.translate = `0 ${((1 - e) * 26).toFixed(2)}px`; });
        items[i].forEach((li, j) => {
          const [ring, chk] = li.firstChild.children;
          job(li, 0.55, 0.4 + i * 0.12 + j * 0.09, p => {
            ring.style.strokeDashoffset = (1 - out(c01(p * 1.4))).toFixed(3);
            chk.style.strokeDashoffset = (1 - out(c01(p * 1.8 - 0.8))).toFixed(3);
            li.style.opacity = (0.3 + 0.7 * out(p)).toFixed(3);
          });
        });
      });
    }

    // featured card: gradient sheen travels around the border while on screen
    const feat = $$('.tally__plan--featured');
    let live = false;
    function spin(t) {
      if (!live) return;
      feat.forEach(f => f.style.setProperty('--tally-angle', ((t / 16) % 360).toFixed(1) + 'deg'));
      requestAnimationFrame(spin);
    }
    const r = root.getBoundingClientRect(), inView = r.top < innerHeight && r.bottom > 0;
    if (inView) reveal();
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(es => {
        const v = es[0].isIntersecting;
        if (v) reveal();
        if (v && !live && feat.length && !reduce) { live = true; requestAnimationFrame(spin); } else if (!v) live = false;
      }, { threshold: 0.15 }).observe(root);
    } else reveal();
    if (inView && feat.length && !reduce && !live) { live = true; requestAnimationFrame(spin); }

    render(false);
    return (root._tally = { set, get yearly() { return yearly; } });
  }

  global.Tally = { mount };
  const auto = () => document.querySelectorAll('[data-tally]:not([data-tally-manual])').forEach(e => mount(e));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
