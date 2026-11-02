/* Lyra — a star rating that draws itself into a constellation.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <div data-lyra data-title="How was your order?" data-name="rating"></div>
     const rating = Lyra.mount(el, { onChange: v => console.log(v) });
   Elements with data-lyra mount themselves on DOMContentLoaded unless data-lyra-manual is set. */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var WORDS = ['Awful', 'Not great', 'Okay', 'Good', 'Loved it'];
  var LIFT = [12, -10, 6, -14, 4, -7, 9, -11, 5, -5];          // irregular "constellation" heights
  var STAR = 'M12 3.4l2.55 5.35 5.85.78-4.28 4.08 1.07 5.82L12 16.6l-5.19 2.83 1.07-5.82-4.28-4.08 5.85-.78z';
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIO = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var back = function (t) { var c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var uid = 0;

  function svg(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function mount(root, opts) {
    if (root._lyra) return root._lyra;
    opts = opts || {};
    var d = root.dataset;
    var max = Math.max(2, Math.min(10, +(opts.max || d.max || 5)));
    var words = opts.labels || (d.labels ? d.labels.split('|') : max === 5 ? WORDS : null);
    var speed = +(opts.speed || d.speed || 1) || 1;
    var title = opts.title != null ? opts.title : d.title;
    var sub = opts.subtitle != null ? opts.subtitle : d.subtitle;
    var ph = opts.placeholder || d.placeholder || 'Tap a star';
    var readOnly = opts.readOnly || 'readonly' in d;
    var id = 'lyra' + (++uid);

    root.classList.add('lyra');
    root.innerHTML =
      (title ? '<p class="lyra__title" id="' + id + '-t">' + esc(title) + '</p>' : '') +
      (sub ? '<p class="lyra__sub">' + esc(sub) + '</p>' : '') +
      '<div class="lyra__sky"><div class="lyra__stars" role="radiogroup"' +
      (title ? ' aria-labelledby="' + id + '-t"' : ' aria-label="Rating"') + (readOnly ? ' aria-readonly="true"' : '') +
      '></div><i class="lyra__streak" aria-hidden="true"></i></div>' +
      '<div class="lyra__foot"><span class="lyra__word" aria-hidden="true"><span></span><span></span></span>' +
      '<span class="lyra__score" aria-hidden="true"><b>0.0</b> / ' + max + '</span>' +
      '<span class="lyra__sr" aria-live="polite"></span></div>';

    var sky = root.querySelector('.lyra__sky'), row = root.querySelector('.lyra__stars');
    var streak = root.querySelector('.lyra__streak'), wordEls = root.querySelectorAll('.lyra__word span');
    var scoreEl = root.querySelector('.lyra__score'), scoreB = scoreEl.firstChild, sr = root.querySelector('.lyra__sr');
    var web = svg('svg', { class: 'lyra__web', 'aria-hidden': 'true' });
    sky.insertBefore(web, row);
    var defs = svg('defs', {}, web);
    function grad(gid, user) {
      var g = svg('linearGradient', user ? { id: gid, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 300, y2: 0 } : { id: gid, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      svg('stop', { offset: 0, class: 'lyra__s1' }, g); svg('stop', { offset: 1, class: 'lyra__s2' }, g);
      return g;
    }
    grad(id + '-g'); var lineGrad = grad(id + '-lg', true);
    var gTw = svg('g', {}, web), gSeg = svg('g', {}, web), gFx = svg('g', {}, web);

    // twinkling background stars (seeded, so every page load looks the same)
    var seed = 7 + max, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var tw = [];
    for (var i = 0; i < 20; i++) tw.push({ x: rnd(), y: rnd(), r: .7 + rnd() * 1.1, ph: rnd() * 6.3, sp: 1.2 + rnd() * 2, el: svg('circle', { class: 'lyra__tw', r: 1, opacity: 0 }, gTw) });

    var stars = [], segs = [];
    for (var k = 0; k < max; k++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lyra__star'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false'); b.tabIndex = k ? -1 : 0;
      b.setAttribute('aria-label', (k + 1) + (k ? ' stars' : ' star') + (words && words[k] ? ', ' + words[k] : ''));
      if (readOnly) b.disabled = true;
      b.innerHTML = '<span class="lyra__glow"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path class="lyra__base" d="' + STAR +
        '"/><path class="lyra__lit" d="' + STAR + '" fill="url(#' + id + '-g)" stroke="url(#' + id + '-g)"/></svg>';
      row.appendChild(b);
      var fx = svg('g', { opacity: 0 }, gFx), sparks = [];
      var ring = svg('circle', { class: 'lyra__ring', r: 10, stroke: 'url(#' + id + '-g)' }, fx);
      for (var j = 0; j < 6; j++) sparks.push(svg('line', { class: 'lyra__spark' }, fx));
      stars.push({ btn: b, lit: b.querySelector('.lyra__lit'), glow: b.firstChild, fx: fx, ring: ring, sparks: sparks, x: 0, y: 0, lift: LIFT[k] });
      if (k) segs.push({ glow: svg('line', { class: 'lyra__seg lyra__seg--glow', stroke: 'url(#' + id + '-lg)' }, gSeg),
        line: svg('line', { class: 'lyra__seg', stroke: 'url(#' + id + '-lg)' }, gSeg), len: 0, a: 0, b: 0 });
    }
    var head = svg('g', { opacity: 0 }, gFx);
    svg('circle', { class: 'lyra__halo', r: 7 }, head); svg('circle', { class: 'lyra__core', r: 2.3 }, head);

    var W = 0, H = 0;
    function layout() {
      W = sky.clientWidth; H = sky.clientHeight;
      web.setAttribute('viewBox', '0 0 ' + W + ' ' + H); web.setAttribute('width', W); web.setAttribute('height', H);
      lineGrad.setAttribute('x2', W);
      var lift = W < 340 ? .7 : 1;
      stars.forEach(function (s) {
        s.x = s.btn.offsetLeft + s.btn.offsetWidth / 2; s.y = s.btn.offsetTop + s.btn.offsetHeight / 2 + s.lift * lift;
        s.ly = s.lift * lift;
        s.fx.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ')');
      });
      segs.forEach(function (g, i) {
        var A = stars[i], B = stars[i + 1], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), gap = Math.min(19, L / 3);
        g.ax = A.x + dx / L * gap; g.ay = A.y + dy / L * gap; g.bx = B.x - dx / L * gap; g.by = B.y - dy / L * gap; g.len = L - 2 * gap;
        [g.line, g.glow].forEach(function (l) {
          l.setAttribute('x1', g.ax); l.setAttribute('y1', g.ay); l.setAttribute('x2', g.bx); l.setAttribute('y2', g.by);
          l.setAttribute('stroke-dasharray', g.len + ' ' + (g.len + 2));
        });
      });
      tw.forEach(function (t) { t.el.setAttribute('cx', 6 + t.x * (W - 12)); t.el.setAttribute('cy', 4 + t.y * (H - 8)); t.el.setAttribute('r', t.r); });
      draw(performance.now());
    }

    var value = +(opts.value || d.value || 0), prev = 0, t0 = -1e9, raf = 0, wordFrom = '', wordTo = '';
    var hidden = null, name = opts.name || d.name;
    if (name) { hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = name; hidden.value = value || ''; root.appendChild(hidden); }
    var GAP = .17, T1 = .14;
    function tk(k) { return T1 + (k - 1) * GAP; }
    function wordFor(v) { return v ? (words && words[v - 1]) || (v + ' / ' + max) : ph; }
    function tone(v) { return !v ? '' : v / max <= .4 ? 'low' : v / max <= .6 ? 'mid' : 'high'; }

    function draw(now) {
      var e = reduce && reduce.matches ? 99 : (now - t0) / 1000 * speed;
      var n = value, p = prev, tEnd = n ? tk(n) + .12 : .2;
      stars.forEach(function (s, i) {
        var k = i + 1, lit = 0, sc = 1, u = (e - tk(k)) / .55;
        if (k <= n) {
          if (u < 0) lit = k <= p ? 1 - .7 * clamp(e / T1) : 0;
          else { lit = .3 + .7 * clamp(u * 4); sc = u >= 1 ? 1 : .7 + .3 * back(clamp(u)); }
        } else if (k <= p) lit = 1 - clamp(e / .22);
        s.lit.style.opacity = lit; s.glow.style.opacity = lit * (k <= n ? 1 : .6);
        s.btn.style.transform = 'translateY(' + s.ly + 'px) scale(' + sc + ')';
        var r = (e - tk(k)) / .62;
        if (k <= n && r >= 0 && r < 1) {
          var q = easeOut(r);
          s.fx.setAttribute('opacity', 1 - r);
          s.ring.setAttribute('r', 13 + 22 * q);
          s.sparks.forEach(function (l, j) {
            var a = (j * 60 + (k % 2 ? 30 : 0)) * Math.PI / 180, d1 = 17 + 15 * q, d2 = d1 + 8 * (1 - r);
            l.setAttribute('x1', Math.cos(a) * d1); l.setAttribute('y1', Math.sin(a) * d1);
            l.setAttribute('x2', Math.cos(a) * d2); l.setAttribute('y2', Math.sin(a) * d2);
          });
        } else s.fx.setAttribute('opacity', 0);
      });
      var headOn = 0, bump = Math.sin(Math.PI * clamp((e - tEnd) / .6));
      segs.forEach(function (g, i) {
        var k = i + 1, op = 0, off = g.len;
        if (k < n) {
          var dr = clamp((e - tk(k) - .04) / (GAP - .02));
          if (dr > 0) { op = 1; off = g.len * (1 - easeIO(dr)); }
          if (dr > 0 && dr < 1) {
            headOn = 1; var f = easeIO(dr);
            head.setAttribute('transform', 'translate(' + (g.ax + (g.bx - g.ax) * f) + ' ' + (g.ay + (g.by - g.ay) * f) + ')');
          }
        }
        if (op === 0 && k < p) { op = 1 - clamp(e / T1); off = 0; }
        g.line.style.opacity = op; g.line.style.strokeDashoffset = off;
        g.glow.style.opacity = op * (.12 + .36 * bump); g.glow.style.strokeDashoffset = off;
      });
      head.setAttribute('opacity', headOn);
      // twinkles: fade the old sky out, the new one in after the constellation closes
      var cnt = Math.round(20 * n / max), pc = Math.round(20 * p / max), tsec = now / 1000;
      tw.forEach(function (t, i) {
        var v = e < tEnd ? (i < pc ? 1 - clamp(e / .2) : 0) : (i < cnt ? clamp((e - tEnd - i * .035) / .3) : 0);
        var tw8 = reduce && reduce.matches ? .6 : .35 + .65 * Math.abs(Math.sin(tsec * t.sp + t.ph));
        t.el.setAttribute('opacity', (v * tw8 * .8).toFixed(3));
      });
      // shooting star on top ratings
      var su = (e - tEnd - .05) / .85;
      if (n && n / max > .6 && su > 0 && su < 1 && !(reduce && reduce.matches)) {
        var sx = -110 + (W + 140) * easeOut(su), sy = H * .05 + H * .42 * easeOut(su);
        streak.style.opacity = Math.sin(Math.PI * su);
        streak.style.transform = 'translate(' + sx + 'px,' + sy + 'px) rotate(17deg)';
      } else streak.style.opacity = 0;
      // label + score
      var w = clamp((e - Math.max(0, tEnd - .12)) / .34), ew = easeOut(w);
      if (wordEls[0].textContent !== wordFrom) wordEls[0].textContent = wordFrom;
      if (wordEls[1].textContent !== wordTo) { wordEls[1].textContent = wordTo; wordEls[1].className = n ? 'is-on' : 'is-ph'; }
      wordEls[0].style.transform = 'translateY(' + (-ew * 100) + '%)'; wordEls[0].style.opacity = 1 - ew;
      wordEls[1].style.transform = 'translateY(' + ((1 - ew) * 100) + '%)'; wordEls[1].style.opacity = ew;
      var sv = p + (n - p) * easeOut(clamp((e - T1) / (tEnd - T1 + .25)));
      scoreB.textContent = sv.toFixed(1);
      scoreEl.style.opacity = n ? clamp(e / .2) : 1 - clamp(e / .2);
      var busy = e < tEnd + 1.2 || (n > 0 && !(reduce && reduce.matches));
      raf = busy ? requestAnimationFrame(draw) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(draw); }

    function set(v, silent) {
      v = Math.max(0, Math.min(max, Math.round(+v || 0)));
      var wasEl = wordEls[1];
      wordFrom = wasEl.textContent; wordEls[0].className = wasEl.className;
      prev = value; value = v; wordTo = wordFor(v); t0 = performance.now();
      if (tone(v)) root.setAttribute('data-tone', tone(v));
      root.classList.toggle('is-rated', v > 0);
      stars.forEach(function (s, i) {
        s.btn.setAttribute('aria-checked', i + 1 === v ? 'true' : 'false');
        s.btn.tabIndex = i === Math.max(0, v - 1) ? 0 : -1;
      });
      if (hidden) hidden.value = v || '';
      sr.textContent = v ? 'Rated ' + v + ' of ' + max + (words && words[v - 1] ? ', ' + words[v - 1] : '') : '';
      kick();
      if (!silent && v !== prev) {
        if (opts.onChange) opts.onChange(v);
        root.dispatchEvent(new CustomEvent('lyra:change', { detail: { value: v }, bubbles: true }));
      }
      return api;
    }

    function hover(k) { stars.forEach(function (s, i) { s.btn.classList.toggle('is-hov', i < k); }); }
    if (!readOnly) {
      stars.forEach(function (s, i) {
        s.btn.addEventListener('click', function () { set(i + 1); });
        s.btn.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'touch') hover(i + 1); });
      });
      row.addEventListener('pointerleave', function () { hover(0); });
      row.addEventListener('keydown', function (ev) {
        var k = ev.key, v = value || 0, nv = null;
        if (k === 'ArrowRight' || k === 'ArrowUp') nv = Math.min(max, v + 1);
        else if (k === 'ArrowLeft' || k === 'ArrowDown') nv = Math.max(1, v - 1);
        else if (k === 'Home') nv = 1; else if (k === 'End') nv = max;
        if (nv == null) return;
        ev.preventDefault(); set(nv); stars[nv - 1].btn.focus();
      });
    }

    wordEls[1].textContent = wordTo = wordFor(value); wordEls[1].className = value ? 'is-on' : 'is-ph';
    if (tone(value)) root.setAttribute('data-tone', tone(value));
    if (value) { prev = value; t0 = -1e9; set(value, true); prev = value; t0 = -1e9; }
    var api = {
      get value() { return value; },
      set: function (v) { return set(v); },
      reset: function () { return set(0); },
      replay: function () { var v = value; prev = 0; value = 0; return set(v || max, true); },
      destroy: function () { cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); delete root._lyra; }
    };
    var ro = global.ResizeObserver ? new ResizeObserver(layout) : null;
    if (ro) ro.observe(sky); else global.addEventListener('resize', layout);
    layout();
    root._lyra = api;
    return api;
  }

  global.Lyra = { mount: mount };
  function auto() {
    [].forEach.call(document.querySelectorAll('[data-lyra]:not([data-lyra-manual])'), function (el) { mount(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
