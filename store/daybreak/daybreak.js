/* Daybreak — a tactile light/dark switch where the sun sets into a starry night.
   Kodehelix UI · kodehelix.in
   Usage:
     <button class="daybreak" data-daybreak data-daybreak-target="html"></button>
     const sw = Daybreak.mount(btn, { target: document.documentElement, attr: 'data-theme' });
     sw.toggle(); sw.set(true);
   Fires "daybreak:change" (detail.dark) and, with a target, sets data-theme="light|dark" on it
   plus a live --daybreak (0 → 1) CSS variable you can use to cross-fade your own colours.
   Elements with [data-daybreak] auto-mount unless they also have [data-daybreak-manual]. */
(function (global) {
  'use strict';
  const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const back = t => 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2);
  const reduced = () => global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 1.5l1.9 8.6 8.6 1.9-8.6 1.9-1.9 8.6-1.9-8.6-8.6-1.9 8.6-1.9z"/></svg>';
  // [left %, top %, size px, sparkle?]
  const STARS = [[12, 22, 3], [29, 13, 14, 1], [22, 60, 2.5], [43, 46, 3], [52, 16, 2.5], [15, 38, 8, 1], [46, 64, 9, 1], [8, 62, 2], [58, 36, 2], [34, 74, 2.5], [38, 30, 2]];
  let uid = 0;

  function cloud(id, cls) {
    return `<svg class="daybreak__cloud ${cls}" viewBox="0 0 64 34"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3eefc"/></linearGradient></defs>` +
      `<path fill="url(#${id})" d="M14 32h36a12 12 0 0 0 1.5-23.8A15 15 0 0 0 24 10a11 11 0 0 0-10 22z"/></svg>`;
  }

  function mount(btn, opts) {
    if (btn._daybreak) return btn._daybreak;
    opts = opts || {};
    const ds = btn.dataset;
    let target = opts.target !== undefined ? opts.target : ds.daybreakTarget || null;
    if (typeof target === 'string') target = document.querySelector(target);
    const attr = opts.attr || ds.daybreakAttr || 'data-theme';
    const values = opts.values || ['light', 'dark'];
    let dark = opts.dark != null ? !!opts.dark
      : btn.getAttribute('aria-checked') === 'true' || !!(target && target.getAttribute(attr) === values[1]);

    const g = 'dbc' + (++uid);
    btn.type = 'button';
    btn.classList.add('daybreak');
    btn.setAttribute('role', 'switch');
    if (!btn.hasAttribute('aria-label') && !btn.hasAttribute('aria-labelledby')) btn.setAttribute('aria-label', opts.label || 'Dark mode');
    btn.innerHTML =
      '<span class="daybreak__sky" aria-hidden="true"><span class="daybreak__night"></span>' +
      STARS.map(s => `<span class="daybreak__star${s[3] ? '' : ' daybreak__star--dot'}" style="left:${s[0]}%;top:${s[1]}%;width:${s[2]}px;height:${s[2]}px">${s[3] ? STAR : ''}</span>`).join('') +
      cloud(g + 'a', 'daybreak__cloud--back') + cloud(g + 'b', 'daybreak__cloud--front') +
      '<span class="daybreak__thumb"><span class="daybreak__halo daybreak__halo--day"></span><span class="daybreak__halo daybreak__halo--night"></span>' +
      '<span class="daybreak__glow daybreak__glow--day"></span><span class="daybreak__glow daybreak__glow--night"></span>' +
      '<span class="daybreak__knob"><span class="daybreak__sun"></span><span class="daybreak__shade"></span><span class="daybreak__moon">' +
      '<span class="daybreak__crater" style="left:52%;top:22%;width:20%;height:20%"></span>' +
      '<span class="daybreak__crater" style="left:24%;top:50%;width:24%;height:24%"></span>' +
      '<span class="daybreak__crater" style="left:60%;top:62%;width:12%;height:12%"></span>' +
      '</span></span></span></span><span class="daybreak__bevel" aria-hidden="true"></span>';

    const $ = s => btn.querySelector(s), $$ = s => [...btn.querySelectorAll(s)];
    const night = $('.daybreak__night'), thumb = $('.daybreak__thumb'), moon = $('.daybreak__moon'), shade = $('.daybreak__shade');
    const dayFx = $$('.daybreak__halo--day,.daybreak__glow--day'), nightFx = $$('.daybreak__halo--night,.daybreak__glow--night');
    const cBack = $('.daybreak__cloud--back'), cFront = $('.daybreak__cloud--front');
    const stars = $$('.daybreak__star').map((el, i) => ({ el, ch: chan(+dark), p: 1.7 + (i * 0.37) % 1.3, ph: i * 1.9 }));

    // tween channels + one spring for the knob
    function chan(v) { return { v, from: v, to: v, t0: 0, d: 0, dur: 1, e: easeIO }; }
    function go(c, to, delay, dur, e, now) { c.from = c.v; c.to = to; c.t0 = now; c.d = delay; c.dur = dur; c.e = e; }
    function step(c, now) {
      if (c.v === c.to) return false;
      const k = clamp((now - c.t0 - c.d) / c.dur);
      c.v = k >= 1 ? c.to : c.from + (c.to - c.from) * c.e(k);
      return true;
    }
    const sky = chan(+dark), clouds = chan(+dark), sweep = chan(+dark);
    let x = +dark, v = 0, X = +dark, travel = 0, raf = 0, last = 0, rm = reduced();

    function layout() { travel = btn.clientWidth - btn.clientHeight; }

    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      let busy = false;
      // spring: slightly under-damped so the sun overshoots and settles
      const K = rm ? 520 : 300, C = rm ? 46 : 22, n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n; i++) { v += (K * (X - x) - C * v) * h; x += v * h; }
      if (Math.abs(X - x) < 0.0008 && Math.abs(v) < 0.01) { x = X; v = 0; } else busy = true;
      busy = step(sky, now) | busy; busy = step(clouds, now) | busy; busy = step(sweep, now) | busy;
      stars.forEach(s => { busy = step(s.ch, now) | busy; });

      const sq = rm ? 0 : Math.min(0.08, Math.abs(v) * 0.018);
      thumb.style.transform = `translate3d(${(x * travel).toFixed(2)}px,0,0) scale(${1 + sq},${1 - sq * 0.6})`;
      const nv = sky.v;
      night.style.opacity = nv;
      dayFx.forEach(e => { e.style.opacity = 1 - nv; });
      nightFx.forEach(e => { e.style.opacity = nv; });
      const c = clouds.v, drift = rm ? 0 : 1;
      cBack.style.transform = `translate(${c * 44 * drift}px,${c * 3 * drift}px)`;
      cFront.style.transform = `translate(${c * 74 * drift}px,${c * 7 * drift}px)`;
      cBack.style.opacity = 0.85 * (1 - c); cFront.style.opacity = 1 - c;
      const cx = -80 + 130 * sweep.v;
      moon.style.clipPath = `circle(64% at ${cx.toFixed(2)}% 50%)`;
      shade.style.left = (cx - 64).toFixed(2) + '%';
      const t = now / 1000;
      let twinkling = false;
      stars.forEach(s => {
        const p = s.ch.v, tw = rm ? 1 : 0.72 + 0.28 * Math.sin(t * (6.283 / s.p) + s.ph);
        if (p > 0.01 && !rm) twinkling = true;
        s.el.style.opacity = clamp(p) * tw;
        s.el.style.transform = `translateY(${((1 - p) * 7).toFixed(2)}px) scale(${(0.2 + 0.8 * p) * (0.9 + 0.1 * tw)})`;
      });
      if (target) target.style.setProperty('--daybreak', nv.toFixed(3));
      if (busy || twinkling) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    function set(next, quiet) {
      next = !!next;
      if (next === dark && !quiet) return api;
      dark = next; rm = reduced();
      btn.setAttribute('aria-checked', String(dark));
      if (target && attr) target.setAttribute(attr, values[+dark]);
      const now = performance.now(), r = rm ? 0.5 : 1;
      X = +dark;
      if (dark) {
        go(sky, 1, 0, 650 * r, easeIO, now);
        go(clouds, 1, 0, 700 * r, easeIO, now);
        go(sweep, 1, 50 * r, 540 * r, easeIO, now);
        stars.forEach((s, i) => go(s.ch, 1, (240 + i * 65) * r, 460 * r, rm ? easeOut : back, now));
      } else {
        go(sky, 0, 0, 650 * r, easeIO, now);
        go(clouds, 0, 120 * r, 720 * r, easeOut, now);
        go(sweep, 0, 0, 520 * r, easeIO, now);
        stars.forEach((s, i) => go(s.ch, 0, i * 22 * r, 220 * r, easeOut, now));
      }
      kick();
      if (!quiet) {
        btn.dispatchEvent(new CustomEvent('daybreak:change', { bubbles: true, detail: { dark } }));
        if (opts.onChange) opts.onChange(dark);
      }
      return api;
    }

    const api = {
      set: d => set(d),
      toggle: () => set(!dark),
      get dark() { return dark; },
      relayout: () => { layout(); kick(); }
    };
    btn.addEventListener('click', () => set(!dark));
    layout();
    if (global.ResizeObserver) new ResizeObserver(api.relayout).observe(btn);
    set(dark, true);
    // first paint: jump straight to the resting state
    [sky, clouds, sweep, ...stars.map(s => s.ch)].forEach(c => { c.v = c.from = c.to; });
    btn._daybreak = api;
    return api;
  }

  function auto() { document.querySelectorAll('[data-daybreak]:not([data-daybreak-manual])').forEach(el => mount(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  global.Daybreak = { mount };
})(window);
