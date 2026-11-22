/* Sprout — smart greenhouse dashboard · Kodehelix UI · kodehelix.in
   Plain JavaScript, no dependencies, no chart library.
   Sprout.mount(el, options) → controller · see README.md */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var now = function () { return global.performance && performance.now ? performance.now() : Date.now(); };
  var raf = function (fn) { return global.requestAnimationFrame(fn); };
  var reduced = function () { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); };

  /* ---------------- helpers ---------------- */
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function spring(t) { return t <= 0 ? 0 : t >= 1.6 ? 1 : 1 - Math.exp(-t * 6.2) * Math.cos(t * 12.5); } // t in seconds, ~20% overshoot
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n, d) { return (+n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function f2(n) { return Math.round(n * 100) / 100; }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
  function smooth(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + f2(pts[0][0]) + ' ' + f2(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + f2(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f2(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f2(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f2(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f2(p2[0]) + ' ' + f2(p2[1]);
    }
    return d;
  }

  /* one rAF loop runs every tween; its clock is performance.now() */
  function Ticker() {
    var jobs = [], running = false;
    function loop() {
      var t = now(), i = 0;
      while (i < jobs.length) {
        var j = jobs[i];
        if (t < j.start) { i++; continue; }
        if (j.fn(t - j.start) === false) jobs.splice(i, 1); else i++;
      }
      if (jobs.length) raf(loop); else running = false;
    }
    return {
      add: function (fn, delay) {
        var job = { start: now() + (delay || 0), fn: fn };
        jobs.push(job);
        if (!running) { running = true; raf(loop); }
        return job;
      },
      tween: function (dur, fn, delay, ease) {
        ease = ease || easeOut;
        return this.add(function (e) { var p = clamp(e / dur, 0, 1); fn(ease(p), p); if (p >= 1) return false; }, delay);
      },
      cancel: function (job) { var i = jobs.indexOf(job); if (i > -1) jobs.splice(i, 1); },
      clear: function () { jobs.length = 0; }
    };
  }

  /* ---------------- plants ----------------
     Every leaf is drawn pointing up from (0,0): [fill path, midrib]. */
  var LEAF = {
    oval: ['M0 0C-6.5-4-7.5-15 0-20C7.5-15 6.5-4 0 0Z', 'M0-2V-15'],
    long: ['M0 0C-4.6-7-5.2-23 0-29C5.2-23 4.6-7 0 0Z', 'M0-2V-24'],
    frill: ['M0 0C-4-3-6.5-7-5-10C-8.5-12-7.5-16-4.5-17C-7.5-20-5.5-24-2.5-25C-3.5-28-1-29.5 0-29.5C1-29.5 3.5-28 2.5-25C5.5-24 7.5-20 4.5-17C7.5-16 8.5-12 5-10C6.5-7 4-3 0 0Z', 'M0-2V-25'],
    round: ['M0-6C-8.5-8-9.5-19.5 0-21.5C9.5-19.5 8.5-8 0-6Z', 'M0 0V-17'],
    serr: ['M0 0C-3-1-5-4-5.2-6L-6.6-7-5.6-8.6-6.9-10-5.6-11.6C-5.2-14-2-16.2 0-17C2-16.2 5.2-14 5.6-11.6L6.9-10 5.6-8.6 6.6-7 5.2-6C5-4 3-1 0 0Z', 'M0-1.5V-13'],
    lobe: ['M0-12C-3-12.5-6.5-14-5.2-17C-7.5-19.5-4.3-22.5-2.2-20.5C-2.2-23.6 2.2-23.6 2.2-20.5C4.3-22.5 7.5-19.5 5.2-17C6.5-14 3-12.5 0-12Z', 'M0 0V-18'],
    curl: ['M0-13C-4.5-13-6.5-16.5-4.2-19C-6.8-22-2.6-25.5 0-23.5C2.6-25.5 6.8-22 4.2-19C6.5-16.5 4.5-13 0-13Z', 'M0 0V-19']
  };
  /* plant shapes you can use in your data (bed.shape) */
  var SHAPES = {
    butter: { crop: 'greens', leaf: 'oval', n: 7, spread: 74, len: 1.08 },
    romaine: { crop: 'greens', leaf: 'long', n: 6, spread: 34, len: 1.12 },
    kale: { crop: 'greens', leaf: 'frill', n: 6, spread: 50, len: 1.0, tone: 'kale' },
    spinach: { crop: 'greens', leaf: 'round', n: 6, spread: 76, len: .9 },
    cherry: { crop: 'tomato', fruit: '#FFB627', fr: 2.5, fc: [[-7, -15], [-9.5, -11.5], [-4.5, -10.5], [7, -25], [9.5, -21.5]] },
    roma: { crop: 'tomato', fruit: '#FF5A4E', fr: 3.1, oval: 1, fc: [[-7, -14], [7.5, -24], [-6.5, -31]] },
    beef: { crop: 'tomato', fruit: '#F04A3E', fr: 4.6, fc: [[-8, -14], [8.5, -26]] },
    heirloom: { crop: 'tomato', fruit: '#FF7FA0', fr: 3.8, fc: [[-8, -15], [7.5, -25], [-7, -32]] },
    basil: { crop: 'herb', leaf: 'oval', pairs: [[-7, 64, .78], [-15, 56, .68], [-22, 46, .56]], tone: 'basil' },
    mint: { crop: 'herb', leaf: 'serr', pairs: [[-6, 74, .7], [-13, 66, .64], [-20, 56, .56], [-26, 44, .46]], tone: 'mint' },
    coriander: { crop: 'herb', leaf: 'lobe', stalks: 6, spread: 50 },
    parsley: { crop: 'herb', leaf: 'curl', stalks: 5, spread: 36 }
  };
  var STAGES = ['Seedling', 'Vegetative', 'Maturing', 'Harvest-ready'];
  function stageOf(g) { return g < .35 ? 0 : g < .6 ? 1 : g < .82 ? 2 : 3; }

  function drawPlant(shape, r, parent) {
    var S = SHAPES[shape] || SHAPES.butter;
    var g = el('g', { class: 'sp-plant sp-t-' + (S.tone || S.crop) }, parent);
    var inner = el('g', {}, g);
    var P = { g: g, inner: inner, leaves: [], fruits: [] };
    function leaf(type, x, y, a, s, cls) {
      var L = LEAF[type], lg = el('g', { class: 'sp-leaf ' + cls }, inner);
      el('path', { d: L[0] }, lg);
      el('path', { d: L[1], class: 'sp-rib' }, lg);
      P.leaves.push({ g: lg, x: x, y: y, a: a, s: s });
    }
    var i, a;
    if (S.crop === 'greens') {
      var list = [];
      for (i = 0; i < S.n; i++) list.push(-S.spread + 2 * S.spread * i / (S.n - 1) + (r() - .5) * 7);
      list.sort(function (p, q) { return Math.abs(q) - Math.abs(p); });
      list.forEach(function (a, k) {
        leaf(S.leaf, 0, 0, a, S.len * (.72 + .3 * Math.abs(a) / S.spread) * (.92 + r() * .16), k < 2 ? 'l1' : k < 4 ? 'l2' : 'l3');
      });
      leaf(S.leaf, 0, 0, (r() - .5) * 10, S.len * .56, 'l3');
    } else if (S.crop === 'tomato') {
      el('path', { d: 'M7.5 3V-45', class: 'sp-stake' }, inner);
      el('path', { d: 'M0 0C1.2-9-1.6-18 0-27C1.1-33-.6-38 0-42', class: 'sp-stem' }, inner);
      [[-9, -60, .64, 'l1'], [-17, 56, .6, 'l1'], [-25, -50, .54, 'l2'], [-33, 48, .48, 'l2']].forEach(function (n) { leaf('long', 0, n[0], n[1], n[2], n[3]); });
      leaf('long', 0, -41, -20, .38, 'l3'); leaf('long', 0, -41, 22, .35, 'l3');
      S.fc.forEach(function (f) {
        var c = S.oval ? el('ellipse', { rx: S.fr * .82, ry: S.fr * 1.12, fill: S.fruit, class: 'sp-fruit' }, inner) : el('circle', { r: S.fr, fill: S.fruit, class: 'sp-fruit' }, inner);
        P.fruits.push({ el: c, x: f[0], y: f[1] });
      });
    } else if (S.stalks) {
      var n = S.stalks;
      for (i = 0; i < n; i++) {
        a = -S.spread + 2 * S.spread * i / (n - 1) + (r() - .5) * 8;
        leaf(S.leaf, 0, 0, a, (.8 + .3 * (1 - Math.abs(a) / S.spread)) * (.9 + r() * .2), i % 3 === 0 ? 'l1' : i % 3 === 1 ? 'l2' : 'l3');
      }
    } else {
      el('path', { d: 'M0 0C.8-10-.8-20 0-31', class: 'sp-stem' }, inner);
      S.pairs.forEach(function (p, k) {
        leaf(S.leaf, 0, p[0], -p[1], p[2], k ? 'l2' : 'l1');
        leaf(S.leaf, 0, p[0], p[1], p[2] * .96, k ? 'l2' : 'l1');
      });
      leaf(S.leaf, 0, -29, -24, .44, 'l3'); leaf(S.leaf, 0, -29, 24, .42, 'l3'); leaf(S.leaf, 0, -30, 0, .5, 'l3');
    }
    return P;
  }
  /* s = scale, u = unfurl 0..1, d = droop 0..1, op = opacity */
  function pose(P, s, u, d, op) {
    P.inner.setAttribute('transform', 'rotate(' + (d * 6).toFixed(2) + ') scale(' + s.toFixed(3) + ')');
    for (var i = 0; i < P.leaves.length; i++) {
      var L = P.leaves[i], sg = L.a >= 0 ? 1 : -1;
      var a = L.a * (.22 + .78 * u) + sg * d * (14 + .45 * Math.abs(L.a));
      L.g.setAttribute('transform', 'translate(' + L.x + ' ' + L.y + ') rotate(' + a.toFixed(1) + ') scale(' + (L.s * (.58 + .42 * u)).toFixed(3) + ')');
    }
    for (i = 0; i < P.fruits.length; i++) {
      var F = P.fruits[i];
      F.el.setAttribute('transform', 'translate(' + F.x + ' ' + F.y + ') scale(' + clamp(u * 1.15 - .15, 0, 1.4).toFixed(3) + ')');
    }
    P.g.style.opacity = op.toFixed(3);
  }

  /* ---------------- demo data: Fernhill Growers ---------------- */
  var DEFAULT_ZONES = [
    {
      name: 'House A', crop: 'Leafy greens', runAt: '06:40', last: 'Yesterday 18:20', temp: 21.6, humidity: 72, vpd: .74,
      waterToday: 940, waterTarget: 1250, tank: [1480, 2000],
      beds: [
        { id: 'A1', shape: 'butter', name: 'Butterhead lettuce', moisture: 52, growth: .84, yield: 58, ec: 1.3, ph: 6.0, temp: 21.4 },
        { id: 'A2', shape: 'romaine', name: 'Romaine lettuce', moisture: 44, growth: .64, yield: 49, ec: 1.4, ph: 6.2, temp: 21.9, dry: [2, 5] },
        { id: 'A3', shape: 'kale', name: 'Lacinato kale', moisture: 55, growth: .9, yield: 71, ec: 1.8, ph: 6.4, temp: 21.1, off: [6] },
        { id: 'A4', shape: 'spinach', name: 'Baby spinach', moisture: 61, growth: .42, yield: 33, ec: 1.6, ph: 6.3, temp: 22.0, wet: [1] }
      ]
    },
    {
      name: 'House B', crop: 'Tomatoes', runAt: '07:15', last: 'Yesterday 19:05', temp: 24.8, humidity: 64, vpd: 1.12,
      waterToday: 1380, waterTarget: 1600, tank: [1720, 2400],
      beds: [
        { id: 'B1', shape: 'cherry', name: 'Sungold cherry', moisture: 48, growth: .86, yield: 96, ec: 2.6, ph: 6.0, temp: 24.6, dry: [3] },
        { id: 'B2', shape: 'roma', name: 'Roma', moisture: 41, growth: .7, yield: 124, ec: 2.9, ph: 5.9, temp: 25.2, dry: [0, 4, 6] },
        { id: 'B3', shape: 'beef', name: 'Beefsteak', moisture: 57, growth: .78, yield: 138, ec: 2.7, ph: 6.1, temp: 24.9, wet: [2, 3] },
        { id: 'B4', shape: 'heirloom', name: 'Brandywine heirloom', moisture: 50, growth: .58, yield: 82, ec: 2.5, ph: 6.2, temp: 24.4, off: [5] }
      ]
    },
    {
      name: 'House C', crop: 'Herbs', runAt: '07:50', last: 'Yesterday 17:45', temp: 22.9, humidity: 58, vpd: 1.18,
      waterToday: 610, waterTarget: 900, tank: [1150, 1600],
      beds: [
        { id: 'C1', shape: 'basil', name: 'Genovese basil', moisture: 47, growth: .76, yield: 21, ec: 1.6, ph: 6.1, temp: 23.4 },
        { id: 'C2', shape: 'mint', name: 'Spearmint', moisture: 63, growth: .88, yield: 17, ec: 1.9, ph: 6.4, temp: 22.6, wet: [4] },
        { id: 'C3', shape: 'coriander', name: 'Coriander', moisture: 38, growth: .5, yield: 12, ec: 1.4, ph: 6.6, temp: 23.0, dry: [1, 6], off: [3] },
        { id: 'C4', shape: 'parsley', name: 'Flat-leaf parsley', moisture: 51, growth: .66, yield: 15, ec: 1.5, ph: 6.2, temp: 22.7 }
      ]
    }
  ];
  var ST_LABEL = { ok: 'Healthy', dry: 'Dry', wet: 'Waterlogged', off: 'Sensor offline' };

  function statusOf(m, o) { return m == null ? 'off' : m < o.dryBelow ? 'dry' : m > o.wetAbove ? 'wet' : 'ok'; }

  function buildZone(z, zi, o) {
    var r = rng(97 + zi * 7919);
    var beds = (z.beds || []).slice(0, 4).map(function (b, bi) {
      var has = function (k, i) { return (b[k] || []).indexOf(i) > -1; };
      var plants = [];
      for (var k = 0; k < 8; k++) {
        var given = b.plants && b.plants[k] || {}, m;
        if ('moisture' in given) m = given.moisture;
        else if (has('off', k)) m = null;
        else if (has('dry', k)) m = 23 + r() * 5;
        else if (has('wet', k)) m = 76 + r() * 7;
        else m = (b.moisture || 50) + (r() - .5) * 11;
        if (m != null) m = Math.round(m * 10) / 10;
        var st = statusOf(m, o);
        var bump = st === 'dry' ? 9 + r() * 4 : 7 + r() * 8;
        plants.push({
          bed: bi, k: k, m: m, st: st,
          pre: m == null ? null : st === 'wet' ? m : Math.max(4, m - bump),
          g: clamp('growth' in given ? given.growth : (b.growth || .7) + (r() - .5) * .18, .12, 1),
          litres: 'litres' in given ? given.litres : st === 'wet' ? 0 : st === 'dry' ? 8.4 + r() * 1.4 : st === 'off' ? 6.0 : 5.1 + r() * 2.2,
          seed: (r() * 1e9) | 0
        });
      }
      var good = plants.filter(function (p) { return p.m != null; });
      var c = { dry: 0, wet: 0, off: 0, ok: 0 };
      plants.forEach(function (p) { c[p.st]++; });
      return {
        id: b.id || (String.fromCharCode(65 + zi) + (bi + 1)), name: b.name || 'Bed ' + (bi + 1), shape: b.shape || 'butter',
        yield: b.yield || 40, ec: b.ec || 1.5, ph: b.ph || 6.2, temp: b.temp || z.temp || 22, plants: plants, counts: c,
        avg: avg(good.map(function (p) { return p.m; })), pre: avg(good.map(function (p) { return p.pre; })),
        status: c.dry ? 'dry' : c.wet ? 'wet' : c.off ? 'off' : 'ok'
      };
    });
    var days = z.days ? z.days.slice(-14).map(function (d) { return { m: d[0], t: d[1], w: d[2] }; }) : null;
    if (!days) {
      days = [];
      var target = z.waterTarget || 1000, base = avg(beds.map(function (b) { return b.avg; }));
      for (var d = 0; d < 14; d++) {
        days.push({
          m: Math.round((base + Math.sin(d * .9 + zi) * 5 + (r() - .5) * 6 - (d === 9 ? 9 : 0)) * 10) / 10,
          t: Math.round(((z.temp || 22) + Math.sin(d * .55 + zi * 2) * 1.8 + (r() - .5) * 1.4) * 10) / 10,
          w: Math.round(target * (.82 + r() * .32))
        });
      }
    }
    var sp = function (b, v, up) { var a = [], x = b; for (var k = 0; k < 12; k++) { x = x * (1 + (r() - .5 + (up || 0)) * v); a.push(x); } return a; };
    return {
      name: z.name || 'House ' + (zi + 1), crop: z.crop || '', runAt: z.runAt || '06:00', last: z.last || 'Yesterday',
      temp: z.temp || 22, humidity: z.humidity || 65, vpd: z.vpd || .9,
      waterToday: z.waterToday || 0, waterTarget: z.waterTarget || 1000, tank: z.tank || [1500, 2000],
      beds: beds, days: days,
      sparks: z.sparks || [sp(48, .07), sp(900, .1, .08), sp(22, .03), sp(300, .06, .1)],
      deltas: z.deltas || null
    };
  }

  /* ---------------- icons (Kodehelix style: 24 grid, 1.75 stroke) ---------------- */
  var I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    house: '<path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.2V20h14V9.2"/><path d="M5 14.5h14M12 9v11"/>',
    drop: '<path d="M12 3.5c3.2 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 2.8-6.5 6-10.5Z"/><path d="M9.2 14.5a2.9 2.9 0 0 0 2.6 2.7"/>',
    sensor: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    basket: '<path d="M4 10h16l-1.6 8.4a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6L4 10Z"/><path d="m8 10 3-6M16 10l-3-6M9.5 14v2.5M14.5 14v2.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    spray: '<path d="M12 3.5c2.5 3.1 4.6 5.5 4.6 8.1a4.6 4.6 0 0 1-9.2 0c0-2.6 2.1-5 4.6-8.1Z"/><path d="M5 20h2.5M10.8 20.5h2.4M16.5 20H19"/>',
    therm: '<path d="M10 14.3V5a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0Z"/><path d="M12 9v7.5"/>',
    sprout: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 8.4 9.6 6 5 6c0 4.2 2.6 6.5 7 6.5Z"/><path d="M12 15c0-3.8 2.5-6.2 7-6.2 0 3.9-2.5 6.2-7 6.2Z"/>',
    sort: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>'
  };
  function icon(n, cls) { return '<svg class="sp-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }
  var LOGO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I.sprout + '</svg>';

  /* ---------------- irrigation map geometry ---------------- */
  var M = { w: 720, h: 360, x0: 152, x1: 706, feedY: 236, top: [12, 98, 184, 270], px0: 205, dx: 66, tankX: 14, tankW: 66, tankY: 70, tankH: 184, pumpX: 104, valveX: 131 };
  var dripY = function (i) { return M.top[i] + 22; };
  var tipY = function (i) { return M.top[i] + 41; };
  var soilY = function (i) { return M.top[i] + 66; };
  var plantX = function (k) { return M.px0 + k * M.dx; };
  var GAUGE_C = 2 * Math.PI * 5.2;

  /* ---------------- the app ---------------- */
  function mount(root, opts) {
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) throw new Error('Sprout: mount element not found');
    if (root._sprout) root._sprout.destroy();
    opts = Object.assign({
      title: 'Greenhouses', company: 'Fernhill Growers', user: 'MK',
      theme: root.getAttribute('data-theme') || 'dark',
      data: null, start: 0,
      duration: 3000,     // ms the water takes from the tank to the last emitter
      autoplay: true,     // water the first zone when mounted
      dryBelow: 30, wetAbove: 72, target: [40, 60],
      endDate: [2026, 10, 22], // [year, monthIndex, day] of the last chart day
      onIrrigate: null    // callback(summary) when a run finishes
    }, opts || {});

    var tick = Ticker();
    var raw = opts.data || DEFAULT_ZONES;
    var data = raw.map(function (z, i) { return buildZone(z, i, opts); });
    var cur = -1, run = null, runJob = null, plants = [], plantLayer = null, rove = 0, offs = [];

    root.classList.add('sprout');
    root.setAttribute('data-theme', opts.theme);
    if (!root.querySelector('.sp-main')) root.innerHTML = template(opts);
    var $ = function (s) { return root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    function on(n, ev, fn, o) { n.addEventListener(ev, fn, o); offs.push(function () { n.removeEventListener(ev, fn, o); }); }

    /* ----- top bar ----- */
    var seg = $('.sp-seg'), thumb = $('.sp-seg-thumb');
    $$('.sp-seg button').forEach(function (b) { b.remove(); });
    data.forEach(function (z, i) {
      var b = h('<button type="button" aria-pressed="false" data-zone="' + i + '">' + esc(z.name) + '</button>');
      on(b, 'click', function () { setZone(i); });
      seg.appendChild(b);
    });
    function placeThumb() {
      var b = seg.querySelectorAll('button')[cur]; if (!b) return;
      thumb.style.width = b.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    var waterBtn = $('[data-sp="water"]'), themeBtn = $('[data-sp="theme"]');
    on(waterBtn, 'click', function () { water(); });
    on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    on($('[data-sp="menu"]'), 'click', function () { root.classList.toggle('nav-open'); });
    on($('.sp-scrim'), 'click', function () { root.classList.remove('nav-open'); });

    /* ----- irrigation map (static parts) ----- */
    var svg = $('.sp-map'), wrap = $('.sp-map-wrap'), tip = wrap.querySelector('.sp-tip');
    svg.innerHTML = '';
    var defs = el('defs', {}, svg);
    defs.innerHTML =
      '<pattern id="sp-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="currentColor"/></pattern>' +
      '<pattern id="sp-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.3" height="3.2" fill="currentColor"/></pattern>' +
      '<pattern id="sp-grain" width="9" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="currentColor"/><circle cx="6.5" cy="4.5" r=".55" fill="currentColor"/></pattern>' +
      '<linearGradient id="sp-water-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="720" y2="0"><stop offset="0" style="stop-color:var(--sprout-accent)"/><stop offset=".3" style="stop-color:var(--sprout-water)"/><stop offset="1" style="stop-color:var(--sprout-water)"/></linearGradient>' +
      '<linearGradient id="sp-tank-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sprout-water)" stop-opacity=".85"/><stop offset="1" style="stop-color:var(--sprout-accent)" stop-opacity=".9"/></linearGradient>' +
      '<radialGradient id="sp-glow-g"><stop offset="0" style="stop-color:var(--sprout-water)" stop-opacity=".75"/><stop offset=".45" style="stop-color:var(--sprout-water)" stop-opacity=".25"/><stop offset="1" style="stop-color:var(--sprout-water)" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="sp-tank-clip"><rect x="' + (M.tankX + 3) + '" y="' + (M.tankY + 3) + '" width="' + (M.tankW - 6) + '" height="' + (M.tankH - 6) + '" rx="9"/></clipPath>' +
      '<filter id="sp-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>';
    el('rect', { width: M.w, height: M.h, fill: 'url(#sp-dots)', class: 'sp-dotbg' }, svg);

    // beds
    var lanes = [];
    var laneG = el('g', {}, svg);
    M.top.forEach(function (y, i) {
      var g = el('g', { class: 'sp-lane' }, laneG);
      var L = {
        g: g,
        bg: el('rect', { x: 162, y: y + 1, width: 550, height: 80, rx: 11, class: 'sp-bed' }, g),
        label: el('text', { x: 174, y: y + 14, class: 'sp-bed-l' }, g),
        right: el('text', { x: 700, y: y + 14, class: 'sp-bed-r', 'text-anchor': 'end' }, g)
      };
      el('rect', { x: 168, y: soilY(i), width: 538, height: 11, rx: 4, class: 'sp-soil' }, g);
      el('rect', { x: 168, y: soilY(i), width: 538, height: 11, rx: 4, fill: 'url(#sp-grain)', class: 'sp-soil-grain' }, g);
      lanes.push(L);
    });
    var wetG = el('g', {}, svg);

    // pipes: shell + core + water + trail + flow
    var pipeG = el('g', { class: 'sp-pipes' }, svg);
    var waterG = el('g', { class: 'sp-waterg' }, svg);
    function pipe(d, len, thin) {
      el('path', { d: d, class: 'sp-pipe' + (thin ? ' thin' : '') }, pipeG);
      el('path', { d: d, class: 'sp-pipe-in' + (thin ? ' thin' : '') }, pipeG);
      var p = {
        len: len, d: d,
        water: el('path', { d: d, class: 'sp-water' + (thin ? ' thin' : ''), 'stroke-dasharray': '0 2000' }, waterG),
        flow: el('path', { d: d, class: 'sp-flow' + (thin ? ' thin' : '') }, waterG),
        trail: el('path', { d: d, class: 'sp-trail', filter: 'url(#sp-blur)' }, waterG),
        core: el('path', { d: d, class: 'sp-trail-core' }, waterG)
      };
      return p;
    }
    var tankOutX = M.tankX + M.tankW;
    var P_MAIN = pipe('M' + tankOutX + ' ' + M.feedY + 'H' + M.x0, M.x0 - tankOutX);
    P_MAIN.from = [tankOutX, M.feedY]; P_MAIN.dir = [1, 0];
    var P_UP = pipe('M' + M.x0 + ' ' + M.feedY + 'V' + dripY(0), M.feedY - dripY(0));
    P_UP.from = [M.x0, M.feedY]; P_UP.dir = [0, -1];
    var P_DN = pipe('M' + M.x0 + ' ' + M.feedY + 'V' + dripY(3), dripY(3) - M.feedY);
    P_DN.from = [M.x0, M.feedY]; P_DN.dir = [0, 1];
    var P_LANE = M.top.map(function (y, i) {
      var p = pipe('M' + M.x0 + ' ' + dripY(i) + 'H' + M.x1, M.x1 - M.x0, true);
      p.from = [M.x0, dripY(i)]; p.dir = [1, 0];
      return p;
    });
    var PIPES = [P_MAIN, P_UP, P_DN].concat(P_LANE);
    M.top.forEach(function (y, i) {
      el('circle', { cx: M.x0, cy: dripY(i), r: 4.2, class: 'sp-joint' }, pipeG);
      el('rect', { x: M.x1 - 1, y: dripY(i) - 3.5, width: 5, height: 7, rx: 1.5, class: 'sp-joint' }, pipeG);
    });

    // slots: tube, emitter, droplets, splash, wet patch, gauge, hit area (geometry is fixed, plants change per zone)
    var fxG = el('g', {}, svg), slotG, plantHost = el('g', {}, svg);
    // plants must sit above tubes but below gauges + drip lines: re-order
    svg.insertBefore(plantHost, pipeG);
    var tubeG = el('g', {}, svg); svg.insertBefore(tubeG, plantHost);
    slotG = el('g', {}, svg);
    svg.appendChild(waterG); svg.appendChild(fxG);
    var slots = [];
    M.top.forEach(function (y, i) {
      for (var k = 0; k < 8; k++) {
        var x = plantX(k), tx = x - 15, sy = soilY(i);
        var s = { i: i, k: k, x: x, tx: tx, sy: sy };
        s.wet = el('ellipse', { cx: x - 3, cy: sy + 2.5, rx: 22, ry: 4.2, class: 'sp-wetpatch' }, wetG);
        el('path', { d: 'M' + tx + ' ' + dripY(i) + 'V' + tipY(i), class: 'sp-tube' }, tubeG);
        s.tube = el('path', { d: 'M' + tx + ' ' + dripY(i) + 'V' + tipY(i), class: 'sp-tube-w', 'stroke-dasharray': '0 40' }, tubeG);
        s.emit = el('rect', { x: tx - 2.4, y: tipY(i) - 1, width: 4.8, height: 4, rx: 1.4, class: 'sp-emit' }, tubeG);
        s.drops = [0, 1, 2].map(function () { return el('path', { d: 'M0-2.6C1.2-1 1.7-.2 1.7.6a1.7 1.7 0 0 1-3.4 0c0-.8.5-1.6 1.7-3.2Z', class: 'sp-drop', opacity: 0 }, fxG); });
        s.splash = el('ellipse', { cx: tx, cy: sy + 1, rx: 2, ry: .8, class: 'sp-splash', opacity: 0 }, fxG);
        var g = el('g', { class: 'sp-slot', tabindex: '-1', role: 'button', 'data-slot': slots.length }, slotG);
        s.hit = el('rect', { x: x - 27, y: y + 24, width: 56, height: 57, rx: 9, class: 'sp-hit' }, g);
        var gg = el('g', { transform: 'translate(' + (x + 19) + ' ' + (sy + 5.5) + ')', class: 'sp-gauge' }, g);
        el('circle', { r: 5.2, class: 'sp-g-bg' }, gg);
        s.hatch = el('circle', { r: 5.2, class: 'sp-g-hatch', fill: 'url(#sp-hatch)' }, gg);
        s.ring = el('circle', { r: 5.2, class: 'sp-g-arc', transform: 'rotate(-90)', 'stroke-dasharray': '0 ' + GAUGE_C }, gg);
        s.halo = el('circle', { r: 8.2, class: 'sp-g-halo' }, gg);
        s.g = g;
        slots.push(s);
      }
    });
    var headG = el('g', {}, svg);
    PIPES.forEach(function (p) {
      p.head = el('g', { class: 'sp-head', opacity: 0 }, headG);
      el('circle', { r: 13, fill: 'url(#sp-glow-g)' }, p.head);
      el('circle', { r: 3.4, class: 'sp-head-core' }, p.head);
    });

    // tank, pump, valve + status
    var eq = el('g', { class: 'sp-equip' }, svg);
    var tx0 = M.tankX, ty0 = M.tankY;
    el('text', { x: tx0, y: 30, class: 'sp-eq-t' }, eq).textContent = 'Tank T1';
    var tankSub = el('text', { x: tx0, y: 45, class: 'sp-eq-s' }, eq);
    el('rect', { x: tx0, y: ty0, width: M.tankW, height: M.tankH, rx: 12, class: 'sp-tank' }, eq);
    var tankWater = el('g', { 'clip-path': 'url(#sp-tank-clip)' }, eq);
    var tankFill = el('rect', { x: tx0, width: M.tankW, height: M.tankH, fill: 'url(#sp-tank-g)' }, tankWater);
    var tankWave = el('path', { class: 'sp-tank-wave' }, tankWater);
    [.25, .5, .75].forEach(function (f) { var yy = ty0 + 4 + (M.tankH - 8) * (1 - f); el('path', { d: 'M' + (tx0 + M.tankW - 11) + ' ' + yy + 'h6', class: 'sp-tank-tick' }, eq); });
    var tankPct = el('text', { x: tx0 + M.tankW / 2, y: ty0 + M.tankH / 2 + 4, class: 'sp-tank-pct', 'text-anchor': 'middle' }, eq);
    el('rect', { x: tx0 + 8, y: ty0 + 8, width: 5, height: M.tankH - 40, rx: 2.5, class: 'sp-tank-shine' }, eq);
    var pump = el('g', { transform: 'translate(' + M.pumpX + ' ' + M.feedY + ')', class: 'sp-pump' }, eq);
    el('circle', { r: 12.5, class: 'sp-pump-body' }, pump);
    var imp = el('g', {}, pump);
    el('path', { d: 'M0 0C2-3 6-4 7.5-2M0 0C1.6 3.4 0 7.4-2.6 7.6M0 0C-3.6.2-6.6-2.8-6-5.4', class: 'sp-imp' }, imp);
    el('circle', { r: 1.8, class: 'sp-imp-hub' }, pump);
    var valve = el('g', { transform: 'translate(' + M.valveX + ' ' + M.feedY + ')', class: 'sp-valve' }, eq);
    el('path', { d: 'M-7-5.5 7 5.5V-5.5L-7 5.5Z', class: 'sp-valve-body' }, valve);
    el('path', { d: 'M0 0V-10', class: 'sp-valve-stem' }, valve);
    var handle = el('path', { d: 'M-5.5-10H5.5', class: 'sp-valve-h' }, valve);
    var st1 = el('text', { x: tx0, y: 292, class: 'sp-eq-s' }, eq); st1.textContent = 'Pump P1';
    var pumpSt = el('text', { x: tx0, y: 306, class: 'sp-eq-v' }, eq);
    var st2 = el('text', { x: tx0, y: 326, class: 'sp-eq-s' }, eq); st2.textContent = 'Flow';
    var flowSt = el('text', { x: tx0, y: 340, class: 'sp-eq-v' }, eq);

    /* ----- KPIs, charts, donut, table, log ----- */
    var kpiEls = [0, 1, 2, 3].map(function (k) { return $('[data-kpi="' + k + '"]'); });
    var shown = { kpi: [0, 0, 0, 0], sparks: null, share: null, total: 0, stages: null, m: null, t: null, w: null };

    /* ---------- zone ---------- */
    function setZone(i, instant) {
      i = ((i % data.length) + data.length) % data.length;
      var first = cur < 0, same = i === cur;
      cur = i;
      var Z = data[i];
      $$('.sp-seg button').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      placeThumb();
      $('[data-sp="sub"]').textContent = opts.company + ' · ' + Z.name + ' · ' + Z.crop;
      $('[data-sp="maptitle"]').textContent = 'Irrigation map · ' + Z.name;
      svg.setAttribute('aria-label', 'Irrigation map of ' + Z.name + ' (' + Z.crop + '): water tank, pump and 4 drip lines over 32 plants. Use the arrow keys to move between plants.');
      Z.beds.forEach(function (b, bi) {
        lanes[bi].label.textContent = b.id + ' · ' + b.name;
        lanes[bi].right.textContent = STAGES[stageOf(avg(b.plants.map(function (p) { return p.g; })))] + ' · 8 plants';
      });
      if (!same || !plantLayer) buildPlants(Z, !first && !instant && !reduced());
      renderTable(Z);
      drawDonut(Z, instant);
      drawStages(Z, instant);
      drawCharts(Z, instant);
      setDeltas(Z);
      morphSparks(Z, instant);
      startRun(instant || !opts.autoplay && first, !same && !first);
    }

    function buildPlants(Z, fade) {
      var old = plantLayer;
      plantLayer = el('g', { class: 'sp-plants' }, plantHost);
      plants = [];
      Z.beds.forEach(function (b, bi) {
        b.plants.forEach(function (p, k) {
          var s = slots[bi * 8 + k];
          var P = drawPlant(b.shape, rng(p.seed), plantLayer);
          P.g.setAttribute('transform', 'translate(' + s.x + ' ' + s.sy + ')');
          P.d = p; P.b = b; P.s = s;
          P.gs = (.66 + .44 * p.g) * (SHAPES[b.shape] && SHAPES[b.shape].crop === 'tomato' ? .92 : 1.1);
          plants.push(P);
          s.g.setAttribute('aria-label', b.id + ' plant ' + (k + 1) + ', ' + b.name);
        });
      });
      if (old) {
        if (fade) tick.tween(260, function (q) { old.style.opacity = 1 - q; if (q >= 1) old.remove(); }, 0, function (t) { return t; });
        else old.remove();
      }
    }

    /* ---------- the hero: an irrigation run ---------- */
    function plan(Z, fresh) {
      var tot = (M.x0 - tankOutX) + (M.feedY - dripY(0)) + (M.x1 - M.x0);
      var v = tot / Math.max(.6, opts.duration / 1000 - .3);
      var t0 = .3, tHead = t0 + (M.x0 - tankOutX) / v;
      P_MAIN.t = t0; P_UP.t = tHead; P_DN.t = tHead;
      var laneT = M.top.map(function (y, i) { return tHead + Math.abs(dripY(i) - M.feedY) / v; });
      P_LANE.forEach(function (p, i) { p.t = laneT[i]; });
      var last = 0, events = [];
      plants.forEach(function (P) {
        var s = P.s;
        P.tTube = laneT[s.i] + (s.tx - M.x0) / v;
        P.tHit = P.tTube + .12 + .26;
        last = Math.max(last, P.tHit);
        var d = P.d, b = P.b, code = b.id + '-' + (d.k + 1);
        if (d.st === 'dry') events.push([P.tHit, 'dry', '<b>' + code + '</b> was dry (' + Math.round(d.pre) + '%) · ' + fmt(d.litres, 1) + ' L delivered']);
        if (d.st === 'wet') events.push([P.tTube, 'wet', '<b>' + code + '</b> waterlogged (' + Math.round(d.m) + '%) · emitter skipped']);
        if (d.st === 'off') events.push([P.tHit, 'off', '<b>' + code + '</b> sensor offline · watered on schedule']);
      });
      events.sort(function (a, b) { return a[0] - b[0]; });
      var total = 0, need = 0;
      plants.forEach(function (P) { total += P.d.litres; if (P.d.st !== 'wet') need++; });
      return { v: v, end: Math.max.apply(null, laneT) + (M.x1 - M.x0) / v, laneT: laneT, last: last, finish: last + 1.5, events: events, total: total, need: need, fresh: fresh };
    }

    function startRun(instant, newZone) {
      if (runJob) { tick.cancel(runJob); runJob = null; }
      var Z = data[cur];
      var wasFull = !!(run && run.reached);
      kpiFrom = shown.kpi.slice();
      var fromDone = !!(run && !newZone && run.reached);
      run = plan(Z);
      run.wasFull = wasFull; run.fromDone = fromDone; run.newZone = newZone; run.ev = 0; run.reached = false;
      clearLog();
      svg.classList.remove('is-flowing');
      root.classList.add('is-running');
      waterBtn.disabled = true;
      setLive('Irrigating');
      if (instant || reduced()) { renderRun(1e4); finishRun(); return; }
      log('start', 'Valve V1 open · ' + esc(Z.name) + ' · ' + (P_LANE.length) + ' drip lines');
      runJob = tick.add(function (e) {
        var t = e / 1000;
        renderRun(t);
        if (t > run.finish) { runJob = null; finishRun(); return false; }
      });
    }

    function setFront(p, f, t) {
      p.water.setAttribute('stroke-dasharray', f >= p.len ? 'none' : f.toFixed(1) + ' 2000');
      var T = 46, on = f > 0 && f < p.len, fade = on ? 1 : f >= p.len ? clamp(1 - (t - p.t - p.len / run.v) / .35, 0, 1) : 0;
      if (fade > 0) {
        p.trail.setAttribute('stroke-dasharray', T + ' 2000'); p.trail.setAttribute('stroke-dashoffset', (T - f).toFixed(1));
        p.core.setAttribute('stroke-dasharray', (T * .45) + ' 2000'); p.core.setAttribute('stroke-dashoffset', (T * .45 - f).toFixed(1));
      }
      p.trail.style.opacity = p.core.style.opacity = fade;
      p.head.setAttribute('opacity', fade.toFixed(2));
      if (fade > 0) p.head.setAttribute('transform', 'translate(' + (p.from[0] + p.dir[0] * f).toFixed(1) + ' ' + (p.from[1] + p.dir[1] * f).toFixed(1) + ')');
    }

    function renderRun(t) {
      var R = run, Z = data[cur], v = R.v;
      // valve opens, pump spins up
      var open = easeOut(clamp(t / .35, 0, 1));
      handle.setAttribute('transform', 'rotate(' + (open * 90).toFixed(1) + ')');
      valve.classList.toggle('is-open', open > .5);
      var spin = t < R.end + .3 ? 1 : clamp(1 - (t - R.end - .3) / .9, 0, 1);
      var ang = t < R.end + .3 ? t * 720 : (R.end + .3) * 720 + 720 * .45 * (1 - Math.pow(1 - clamp((t - R.end - .3) / .9, 0, 1), 2));
      imp.setAttribute('transform', 'rotate(' + (ang % 360).toFixed(1) + ')');
      pump.classList.toggle('is-on', spin > .2);
      pumpSt.textContent = spin > .2 ? 'Running' : 'Standby';
      pumpSt.setAttribute('class', 'sp-eq-v' + (spin > .2 ? ' on' : ''));
      // old water drains out before the new run fills the pipes
      var draining = R.wasFull && t < .28;
      waterG.style.opacity = draining ? (1 - t / .28).toFixed(2) : 1;
      if (plantLayer && R.newZone) plantLayer.style.opacity = clamp(t / .3, 0, 1).toFixed(2);
      if (!draining) PIPES.forEach(function (p) { setFront(p, clamp((t - p.t) * v, 0, p.len), t); });
      var delivered = 0, watered = 0, msum = 0, mn = 0, flowNow = 0;
      for (var n = 0; n < plants.length; n++) {
        var P = plants[n], d = P.d, s = P.s, wet = d.st === 'wet';
        // tube fills, droplets fall from the emitter, a splash ring spreads on the soil
        var tf = wet ? 0 : clamp((t - P.tTube) / .12, 0, 1);
        s.tube.setAttribute('stroke-dasharray', draining ? 'none' : (tf * 19).toFixed(1) + ' 40');
        s.emit.classList.toggle('on', tf >= 1 && !draining || draining);
        s.emit.classList.toggle('off', wet && t >= P.tTube);
        for (var k = 0; k < 3; k++) {
          var q = wet ? -1 : (t - (P.tTube + .12 + k * .1)) / .26;
          if (q >= 0 && q < 1) {
            s.drops[k].setAttribute('opacity', (1 - q * .35).toFixed(2));
            s.drops[k].setAttribute('transform', 'translate(' + s.tx + ' ' + (tipY(s.i) + 5 + q * q * (s.sy - tipY(s.i) - 5)).toFixed(1) + ')');
          } else s.drops[k].setAttribute('opacity', 0);
        }
        var q2 = wet ? -1 : (t - P.tHit) / .6;
        if (q2 >= 0 && q2 < 1) {
          var rx = 2 + 13 * easeOut(q2);
          s.splash.setAttribute('rx', rx.toFixed(1)); s.splash.setAttribute('ry', (rx * .28).toFixed(1)); s.splash.setAttribute('opacity', (.95 * (1 - q2)).toFixed(2));
        } else s.splash.setAttribute('opacity', 0);
        // the plant springs up to its growth stage (dry plants droop until the water arrives)
        var fin = { s: P.gs, u: 1, d: 0, o: 1 };
        var pre = wet ? { s: P.gs, u: 1, d: .18, o: .92 } : { s: P.gs * .72, u: .1, d: d.st === 'dry' ? 1 : .45, o: .5 };
        var e = t - P.tHit, sc, u, dr, op;
        if (wet) { var w0 = R.fromDone ? 1 - clamp(t / .35, 0, 1) : 0; sc = P.gs; u = 1; dr = .18 * (1 - w0); op = .92 + .08 * w0; }
        else if (e < 0) {
          var b0 = R.fromDone ? easeInOut(clamp(t / .4, 0, 1)) : 1;
          sc = lerp(fin.s, pre.s, b0); u = lerp(1, pre.u, b0); dr = lerp(0, pre.d, b0); op = lerp(1, pre.o, b0);
        } else {
          var sp = spring(e), su = spring(e * .9 - .04);
          sc = lerp(pre.s, fin.s, sp); u = lerp(pre.u, 1, su); dr = lerp(pre.d, 0, easeOut(clamp(e / .55, 0, 1))); op = lerp(pre.o, 1, clamp(e / .25, 0, 1));
        }
        pose(P, sc, u, dr, op);
        // soil moisture gauge fills and takes its status colour
        var gp = wet ? easeOut(clamp((t - P.tTube) / .5, 0, 1)) : easeOut(clamp((t - P.tHit) / .75, 0, 1));
        var shownSt = (wet ? t >= P.tTube : t >= P.tHit) ? d.st : 'pending';
        if (s.st !== shownSt) { s.g.setAttribute('class', 'sp-slot is-' + shownSt); s.st = shownSt; }
        var mv = d.m == null ? 0 : lerp(d.pre, d.m, gp);
        if (R.fromDone && t < .4 && !wet && d.m != null) mv = lerp(d.m, d.pre, clamp(t / .4, 0, 1));
        s.ring.setAttribute('stroke-dasharray', (GAUGE_C * clamp(mv / 100, 0, 1)).toFixed(2) + ' ' + GAUGE_C.toFixed(2));
        s.wet.setAttribute('opacity', (wet ? .34 : .3 * clamp((t - P.tHit) / .8, 0, 1)).toFixed(2));
        if (d.m != null) { msum += mv; mn++; }
        var lp = wet ? 0 : clamp((t - P.tHit) / .6, 0, 1);
        delivered += d.litres * lp;
        if (lp > 0 && lp < 1) flowNow += d.litres / .6;
        if (!wet && t >= P.tHit) watered++;
        P.cur = { mv: mv, watered: !wet && t >= P.tHit };
      }
      // live counters
      setStat('litres', fmt(delivered, 0) + ' L', delivered / (R.total || 1));
      setStat('plants', watered + ' / ' + R.need, watered / (R.need || 1));
      var lvl = Z.tank[0] - delivered, pct = lvl / Z.tank[1];
      setStat('tank', Math.round(pct * 100) + '%', pct);
      setTank(lvl, Z.tank[1], t);
      flowSt.textContent = (spin > .2 ? (1.8 + Math.min(2.6, flowNow / 40)).toFixed(1) : '0.3') + ' m³/h';
      flowSt.setAttribute('class', 'sp-eq-v' + (spin > .2 ? ' on' : ''));
      var issues = 0;
      plants.forEach(function (P) { if (P.s.st !== 'pending' && P.d.st !== 'ok') issues++; });
      setStat('issues', String(issues), null);
      // KPIs follow the water
      var kin = clamp(t / .9, 0, 1);
      setKpi(0, mn ? msum / mn : 0, kin);
      setKpi(1, Z.waterToday + delivered, kin);
      setKpi(2, Z.temp, kin);
      setKpi(3, Z.beds.reduce(function (a, b) { return a + b.yield; }, 0), kin);
      setTodayBar(Z.waterToday + delivered);
      // beds finish → table rows update
      R.laneDone = R.laneDone || [];
      Z.beds.forEach(function (b, bi) {
        var done = t >= R.laneT[bi] + (M.x1 - M.x0) / v + .5;
        if (done !== !!R.laneDone[bi]) { R.laneDone[bi] = done; updateRow(bi, done); }
      });
      // log
      while (R.ev < R.events.length && R.events[R.ev][0] <= t) { var E = R.events[R.ev++]; log(E[1], E[2]); }
      R.reached = R.reached || t >= R.end;
    }

    function finishRun() {
      var Z = data[cur], R = run;
      R.done = true; R.reached = true;
      root.classList.remove('is-running');
      waterBtn.disabled = false;
      svg.classList.toggle('is-flowing', !reduced());
      valve.classList.add('is-open');
      handle.setAttribute('transform', 'rotate(90)');
      var c = { dry: 0, wet: 0, off: 0 };
      plants.forEach(function (P) { if (c[P.d.st] != null) c[P.d.st]++; });
      log('done', 'Run complete · <b>' + fmt(R.total, 0) + ' L</b> to ' + R.need + ' plants' + (c.wet ? ' · ' + c.wet + ' skipped' : ''));
      setLive('Done', true);
      if (typeof opts.onIrrigate === 'function') opts.onIrrigate({ zone: cur, name: Z.name, litres: Math.round(R.total * 10) / 10, watered: R.need, dry: c.dry, waterlogged: c.wet, offline: c.off });
    }

    function water() { if (cur < 0) return setZone(opts.start); startRun(false, false); }

    /* ----- tank ----- */
    function setTank(lvl, cap, t) {
      var f = clamp(lvl / cap, 0, 1), top = M.tankY + 4 + (M.tankH - 8) * (1 - f);
      tankFill.setAttribute('y', top.toFixed(1));
      var ph = (t || 0) * 5, d = 'M' + M.tankX + ' ' + (top + 1);
      for (var x = 0; x <= M.tankW; x += 6) d += 'L' + (M.tankX + x) + ' ' + (top + Math.sin(ph + x * .22) * 1.6).toFixed(2);
      d += 'V' + (M.tankY + M.tankH) + 'H' + M.tankX + 'Z';
      tankWave.setAttribute('d', d);
      tankFill.setAttribute('height', M.tankH);
      tankPct.textContent = Math.round(f * 100) + '%';
      tankSub.textContent = fmt(lvl) + ' / ' + fmt(cap) + ' L';
      var bar = $('[data-sp="tankbar"]'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
      var tp = $('[data-sp="tankpct"]'); if (tp) tp.textContent = Math.round(f * 100) + '%';
      var ts = $('[data-sp="tanksub"]'); if (ts) ts.textContent = fmt(lvl) + ' of ' + fmt(cap) + ' L · ' + data[cur].name;
    }

    function setStat(k, txt, bar) {
      var n = $('[data-stat="' + k + '"]'); if (!n) return;
      var b = n.querySelector('b'); if (b.textContent !== txt) b.textContent = txt;
      var i = n.querySelector('.sp-stat-bar i'); if (i && bar != null) i.style.width = (clamp(bar, 0, 1) * 100).toFixed(1) + '%';
    }

    /* ----- KPIs ----- */
    var KF = [
      function (v) { return v.toFixed(1) + '<small>%</small>'; },
      function (v) { return fmt(v) + '<small> L</small>'; },
      function (v) { return v.toFixed(1) + '<small>°C</small>'; },
      function (v) { return fmt(v) + '<small> kg</small>'; }
    ];
    var kpiFrom = [0, 0, 0, 0];
    function setKpi(k, val, p) {
      var v = p < 1 ? lerp(kpiFrom[k], val, easeOut(p)) : val;
      shown.kpi[k] = v;
      var html = KF[k](v);
      if (kpiEls[k] && kpiEls[k]._h !== html) { kpiEls[k].innerHTML = html; kpiEls[k]._h = html; }
    }
    function setDeltas(Z) {
      var dl = Z.deltas || [
        (avg(Z.beds.map(function (b) { return b.avg; })) - Z.days[12].m).toFixed(1) + ' pt',
        Math.round((Z.waterToday + plans(Z)) / Z.waterTarget * 100) + '%',
        Z.humidity + '% RH',
        '+' + (4 + (cur * 3.7) % 6).toFixed(1) + '%'
      ];
      var subs = ['today', 'of target', 'VPD ' + Z.vpd.toFixed(2), 'vs plan'];
      dl.forEach(function (d, k) {
        var n = $('[data-delta="' + k + '"]'); if (!n) return;
        n.textContent = (k === 0 && d[0] !== '-' ? '+' : '') + d;
        n.className = 'sp-delta ' + (k === 2 ? 'neutral' : String(d)[0] === '-' ? 'down' : 'up');
        var sb = $('[data-kpi-sub="' + k + '"]'); if (sb) sb.textContent = subs[k];
      });
    }
    function plans(Z) { var s = 0; Z.beds.forEach(function (b) { b.plants.forEach(function (p) { s += p.litres; }); }); return s; }
    function sparkPath(a, w, hh) {
      var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), r = (mx - mn) || 1;
      return a.map(function (v, i) { return [i / (a.length - 1) * w, hh - 3 - (v - mn) / r * (hh - 6)]; });
    }
    function morphSparks(Z, instant) {
      var to = Z.sparks, from = shown.sparks || to.map(function (s) { var m = avg(s); return s.map(function () { return m; }); });
      tick.tween(instant || reduced() ? 1 : 900, function (p) {
        var c = to.map(function (s, k) { return s.map(function (v, i) { return lerp(from[k][i], v, p); }); });
        c.forEach(function (s, k) {
          var pts = sparkPath(s, 92, 28), line = $('[data-spark="' + k + '"]'), area = $('[data-sparka="' + k + '"]');
          if (line) line.setAttribute('d', smooth(pts));
          if (area) area.setAttribute('d', smooth(pts) + 'L92 30L0 30Z');
        });
        shown.sparks = c;
      });
    }

    /* ----- donut: yield forecast by bed ----- */
    var DONUT_C = 2 * Math.PI * 68, DCOL = ['var(--sprout-leaf)', 'var(--sprout-water)', 'var(--sprout-accent)', 'var(--sprout-peri)'];
    var dsvg = $('.sp-donut svg'), segs = [0, 1, 2, 3].map(function (k) {
      return el('circle', { cx: 85, cy: 85, r: 68, fill: 'none', style: 'stroke:' + DCOL[k], 'stroke-width': 16, 'stroke-linecap': 'round', transform: 'rotate(-90 85 85)', 'stroke-dasharray': '0 ' + DONUT_C, class: 'sp-seg-arc' }, dsvg);
    });
    function drawDonut(Z, instant) {
      var tot = Z.beds.reduce(function (a, b) { return a + b.yield; }, 0);
      var to = Z.beds.map(function (b) { return b.yield / tot; });
      var from = shown.share || [0, 0, 0, 0], fromT = shown.total || 0;
      var ul = $('[data-sp="dlegend"]');
      ul.innerHTML = Z.beds.map(function (b, k) {
        return '<li><i style="background:' + DCOL[k] + '"></i><span>' + esc(b.id) + ' · ' + esc(b.name) + '</span><b class="sp-num">' + fmt(b.yield) + ' kg</b></li>';
      }).join('');
      tick.tween(instant || reduced() ? 1 : 1100, function (p) {
        var acc = 0;
        to.forEach(function (v, k) {
          var s = lerp(from[k], v, p), len = s * DONUT_C - 22;
          segs[k].setAttribute('stroke-dasharray', Math.max(.01, len).toFixed(2) + ' ' + DONUT_C.toFixed(2));
          segs[k].setAttribute('stroke-dashoffset', (-(acc * DONUT_C + 11)).toFixed(2));
          segs[k].style.opacity = len > 1 ? 1 : 0;
          acc += s;
        });
        $('[data-sp="dtotal"]').innerHTML = fmt(lerp(fromT, tot, p)) + '<small> kg</small>';
        if (p >= 1) { shown.share = to; shown.total = tot; }
      }, 0, easeInOut);
    }

    /* ----- growth stages bar ----- */
    var SCOL = ['var(--sprout-peri)', 'var(--sprout-water)', 'var(--sprout-leaf)', 'var(--sprout-gold)'];
    var sbar = $('[data-sp="stagebar"]'), sleg = $('[data-sp="stagelegend"]');
    sbar.innerHTML = SCOL.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');
    function drawStages(Z, instant) {
      var c = [0, 0, 0, 0];
      Z.beds.forEach(function (b) { b.plants.forEach(function (p) { c[stageOf(p.g)]++; }); });
      var n = c.reduce(function (a, b) { return a + b; }, 0) || 1;
      sleg.innerHTML = STAGES.map(function (s, k) { return '<li><i style="background:' + SCOL[k] + '"></i>' + s + '<b class="sp-num">' + c[k] + '</b></li>'; }).join('');
      $('[data-sp="stagesub"]').textContent = n + ' plants';
      var from = shown.stages || [0, 0, 0, 0], bars = sbar.children;
      tick.tween(instant || reduced() ? 1 : 900, function (p) {
        for (var k = 0; k < 4; k++) bars[k].style.flexGrow = lerp(from[k], c[k] / n, p).toFixed(4);
        if (p >= 1) shown.stages = c.map(function (v) { return v / n; });
      }, 120);
    }

    /* ----- charts ----- */
    var mwrap = $('.sp-mchart'), msvg = mwrap.querySelector('svg'), mtip = mwrap.querySelector('.sp-tip');
    var wwrap = $('.sp-wchart'), wsvg = wwrap.querySelector('svg'), wtip = wwrap.querySelector('.sp-tip');
    var chartJob = null, today = null;
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dates = [];
    (function () { var e = opts.endDate; for (var i = 13; i >= 0; i--) { var d = new Date(e[0], e[1], e[2] - i); dates.push([MON[d.getMonth()] + ' ' + d.getDate(), d.getDate()]); } })();

    function drawCharts(Z, instant) {
      var tm = Z.days.map(function (d) { return d.m; }), tt = Z.days.map(function (d) { return d.t; }), tw = Z.days.map(function (d) { return d.w; });
      tw[13] = Z.waterToday;
      var fm = shown.m || tm.map(function () { return 0; }), ft = shown.t || tt.map(function () { return 10; }), fw = shown.w || tw.map(function () { return 0; });
      if (chartJob) tick.cancel(chartJob);
      var fast = instant || reduced(), dur = fast ? 1 : 700, stag = fast ? 0 : 45;
      chartJob = tick.add(function (e) {
        var cm = [], ct = [], cw = [], all = true;
        for (var i = 0; i < 14; i++) {
          var p = clamp((e - i * stag) / dur, 0, 1); if (p < 1) all = false;
          var q = easeInOut(p);
          cm.push(lerp(fm[i], tm[i], q)); ct.push(lerp(ft[i], tt[i], q)); cw.push(lerp(fw[i], tw[i], q));
        }
        shown.m = cm; shown.t = ct; shown.w = cw;
        if (today != null && run && !run.done) cw[13] = shown.w[13] = Math.max(cw[13], today);
        paintMoist(); paintWater();
        if (all || instant) { chartJob = null; return false; }
      });
    }
    function paintMoist() {
      if (!shown.m) return;
      var W = mwrap.clientWidth || 600, H = mwrap.clientHeight || 220, Z = data[cur];
      var l = 34, r = 38, t = 12, b = 26, iw = W - l - r, ih = H - t - b;
      var X = function (i) { return l + i * iw / 13; }, Y = function (m) { return t + (1 - m / 80) * ih; }, YT = function (c) { return t + (1 - (c - 10) / 20) * ih; };
      msvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var s = '<defs><linearGradient id="sp-ma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sprout-water)" stop-opacity=".26"/><stop offset="1" style="stop-color:var(--sprout-water)" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="sp-ml" gradientUnits="userSpaceOnUse" x1="' + l + '" x2="' + (W - r) + '" y1="0" y2="0"><stop offset="0" style="stop-color:var(--sprout-accent)"/><stop offset="1" style="stop-color:var(--sprout-water)"/></linearGradient></defs>';
      for (var g = 0; g <= 4; g++) {
        var gy = Y(g * 20);
        s += '<path class="sp-grid" d="M' + l + ' ' + f2(gy) + 'H' + (W - r) + '"/><text class="sp-ax" x="' + (l - 8) + '" y="' + f2(gy + 3.5) + '" text-anchor="end">' + g * 20 + '%</text>' +
          '<text class="sp-ax" x="' + (W - r + 8) + '" y="' + f2(gy + 3.5) + '">' + (10 + g * 5) + '°</text>';
      }
      s += '<rect class="sp-band" x="' + l + '" y="' + f2(Y(opts.target[1])) + '" width="' + iw + '" height="' + f2(Y(opts.target[0]) - Y(opts.target[1])) + '"/>';
      s += '<path class="sp-band-e" d="M' + l + ' ' + f2(Y(opts.target[1])) + 'H' + (W - r) + 'M' + l + ' ' + f2(Y(opts.target[0])) + 'H' + (W - r) + '"/>';
      var step = W < 420 ? 4 : W < 620 ? 3 : 2;
      for (var i = 13; i >= 0; i -= step) s += '<text class="sp-ax" x="' + f2(X(i)) + '" y="' + (H - 7) + '" text-anchor="middle">' + (i === 13 ? 'Today' : dates[i][0]) + '</text>';
      var pm = shown.m.map(function (v, i) { return [X(i), Y(v)]; }), pt = shown.t.map(function (v, i) { return [X(i), YT(v)]; });
      s += '<path class="sp-m-area" fill="url(#sp-ma)" d="' + smooth(pm) + 'L' + f2(X(13)) + ' ' + f2(Y(0)) + 'L' + l + ' ' + f2(Y(0)) + 'Z"/>';
      s += '<path class="sp-t-line" d="' + smooth(pt) + '"/>';
      s += '<path class="sp-m-line" stroke="url(#sp-ml)" d="' + smooth(pm) + '"/>';
      var lp = pm[13];
      s += '<circle class="sp-m-glow" cx="' + f2(lp[0]) + '" cy="' + f2(lp[1]) + '" r="9"/><circle class="sp-m-dot" cx="' + f2(lp[0]) + '" cy="' + f2(lp[1]) + '" r="4"/>';
      s += '<g class="sp-cross" opacity="0"><path class="sp-cross-l" d="M0 ' + t + 'V' + (t + ih) + '"/><circle class="sp-cross-m" r="4.5"/><circle class="sp-cross-t" r="3.5"/></g>';
      msvg.innerHTML = s;
      msvg._geo = { X: X, Y: Y, YT: YT, l: l, iw: iw, W: W };
    }
    function paintWater() {
      if (!shown.w) return;
      var W = wwrap.clientWidth || 300, H = wwrap.clientHeight || 220, Z = data[cur];
      var l = 38, r = 6, t = 12, b = 26, iw = W - l - r, ih = H - t - b;
      var mx = Math.max(Z.waterTarget * 1.25, Math.max.apply(null, shown.w) * 1.08), stepV = mx > 1200 ? 500 : mx > 500 ? 250 : 100;
      mx = Math.ceil(mx / stepV) * stepV;
      var Y = function (v) { return t + (1 - v / mx) * ih; }, bw = iw / 14;
      wsvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var s = '<defs><linearGradient id="sp-wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sprout-water)"/><stop offset="1" style="stop-color:var(--sprout-accent)"/></linearGradient></defs>';
      for (var v = 0; v <= mx; v += stepV) s += '<path class="sp-grid" d="M' + l + ' ' + f2(Y(v)) + 'H' + (W - r) + '"/><text class="sp-ax" x="' + (l - 7) + '" y="' + f2(Y(v) + 3.5) + '" text-anchor="end">' + (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v) + '</text>';
      var w = Math.max(4, Math.min(18, bw * .58));
      shown.w.forEach(function (val, i) {
        var x = l + i * bw + (bw - w) / 2, y = Y(Math.max(0, val)), hh = Y(0) - y, over = val > Z.waterTarget && i !== 13;
        var yt = over ? Y(Z.waterTarget) : y;
        s += '<path class="sp-bar' + (i === 13 ? ' is-today' : '') + '" data-i="' + i + '" d="' + (over ? 'M' + f2(x) + ' ' + f2(Y(0)) + 'V' + f2(yt + 1) + 'H' + f2(x + w) + 'V' + f2(Y(0)) + 'Z' : barPath(x, y, w, hh)) + '"' + (i === 13 ? ' style="fill:url(#sp-wb)"' : '') + '/>';
        if (over) s += '<path class="sp-bar-over" data-i="' + i + '" d="' + barPath(x, y, w, yt - y) + '"/>';
      });
      var ty = Y(Z.waterTarget);
      s += '<path class="sp-target" d="M' + l + ' ' + f2(ty) + 'H' + (W - r) + '"/>';
      s += '<text class="sp-ax sp-target-t" x="' + (W - r) + '" y="' + f2(ty - 6) + '" text-anchor="end">Target ' + fmt(Z.waterTarget) + ' L</text>';
      var stp = W < 300 ? 4 : 2;
      for (var i = 13; i >= 0; i -= stp) s += '<text class="sp-ax" x="' + f2(l + i * bw + bw / 2) + '" y="' + (H - 7) + '" text-anchor="middle">' + (i === 13 ? 'Today' : dates[i][1]) + '</text>';
      wsvg.innerHTML = s;
      wsvg._geo = { l: l, bw: bw, Y: Y };
      var tot = $('[data-sp="wtotal"]'); if (tot) tot.innerHTML = fmt(avg(shown.w)) + '<small> L / day avg</small>';
    }
    function barPath(x, y, w, hh) {
      var r = Math.min(3.5, w / 2, hh);
      if (hh <= .5) return 'M' + f2(x) + ' ' + f2(y + hh) + 'h' + f2(w);
      return 'M' + f2(x) + ' ' + f2(y + hh) + 'V' + f2(y + r) + 'Q' + f2(x) + ' ' + f2(y) + ' ' + f2(x + r) + ' ' + f2(y) + 'H' + f2(x + w - r) + 'Q' + f2(x + w) + ' ' + f2(y) + ' ' + f2(x + w) + ' ' + f2(y + r) + 'V' + f2(y + hh) + 'Z';
    }
    function setTodayBar(v) {
      today = v;
      if (!shown.w || chartJob) return;
      if (Math.abs(shown.w[13] - v) < 2) return;
      shown.w[13] = v; paintWater();
    }
    // chart hover: crosshair + tooltip
    function chartTip(wrapEl, tipEl, html, x, y) {
      tipEl.innerHTML = html; tipEl.classList.add('on');
      var tw = tipEl.offsetWidth, th = tipEl.offsetHeight, W = wrapEl.clientWidth, H = wrapEl.clientHeight;
      tipEl.style.left = (x + 14 + tw <= W ? x + 14 : Math.max(0, x - 14 - tw)) + 'px';
      tipEl.style.top = clamp(y - th / 2, 0, Math.max(0, H - th)) + 'px';
    }
    function moistMove(e) {
      var G = msvg._geo; if (!G || !shown.m) return;
      var rc = msvg.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - rc.left;
      var i = clamp(Math.round((x - G.l) / G.iw * 13), 0, 13), Z = data[cur];
      var cx = G.X(i), my = G.Y(shown.m[i]), ty = G.YT(shown.t[i]), cr = msvg.querySelector('.sp-cross');
      cr.setAttribute('opacity', 1);
      cr.querySelector('.sp-cross-l').setAttribute('transform', 'translate(' + cx + ' 0)');
      cr.querySelector('.sp-cross-m').setAttribute('cx', cx); cr.querySelector('.sp-cross-m').setAttribute('cy', my);
      cr.querySelector('.sp-cross-t').setAttribute('cx', cx); cr.querySelector('.sp-cross-t').setAttribute('cy', ty);
      var m = shown.m[i], st = m < opts.target[0] ? 'Below target' : m > opts.target[1] ? 'Above target' : 'In range';
      chartTip(mwrap, mtip, '<b>' + (i === 13 ? 'Today' : dates[i][0]) + '</b><span><i class="sp-k-m"></i>Moisture <em>' + m.toFixed(1) + '%</em></span><span><i class="sp-k-t"></i>Air temp <em>' + shown.t[i].toFixed(1) + '°C</em></span><small>' + st + ' · ' + fmt(Z.days[i].w) + ' L used</small>', cx, Math.min(my, ty));
    }
    function moistLeave() { var cr = msvg.querySelector('.sp-cross'); if (cr) cr.setAttribute('opacity', 0); mtip.classList.remove('on'); }
    on(msvg, 'mousemove', moistMove); on(msvg, 'touchstart', moistMove, { passive: true }); on(msvg, 'mouseleave', moistLeave);
    function waterMove(e) {
      var G = wsvg._geo; if (!G || !shown.w) return;
      var rc = wsvg.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - rc.left;
      var i = clamp(Math.floor((x - G.l) / G.bw), 0, 13), Z = data[cur], v = shown.w[i];
      $$('.sp-wchart .sp-bar').forEach(function (b) { b.classList.toggle('is-hover', +b.getAttribute('data-i') === i); });
      var diff = Math.round((v - Z.waterTarget) / Z.waterTarget * 100);
      chartTip(wwrap, wtip, '<b>' + (i === 13 ? 'Today' : dates[i][0]) + '</b><span>Water <em>' + fmt(v) + ' L</em></span><small>' + (diff > 0 ? '+' : '') + diff + '% vs target</small>', G.l + i * G.bw + G.bw / 2, G.Y(v));
    }
    function waterLeave() { $$('.sp-wchart .sp-bar').forEach(function (b) { b.classList.remove('is-hover'); }); wtip.classList.remove('on'); }
    on(wsvg, 'mousemove', waterMove); on(wsvg, 'touchstart', waterMove, { passive: true }); on(wsvg, 'mouseleave', waterLeave);

    /* ----- beds table ----- */
    var tbody = $('.sp-table tbody');
    function renderTable(Z) {
      tbody.innerHTML = Z.beds.map(function (b, bi) {
        return '<tr tabindex="0" data-bed="' + bi + '" aria-label="Show bed ' + esc(b.id) + ' on the irrigation map">' +
          '<td><div class="sp-bedcell"><span class="sp-bed-ic" style="--c:' + DCOL[bi] + '">' + icon('sprout') + '</span><div><b>' + esc(b.id) + ' · ' + esc(b.name) + '</b><small>8 plants · ' + STAGES[stageOf(avg(b.plants.map(function (p) { return p.g; })))] + '</small></div></div></td>' +
          '<td><div class="sp-mbar"><span class="sp-num" data-mv>' + Math.round(b.pre) + '%</span><em><u style="left:' + opts.target[0] / .8 + '%;width:' + (opts.target[1] - opts.target[0]) / .8 + '%"></u><i data-mb style="width:' + (b.pre / .8).toFixed(1) + '%"></i></em></div></td>' +
          '<td class="sp-num sp-last">' + b.temp.toFixed(1) + '°C<small>EC ' + b.ec.toFixed(1) + ' · pH ' + b.ph.toFixed(1) + '</small></td>' +
          '<td class="sp-num sp-last" data-last>' + lastHtml(Z.last) + '</td>' +
          '<td><span class="sp-status is-pending" data-st>Waiting</span></td></tr>';
      }).join('');
    }
    function lastHtml(t) { var m = String(t).match(/^(.*?)\s+(\d.*)$/); return m ? esc(m[2]) + '<small>' + esc(m[1]) + '</small>' : esc(t); }
    function updateRow(bi, done) {
      var Z = data[cur], b = Z.beds[bi], tr = tbody.querySelector('[data-bed="' + bi + '"]'); if (!tr) return;
      var litres = b.plants.reduce(function (a, p) { return a + p.litres; }, 0);
      tr.querySelector('[data-mv]').textContent = Math.round(done ? b.avg : b.pre) + '%';
      var mb = tr.querySelector('[data-mb]');
      mb.style.width = ((done ? b.avg : b.pre) / .8).toFixed(1) + '%';
      mb.className = done ? 'is-' + (b.avg < opts.target[0] ? 'low' : b.avg > opts.target[1] ? 'high' : 'ok') : '';
      tr.querySelector('[data-last]').innerHTML = done ? esc(Z.runAt) + '<small>' + fmt(litres) + ' L delivered</small>' : lastHtml(Z.last);
      var st = tr.querySelector('[data-st]'), c = b.counts;
      var txt = !done ? 'Waiting' : b.status === 'dry' ? c.dry + ' dry' : b.status === 'wet' ? 'Waterlogged' : b.status === 'off' ? 'Offline' : 'Healthy';
      st.className = 'sp-status is-' + (done ? b.status : 'pending'); st.textContent = txt;
      if (done) { tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash'); }
    }
    function selectBed(bi, fromMap) {
      $$('.sp-table tr[data-bed]').forEach(function (r) { r.classList.toggle('is-sel', +r.getAttribute('data-bed') === bi); r.setAttribute('aria-selected', +r.getAttribute('data-bed') === bi ? 'true' : 'false'); });
      lanes.forEach(function (L, i) { L.g.classList.toggle('is-hl', i === bi); });
      clearTimeout(selectBed.t);
      selectBed.t = setTimeout(function () { lanes.forEach(function (L) { L.g.classList.remove('is-hl'); }); }, 2600);
      if (!fromMap) {
        var r = wrap.getBoundingClientRect();
        if (r.top < 0 || r.bottom > (global.innerHeight || 800)) wrap.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
        if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = 0;
      }
    }
    on(tbody, 'click', function (e) { var tr = e.target.closest('tr[data-bed]'); if (tr) selectBed(+tr.getAttribute('data-bed')); });
    on(tbody, 'keydown', function (e) { var tr = e.target.closest('tr[data-bed]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectBed(+tr.getAttribute('data-bed')); } });

    /* ----- log ----- */
    var logEl = $('[data-sp="log"]');
    var LOG_IC = { start: 'spray', dry: 'drop', wet: 'drop', off: 'sensor', done: 'sprout' };
    var logN = 0;
    function clearLog() { logEl.innerHTML = ''; logN = 0; }
    function log(kind, html) {
      var Z = data[cur], n = logN++;
      var mm = +Z.runAt.slice(3) + Math.floor(n * 1.5), hh = +Z.runAt.slice(0, 2) + Math.floor(mm / 60);
      var time = String(hh).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0');
      var li = h('<li class="is-' + kind + '"><span class="sp-log-ic">' + icon(LOG_IC[kind]) + '</span><p>' + html + '</p><time>' + time + '</time></li>');
      logEl.insertBefore(li, logEl.firstChild);
      while (logEl.children.length > 5) logEl.lastChild.remove();
    }
    function setLive(txt, done) { var n = $('[data-sp="live"]'); if (!n) return; n.textContent = txt; n.className = 'sp-live' + (done ? ' is-done' : ''); }

    /* ----- plant tooltips + keyboard ----- */
    function tipFor(si) {
      var P = plants[si]; if (!P) return;
      var d = P.d, b = P.b, s = P.s, st = s.st && s.st !== 'pending' ? d.st : null;
      var m = d.m == null ? '—' : Math.round(P.cur ? P.cur.mv : d.m) + '%';
      var last = P.cur && P.cur.watered ? data[cur].runAt + ' · ' + fmt(d.litres, 1) + ' L' : d.st === 'wet' ? 'Skipped · soil saturated' : data[cur].last;
      tip.innerHTML = '<b>' + esc(b.id) + ' · ' + esc(b.name) + '</b><small>Plant ' + (d.k + 1) + ' · ' + STAGES[stageOf(d.g)] + '</small>' +
        '<dl><dt>Soil moisture</dt><dd>' + m + (st ? ' <span class="sp-status is-' + st + '">' + ST_LABEL[st] + '</span>' : '') + '</dd>' +
        '<dt>Last watered</dt><dd>' + esc(last) + '</dd><dt>EC · pH</dt><dd>' + b.ec.toFixed(1) + ' · ' + b.ph.toFixed(1) + '</dd></dl>';
      tip.classList.add('on');
      var wr = wrap.getBoundingClientRect(), hr = s.hit.getBoundingClientRect();
      var x = hr.left - wr.left + wrap.scrollLeft + hr.width / 2, y = hr.top - wr.top;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = clamp(x - tw / 2, wrap.scrollLeft + 4, wrap.scrollLeft + wrap.clientWidth - tw - 4);
      var top = y - th - 6; if (top < 2) top = y + hr.height + 6;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
      s.g.setAttribute('aria-label', b.id + ' plant ' + (d.k + 1) + ', ' + b.name + ', soil moisture ' + m + (st ? ', ' + ST_LABEL[st] : '') + ', last watered ' + last);
    }
    function hideTip() { tip.classList.remove('on'); }
    slots.forEach(function (s, si) {
      on(s.g, 'mouseenter', function () { tipFor(si); });
      on(s.g, 'mouseleave', hideTip);
      on(s.g, 'focus', function () { rove = si; tipFor(si); });
      on(s.g, 'blur', hideTip);
      on(s.g, 'click', function () { tipFor(si); selectBed(s.i, true); });
    });
    slots[0].g.setAttribute('tabindex', '0');
    on(svg, 'keydown', function (e) {
      var k = e.key, n = rove;
      if (k === 'ArrowRight') n++; else if (k === 'ArrowLeft') n--; else if (k === 'ArrowDown') n += 8; else if (k === 'ArrowUp') n -= 8;
      else if (k === 'Home') n = 0; else if (k === 'End') n = slots.length - 1;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); selectBed(slots[rove].i, true); return; }
      else if (k === 'Escape') { hideTip(); return; } else return;
      e.preventDefault();
      n = clamp(n, 0, slots.length - 1);
      slots[rove].g.setAttribute('tabindex', '-1'); slots[n].g.setAttribute('tabindex', '0'); rove = n; slots[n].g.focus();
    });

    /* ----- theme + resize ----- */
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      themeBtn.innerHTML = icon(t === 'light' ? 'moon' : 'sun');
      themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    setTheme(opts.theme);
    var ro = global.ResizeObserver ? new ResizeObserver(function () { placeThumb(); if (!chartJob) { paintMoist(); paintWater(); } }) : null;
    if (ro) { ro.observe(mwrap); ro.observe(wwrap); ro.observe(seg); }
    else on(global, 'resize', function () { placeThumb(); paintMoist(); paintWater(); });

    setZone(clamp(opts.start, 0, data.length - 1), !opts.autoplay);

    var api = {
      setZone: function (i) { setZone(i); return api; },
      next: function () { setZone(cur + 1); return api; },
      water: function () { water(); return api; },
      setTheme: function (t) { setTheme(t); return api; },
      selectBed: function (i) { selectBed(i); return api; },
      get zone() { return cur; },
      get running() { return !!runJob; },
      destroy: function () {
        tick.clear(); if (ro) ro.disconnect();
        offs.forEach(function (f) { f(); }); offs = [];
        clearTimeout(selectBed.t);
        delete root._sprout;
      }
    };
    root._sprout = api;
    return api;
  }

  /* ---------------- markup (index.html carries the same, edit either) ---------------- */
  function template(o) {
    var nav = [['grid', 'Overview', 1], ['house', 'Greenhouses'], ['drop', 'Irrigation'], ['sensor', 'Sensors', 0, '3'], ['basket', 'Harvest'], ['chart', 'Reports']];
    var lg = '<div class="sp-legend"><span><i class="is-ok"></i>Healthy</span><span><i class="is-dry"></i>Dry</span><span><i class="is-wet"></i>Waterlogged</span><span><i class="is-off"></i>Offline</span></div>';
    return '' +
      '<aside class="sp-side" aria-label="Main">' +
      '<div class="sp-brand"><span class="sp-brand-mark">' + LOGO + '</span><div>Sprout<small>' + esc(o.company) + '</small></div></div>' +
      '<nav class="sp-nav"><div class="sp-nav-label">Farm</div>' +
      nav.map(function (n) { return '<a href="#"' + (n[2] ? ' aria-current="page"' : '') + '>' + icon(n[0]) + '<span>' + n[1] + '</span>' + (n[3] ? '<em class="sp-pill">' + n[3] + '</em>' : '') + '</a>'; }).join('') +
      '<div class="sp-nav-label">Account</div><a href="#">' + icon('gear') + '<span>Settings</span></a></nav>' +
      '<div class="sp-side-card"><div class="sp-tank-h">' + icon('drop') + '<b>Water tank</b><span class="sp-num" data-sp="tankpct">—</span></div>' +
      '<div class="sp-tank-bar"><i data-sp="tankbar"></i></div><span class="sp-tank-sub" data-sp="tanksub"></span></div>' +
      '</aside><div class="sp-scrim"></div>' +
      '<main class="sp-main">' +
      '<header class="sp-top">' +
      '<button class="sp-icon-btn sp-menu" type="button" data-sp="menu" aria-label="Open menu">' + icon('menu') + '</button>' +
      '<div class="sp-title"><h1>' + esc(o.title) + '</h1><p data-sp="sub"></p></div>' +
      '<div class="sp-seg" role="group" aria-label="Greenhouse"><span class="sp-seg-thumb"></span></div>' +
      '<button class="sp-icon-btn" type="button" data-sp="theme" aria-label="Switch theme"></button>' +
      '<button class="sp-btn" type="button" data-sp="water">' + icon('spray') + '<span>Run irrigation</span></button>' +
      '<span class="sp-avatar" aria-hidden="true">' + esc(o.user) + '</span>' +
      '</header>' +
      '<section class="sp-kpis">' +
      kpi(0, 'drop', 'Avg soil moisture', 'var(--sprout-water)') +
      kpi(1, 'spray', 'Water used today', 'var(--sprout-accent)') +
      kpi(2, 'therm', 'Air temperature', 'var(--sprout-peri)') +
      kpi(3, 'basket', 'Yield forecast', 'var(--sprout-leaf)') +
      '</section>' +
      '<section class="sp-row">' +
      '<article class="sp-card sp-mapcard"><div class="sp-card-h"><div><h2 data-sp="maptitle">Irrigation map</h2><p>Drip lines, emitters and live soil moisture per plant</p></div>' + lg + '</div>' +
      '<div class="sp-map-wrap"><svg class="sp-map" viewBox="0 0 720 360" role="group" aria-label="Irrigation map"></svg><div class="sp-tip sp-ptip" aria-hidden="true"></div></div>' +
      '<div class="sp-map-stats">' +
      '<div class="sp-stat" data-stat="litres"><span>Water delivered</span><b class="sp-num">0 L</b><div class="sp-stat-bar"><i></i></div></div>' +
      '<div class="sp-stat" data-stat="plants"><span>Plants watered</span><b class="sp-num">0</b><div class="sp-stat-bar"><i class="is-leaf"></i></div></div>' +
      '<div class="sp-stat" data-stat="tank"><span>Tank level</span><b class="sp-num">—</b><div class="sp-stat-bar"><i class="is-tank"></i></div></div>' +
      '<div class="sp-stat" data-stat="issues"><span>Need attention</span><b class="sp-num">0</b><div class="sp-stat-dots"><i class="is-dry"></i><i class="is-wet"></i><i class="is-off"></i></div></div>' +
      '</div></article>' +
      '<article class="sp-card sp-yield"><div class="sp-card-h"><div><h2>Yield forecast</h2><p>By bed · next 30 days</p></div></div>' +
      '<div class="sp-donut-wrap"><div class="sp-donut"><svg viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="68" fill="none" class="sp-donut-track" stroke-width="16"/></svg><div class="sp-donut-c"><b class="sp-num" data-sp="dtotal">0</b><span>forecast</span></div></div><ul class="sp-dlegend" data-sp="dlegend"></ul></div>' +
      '<div class="sp-stages"><div class="sp-stages-h"><span>Growth stage</span><span data-sp="stagesub"></span></div><div class="sp-stagebar" data-sp="stagebar"></div><ul class="sp-stage-l" data-sp="stagelegend"></ul></div>' +
      '</article></section>' +
      '<section class="sp-row">' +
      '<article class="sp-card"><div class="sp-card-h"><div><h2>Soil moisture</h2><p>Daily average · last 14 days</p></div>' +
      '<div class="sp-legend"><span><i class="sp-k-m"></i>Moisture</span><span><i class="sp-k-t"></i>Air temp</span><span><i class="sp-k-b"></i>Target ' + o.target[0] + '–' + o.target[1] + '%</span></div></div>' +
      '<div class="sp-chart sp-mchart"><svg role="img" aria-label="Soil moisture and air temperature, last 14 days"></svg><div class="sp-tip"></div></div></article>' +
      '<article class="sp-card sp-logcard"><div class="sp-card-h"><div><h2>Irrigation log</h2><p>Events from the current run</p></div><span class="sp-live" data-sp="live">Idle</span></div>' +
      '<ol class="sp-log" data-sp="log" aria-live="polite"></ol></article>' +
      '</section>' +
      '<section class="sp-row">' +
      '<article class="sp-card"><div class="sp-card-h"><div><h2>Beds &amp; sensors</h2><p>Click a bed to find it on the irrigation map</p></div></div>' +
      '<div class="sp-table-wrap"><table class="sp-table"><thead><tr><th>Bed</th><th>Moisture</th><th>Soil</th><th>Watered</th><th>Status</th></tr></thead><tbody></tbody></table></div></article>' +
      '<article class="sp-card"><div class="sp-card-h"><div><h2>Water use</h2><p>Litres per day vs target</p></div><b class="sp-big sp-num" data-sp="wtotal">0</b></div>' +
      '<div class="sp-chart sp-wchart"><svg role="img" aria-label="Water used per day, last 14 days"></svg><div class="sp-tip"></div></div></article>' +
      '</section>' +
      '</main>';
  }
  function kpi(k, ic, label, color) {
    return '<article class="sp-card sp-kpi"><div class="sp-kpi-top">' + icon(ic) + label + '</div>' +
      '<div class="sp-kpi-val sp-num" data-kpi="' + k + '">0</div>' +
      '<div class="sp-kpi-foot"><span><span class="sp-delta up" data-delta="' + k + '">+0%</span> <span data-kpi-sub="' + k + '"></span></span>' +
      '<svg class="sp-spark" viewBox="0 0 92 30" aria-hidden="true" style="color:' + color + '"><path class="sp-spark-a" data-sparka="' + k + '"/><path class="sp-spark-l" data-spark="' + k + '"/></svg></div></article>';
  }

  var Sprout = {
    mount: mount, version: '1.0.0', data: DEFAULT_ZONES, shapes: Object.keys(SHAPES),
    template: function (o) { return template(Object.assign({ title: 'Greenhouses', company: 'Fernhill Growers', user: 'MK', target: [40, 60] }, o || {})); }
  };
  global.Sprout = Sprout;

  // auto-mount: <div data-sprout></div> (options as JSON in data-sprout; add data-sprout-manual to mount it yourself)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-sprout]'), function (n) {
      if (n._sprout || n.hasAttribute('data-sprout-manual')) return;
      var o = {}; try { o = JSON.parse(n.getAttribute('data-sprout') || '{}'); } catch (e) { }
      mount(n, o);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
