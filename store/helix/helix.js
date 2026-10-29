/* Helix — the Kodehelix signature loader: a 3D double helix of dots that folds into a check.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <span class="helix" data-helix data-size="md"></span>
     const h = Helix.mount(el, { size: 'lg', dots: 16, speed: 1 });
     h.done();   // collapses into a line, then draws a check (returns a Promise)
     h.reset();  // back to spinning
   Elements with data-helix auto-mount on DOMContentLoaded unless data-helix-manual is set. */
(function (global) {
  'use strict';
  var SIZES = { sm: 44, md: 150, lg: 300 };
  var TAU = Math.PI * 2;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var backOut = function (t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var mq = global.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function rgb(s, fb) {
    s = (s || '').trim();
    var m = s.match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      var h = m[1].length < 6 ? m[1].replace(/./g, '$&$&') : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = s.match(/rgba?\(([^)]+)\)/);
    return m ? m[1].split(/[ ,/]+/).slice(0, 3).map(Number) : fb;
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function col(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }

  function mount(el, opts) {
    if (el._helix) return el._helix;
    opts = opts || {};
    var size = opts.size || el.getAttribute('data-size');
    if (SIZES[size]) el.setAttribute('data-size', size); else if (parseFloat(size)) el.style.width = parseFloat(size) + 'px';
    el.classList.add('helix');
    el.setAttribute('role', 'status');
    var sr = document.createElement('span'); sr.className = 'helix__sr';
    var label = opts.label || el.getAttribute('data-label') || 'Loading';
    var doneLabel = opts.doneLabel || el.getAttribute('data-done') || 'Complete';
    sr.textContent = label;
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    el.append(cv, sr);
    var ctx = cv.getContext('2d');
    var dotsOpt = +(opts.dots || el.getAttribute('data-dots')) || 0;
    var speed = +(opts.speed || el.getAttribute('data-speed')) || 1;

    var W = 0, H = 0, N = 12, A, B, D;
    function layout() {
      var w = el.clientWidth || SIZES[size] || 150;
      var small = w < 80;
      W = w; H = Math.round(w * (small ? .5 : .44));
      N = dotsOpt || (small ? 7 : w < 200 ? 12 : 16);
      var dpr = Math.min(2, global.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cs = getComputedStyle(el);
      A = rgb(cs.getPropertyValue('--helix-a'), [59, 91, 255]);
      B = rgb(cs.getPropertyValue('--helix-b'), [34, 195, 238]);
      D = rgb(cs.getPropertyValue('--helix-done'), [25, 195, 125]);
      draw();
    }

    // state
    var mode = 'spin', t0 = 0, angle = 0, clock = 0, last = 0, raf = 0, visible = true;
    var from = { amp: 1, green: 0, check: 0 };
    var cur = { amp: 1, green: 0, fuse: 0, lineA: 0, lineB: 0, check: 0, pop: 0, bloom: 0, checkA: 1 };

    function step(now) {
      raf = 0;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      var reduce = mq.matches;
      clock += dt;
      var f = (now - t0) / 1000, spinK = 1;
      if (mode === 'done') {
        var p1 = easeIO(clamp(f / .55));
        cur.amp = from.amp * (1 - p1);
        spinK = 1 - .65 * p1;
        cur.green = from.green + (1 - from.green) * clamp((f - .1) / .4);
        cur.fuse = easeOut(clamp((f - .48) / .2));
        var c = easeIO(clamp((f - .64) / .42));
        cur.lineA = c; cur.lineB = c;
        cur.check = easeOut(clamp((f - .92) / .42));
        cur.checkA = 1;
        cur.pop = Math.sin(Math.PI * clamp((f - 1.12) / .36));
        cur.bloom = reduce ? 0 : Math.sin(Math.PI * clamp((f - 1.05) / .8));
      } else if (mode === 'reset') {
        var o = easeOut(clamp(f / .28));
        cur.check = from.check; cur.checkA = 1 - o; cur.fuse = 0; cur.pop = 0; cur.bloom = 0;
        var g = backOut(clamp((f - .12) / .8));
        cur.amp = from.amp + (1 - from.amp) * g;
        cur.green = from.green * (1 - easeOut(clamp(f / .5)));
        spinK = .35 + .65 * clamp(f / .6);
        if (f > 1) { mode = 'spin'; cur.check = 0; cur.amp = 1; cur.green = 0; }
      }
      angle += dt * speed * spinK * TAU * (reduce ? .14 : .42);
      draw();
      var settled = mode === 'done' && f > 2.1;
      if (!settled && visible) raf = requestAnimationFrame(step);
    }

    function draw() {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      var r0 = Math.max(1.8, H * .07);
      var breathe = mq.matches ? 1 : 1 + .035 * Math.sin(clock * 1.6);
      var amp = cur.amp, a = H * .3 * amp * breathe;
      var span = W / 2 - r0 * 2.6;
      var twist = TAU * 1.15 / (N - 1);
      var dotA = 1 - cur.fuse, dots = [], rungs = [];
      if (dotA > .002) {
        for (var i = 0; i < N; i++) {
          var u = i / (N - 1), th = i * twist - angle;
          var env = .78 + .22 * Math.sin(Math.PI * u);
          var s = Math.sin(th), c = Math.cos(th);
          var x = cx + (u - .5) * 2 * span;
          var ca = mix(mix(A, B, u * .25), D, cur.green), cb = mix(mix(B, A, u * .2), D, cur.green);
          var p = { x: x + (x - cx) * .05 * c * amp, y: cy + a * env * s, z: c, c: ca };
          var q = { x: x - (x - cx) * .05 * c * amp, y: cy - a * env * s, z: -c, c: cb };
          dots.push(p, q); rungs.push([p, q]);
        }
        dots.forEach(function (d) { d.d = (d.z + 1) / 2 * amp + (1 - amp); });
        dots.sort(function (m, n) { return m.d - n.d; });
        // soft additive glow under the near beads
        ctx.globalCompositeOperation = 'lighter';
        dots.forEach(function (d) {
          if (d.d < .5) return;
          var R = r0 * 3.4 * (.55 + .45 * d.d);
          var g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, R);
          g.addColorStop(0, col(d.c, .2 * (d.d - .5) * 2 * dotA)); g.addColorStop(1, col(d.c, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, R, 0, TAU); ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';
        var drewRungs = false;
        for (var k = 0; k < dots.length; k++) {
          var d = dots[k];
          if (!drewRungs && d.d >= .5) { drawRungs(rungs, amp, dotA, r0); drewRungs = true; }
          bead(d, r0, dotA);
        }
        if (!drewRungs) drawRungs(rungs, amp, dotA, r0);
      }
      // fused line -> check
      var lw = Math.max(2, r0 * 1.05);
      var k2 = H * .36, ax = cx - .62 * k2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (cur.fuse > 0 && cur.lineA < 1) {
        var x1 = cx - span + (ax - (cx - span)) * cur.lineA, x2 = cx + span + (ax - (cx + span)) * cur.lineB;
        ctx.strokeStyle = col(D, cur.fuse); ctx.lineWidth = lw;
        ctx.shadowColor = col(D, .7); ctx.shadowBlur = r0 * 2.2;
        ctx.beginPath(); ctx.moveTo(x1, cy); ctx.lineTo(x2, cy); ctx.stroke();
      }
      if (cur.bloom > 0) {
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'lighter';
        var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * .5);
        bg.addColorStop(0, col(D, .3 * cur.bloom)); bg.addColorStop(1, col(D, 0));
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (cur.check > 0 && cur.checkA > 0) {
        var sc = 1 + .07 * cur.pop * (mq.matches ? 0 : 1);
        var pts = [[-.62, .02], [-.16, .48], [.78, -.52]].map(function (v) { return [cx + v[0] * k2 * sc, cy + v[1] * k2 * sc]; });
        var L = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) + Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
        ctx.setLineDash([L * cur.check, L + 1]);
        ctx.strokeStyle = col(D, cur.checkA); ctx.lineWidth = lw * 1.15;
        ctx.shadowColor = col(D, .75 * cur.checkA); ctx.shadowBlur = r0 * 2.6;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.shadowBlur = 0;
    }

    function drawRungs(rungs, amp, alpha, r0) {
      if (amp < .02) return;
      ctx.lineWidth = Math.max(.75, r0 * .2);
      rungs.forEach(function (r) {
        var p = r[0], q = r[1];
        var g = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
        var side = .35 + .65 * Math.abs(p.y - q.y) / (H * .6 + .01);
        g.addColorStop(0, col(p.c, (.08 + .32 * p.d) * side * amp * alpha));
        g.addColorStop(1, col(q.c, (.08 + .32 * q.d) * side * amp * alpha));
        ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      });
    }

    // a bead: crisp when near, soft and dim (blurred) on the far side
    function bead(d, r0, alpha) {
      var R = r0 * (.55 + .45 * d.d), soft = .12 + .95 * (1 - d.d), a = (.26 + .74 * d.d) * alpha;
      var out = R * (1 + soft);
      var g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, out);
      g.addColorStop(0, col(mix(d.c, [255, 255, 255], .18 * d.d), a));
      g.addColorStop(Math.max(.05, (1 - soft * .7) / (1 + soft)), col(d.c, a));
      g.addColorStop(1, col(d.c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, out, 0, TAU); ctx.fill();
      if (d.d > .62 && R > 2.2) {
        ctx.fillStyle = col([255, 255, 255], (d.d - .62) * 1.25 * alpha);
        ctx.beginPath(); ctx.arc(d.x - R * .32, d.y - R * .34, R * .3, 0, TAU); ctx.fill();
      }
    }

    function kick() { if (!raf && visible) { last = 0; raf = requestAnimationFrame(step); } }
    function snap() { from.amp = cur.amp; from.green = cur.green; from.check = cur.check * cur.checkA; }

    var timer = 0;
    var api = {
      el: el,
      done: function () {
        if (mode !== 'done') { snap(); mode = 'done'; t0 = performance.now(); kick(); }
        el.setAttribute('aria-busy', 'false'); sr.textContent = doneLabel; el.classList.add('is-done');
        clearTimeout(timer);
        return new Promise(function (res) { timer = setTimeout(res, 1450); });
      },
      reset: function () {
        if (mode === 'spin') return;
        clearTimeout(timer);
        snap(); mode = 'reset'; t0 = performance.now(); kick();
        el.setAttribute('aria-busy', 'true'); sr.textContent = label; el.classList.remove('is-done');
      },
      relayout: layout,
      destroy: function () {
        cancelAnimationFrame(raf); raf = 0; visible = false;
        if (ro) ro.disconnect(); if (io) io.disconnect();
        cv.remove(); sr.remove(); delete el._helix;
      }
    };
    el._helix = api;
    el.setAttribute('aria-busy', 'true');

    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (el.clientWidth !== W) layout(); }) : null;
    if (ro) ro.observe(el); else addEventListener('resize', layout);
    var io = global.IntersectionObserver ? new IntersectionObserver(function (e) {
      visible = e[e.length - 1].isIntersecting; if (visible) kick();
    }) : null;
    if (io) io.observe(el);
    layout(); kick();
    return api;
  }

  function auto() {
    document.querySelectorAll('[data-helix]:not([data-helix-manual])').forEach(function (e) { mount(e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  global.Helix = { mount: mount };
})(window);
