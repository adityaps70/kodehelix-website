/* Groove — music streaming analytics dashboard · Kodehelix UI · kodehelix.in
   Plain JS, no dependencies. Groove.mount(el, options) → controller. See README.md */
(function (global) {
  'use strict';

  var now = function () { return global.performance && performance.now ? performance.now() : Date.now(); };
  var reduced = function () { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  var NS = 'http://www.w3.org/2000/svg';
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function backOut(t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function compact(n, small) {
    var a = Math.abs(n), u = '', v = n, d = 0;
    if (a >= 1e6) { v = n / 1e6; u = 'M'; d = 2; } else if (a >= 1e4) { v = n / 1e3; u = 'K'; d = 1; } else return fmt(n);
    return v.toFixed(d) + (small ? '<small>' + u + '</small>' : u);
  }
  function secs(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function toSec(t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function smooth(pts, lo, hi) {
    if (pts.length < 2) return '';
    var cy = function (y) { return lo == null ? y : clamp(y, lo, hi); };
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + cy(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + cy(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- demo data (fictional artist & label) ---------- */
  var DATA = [
    {
      name: 'Glasshouse', kind: 'Album', released: 'Nov 6', relDay: 12, curve: 'launch', base: 92000, prevScale: .64, seed: 7,
      label: ['#3B5BFF', '#22C3EE'], palette: ['#22C3EE', '#8FA3FF', '#3B9BFF', '#7BE0FF'],
      listeners: 412300, saves: 96400, deltas: [38.2, 18.6, 24.1, 38.2], heat: 'evening',
      tracks: [['Glasshouse', '3:48', 284100, .21], ['Paper Satellites', '4:12', 402600, .27], ['Low Tide Lights', '3:21', 171900, .18], ['Saltwater Radio', '3:55', 521300, .31],
        ['Kerosene Sky', '4:40', 132800, .15], ['Hollow Bloom', '3:05', 196400, .19], ['Northbound Again', '4:02', 144700, .16], ['Quiet Engines', '5:10', 108900, .14]],
      platforms: [['Spotify', .56], ['Apple Music', .21], ['YouTube Music', .14], ['Other', .09]],
      ages: [['18–24', .29], ['25–34', .41], ['35–44', .19], ['45+', .11]],
      cities: [['London', 'GB', 48210, 24, 3], ['Berlin', 'DE', 31870, 19, 1], ['Mumbai', 'IN', 29440, 41, 3], ['New York', 'US', 27960, 12, 0], ['Melbourne', 'AU', 21330, 16, 1], ['São Paulo', 'BR', 18920, 33, 5]],
      playlists: [['Glass & Static', 412000, 3, 4, '2d ago', 1], ['Indie Drift', 286500, 1, 12, '4d ago', 1], ['Late Night Static', 154200, 7, 7, '5d ago', 0], ['Coastal Commute', 98400, 0, 21, '1w ago', 0], ['Rainy Window', 61300, 5, 3, '1w ago', 0]]
    },
    {
      name: 'Afterglow', kind: 'EP', released: 'Jun 20', relDay: null, curve: 'steady', base: 52000, prevScale: .82, seed: 21,
      label: ['#FF7A59', '#FFB020'], palette: ['#FFB020', '#FF7A59', '#FF5A8A', '#F4C95D'],
      listeners: 286900, saves: 61200, deltas: [-6.4, -4.2, 3.1, -6.4], heat: 'commute',
      tracks: [['Afterglow', '3:32', 4281600, .24], ['Neon Orchard', '3:58', 2904300, .22], ['Ferris Light', '4:15', 1766200, .17], ['Marigold Static', '3:10', 2337900, .2], ['Last Train Home', '4:44', 1203500, .15]],
      platforms: [['Spotify', .61], ['Apple Music', .17], ['YouTube Music', .15], ['Other', .07]],
      ages: [['18–24', .38], ['25–34', .33], ['35–44', .18], ['45+', .11]],
      cities: [['Los Angeles', 'US', 26400, -3, 0], ['Mexico City', 'MX', 22180, 6, 3], ['London', 'GB', 19950, -8, 0], ['Jakarta', 'ID', 17600, 11, 1], ['Paris', 'FR', 15320, -5, 2], ['Toronto', 'CA', 13870, -2, 0]],
      playlists: [['Golden Hour Pop', 538000, 0, 18, '3w ago', 1], ['Sunset Drive', 201400, 3, 9, '1mo ago', 0], ['Summer Leftovers', 133800, 1, 26, '1mo ago', 0], ['Warm Static', 72900, 2, 5, '2mo ago', 0], ['Sunday Reset', 40100, 4, 14, '2mo ago', 0]]
    },
    {
      name: 'Northline', kind: 'Single', released: 'Sep 18', relDay: null, curve: 'climb', base: 9500, prevScale: .5, seed: 33,
      label: ['#19C37D', '#22C3EE'], palette: ['#19C37D', '#22C3EE', '#7BE3A4', '#8FA3FF'],
      listeners: 351400, saves: 88700, deltas: [64.3, 31.8, 47.5, 64.3], heat: 'late',
      tracks: [['Northline', '3:41', 3118400, .29], ['Northline (Night Drive)', '4:26', 1402700, .23], ['Northline (Acoustic)', '3:37', 866100, .2], ['Ember Coast', '3:54', 1094800, .18]],
      platforms: [['Spotify', .52], ['Apple Music', .2], ['YouTube Music', .19], ['Other', .09]],
      ages: [['18–24', .34], ['25–34', .36], ['35–44', .2], ['45+', .1]],
      cities: [['Stockholm', 'SE', 34600, 52, 0], ['Oslo', 'NO', 22900, 38, 1], ['Amsterdam', 'NL', 20450, 29, 0], ['Bengaluru', 'IN', 19700, 61, 2], ['Chicago', 'US', 16200, 18, 1], ['Tokyo', 'JP', 14800, 44, 3]],
      playlists: [['Nordic Nights', 624000, 0, 2, '6d ago', 1], ['Night Drive Essentials', 318700, 1, 6, '1w ago', 1], ['Cold Coast', 142300, 3, 11, '2w ago', 0], ['Acoustic Mornings', 88600, 2, 8, '3w ago', 0], ['Snowfall Focus', 51200, 0, 17, '1mo ago', 0]]
    }
  ];

  var PCOL = ['var(--groove-accent)', 'var(--groove-cyan)', 'var(--groove-peri)', 'var(--groove-warn)'];
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function curve(kind, base, n, r, relDay) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var wk = (i % 7 === 5 || i % 7 === 6) ? 1.1 : 1, v;
      if (kind === 'launch') v = i < relDay ? base * .05 * (1 + i * .06) : base * (.62 + 1.5 * Math.exp(-(i - relDay) / 4.2));
      else if (kind === 'climb') v = base * Math.exp(i * .072) * (i >= 18 ? 1.3 : 1);
      else v = base * (1 - i * .005);
      out.push(Math.round(v * wk * (1 + (r() - .5) * .1)));
    }
    return out;
  }
  function heatVal(kind, d, h) {
    var g = function (c, w) { var x = Math.min(Math.abs(h - c), 24 - Math.abs(h - c)); return Math.exp(-x * x / (2 * w * w)); };
    var we = d >= 5, v;
    if (kind === 'commute') v = .15 + .75 * g(8, 1.4) * (we ? .35 : 1) + .9 * g(18, 1.8) * (we ? .5 : 1) + (we ? .55 * g(14, 3) : .2 * g(13, 2));
    else if (kind === 'late') v = .1 + .95 * g(23.5, 2.2) * (d === 4 || d === 5 ? 1.15 : .85) + .25 * g(17, 3);
    else v = .12 + .9 * g(21, 2.3) * (d === 4 ? 1.2 : 1) + .3 * g(9, 1.6) * (we ? .4 : 1) + (we ? .45 * g(15, 3) : 0);
    return v;
  }

  function build(R, i) {
    var r = rng(R.seed || (i + 1) * 17);
    R = Object.assign({ kind: 'Release', released: '', relDay: null, curve: 'steady', base: 20000, label: ['#3B5BFF', '#22C3EE'], palette: ['#22C3EE', '#8FA3FF', '#3B9BFF', '#7BE0FF'],
      listeners: 0, saves: 0, deltas: [0, 0, 0, 0], platforms: [['Spotify', 1]], ages: [], cities: [], playlists: [] }, R);
    var tracks = R.tracks.map(function (t, k) { return { name: t[0], len: t[1], sec: toSec(t[1]), streams: t[2], save: t[3] || 0, color: R.palette[k % R.palette.length] }; });
    var days = R.days || curve(R.curve, R.base, 30, r, R.relDay);
    var prev = R.prev || curve(R.curve === 'climb' ? 'steady' : R.curve, R.base * (R.prevScale || .7), 30, r, R.relDay);
    var s30 = sum(days), heat = [], hm = 0;
    for (var d = 0; d < 7; d++) for (var h = 0; h < 24; h++) { var v = R.heatmap ? R.heatmap[d * 24 + h] : heatVal(R.heat || 'evening', d, h) * (1 + (r() - .5) * .22); heat.push(v); hm = Math.max(hm, v); }
    heat = heat.map(function (v) { return v / hm; });
    var sp = function (b, v, up) { var a = [], x = b; for (var k = 0; k < 12; k++) { x = x * (1 + (r() - .5 + up) * v); a.push(x); } return a; };
    var tl = sp(100, .1, R.deltas[1] / 400), ts = sp(100, .1, R.deltas[2] / 400);
    var sd = []; for (var k = 0; k < 12; k++) sd.push(sum(days.slice(Math.floor(k * 2.5), Math.floor(k * 2.5) + 3)));
    return {
      raw: R, name: R.name, kind: R.kind, released: R.released, relDay: R.relDay, label: R.label, tracks: tracks,
      total: sum(tracks.map(function (t) { return t.streams; })), runtime: sum(tracks.map(function (t) { return t.sec; })),
      days: days, prev: prev, streams30: s30, listeners: R.listeners, saves: R.saves, royalties: R.royalties || s30 * (R.rate || .0036),
      deltas: R.deltas, sparks: [sd, tl, ts, sd], heat: heat, platforms: R.platforms, ages: R.ages, cities: R.cities, playlists: R.playlists
    };
  }

  var I = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12H5M19 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'
  };
  function icon(n) { return '<svg class="gr-ico" viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }

  /* ---------- turntable geometry (viewBox 380 x 320) ---------- */
  var G = { cx: 160, cy: 160, plat: 148, vinyl: 140, out: 134, inn: 52, lab: 44, px: 338, py: 52, gap: 2.4 };
  G.nx = 176 + 24 * Math.cos(24 * Math.PI / 180); G.ny = 24 * Math.sin(24 * Math.PI / 180);
  G.ln = Math.hypot(G.nx, G.ny); G.alpha = Math.atan2(G.ny, G.nx);
  G.d = Math.hypot(G.cx - G.px, G.cy - G.py); G.beta = Math.atan2(G.cy - G.py, G.cx - G.px);
  G.rest = 86 * Math.PI / 180;
  function armFor(r) { var phi = Math.acos(clamp((G.d * G.d + G.ln * G.ln - r * r) / (2 * G.d * G.ln), -1, 1)); return G.beta - phi - G.alpha; }
  function needleAt(th) { var a = th + G.alpha; return [G.px + G.ln * Math.cos(a), G.py + G.ln * Math.sin(a)]; }

  function mount(root, opts) {
    if (!root) throw new Error('Groove.mount: element not found');
    if (root.__groove) root.__groove.destroy();
    opts = opts || {};
    var o = {
      start: opts.start || 0, duration: opts.duration || 3400, rpm: opts.rpm || 45, endDate: opts.endDate || [2026, 10, 23],
      onPlay: opts.onPlay || null, theme: opts.theme || null
    };
    var data = (opts.data || DATA).map(build);
    var $ = function (s) { return root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    var offs = [];
    function on(n, ev, fn, op) { if (!n) return; n.addEventListener(ev, fn, op); offs.push(function () { n.removeEventListener(ev, fn, op); }); }
    if (o.theme) root.setAttribute('data-theme', o.theme);

    /* animation engine: one rAF loop for everything */
    var jobs = [], running = false, last = 0, rafId = 0;
    function loop() {
      var t = now(), dt = Math.min(64, t - last); last = t;
      spinStep(dt);
      for (var i = jobs.length - 1; i >= 0; i--) { var j = jobs[i]; if (t < j.at) continue; if (j.fn(t - j.at) === false) jobs.splice(jobs.indexOf(j), 1); }
      if (jobs.length || spin.speed > .0004 || spin.target > 0) rafId = global.requestAnimationFrame(loop); else running = false;
    }
    function kick() { if (!running) { running = true; last = now(); rafId = global.requestAnimationFrame(loop); } }
    function add(fn, delay) { var j = { fn: fn, at: now() + (delay || 0) }; jobs.push(j); kick(); return j; }
    function tween(dur, fn, delay, ease) { ease = ease || easeOut; return add(function (e) { var p = clamp(e / dur, 0, 1); fn(ease(p), p); if (p >= 1) return false; }, delay); }
    function cancel(j) { var i = jobs.indexOf(j); if (i > -1) jobs.splice(i, 1); }

    /* ---------- top bar ---------- */
    var seg = $('.gr-seg'), thumb = $('.gr-seg-thumb');
    $$('.gr-seg button').forEach(function (b) { b.remove(); });
    data.forEach(function (R, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = R.name; b.setAttribute('data-release', i); b.setAttribute('aria-pressed', 'false');
      seg.appendChild(b); on(b, 'click', function () { setRelease(i); });
    });
    function placeThumb() { var b = seg.querySelectorAll('button')[cur]; if (!b || !thumb) return; thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    var themeBtn = $('[data-gr="theme"]');
    function setTheme(t) { root.setAttribute('data-theme', t); if (themeBtn) { themeBtn.innerHTML = icon(t === 'light' ? 'moon' : 'sun'); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); } paintChart(); }
    setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    on($('[data-gr="play"]'), 'click', function () { play(); });
    on($('[data-gr="menu"]'), 'click', function () { root.classList.toggle('nav-open'); });
    on($('.gr-scrim'), 'click', function () { root.classList.remove('nav-open'); });

    /* ---------- turntable ---------- */
    var svg = $('.gr-tt'), ttWrap = $('.gr-tt-wrap'), ttTip = ttWrap.querySelector('.gr-tip');
    svg.innerHTML = '';
    var defs = el('defs', {}, svg);
    var uid = 'gr' + Math.floor(Math.random() * 1e6);
    defs.innerHTML = '<radialGradient id="' + uid + 'v" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#1c1e27"/><stop offset=".55" stop-color="#101117"/><stop offset="1" stop-color="#07080b"/></radialGradient>' +
      '<linearGradient id="' + uid + 's" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".13"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + uid + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3B5BFF" data-l="0"/><stop offset="1" stop-color="#22C3EE" data-l="1"/></linearGradient>' +
      '<filter id="' + uid + 'b" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="' + uid + 'g" x="-.2" y="-.2" width="1.4" height="1.4"><feGaussianBlur stdDeviation="1.6"/></filter>';
    el('rect', { x: 4, y: 4, width: 372, height: 312, rx: 20, class: 'gr-plinth' }, svg);
    el('rect', { x: 5.5, y: 5.5, width: 369, height: 309, rx: 18.5, class: 'gr-plinth-in' }, svg);
    el('circle', { cx: G.cx, cy: G.cy, r: G.plat, class: 'gr-platter' }, svg);
    el('circle', { cx: G.cx, cy: G.cy, r: G.plat - 4, class: 'gr-platter-dots' }, svg);
    el('circle', { cx: G.cx, cy: G.cy, r: G.vinyl, class: 'gr-vinyl', fill: 'url(#' + uid + 'v)' }, svg);
    var rings = el('g', { class: 'gr-rings' }, svg);
    for (var rr = G.inn + 1; rr < G.vinyl - 1; rr += 2.3) el('circle', { cx: G.cx, cy: G.cy, r: rr.toFixed(1) }, rings);
    var bandG = el('g', {}, svg), gapG = el('g', {}, svg);
    var spinG = el('g', {}, svg), ghostG = el('g', {}, spinG), arcG = el('g', {}, spinG), labelG = el('g', {}, spinG);
    var labC = el('circle', { cx: G.cx, cy: G.cy, r: G.lab, fill: 'url(#' + uid + 'l)' }, labelG);
    el('circle', { cx: G.cx, cy: G.cy, r: G.lab - 3, fill: 'none', stroke: 'rgba(255,255,255,.18)', 'stroke-width': .8 }, labelG);
    var labT = el('text', { x: G.cx, y: G.cy - 12, 'text-anchor': 'middle', class: 'gr-label-t' }, labelG);
    var labS = el('text', { x: G.cx, y: G.cy + 20, 'text-anchor': 'middle', class: 'gr-label-s' }, labelG);
    el('circle', { cx: G.cx + 27, cy: G.cy + 8, r: 2.2, fill: 'rgba(255,255,255,.75)' }, labelG);
    el('circle', { cx: G.cx, cy: G.cy, r: 4.2, class: 'gr-spindle' }, svg);
    var sheen = el('g', { 'pointer-events': 'none' }, svg);
    [[-58, 34], [122, 26]].forEach(function (w) {
      var R = G.vinyl - 1, p = el('path', { fill: 'url(#' + uid + 's)', opacity: .9 }, sheen);
      p.setAttribute('transform', 'rotate(' + w[0] + ' ' + G.cx + ' ' + G.cy + ')');
      p.setAttribute('d', 'M' + G.cx + ' ' + G.cy + 'L' + (G.cx + R * Math.cos(-w[1] / 2 * Math.PI / 180)).toFixed(1) + ' ' + (G.cy + R * Math.sin(-w[1] / 2 * Math.PI / 180)).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (G.cx + R * Math.cos(w[1] / 2 * Math.PI / 180)).toFixed(1) + ' ' + (G.cy + R * Math.sin(w[1] / 2 * Math.PI / 180)).toFixed(1) + 'Z');
    });
    el('circle', { cx: G.cx, cy: G.cy, r: G.lab, fill: 'none', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1.2 }, sheen);
    var hitG = el('g', {}, svg);
    var scan = el('circle', { cx: G.cx, cy: G.cy, r: G.out, class: 'gr-scan' }, svg);
    var fxG = el('g', { 'pointer-events': 'none' }, svg);
    var glow = el('circle', { r: 9, fill: '#22C3EE', opacity: 0, filter: 'url(#' + uid + 'b)' }, fxG);
    var waves = [0, 1, 2, 3].map(function () { return { n: el('circle', { r: 0, class: 'gr-wave', opacity: 0 }, fxG), t: -1 }; });
    var tipDot = el('circle', { r: 1.8, class: 'gr-tip-dot', opacity: 0 }, fxG);
    // controls
    el('circle', { cx: 302, cy: 290, r: 10, class: 'gr-knob' }, svg);
    el('circle', { cx: 302, cy: 283.5, r: 1.6, class: 'gr-knob-dot' }, svg);
    el('circle', { cx: 330, cy: 290, r: 10, class: 'gr-knob' }, svg);
    el('circle', { cx: 325, cy: 285, r: 1.6, class: 'gr-knob-dot' }, svg);
    el('circle', { cx: 355, cy: 290, r: 2.6, class: 'gr-led' }, svg);
    el('circle', { cx: 32, cy: 292, r: 2.6, class: 'gr-led' }, svg);
    var restP = [G.px + 150 * Math.cos(G.rest), G.py + 150 * Math.sin(G.rest)];
    el('circle', { cx: restP[0].toFixed(1), cy: restP[1].toFixed(1), r: 6.5, class: 'gr-rest' }, svg);
    // tonearm (drawn pointing along +x from the pivot, rotated as a group)
    var shadowG = el('g', { opacity: .3, filter: 'url(#' + uid + 'g)' }, svg);
    var shadowArm = el('g', {}, shadowG);
    el('path', { d: 'M-30 0H176L' + G.nx.toFixed(1) + ' ' + G.ny.toFixed(1), class: 'gr-arm-shadow' }, shadowArm);
    el('circle', { cx: G.px, cy: G.py, r: 21, class: 'gr-arm-base' }, svg);
    var armG = el('g', {}, svg);
    el('rect', { x: -40, y: -8.5, width: 20, height: 17, rx: 4, class: 'gr-arm-weight' }, armG);
    el('path', { d: 'M-20 0H176', class: 'gr-arm-tube' }, armG);
    el('path', { d: 'M-18 -1.2H172', class: 'gr-arm-hl' }, armG);
    var head = el('g', { transform: 'translate(176 0) rotate(24)' }, armG);
    el('rect', { x: -3, y: -6, width: 30, height: 12, rx: 3, class: 'gr-arm-head' }, head);
    el('path', { d: 'M4 -6v-4', class: 'gr-arm-tube', style: 'stroke-width:2' }, head);
    el('circle', { cx: 0, cy: 0, r: 7.5, class: 'gr-arm-ring' }, armG);
    el('circle', { cx: 0, cy: 0, r: 3, fill: 'var(--groove-plinth-2)' }, armG);

    var spin = { angle: 0, speed: 0, target: 0 };
    function spinStep(dt) {
      var k = spin.target > spin.speed ? 380 : 650;
      spin.speed += (spin.target - spin.speed) * clamp(dt / k, 0, 1);
      if (spin.target === 0 && spin.speed < .0004) spin.speed = 0;
      spin.angle = (spin.angle + spin.speed * dt) % 360;
      spinG.setAttribute('transform', 'rotate(' + spin.angle.toFixed(2) + ' ' + G.cx + ' ' + G.cy + ')');
    }
    var arm = { th: G.rest, lift: 1 };
    function setArm(th, lift) {
      arm.th = th; arm.lift = lift;
      var deg = (th * 180 / Math.PI).toFixed(2);
      armG.setAttribute('transform', 'translate(' + G.px + ' ' + G.py + ') rotate(' + deg + ')');
      var off = 3 + lift * 7;
      shadowArm.setAttribute('transform', 'translate(' + (G.px + off) + ' ' + (G.py + off * 1.4) + ') rotate(' + deg + ')');
      shadowG.setAttribute('opacity', (.42 - lift * .2).toFixed(2));
    }
    setArm(G.rest, 1);

    /* ---------- state ---------- */
    var cur = -1, R = null, bands = [], run = null, runJob = null, lastWave = 0;
    var trackList = $('[data-gr="tracks"]'), live = $('[data-gr="live"]');
    var stat = {
      streams: $('[data-stat="streams"] b'), played: $('[data-stat="played"] b'), dots: $('[data-stat="played"] .gr-dots'),
      time: $('[data-stat="time"] b'), top: $('[data-stat="top"] b')
    };

    function layoutBands(R) {
      var n = R.tracks.length, W = G.out - G.inn - G.gap * (n - 1), rOut = G.out;
      return R.tracks.map(function (t, k) {
        var w = W * t.sec / R.runtime, b = { k: k, t: t, rOut: rOut, rIn: rOut - w, w: w, mid: rOut - w / 2 };
        rOut = b.rIn - G.gap; return b;
      });
    }
    function buildDeck(R, fadeOld) {
      // old arcs keep spinning while they fade out
      if (fadeOld) {
        Array.prototype.slice.call(arcG.childNodes).forEach(function (n) { ghostG.appendChild(n); });
        var gh = Array.prototype.slice.call(ghostG.childNodes);
        tween(380, function (q) { gh.forEach(function (n) { n.style.opacity = 1 - q; }); if (q >= 1) gh.forEach(function (n) { n.remove(); }); }, 0, function (x) { return x; });
        var oldB = Array.prototype.slice.call(bandG.childNodes);
        tween(300, function (q) { oldB.forEach(function (n) { n.style.opacity = 1 - q; }); if (q >= 1) oldB.forEach(function (n) { n.remove(); }); });
      } else { arcG.innerHTML = ''; bandG.innerHTML = ''; }
      gapG.innerHTML = ''; hitG.innerHTML = '';
      bands = layoutBands(R);
      var maxS = Math.max.apply(null, R.tracks.map(function (t) { return t.streams; }));
      bands.forEach(function (b, k) {
        b.fill = el('circle', { cx: G.cx, cy: G.cy, r: b.mid.toFixed(2), class: 'gr-band', stroke: b.t.color, 'stroke-width': b.w.toFixed(2) }, bandG);
        b.C = 2 * Math.PI * b.mid;
        b.target = (34 + 300 * b.t.streams / maxS) / 360 * b.C;
        b.arc = el('circle', { cx: G.cx, cy: G.cy, r: b.mid.toFixed(2), class: 'gr-arc', stroke: b.t.color, 'stroke-width': Math.max(2.2, b.w * .42).toFixed(2), 'stroke-dasharray': '0 ' + b.C.toFixed(1), opacity: 0 }, arcG);
        b.halo = el('circle', { cx: G.cx, cy: G.cy, r: b.mid.toFixed(2), class: 'gr-arc', stroke: b.t.color, 'stroke-width': (Math.max(2.2, b.w * .42) + 5).toFixed(2), 'stroke-dasharray': '0 ' + b.C.toFixed(1), opacity: 0, filter: 'url(#' + uid + 'g)' }, arcG);
        arcG.insertBefore(b.halo, b.arc);
        if (k > 0) el('circle', { cx: G.cx, cy: G.cy, r: (b.rOut + G.gap / 2).toFixed(2), class: 'gr-gap' }, gapG);
        b.hit = el('circle', { cx: G.cx, cy: G.cy, r: b.mid.toFixed(2), class: 'gr-band-hit', 'stroke-width': (b.w + G.gap).toFixed(2), tabindex: 0, role: 'button', 'aria-label': 'Track ' + (k + 1) + ': ' + b.t.name + ', ' + fmt(b.t.streams) + ' streams' }, hitG);
        b.hit.addEventListener('pointerenter', function (e) { showTip(b, e); });
        b.hit.addEventListener('pointermove', function (e) { showTip(b, e); });
        b.hit.addEventListener('pointerleave', hideTip);
        b.hit.addEventListener('focus', function () { showTip(b); });
        b.hit.addEventListener('blur', hideTip);
        b.hit.addEventListener('click', function () { spotlight(k); });
        b.hit.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spotlight(k); } });
        b.s = { lit: 0, len: 0, start: 0, streams: 0, done: false };
      });
      // label
      var stops = defs.querySelectorAll('[data-l]'); stops[0].setAttribute('stop-color', R.label[0]); stops[1].setAttribute('stop-color', R.label[1]);
      labT.textContent = R.name.toUpperCase();
      labS.textContent = R.kind.toUpperCase() + ' · ' + o.rpm + ' RPM';
      var ls = labT.getComputedTextLength ? labT.getComputedTextLength() : 0; if (ls > 72) labT.setAttribute('textLength', 72); else labT.removeAttribute('textLength');
      // tracklist
      trackList.innerHTML = R.tracks.map(function (t, k) {
        return '<li><button type="button" class="gr-track" data-track="' + k + '" style="--c:' + t.color + ';animation:gr-in .45s ' + (k * 40) + 'ms cubic-bezier(.2,.9,.2,1) both"><span class="gr-track-n"><span>' + (k + 1) + '</span><span class="gr-eq" aria-hidden="true"><i></i><i></i><i></i></span></span>' +
          '<span class="gr-track-name"><b>' + esc(t.name) + '</b><small>' + esc(t.len) + ' · ' + Math.round(t.save * 100) + '% save rate</small></span><span class="gr-track-v gr-num" data-tv>0</span><span class="gr-track-bar"><i></i></span></button></li>';
      }).join('');
      bands.forEach(function (b, k) {
        b.row = trackList.querySelector('[data-track="' + k + '"]'); b.val = b.row.querySelector('[data-tv]'); b.bar = b.row.querySelector('.gr-track-bar i');
        b.row.addEventListener('click', function () { spotlight(k); });
        b.row.addEventListener('pointerenter', function () { b.row.classList.add('is-spot'); });
        b.row.addEventListener('pointerleave', function () { b.row.classList.remove('is-spot'); });
      });
      stat.dots.innerHTML = R.tracks.map(function () { return '<i></i>'; }).join('');
      $('[data-gr="decktitle"]').textContent = R.name + ' · ' + R.tracks.length + (R.tracks.length === 1 ? ' track' : ' tracks');
      svg.setAttribute('aria-label', 'Turntable: ' + R.name + ', one groove per track');
    }
    function showTip(b, e) {
      var wr = ttWrap.getBoundingClientRect(), x, y;
      if (e && e.clientX != null) { x = e.clientX - wr.left; y = e.clientY - wr.top; }
      else { var sr = svg.getBoundingClientRect(), s = sr.width / 380; x = sr.left - wr.left + G.cx * s; y = sr.top - wr.top + (G.cy - b.mid) * s; }
      ttTip.innerHTML = '<b>' + (b.k + 1) + '. ' + esc(b.t.name) + '</b><span>Length<em>' + esc(b.t.len) + '</em></span><span>Streams<em>' + fmt(b.t.streams) + '</em></span><span>Save rate<em>' + Math.round(b.t.save * 100) + '%</em></span>';
      ttTip.style.left = clamp(x, 80, wr.width - 80) + 'px'; ttTip.style.top = Math.max(y, 70) + 'px'; ttTip.classList.add('on');
      bands.forEach(function (o2) { o2.row.classList.toggle('is-spot', o2 === b); });
    }
    function hideTip() { ttTip.classList.remove('on'); bands.forEach(function (b) { b.row.classList.remove('is-spot'); }); }

    function spotlight(k) {
      var b = bands[k]; if (!b) return;
      b.row.classList.add('is-spot'); setTimeout(function () { b.row.classList.remove('is-spot'); }, 1400);
      var base = b.s.lit;
      tween(1100, function (q) { b.fill.style.opacity = (base * .16 + Math.sin(q * Math.PI) * .32).toFixed(3); b.halo.setAttribute('opacity', (b.s.lit * .5 + Math.sin(q * Math.PI) * .5).toFixed(2)); }, 0, function (x) { return x; });
    }

    function bandAt(r) { for (var i = 0; i < bands.length; i++) if (r <= bands[i].rOut && r >= bands[i].rIn) return i; return -1; }
    function needleDeg() { var p = needleAt(arm.th); return Math.atan2(p[1] - G.cy, p[0] - G.cx) * 180 / Math.PI; }
    function setArc(b) {
      var len = b.s.len;
      b.arc.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + b.C.toFixed(1));
      b.halo.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + b.C.toFixed(1));
      var tr = 'rotate(' + b.s.start.toFixed(2) + ' ' + G.cx + ' ' + G.cy + ')';
      b.arc.setAttribute('transform', tr); b.halo.setAttribute('transform', tr);
    }

    /* the play run: drop → read every groove → lift */
    var A = 650, LIFT = 900, HOLD = 320;
    function play(instant) {
      if (!R) return;
      if (runJob) cancel(runJob);
      var D = o.duration, th0 = arm.th, thOut = armFor(G.out + 1), thIn = armFor(G.inn - 1);
      bands.forEach(function (b) { b.s = { lit: 0, len: 0, start: 0, streams: 0, done: false, entered: false }; b.fill.style.opacity = 0; b.arc.setAttribute('opacity', 0); b.halo.setAttribute('opacity', 0); b.row.classList.remove('is-now', 'is-done'); b.val.textContent = '0'; b.bar.style.width = '0'; setArc(b); });
      Array.prototype.forEach.call(stat.dots.children, function (d) { d.style.background = ''; });
      run = { lead: -1 };
      if (instant || reduced()) { finishAll(); return; }
      root.classList.add('is-playing'); live.className = 'gr-live is-on'; live.textContent = 'Playing';
      spin.target = o.rpm * 6 / 1000 * .9;
      kick();
      var maxS = Math.max.apply(null, R.tracks.map(function (t) { return t.streams; }));
      runJob = add(function (e) {
        var r = null;
        if (e < A) { var p = e / A; setArm(lerp(th0, thOut, backOut(p)), 1 - easeOut(p) * .9); }
        else if (e < A + D) {
          var q = (e - A) / D; r = lerp(G.out, G.inn, q);
          setArm(armFor(r), .1);
        } else if (e < A + D + HOLD) { setArm(thIn, .1); }
        else if (e < A + D + HOLD + LIFT) { var u = (e - A - D - HOLD) / LIFT; setArm(lerp(thIn, G.rest, easeInOut(u)), .1 + easeOut(Math.min(1, u * 3)) * .9); if (spin.target) spin.target = 0; }
        else { setArm(G.rest, 1); finishRun(); return false; }
        readGrooves(r, e, maxS);
        return true;
      });
    }
    function readGrooves(r, e, maxS) {
      var np = needleAt(arm.th), nd = needleDeg(), k = r == null ? -1 : bandAt(r), t = now();
      var reading = r != null;
      scan.setAttribute('r', (r || G.inn).toFixed(2)); scan.setAttribute('opacity', reading ? .16 : 0);
      tipDot.setAttribute('cx', np[0].toFixed(1)); tipDot.setAttribute('cy', np[1].toFixed(1)); tipDot.setAttribute('opacity', reading ? .95 : 0);
      glow.setAttribute('cx', np[0].toFixed(1)); glow.setAttribute('cy', np[1].toFixed(1));
      glow.setAttribute('opacity', reading && k > -1 ? .85 : reading ? .35 : 0);
      if (k > -1) glow.setAttribute('fill', bands[k].t.color);
      if (reading && k > -1 && t - lastWave > 260) {
        lastWave = t; var w = waves.filter(function (x) { return x.t < 0; })[0] || waves[0];
        w.t = t; w.x = np[0]; w.y = np[1]; w.n.setAttribute('stroke', bands[k].t.color);
      }
      waves.forEach(function (w) {
        if (w.t < 0) return; var p = (t - w.t) / 720;
        if (p >= 1) { w.t = -1; w.n.setAttribute('opacity', 0); return; }
        w.n.setAttribute('cx', w.x.toFixed(1)); w.n.setAttribute('cy', w.y.toFixed(1)); w.n.setAttribute('r', (3 + easeOut(p) * 20).toFixed(1)); w.n.setAttribute('opacity', ((1 - p) * .85).toFixed(2));
      });
      var playedN = 0, counted = 0, timeS = 0, cum = 0;
      bands.forEach(function (b, i) {
        var s = b.s;
        if (reading && r <= b.rOut && !s.entered) { s.entered = true; s.t0 = t; b.row.classList.add('is-now'); }
        if (s.entered && !s.done) {
          var span = Math.max(1, (b.w + G.gap) / (G.out - G.inn) * o.duration), pr = clamp((t - s.t0) / span, 0, 1);
          s.lit = easeOut(Math.min(1, pr * 2.5)); s.len = b.target * easeOut(pr); s.streams = b.t.streams * easeOut(pr);
          s.start = nd - spin.angle;
          b.fill.style.opacity = (s.lit * .16).toFixed(3); b.arc.setAttribute('opacity', .95); b.halo.setAttribute('opacity', (s.lit * .55).toFixed(2));
          setArc(b);
          b.val.textContent = compact(s.streams); b.bar.style.width = (s.streams / maxS * 100).toFixed(1) + '%';
          if (pr >= 1 || (reading && r < b.rIn - G.gap) || !reading) {
            s.done = true; s.len = b.target; s.streams = b.t.streams; setArc(b);
            b.val.textContent = compact(b.t.streams); b.bar.style.width = (b.t.streams / maxS * 100).toFixed(1) + '%';
            b.row.classList.remove('is-now'); b.row.classList.add('is-done');
            if (stat.dots.children[i]) stat.dots.children[i].style.background = b.t.color;
            if (run.lead < 0 || b.t.streams > R.tracks[run.lead].streams) { run.lead = i; stat.top.textContent = b.t.name; }
          }
        }
        if (s.done) playedN++;
        counted += s.streams;
        if (s.entered) timeS = cum + b.t.sec * (s.done ? 1 : clamp((b.rOut - (r == null ? b.rIn : r)) / b.w, 0, 1));
        cum += b.t.sec;
      });
      stat.streams.innerHTML = compact(counted, true);
      stat.played.innerHTML = playedN + '<small> / ' + bands.length + '</small>';
      stat.time.innerHTML = secs(timeS) + '<small> / ' + secs(R.runtime) + '</small>';
    }
    function finishAll() {
      var maxS = Math.max.apply(null, R.tracks.map(function (t) { return t.streams; }));
      bands.forEach(function (b, i) {
        b.s = { lit: 1, len: b.target, start: -90 + i * 47, streams: b.t.streams, done: true, entered: true };
        b.fill.style.opacity = .16; b.arc.setAttribute('opacity', .95); b.halo.setAttribute('opacity', .45); setArc(b);
        b.val.textContent = compact(b.t.streams); b.bar.style.width = (b.t.streams / maxS * 100).toFixed(1) + '%'; b.row.classList.add('is-done');
        if (stat.dots.children[i]) stat.dots.children[i].style.background = b.t.color;
      });
      var top = R.tracks.reduce(function (a, t, i) { return t.streams > R.tracks[a].streams ? i : a; }, 0);
      stat.streams.innerHTML = compact(R.total, true); stat.played.innerHTML = bands.length + '<small> / ' + bands.length + '</small>';
      stat.time.innerHTML = secs(R.runtime) + '<small> / ' + secs(R.runtime) + '</small>'; stat.top.textContent = R.tracks[top].name;
      setArm(G.rest, 1); spin.target = 0; spin.speed = 0; scan.setAttribute('opacity', 0); glow.setAttribute('opacity', 0); tipDot.setAttribute('opacity', 0);
      live.className = 'gr-live is-done'; live.textContent = 'Played'; root.classList.remove('is-playing');
      notify();
    }
    function finishRun() {
      runJob = null; root.classList.remove('is-playing'); live.className = 'gr-live is-done'; live.textContent = 'Played';
      scan.setAttribute('opacity', 0); glow.setAttribute('opacity', 0); tipDot.setAttribute('opacity', 0);
      // a light runs around every ring, outside in
      bands.forEach(function (b, i) { tween(700, function (q) { b.halo.setAttribute('opacity', (.45 + Math.sin(q * Math.PI) * .55).toFixed(2)); }, i * 70, function (x) { return x; }); });
      notify();
    }
    function notify() {
      if (!o.onPlay) return;
      var top = R.tracks.reduce(function (a, t, i) { return t.streams > R.tracks[a].streams ? i : a; }, 0);
      try { o.onPlay({ release: cur, name: R.name, tracks: R.tracks.length, streams: R.total, top: R.tracks[top].name }); } catch (e) { }
    }

    /* ---------- KPIs ---------- */
    var shown = { k: [0, 0, 0, 0] };
    var KF = [function (v) { return compact(v, true); }, function (v) { return compact(v, true); }, function (v) { return compact(v, true); }, function (v) { return '$' + fmt(v); }];
    function kpis(R, instant) {
      var to = [R.streams30, R.listeners, R.saves, R.royalties], from = shown.k.slice();
      var subs = ['vs prior 30d', 'vs October', fmt(R.saves / R.listeners * 100) + '% save', '$3.60 / 1K'];
      [0, 1, 2, 3].forEach(function (k) {
        var d = R.deltas[k], de = $('[data-delta="' + k + '"]'); if (de) { de.textContent = (d >= 0 ? '+' : '') + d.toFixed(1) + '%'; de.className = 'gr-delta ' + (d >= 0 ? 'up' : 'down'); }
        var s = $('[data-kpi-sub="' + k + '"]'); if (s) s.textContent = subs[k];
      });
      tween(instant || reduced() ? 1 : 1000, function (p) {
        [0, 1, 2, 3].forEach(function (k) { var v = lerp(from[k], to[k], p); shown.k[k] = v; var n = $('[data-kpi="' + k + '"]'); if (n) n.innerHTML = KF[k](v); });
      });
      morphSparks(R, instant);
      var pay = R.royalties * .82, th = 10000;
      var pe = $('[data-gr="pay"]'), pb = $('[data-gr="paybar"]'), ps = $('[data-gr="paysub"]');
      if (pe) pe.textContent = '$' + fmt(pay); if (pb) pb.style.width = clamp(pay / th * 100, 4, 100) + '%'; if (ps) ps.textContent = 'Pays out Dec 15 · after distributor fee';
    }
    function sparkPts(a, w, hh) { var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), r = mx - mn || 1; return a.map(function (v, i) { return [i / (a.length - 1) * w, hh - 3 - (v - mn) / r * (hh - 6)]; }); }
    function morphSparks(R, instant) {
      var to = R.sparks.map(function (s) { return sparkPts(s, 92, 30); }), from = shown.sp || to.map(function (s) { return s.map(function (p) { return [p[0], 27]; }); });
      tween(instant || reduced() ? 1 : 900, function (p) {
        to.forEach(function (s, k) {
          var pts = s.map(function (q, i) { return [q[0], lerp(from[k][i][1], q[1], clamp(p * 1.6 - i / 22, 0, 1))]; });
          var l = $('[data-spark="' + k + '"]'), a = $('[data-sparka="' + k + '"]'), d = smooth(pts);
          if (l) l.setAttribute('d', d); if (a) a.setAttribute('d', d + 'L92 30L0 30Z');
          if (p >= 1) shown.sp = to;
        });
      });
    }

    /* ---------- platforms donut + ages ---------- */
    var dsvg = $('.gr-donut svg'), segs = [0, 1, 2, 3].map(function (k) { return el('circle', { cx: 85, cy: 85, r: 68, class: 'gr-donut-seg', 'stroke-width': 16, stroke: PCOL[k], 'stroke-dasharray': '0 999' }, dsvg); });
    var DC = 2 * Math.PI * 68;
    function donut(R, instant) {
      var to = R.platforms.map(function (p) { return p[1]; }), from = shown.d || to.map(function () { return 0; });
      var ul = $('[data-gr="dlegend"]');
      if (ul) ul.innerHTML = R.platforms.map(function (p, k) { return '<li><i style="background:' + PCOL[k] + '"></i>' + esc(p[0]) + '<b class="gr-num">' + Math.round(p[1] * 100) + '%</b></li>'; }).join('');
      var tot = $('[data-gr="dtotal"]'), f0 = shown.dt || 0;
      tween(instant || reduced() ? 1 : 1100, function (p) {
        var acc = 0;
        to.forEach(function (v, k) {
          var cv = lerp(from[k], v, p), len = Math.max(0, cv * DC - 3);
          segs[k].setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + DC.toFixed(2)); segs[k].setAttribute('stroke-dashoffset', (-acc * DC).toFixed(2)); acc += cv;
        });
        if (tot) tot.innerHTML = compact(lerp(f0, R.listeners, p));
        if (p >= 1) { shown.d = to; shown.dt = R.listeners; }
      });
      var ag = $('[data-gr="ages"]');
      if (ag) {
        var mx = Math.max.apply(null, R.ages.map(function (a) { return a[1]; }));
        if (!ag.children.length) ag.innerHTML = R.ages.map(function (a) { return '<div class="gr-age"><span>' + esc(a[0]) + '</span><div><i></i></div><b class="gr-num"></b></div>'; }).join('');
        R.ages.forEach(function (a, k) {
          var row = ag.children[k]; if (!row) return;
          row.querySelector('span').textContent = a[0]; row.querySelector('b').textContent = Math.round(a[1] * 100) + '%';
          var bar = row.querySelector('i'); bar.style.transition = 'width .9s ' + (k * 80) + 'ms cubic-bezier(.2,.9,.2,1)';
          global.requestAnimationFrame(function () { bar.style.width = (a[1] / mx * 100).toFixed(1) + '%'; });
        });
        var sub = $('[data-gr="agesub"]'); if (sub) { var top = R.ages.reduce(function (x, a) { return a[1] > x[1] ? a : x; }); sub.textContent = 'Most listeners ' + top[0]; }
      }
    }

    /* ---------- daily streams chart ---------- */
    var cwrap = $('.gr-schart'), csvg = cwrap.querySelector('svg'), ctip = cwrap.querySelector('.gr-tip');
    var dates = []; (function () { var e = o.endDate; for (var i = 29; i >= 0; i--) { var d = new Date(e[0], e[1], e[2] - i); dates.push(MON[d.getMonth()] + ' ' + d.getDate()); } })();
    var chartJob = null;
    function drawChart(R, instant) {
      var tv = R.days, tp = R.prev, fv = shown.v || tv.map(function () { return 0; }), fp = shown.p || tp.map(function () { return 0; });
      var fmx = shown.mx || Math.max.apply(null, tv.concat(tp)), tmx = Math.max.apply(null, tv.concat(tp));
      if (chartJob) cancel(chartJob);
      shown.rel = R.relDay;
      var dur = instant || reduced() ? 1 : 1300;
      chartJob = add(function (e) {
        var p = clamp(e / dur, 0, 1);
        shown.v = tv.map(function (v, i) { return lerp(fv[i], v, easeOut(clamp((e - i * 22) / 620, 0, 1))); });
        shown.p = tp.map(function (v, i) { return lerp(fp[i], v, easeOut(clamp((e - 120 - i * 22) / 620, 0, 1))); });
        shown.mx = lerp(fmx, tmx, easeOut(clamp(e / 500, 0, 1)));
        paintChart();
        if (e > 22 * 30 + 740 || dur === 1) { shown.v = tv.slice(); shown.p = tp.slice(); shown.mx = tmx; paintChart(); chartJob = null; return false; }
      });
    }
    function niceMax(v) { var m = Math.pow(10, Math.floor(Math.log10(v || 1))), n = v / m; return (n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : n <= 8 ? 8 : 10) * m; }
    var CH = {};
    function paintChart() {
      if (!csvg || !shown.v) return;
      var W = cwrap.clientWidth || 600, H = cwrap.clientHeight || 230, l = 40, r = 8, t = 10, b = 24, iw = W - l - r, ih = H - t - b;
      var mx = niceMax(shown.mx * 1.05);
      CH = { W: W, H: H, l: l, t: t, iw: iw, ih: ih, mx: mx };
      var X = function (i) { return l + i * iw / 29; }, Y = function (v) { return t + (1 - v / mx) * ih; };
      var h = '<defs><linearGradient id="' + uid + 'lg" x1="0" x2="1"><stop offset="0" stop-color="var(--groove-accent)"/><stop offset="1" stop-color="var(--groove-cyan)"/></linearGradient>' +
        '<linearGradient id="' + uid + 'ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--groove-cyan)" stop-opacity=".26"/><stop offset="1" stop-color="var(--groove-cyan)" stop-opacity="0"/></linearGradient></defs>';
      for (var g = 0; g <= 4; g++) { var gy = t + ih * g / 4; h += '<line class="gr-grid" x1="' + l + '" x2="' + (W - r) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/><text class="gr-axis" x="' + (l - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" text-anchor="end">' + compact(mx * (1 - g / 4)).replace('.0K', 'K') + '</text>'; }
      for (var i = 0; i < 30; i += (W < 420 ? 7 : 5)) h += '<text class="gr-axis" x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : 'middle') + '">' + dates[i] + '</text>';
      if (shown.rel != null) { var rx = X(shown.rel); h += '<line class="gr-mark" x1="' + rx.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y1="' + t + '" y2="' + (t + ih) + '"/><text class="gr-mark-t" x="' + (rx + 5).toFixed(1) + '" y="' + (t + 10) + '">Release day</text>'; }
      var pv = shown.v.map(function (v, i) { return [X(i), Y(v)]; }), pp = shown.p.map(function (v, i) { return [X(i), Y(v)]; });
      var dv = smooth(pv, t, t + ih);
      h += '<path class="gr-prev" d="' + smooth(pp, t, t + ih) + '"/>';
      h += '<path d="' + dv + 'L' + X(29).toFixed(1) + ' ' + (t + ih) + 'L' + l + ' ' + (t + ih) + 'Z" fill="url(#' + uid + 'ag)"/>';
      h += '<path d="' + dv + '" fill="none" stroke="url(#' + uid + 'lg)" stroke-width="2.4" stroke-linecap="round"/>';
      h += '<line class="gr-cross" x1="0" x2="0" y1="' + t + '" y2="' + (t + ih) + '" opacity="0"/><circle class="gr-cross-dot" r="4.5" opacity="0"/>';
      csvg.innerHTML = h;
    }
    function chartMove(e) {
      if (!CH.iw || !shown.v) return;
      var rc = csvg.getBoundingClientRect(), x = e.clientX - rc.left, i = clamp(Math.round((x - CH.l) / CH.iw * 29), 0, 29);
      var cx = CH.l + i * CH.iw / 29, cy = CH.t + (1 - shown.v[i] / CH.mx) * CH.ih;
      var cr = csvg.querySelector('.gr-cross'), cd = csvg.querySelector('.gr-cross-dot');
      if (cr) { cr.setAttribute('x1', cx); cr.setAttribute('x2', cx); cr.setAttribute('opacity', 1); }
      if (cd) { cd.setAttribute('cx', cx); cd.setAttribute('cy', cy); cd.setAttribute('opacity', 1); }
      ctip.innerHTML = '<b>' + dates[i] + (shown.rel === i ? ' · release day' : '') + '</b><span>This release<em>' + fmt(shown.v[i]) + '</em></span><span>Previous<em>' + fmt(shown.p[i]) + '</em></span>';
      ctip.style.left = clamp(cx, 76, CH.W - 76) + 'px'; ctip.style.top = Math.max(cy, 64) + 'px'; ctip.classList.add('on');
    }
    function chartLeave() { var cr = csvg.querySelector('.gr-cross'), cd = csvg.querySelector('.gr-cross-dot'); if (cr) cr.setAttribute('opacity', 0); if (cd) cd.setAttribute('opacity', 0); ctip.classList.remove('on'); }
    on(csvg, 'pointermove', chartMove); on(csvg, 'pointerleave', chartLeave);

    /* ---------- listening heatmap ---------- */
    var hsvg = $('.gr-heat'), cells = [];
    (function () {
      var cw = (330 - 28) / 24;
      DAYS.forEach(function (d, r) { el('text', { x: 0, y: r * 22 + 13.5, class: 'gr-heat-l' }, hsvg).textContent = d; });
      for (var r = 0; r < 7; r++) for (var c = 0; c < 24; c++) {
        var x = 28 + c * cw, y = r * 22;
        el('rect', { x: x.toFixed(2), y: y, width: (cw - 2).toFixed(2), height: 19, rx: 3, class: 'gr-cell-bg' }, hsvg);
        var n = el('rect', { x: x.toFixed(2), y: y, width: (cw - 2).toFixed(2), height: 19, rx: 3, class: 'gr-cell', opacity: 0 }, hsvg);
        cells.push({ n: n, r: r, c: c, cx: x + (cw - 2) / 2, cy: y + 9.5, v: 0 });
      }
      [[0, '12a'], [6, '6a'], [12, '12p'], [18, '6p'], [23, '11p']].forEach(function (h) { el('text', { x: (28 + h[0] * cw + (cw - 2) / 2).toFixed(1), y: 7 * 22 + 12, 'text-anchor': 'middle', class: 'gr-heat-l' }, hsvg).textContent = h[1]; });
    })();
    var hours = $('.gr-hours'), hbars = [];
    if (hours) for (var hb = 0; hb < 24; hb++) hbars.push({ n: el('rect', { x: (28 + hb * (330 - 28) / 24).toFixed(2), y: 64, width: ((330 - 28) / 24 - 2).toFixed(2), height: 0, rx: 2, class: 'gr-hbar' }, hours), v: 0 });
    var heatJob = null;
    function heat(R, instant) {
      if (heatJob) cancel(heatJob);
      var from = cells.map(function (c) { return c.v; });
      var pk = 0; R.heat.forEach(function (v, i) { if (v > R.heat[pk]) pk = i; });
      var pd = Math.floor(pk / 24), ph = pk % 24, hh = function (x) { x = (x + 24) % 24; return (x % 12 || 12) + (x < 12 ? ' am' : ' pm'); };
      var pe = $('[data-gr="peak"]'); if (pe) pe.textContent = DAYS[pd] + ' ' + hh(ph).replace(/ .m$/, '') + '–' + hh(ph + 1);
      var dur = instant || reduced() ? 0 : 1;
      var hv = []; for (var x = 0; x < 24; x++) { var t2 = 0; for (var y = 0; y < 7; y++) t2 += R.heat[y * 24 + x]; hv.push(t2); }
      var hmx = Math.max.apply(null, hv), hfrom = hbars.map(function (b) { return b.v; });
      var night = sum(hv.filter(function (v, x) { return x >= 22 || x < 5; })) / sum(hv);
      var ne = $('[data-gr="night"]'); if (ne) ne.textContent = Math.round(night * 100) + '% after 10 pm';
      hbars.forEach(function (b, x) { b.n.setAttribute('class', 'gr-hbar' + (hv[x] === hmx ? ' is-peak' : '')); });
      heatJob = add(function (e) {
        hbars.forEach(function (b, x) {
          var p = dur ? clamp((e - 120 - x * 26) / 460, 0, 1) : 1, v = lerp(hfrom[x], hv[x] / hmx, backOut(p));
          if (p >= 1) b.v = hv[x] / hmx;
          var hh2 = Math.max(2, v * 56); b.n.setAttribute('y', (62 - hh2).toFixed(1)); b.n.setAttribute('height', hh2.toFixed(1));
        });
        var all = true;
        cells.forEach(function (c, i) {
          var p = dur ? clamp((e - c.c * 26 - c.r * 34) / 380, 0, 1) : 1; if (p < 1) all = false;
          c.v = lerp(from[i], R.heat[i], easeOut(p));
          c.n.setAttribute('opacity', (.06 + .94 * Math.pow(c.v, 1.25)).toFixed(3));
          var s = 1 + Math.sin(p * Math.PI) * .35;
          c.n.setAttribute('transform', p > 0 && p < 1 ? 'translate(' + c.cx.toFixed(1) + ' ' + c.cy + ') scale(' + s.toFixed(3) + ') translate(' + (-c.cx).toFixed(1) + ' ' + (-c.cy) + ')' : '');
        });
        if (all && (!dur || e > 120 + 24 * 26 + 480)) { hbars.forEach(function (b, x) { b.v = hv[x] / hmx; }); heatJob = null; return false; }
      });
    }

    /* ---------- cities + playlists ---------- */
    var CCOL = ['#3B5BFF', '#22C3EE', '#8FA3FF', '#19C37D', '#FFB020', '#FF7A59'];
    function cities(R) {
      var tb = $('.gr-table tbody'); if (!tb) return;
      var mx = Math.max.apply(null, R.cities.map(function (c) { return c[2]; })), tot = sum(R.cities.map(function (c) { return c[2]; }));
      tb.innerHTML = R.cities.map(function (c, i) {
        return '<tr style="animation:gr-in .45s ' + (i * 50) + 'ms cubic-bezier(.2,.9,.2,1) both"><td><div class="gr-city"><span class="gr-city-ic" style="--c:' + CCOL[i % 6] + '">' + esc(c[1]) + '</span><div><b>' + esc(c[0]) + '</b><small>' + esc(c[1]) + '</small></div></div></td>' +
          '<td class="gr-num"><b>' + fmt(c[2]) + '</b></td><td><span class="gr-chg ' + (c[3] >= 0 ? 'up' : 'down') + '">' + (c[3] >= 0 ? '▲ ' : '▼ ') + Math.abs(c[3]) + '%</span></td>' +
          '<td><div class="gr-share"><div><i data-w="' + (c[2] / mx * 100).toFixed(1) + '"></i></div><span class="gr-num">' + Math.round(c[2] / tot * 100) + '%</span></div></td><td>' + esc((R.tracks[c[4]] || R.tracks[0]).name) + '</td></tr>';
      }).join('');
      global.requestAnimationFrame(function () { global.requestAnimationFrame(function () { Array.prototype.forEach.call(tb.querySelectorAll('[data-w]'), function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); }); });
    }
    function playlists(R) {
      var ul = $('[data-gr="plist"]'); if (!ul) return;
      ul.innerHTML = R.playlists.map(function (p, i) {
        var t = R.tracks[p[2]] || R.tracks[0], c1 = R.label[i % 2], c2 = R.tracks[(i + 1) % R.tracks.length].color;
        return '<li class="gr-pl" style="animation-delay:' + (i * 60) + 'ms"><span class="gr-pl-art" style="--c:' + c1 + ';--c2:' + c2 + '"></span><div class="gr-pl-t"><b>' + esc(p[0]) + '</b><small>' + esc(t.name) + ' · ' + compact(p[1]) + ' followers' + (p[5] ? ' · editorial' : '') + '</small></div><div class="gr-pl-pos"><b>#' + p[3] + '</b>' + esc(p[4]) + '</div></li>';
      }).join('');
      var re = $('[data-gr="reach"]'); if (re) re.innerHTML = compact(sum(R.playlists.map(function (p) { return p[1]; })), true) + '<small> reach</small>';
    }

    /* ---------- switching release ---------- */
    function setRelease(i, instant) {
      i = ((i % data.length) + data.length) % data.length;
      var fresh = cur < 0; cur = i; R = data[i];
      $$('.gr-seg button').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      placeThumb();
      var sub = $('[data-gr="sub"]'); if (sub) sub.textContent = 'Nova Halden · ' + R.kind + ' · ' + R.tracks.length + ' tracks · out ' + R.released;
      buildDeck(R, !fresh && !instant);
      if (!fresh && !instant && !reduced()) tween(520, function (q) { var s = q < .4 ? 1 - q / .4 * .3 : .7 + backOut((q - .4) / .6) * .3; labelG.setAttribute('transform', 'translate(' + G.cx + ' ' + G.cy + ') scale(' + s.toFixed(3) + ') translate(' + (-G.cx) + ' ' + (-G.cy) + ')'); }, 0, function (x) { return x; });
      kpis(R, instant); donut(R, instant); drawChart(R, instant); heat(R, instant); cities(R); playlists(R);
      play(instant);
    }
    function onResize() { placeThumb(); paintChart(); }
    on(global, 'resize', onResize);

    var ctl = {
      setRelease: function (i) { setRelease(i); return ctl; },
      next: function () { setRelease(cur + 1); return ctl; },
      prev: function () { setRelease(cur - 1); return ctl; },
      play: function () { play(); return ctl; },
      spotlight: function (k) { spotlight(k); return ctl; },
      setTheme: function (t) { setTheme(t); return ctl; },
      get release() { return cur; },
      data: data,
      destroy: function () { jobs.length = 0; global.cancelAnimationFrame(rafId); running = false; offs.forEach(function (f) { f(); }); offs = []; delete root.__groove; }
    };
    root.__groove = ctl;
    setRelease(clamp(o.start, 0, data.length - 1));
    if (global.document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeThumb(); paintChart(); });
    return ctl;
  }

  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-groove]'), function (n) { if (!n.hasAttribute('data-groove-manual') && !n.__groove) mount(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();

  global.Groove = { mount: mount, data: DATA, version: '1.0.0' };
})(window);
