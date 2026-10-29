/* Glide — a tab bar whose highlight stretches like a rubber band.
   Kodehelix UI · kodehelix.in
   Usage:
     <div class="glide" data-glide>
       <div class="glide__bar" role="tablist" aria-label="Sections">
         <button class="glide__tab"><svg viewBox="0 0 24 24">…</svg><span class="glide__label">Overview</span></button> …
       </div>
       <div class="glide__panels"><section class="glide__panel">…</section> …</div>
     </div>
     const tabs = Glide.mount(el); tabs.select(2);
   Fires "glide:change" (detail.index, detail.tab, detail.panel).
   Elements with [data-glide] auto-mount unless they also have [data-glide-manual]. */
(function (global) {
  'use strict';
  const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const out = t => 1 - Math.pow(1 - t, 4);
  const inq = t => t * t;
  const reduced = () => global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  function mount(root, opts) {
    if (root._glide) return root._glide;
    opts = opts || {};
    const bar = root.querySelector('.glide__bar, [role=tablist]');
    const tabs = [...bar.querySelectorAll('.glide__tab, [role=tab]')];
    const panels = [...root.querySelectorAll('.glide__panel, [role=tabpanel]')];
    const pill = document.createElement('span');
    pill.className = 'glide__pill'; pill.setAttribute('aria-hidden', 'true');
    bar.prepend(pill);
    bar.setAttribute('role', 'tablist');
    const id = 'glide' + (++uid);
    let cur = Math.max(0, Math.min(tabs.length - 1, opts.index != null ? opts.index : tabs.findIndex(t => t.getAttribute('aria-selected') === 'true')));

    // icon strokes get a normalised length so they can draw on
    const strokes = tabs.map(t => [...t.querySelectorAll('svg path, svg circle, svg rect, svg line, svg polyline')].map(s => {
      s.setAttribute('pathLength', '1'); s.style.strokeDasharray = '1 1'; return s;
    }));
    tabs.forEach((t, i) => {
      t.type = 'button'; t.classList.add('glide__tab'); t.setAttribute('role', 'tab');
      t.id = t.id || `${id}-tab${i}`;
      t.querySelectorAll('svg').forEach(s => s.setAttribute('aria-hidden', 'true'));
      const p = panels[i];
      if (p) {
        p.id = p.id || `${id}-panel${i}`;
        p.classList.add('glide__panel'); p.setAttribute('role', 'tabpanel');
        p.setAttribute('aria-labelledby', t.id); t.setAttribute('aria-controls', p.id);
        if (!p.hasAttribute('tabindex')) p.tabIndex = 0;
        p._g = { x: 0, o: i === cur ? 1 : 0 };
        [...p.children].forEach(c => { c._g = { x: 0, o: 1 }; });
      }
      t.addEventListener('click', () => select(i));
    });

    bar.addEventListener('keydown', e => {
      const n = tabs.length, k = e.key;
      let i = k === 'ArrowRight' ? (cur + 1) % n : k === 'ArrowLeft' ? (cur - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if (i < 0) return;
      e.preventDefault(); select(i, true);
    });

    // ---- the rubber band: two edges, each on its own spring ----
    const E = { L: { x: 0, v: 0, t: 0, k: 300, c: 30, at: 0 }, R: { x: 0, v: 0, t: 0, k: 300, c: 30, at: 0 } };
    let dir = 1, raf = 0, last = 0, rm = reduced();
    const tweens = [];
    let pad = 5;
    let pos = [];
    function measure(i) { pos = tabs.map(t => [t.offsetLeft, t.offsetLeft + t.offsetWidth]); return pos[i]; }

    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      let busy = false;
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (const e of [E.L, E.R]) {
        if (now < e.at) { busy = true; continue; }
        for (let i = 0; i < n; i++) { e.v += (e.k * (e.t - e.x) - e.c * e.v) * h; e.x += e.v * h; }
        if (Math.abs(e.t - e.x) < 0.2 && Math.abs(e.v) < 2) { e.x = e.t; e.v = 0; } else busy = true;
      }
      const max = bar.clientWidth - pad;
      let L = Math.max(pad, E.L.x), R = Math.min(max, E.R.x);
      if (R - L < 18) { const m = (L + R) / 2; L = m - 9; R = m + 9; }
      const rest = Math.max(1, E.R.t - E.L.t), s = Math.max(0, (R - L) / rest - 1);
      pill.style.width = (R - L).toFixed(2) + 'px';
      pill.style.transform = `translate3d(${L.toFixed(2)}px,0,0) scaleY(${(1 - Math.min(0.16, s * 0.1)).toFixed(4)})`;
      pill.style.setProperty('--glide-s', Math.min(0.6, s).toFixed(3));
      // tabs the band is passing over light up
      tabs.forEach((t, j) => { const q = pos[j], o = (Math.min(R, q[1]) - Math.max(L, q[0])) / (q[1] - q[0]); t.style.color = j !== cur && o > 0.5 ? 'rgba(255,255,255,.82)' : ''; });

      for (let i = tweens.length - 1; i >= 0; i--) {
        const w = tweens[i], k = clamp((now - w.t0 - w.d) / w.dur), e = w.e(k), g = w.el._g;
        g.x = w.fx + (w.tx - w.fx) * e; g.o = w.fo + (w.to - w.fo) * e;
        if (w.draw) w.draw.style.strokeDashoffset = (1 - e).toFixed(3);
        else {
          w.el.style.transform = g.x ? `translate3d(${g.x.toFixed(2)}px,0,0)` : '';
          w.el.style.opacity = g.o;
          if (w.panel) w.el.style.visibility = g.o > 0.002 || w.panel === 2 ? 'visible' : 'hidden';
        }
        if (k >= 1) tweens.splice(i, 1); else busy = true;
      }
      if (busy) raf = requestAnimationFrame(frame); else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function tween(el, tx, to, d, dur, e, now, panel) {
      for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].el === el && !tweens[i].draw) tweens.splice(i, 1);
      tweens.push({ el, fx: el._g.x, fo: el._g.o, tx, to, t0: now, d, dur, e, panel });
    }

    function paint(i) {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    }

    function select(i, focus) {
      i = Math.max(0, Math.min(tabs.length - 1, i | 0));
      if (focus) tabs[i].focus();
      if (i === cur) return api;
      rm = reduced();
      const now = performance.now();
      dir = i > cur ? 1 : -1;
      const prev = cur; cur = i;
      paint(i);
      // springs: the leading edge is stiff and quick, the trailing edge soft and a beat late
      const [l, r] = measure(i), lead = dir > 0 ? E.R : E.L, trail = dir > 0 ? E.L : E.R;
      E.L.t = l; E.R.t = r;
      if (rm) { [E.L, E.R].forEach(e => { e.k = 520; e.c = 46; e.at = 0; }); }
      else {
        const far = Math.min(3, Math.abs(i - prev));
        lead.k = 460; lead.c = 38; lead.at = 0;
        trail.k = 150; trail.c = 21; trail.at = now + 40 + 25 * far;
      }
      pill.style.setProperty('--glide-x', dir > 0 ? '100%' : '0%');

      // icon draws on
      if (!rm) strokes[i].forEach((s, j) => {
        for (let k = tweens.length - 1; k >= 0; k--) if (tweens[k].draw === s) tweens.splice(k, 1);
        s._g = s._g || { x: 0, o: 0 }; s.style.strokeDashoffset = 1;
        tweens.push({ el: s, draw: s, fx: 0, fo: 0, tx: 0, to: 0, t0: now, d: j * 60, dur: 520, e: out });
      });

      // panels slide in the direction of travel
      const m = rm ? 0 : 1;
      panels.forEach((p, j) => {
        if (j === i) {
          if (p._g.o < 0.05) p._g.x = 46 * dir * m;
          p.style.visibility = 'visible';
          tween(p, 0, 1, rm ? 0 : 110, rm ? 200 : 440, out, now, 2);
          [...p.children].forEach((c, k) => {
            c._g.x = 26 * dir * m; c._g.o = 0;
            c.style.opacity = 0;
            tween(c, 0, 1, rm ? 0 : 140 + k * 55, rm ? 200 : 520, out, now);
          });
        } else if (p._g.o > 0) tween(p, -28 * dir * m, 0, 0, rm ? 150 : 170, inq, now, 1);
      });
      kick();
      const p = panels[i];
      root.dispatchEvent(new CustomEvent('glide:change', { bubbles: true, detail: { index: i, tab: tabs[i], panel: p } }));
      if (opts.onChange) opts.onChange(i);
      return api;
    }

    function relayout() {
      pad = tabs[0].offsetLeft;
      const [l, r] = measure(cur);
      E.L.t = E.L.x = l; E.R.t = E.R.x = r; E.L.v = E.R.v = 0; kick();
    }
    const api = { select: (i, focus) => select(i, focus), get index() { return cur; }, relayout };
    paint(cur);
    panels.forEach((p, j) => { p.style.opacity = j === cur ? 1 : 0; p.style.visibility = j === cur ? 'visible' : 'hidden'; });
    relayout();
    if (global.ResizeObserver) new ResizeObserver(relayout).observe(bar);
    root._glide = api;
    return api;
  }

  function auto() { document.querySelectorAll('[data-glide]:not([data-glide-manual])').forEach(el => mount(el)); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  global.Glide = { mount };
})(window);
