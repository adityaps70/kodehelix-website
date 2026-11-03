/* Relay — delivery operations dashboard template · Kodehelix UI · kodehelix.in
   Plain JS, zero dependencies. Relay.mount(el, options) → controller. See README.md. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0;
  var COLORS = ['var(--relay-r1)', 'var(--relay-r2)', 'var(--relay-r3)', 'var(--relay-r4)', 'var(--relay-r5)'];
  var STATUS = {
    route: ['On route', 'var(--relay-blue)'],
    done: ['Delivered', 'var(--relay-good)'],
    late: ['Delayed', 'var(--relay-warn)'],
    back: ['Returning', 'var(--relay-peri)']
  };

  /* ---------- demo data (replace with your own: same shape) ---------- */
  function curve(peaks, total, seed) {
    var a = [], sum = 0, h, v;
    for (h = 0; h < 24; h++) {
      v = 0;
      peaks.forEach(function (p) { v += p[1] * Math.exp(-Math.pow(h - p[0], 2) / (2 * p[2] * p[2])); });
      v = h < 6 || h > 21 ? v * 0.05 + 1 : v + 4 + (Math.sin(h * 2.3 + seed) * 0.5 + 0.5) * 9;
      a.push(v); sum += v;
    }
    return a.map(function (x) { return Math.round(x / sum * total); });
  }
  var DATA = {
    company: 'Relay Logistics',
    now: 14.33,
    days: ['21 Oct', '22 Oct', '23 Oct', '24 Oct', '25 Oct', '26 Oct', '27 Oct', '28 Oct', '29 Oct', '30 Oct', '31 Oct', '1 Nov', '2 Nov', '3 Nov'],
    stops: {
      s1: [92, 72, 'Elm Row'], s2: [178, 46, 'Kite Hill'], s3: [256, 96, 'Ashgrove'], s4: [402, 62, 'Mill Lane'],
      s5: [498, 40, 'Linden Square'], s6: [586, 92, 'Pier 9'], s7: [560, 186, 'Quarry Road'], s8: [470, 250, 'Fennel Park'],
      s9: [590, 290, 'Harbor Street'], s10: [432, 306, 'Brookfield'], s11: [330, 286, 'Sable Court'], s12: [226, 312, 'Orchard Way'],
      s13: [128, 262, 'Wren Street'], s14: [54, 186, 'Copper Yard'], s15: [160, 160, 'Tannery Lane'], s16: [402, 150, 'Bell Tower'],
      s17: [262, 214, 'Saltmarsh'], s18: [96, 318, 'Vine Court']
    },
    hubs: [
      {
        id: 'north', name: 'North hub', area: 'Northside', x: 318, y: 128,
        kpis: {
          parcels: { v: 1284, d: 8.2, spark: [980, 1040, 1010, 1120, 1090, 1190, 1284] },
          delivered: { v: 912, d: 5.1, spark: [700, 760, 720, 810, 790, 860, 912] },
          ontime: { v: 96.4, d: 1.3, spark: [93.9, 94.6, 94.1, 95.2, 95.0, 95.8, 96.4] },
          stop: { v: 192, d: -6, spark: [214, 209, 211, 203, 200, 196, 192] }
        },
        foot: { stops: 318, of: 446, km: 1186, delay: 4 },
        hourly: curve([[10, 120, 1.8], [15.5, 95, 1.6]], 1284, 1),
        trend: [93.8, 94.9, 94.2, 95.6, 96.1, 93.4, 94.8, 95.9, 96.6, 95.2, 97.1, 96.0, 95.1, 96.4],
        routes: [
          { driver: 'Asha Kapoor', van: 'NV-04', stops: ['s3', 's2', 's1'], done: 31, total: 31, eta: '13:55', status: 'done' },
          { driver: 'Rohan Mehta', van: 'NV-11', stops: ['s4', 's5', 's6'], done: 22, total: 34, eta: '16:10', status: 'route' },
          { driver: 'Mina Sato', van: 'NV-07', stops: ['s16', 's7', 's9'], done: 19, total: 28, eta: '15:45', status: 'route' },
          { driver: 'Dev Rao', van: 'NV-02', stops: ['s17', 's11', 's10'], done: 12, total: 30, eta: '17:20', status: 'late' },
          { driver: 'Leo Park', van: 'NV-15', stops: ['s15', 's14', 's13'], done: 24, total: 26, eta: '14:50', status: 'route' }
        ]
      },
      {
        id: 'river', name: 'River hub', area: 'Riverside', x: 196, y: 222,
        kpis: {
          parcels: { v: 1046, d: 3.4, spark: [930, 960, 1001, 978, 1012, 1030, 1046] },
          delivered: { v: 688, d: -2.6, spark: [720, 705, 730, 698, 710, 702, 688] },
          ontime: { v: 93.1, d: -1.8, spark: [95.4, 94.9, 95.1, 94.2, 94.6, 93.8, 93.1] },
          stop: { v: 221, d: 4, spark: [205, 210, 208, 214, 212, 218, 221] }
        },
        foot: { stops: 241, of: 372, km: 942, delay: 11 },
        hourly: curve([[12, 130, 2.4], [17.5, 50, 1.2]], 1046, 2),
        trend: [95.2, 94.8, 95.6, 94.1, 93.9, 95.0, 94.4, 92.8, 93.6, 94.2, 92.4, 93.8, 94.0, 93.1],
        routes: [
          { driver: 'Sara Thomas', van: 'RV-03', stops: ['s12', 's18'], done: 18, total: 22, eta: '15:05', status: 'route' },
          { driver: 'Kabir Shah', van: 'RV-08', stops: ['s13', 's14', 's15', 's1'], done: 14, total: 33, eta: '17:40', status: 'late' },
          { driver: 'Ines Duarte', van: 'RV-12', stops: ['s17', 's3', 's2'], done: 27, total: 27, eta: '13:30', status: 'back' },
          { driver: 'Omar Haddad', van: 'RV-05', stops: ['s11', 's10', 's9'], done: 16, total: 29, eta: '16:25', status: 'route' },
          { driver: 'Priya Nair', van: 'RV-09', stops: ['s16', 's4', 's5'], done: 20, total: 31, eta: '16:00', status: 'route' }
        ]
      },
      {
        id: 'east', name: 'East hub', area: 'Eastgate', x: 500, y: 178,
        kpis: {
          parcels: { v: 1512, d: 12.6, spark: [1120, 1210, 1260, 1300, 1390, 1440, 1512] },
          delivered: { v: 1129, d: 9.8, spark: [860, 900, 950, 990, 1040, 1080, 1129] },
          ontime: { v: 97.2, d: 0.6, spark: [96.1, 96.8, 96.4, 96.9, 97.0, 96.6, 97.2] },
          stop: { v: 174, d: -9, spark: [198, 194, 190, 186, 181, 178, 174] }
        },
        foot: { stops: 402, of: 520, km: 1394, delay: 3 },
        hourly: curve([[9, 115, 1.5], [13, 70, 1.8], [17.5, 105, 1.7]], 1512, 3),
        trend: [96.0, 96.4, 95.8, 96.9, 97.4, 96.2, 96.8, 97.6, 96.9, 97.8, 97.1, 96.5, 96.6, 97.2],
        routes: [
          { driver: 'Tom Becker', van: 'EG-01', stops: ['s8', 's10', 's11', 's12'], done: 25, total: 32, eta: '15:20', status: 'route' },
          { driver: 'Zara Ali', van: 'EG-06', stops: ['s7', 's6', 's5'], done: 29, total: 29, eta: '14:05', status: 'done' },
          { driver: 'Nikhil Jain', van: 'EG-10', stops: ['s9'], done: 21, total: 24, eta: '14:55', status: 'route' },
          { driver: 'Hana Kim', van: 'EG-04', stops: ['s16', 's4', 's3', 's2'], done: 17, total: 35, eta: '17:05', status: 'late' },
          { driver: 'Felix Moreau', van: 'EG-14', stops: ['s17', 's13', 's14'], done: 23, total: 30, eta: '15:50', status: 'route' }
        ]
      }
    ]
  };

  /* ---------- helpers ---------- */
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function S(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function mmss(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function hh(h) { return ('0' + Math.floor(h)).slice(-2) + ':' + ('0' + Math.round((h % 1) * 60)).slice(-2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  var E = {
    io: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    back: function (t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    lin: function (t) { return t; }
  };

  /* tiny tween engine: one rAF loop per dashboard, tweens can be killed by tag */
  function Engine() { this.list = []; this.raf = 0; }
  Engine.prototype.add = function (o) {
    o.start = performance.now() + (o.delay || 0);
    o.ease = o.ease || E.io;
    if (mq.matches || !o.dur) { o.fn(1); if (o.done) o.done(); return; }
    o.fn(0);
    this.list.push(o);
    if (!this.raf) this.raf = requestAnimationFrame(this.loop.bind(this));
  };
  Engine.prototype.loop = function () {
    var now = performance.now(), cur = this.list;
    this.list = [];
    for (var i = 0; i < cur.length; i++) {
      var t = cur[i], p = (now - t.start) / t.dur;
      if (t.dead) continue;
      if (p < 0) { this.list.push(t); continue; }
      if (p >= 1) { t.fn(1); if (t.done) t.done(); } else { t.fn(t.ease(p)); this.list.push(t); }
    }
    this.raf = this.list.length ? requestAnimationFrame(this.loop.bind(this)) : 0;
  };
  Engine.prototype.kill = function (tag) {
    this.list.forEach(function (t) { if (t.tag === tag) t.dead = true; });
  };
  Engine.prototype.stop = function () { cancelAnimationFrame(this.raf); this.raf = 0; this.list = []; };

  /* smooth path through points (Catmull-Rom → cubic Béziers), returned per segment */
  function segments(pts) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      out.push(' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0] + ' ' + p2[1]);
    }
    return out;
  }
  function sparkPath(vals, w, h, pad) {
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    return vals.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / (vals.length - 1) * w).toFixed(1) + ' ' + (pad + (1 - (v - mn) / r) * (h - pad * 2)).toFixed(1);
    }).join(' ');
  }

  /* ---------- the dashboard ---------- */
  function mount(root, opts) {
    if (!root) throw new Error('Relay.mount: element not found');
    if (root.__relay) return root.__relay;
    opts = opts || {};
    var data = opts.data || DATA;
    var id = 'rl' + (++uid);
    var fx = new Engine();
    var st = { hub: null, focus: -1, pinned: -1, sort: null, dir: 1, q: '', kpi: {}, hourly: null, trend: null };
    var off = [];
    function on(el, ev, fn, o) { if (!el) return; el.addEventListener(ev, fn, o); off.push(function () { el.removeEventListener(ev, fn, o); }); }

    if (opts.theme) root.setAttribute('data-theme', opts.theme);

    /* --- map --- */
    var mapBox = $(root, '[data-rl-map]');
    var map = S('svg', { viewBox: '0 0 640 340', 'class': 'rl-map', role: 'img' }, mapBox);
    var bg = S('g', { 'class': 'rl-bg' }, map);
    S('path', { 'class': 'rl-park', d: 'M88 110c14-22 52-26 70-8 16 16 6 40-16 46-26 8-66-14-54-38z' }, bg);
    S('path', { 'class': 'rl-park', d: 'M500 112c18-14 52-10 60 10 8 22-14 36-36 34-28-2-42-30-24-44z' }, bg);
    S('path', { 'class': 'rl-park', d: 'M318 318c10-12 40-14 54-2 10 10 0 22-22 22-22 0-42-8-32-20z' }, bg);
    var streets = [
      'M-10 140C120 128 260 150 380 134S560 120 650 128', 'M-10 300C110 286 230 296 360 280S560 262 650 270',
      'M140 -10C150 90 132 200 150 350', 'M300 -10C290 110 312 230 298 350', 'M460 -10C470 100 448 220 466 350',
      'M-10 40C140 30 280 54 420 30S600 30 650 22'
    ];
    streets.forEach(function (d) { S('path', { 'class': 'rl-avenue', d: d }, bg); });
    for (var gx = 40; gx < 640; gx += 52) S('path', { 'class': 'rl-street', d: 'M' + gx + ' -5L' + (gx + 14) + ' 345' }, bg);
    for (var gy = 22; gy < 340; gy += 46) S('path', { 'class': 'rl-street', d: 'M-5 ' + gy + 'L645 ' + (gy - 10) }, bg);
    S('path', { 'class': 'rl-water', d: 'M-20 214C70 196 130 262 230 262S380 222 470 246 590 330 660 310' }, bg);
    var routesHost = S('g', {}, map);
    var stopsG = S('g', {}, map);
    var vansG = S('g', {}, map);
    var depot = S('g', { 'class': 'rl-depot' }, map);
    var pulse = S('circle', { 'class': 'rl-depot-pulse', r: 14 }, depot);
    var depotBody = S('g', {}, depot);
    S('rect', { x: -14, y: -14, width: 28, height: 28, rx: 9 }, depotBody);
    S('path', { d: 'M-7 -1L0 -6.5 7 -1M-5 -2V6H5V-2M-2 6V2H2V6' }, depotBody);
    var depotLabel = S('text', { 'class': 'rl-depot-label', y: 29, 'text-anchor': 'middle' }, depot);

    var stopEls = {};
    Object.keys(data.stops).forEach(function (k) {
      var s = data.stops[k];
      var g = S('g', { 'class': 'rl-stop is-idle', transform: 'translate(' + s[0] + ' ' + s[1] + ')' }, stopsG);
      S('title', {}, g).textContent = s[2];
      var ring = S('circle', { 'class': 'rl-ring', r: 6 }, g);
      S('circle', { 'class': 'rl-dot', r: 6 }, g);
      S('path', { 'class': 'rl-tick', d: 'M-2.6 .2L-.7 2.1 2.8-1.9' }, g);
      stopEls[k] = { g: g, ring: ring, tick: g.lastChild };
    });
    var depotPos = null;

    function ping(stop, color) {
      stop.g.classList.add('is-done');
      fx.add({ dur: 650, ease: E.out, tag: 'hub', fn: function (e) {
        stop.ring.setAttribute('r', 6 + e * 14); stop.ring.style.opacity = (1 - e) * 0.9;
      } });
      fx.add({ dur: 320, delay: 80, tag: 'hub', fn: function (e) { stop.tick.style.strokeDashoffset = 12 * (1 - e); } });
    }

    function drawRoutes(hub, intro) {
      // old routes retract and fade
      var old = routesHost.firstChild;
      var oldVans = vansG.firstChild;
      if (old) {
        var olds = $$(old, '.rl-route');
        fx.add({ dur: 380, ease: E.io, tag: 'old', fn: function (e) {
          old.style.opacity = 1 - e; if (oldVans) oldVans.style.opacity = 1 - e;
          olds.forEach(function (p) { var L = +p.dataset.len, f = +p.dataset.f; p.style.strokeDashoffset = L - L * f * (1 - e); });
        }, done: function () { if (old.parentNode) old.remove(); if (oldVans && oldVans.parentNode) oldVans.remove(); } });
      }
      map.classList.remove('is-settled');
      var layer = S('g', {}, routesHost);
      var vans = S('g', {}, vansG);
      // stops: idle unless on a route of this hub
      Object.keys(stopEls).forEach(function (k) {
        var s = stopEls[k];
        s.g.setAttribute('class', 'rl-stop is-idle');
        s.g.removeAttribute('data-route');
        s.tick.style.strokeDashoffset = 12;
        s.ring.style.opacity = 0;
      });
      var t0 = intro ? 250 : 640;
      hub.routes.forEach(function (r, i) {
        var c = COLORS[i % COLORS.length];
        var pts = [[hub.x, hub.y]].concat(r.stops.map(function (k) { return data.stops[k]; }));
        var segs = segments(pts), d = 'M' + hub.x + ' ' + hub.y + segs.join('');
        var g = S('g', { 'class': 'rl-r', 'data-route': i, style: '--c:' + c }, layer);
        var plan = S('path', { 'class': 'rl-plan', d: d, style: 'fill:none;stroke-linecap:round;stroke:' + c + ';opacity:.28;stroke-dasharray:3 7;stroke-width:2' }, g);
        var glow = S('path', { 'class': 'rl-route-glow', d: d, style: 'stroke:' + c }, g);
        var path = S('path', { 'class': 'rl-route', d: d, style: 'stroke:' + c }, g);
        S('path', { 'class': 'rl-flow', d: d, style: 'stroke:' + c + ';animation-delay:' + (-i * 0.23) + 's' }, g);
        var L = path.getTotalLength();
        var f = r.status === 'done' || r.status === 'back' ? 1 : Math.max(0.12, Math.min(0.97, r.done / r.total));
        path.dataset.len = L; path.dataset.f = f;
        [path, glow].forEach(function (p) { p.style.strokeDasharray = L + ' ' + (L + 2); p.style.strokeDashoffset = L; });
        plan.style.opacity = 0;
        // where each stop sits along the route
        var fr = [], tmp = S('path', {}, map);
        for (var k = 1; k <= segs.length; k++) {
          tmp.setAttribute('d', 'M' + hub.x + ' ' + hub.y + segs.slice(0, k).join(''));
          fr.push(tmp.getTotalLength() / L);
        }
        tmp.remove();
        r.stops.forEach(function (k) {
          var s = stopEls[k]; if (!s) return;
          s.g.setAttribute('class', 'rl-stop');
          s.g.setAttribute('data-route', i);
          s.g.style.setProperty('--c', c);
        });
        var van = S('g', { 'class': 'rl-van', style: '--c:' + c + ';opacity:0' }, vans);
        S('circle', { r: 10 }, van); S('circle', { r: 4.5 }, van);
        var hit = 0;
        fx.add({ dur: 1150, delay: t0 + i * 120, ease: E.io, tag: 'hub', fn: function (e) {
          var len = L * f * e;
          path.style.strokeDashoffset = L - len; glow.style.strokeDashoffset = L - len;
          plan.style.opacity = 0.9 * Math.min(1, e * 3) ;
          var pt = path.getPointAtLength(len);
          van.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
          van.style.opacity = e > 0 ? 1 : 0;
          while (hit < fr.length && fr[hit] <= f * e + 0.001) { ping(stopEls[r.stops[hit]], c); hit++; }
        } });
      });
      fx.add({ dur: 10, delay: t0 + hub.routes.length * 120 + 1150, tag: 'hub', fn: function () {}, done: function () { map.classList.add('is-settled'); } });
    }

    function moveDepot(hub, intro) {
      var from = depotPos || { x: hub.x, y: hub.y };
      depotLabel.textContent = hub.name;
      fx.add({ dur: intro ? 500 : 620, delay: intro ? 0 : 120, ease: E.back, tag: 'hub', fn: function (e) {
        var x = intro ? hub.x : lerp(from.x, hub.x, e), y = intro ? hub.y : lerp(from.y, hub.y, e);
        depot.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        depotBody.setAttribute('transform', intro ? 'scale(' + Math.max(0, e) + ')' : '');
      } });
      fx.add({ dur: 900, delay: intro ? 200 : 640, ease: E.out, tag: 'hub', fn: function (e) {
        pulse.setAttribute('r', 14 + e * 46); pulse.style.opacity = e > 0 ? (1 - e) * 0.9 : 0;
      } });
      depotPos = { x: hub.x, y: hub.y };
    }

    /* --- KPIs --- */
    var KPI = {
      parcels: function (v) { return fmt(v); },
      delivered: function (v, k) { return fmt(v) + '<small>' + Math.round(v / k.parcels * 100) + '%</small>'; },
      ontime: function (v) { return v.toFixed(1) + '<small>%</small>'; },
      stop: function (v) { return mmss(v) + '<small>min</small>'; }
    };
    function drawKpis(hub) {
      var cur = { parcels: hub.kpis.parcels.v };
      $$(root, '[data-rl-kpi]').forEach(function (card, n) {
        var key = card.getAttribute('data-rl-kpi'), k = hub.kpis[key];
        if (!k) return;
        var from = st.kpi[key] || { v: 0, spark: k.spark.map(function () { return k.spark[0]; }) };
        var val = $(card, '.rl-kpi-val'), dl = $(card, '.rl-delta'), sp = $(card, '.rl-spark');
        var good = key === 'stop' ? k.d <= 0 : k.d >= 0;
        dl.classList.toggle('is-neg', k.d < 0);
        dl.classList.toggle('is-bad', !good);
        $(dl, 'span').textContent = (k.d > 0 ? '+' : k.d < 0 ? '−' : '') + Math.abs(k.d) + (key === 'ontime' ? ' pt' : '%');
        if (!sp.firstChild) { S('path', { 'class': 'rl-spark-fill' }, sp); S('path', {}, sp); }
        var fill = sp.firstChild, line = sp.lastChild;
        fx.add({ dur: 1000, delay: 80 + n * 70, ease: E.out, tag: 'hub', fn: function (e) {
          var v = lerp(from.v, k.v, e);
          cur.parcels = lerp((st.kpi.parcels || { v: 0 }).v, hub.kpis.parcels.v, e) || 1;
          val.innerHTML = KPI[key](v, key === 'delivered' ? { parcels: hub.kpis.parcels.v } : cur);
          var vals = k.spark.map(function (x, i) { return lerp(from.spark[i], x, e); });
          var d = sparkPath(vals, 84, 30, 3);
          line.setAttribute('d', d); fill.setAttribute('d', d + ' L84 30 L0 30Z');
        } });
        st.kpi[key] = { v: k.v, spark: k.spark.slice() };
      });
    }

    /* --- delivery clock --- */
    var clockBox = $(root, '[data-rl-clock]'), clock, bars = [], hand, nowDot;
    if (clockBox) {
      clock = S('svg', { viewBox: '0 0 240 240', role: 'img' }, clockBox);
      var cd = S('defs', {}, clock), lg = S('linearGradient', { id: id + 'cg', x1: 40, y1: 20, x2: 200, y2: 220, gradientUnits: 'userSpaceOnUse' }, cd);
      S('stop', { offset: 0, 'stop-color': '#3B5BFF' }, lg); S('stop', { offset: 1, 'stop-color': '#22C3EE' }, lg);
      S('circle', { 'class': 'rl-face', cx: 120, cy: 120, r: 54 }, clock);
      S('circle', { 'class': 'rl-face', cx: 120, cy: 120, r: 98, 'stroke-dasharray': '1 5' }, clock);
      for (var h = 0; h < 24; h++) {
        var a = h / 24 * Math.PI * 2 - Math.PI / 2;
        var b = S('line', { 'class': 'rl-bar ' + (h < Math.floor(data.now) ? 'is-past' : 'is-next') }, clock);
        if (h < Math.floor(data.now)) b.setAttribute('stroke', 'url(#' + id + 'cg)');
        b.__a = a; bars.push(b);
        if (h % 6 === 0) {
          var t = S('text', { 'class': 'rl-hour', x: 120 + Math.cos(a) * 112, y: 120 + Math.sin(a) * 112 }, clock);
          t.textContent = ('0' + h).slice(-2);
        }
      }
      var na = data.now / 24 * Math.PI * 2 - Math.PI / 2;
      nowDot = S('circle', { 'class': 'rl-now', r: 3.5, cx: 120 + Math.cos(na) * 47, cy: 120 + Math.sin(na) * 47 }, clock);
      S('title', {}, nowDot).textContent = 'Now ' + hh(data.now);
      hand = S('line', { 'class': 'rl-hand', x1: 120, y1: 120, x2: 120, y2: 24 }, clock);
    }
    function barTo(b, len) {
      var r0 = 60, c = Math.cos(b.__a), s = Math.sin(b.__a);
      b.setAttribute('x1', (120 + c * r0).toFixed(1)); b.setAttribute('y1', (120 + s * r0).toFixed(1));
      b.setAttribute('x2', (120 + c * (r0 + len)).toFixed(1)); b.setAttribute('y2', (120 + s * (r0 + len)).toFixed(1));
    }
    function drawClock(hub) {
      if (!clock) return;
      var mx = Math.max.apply(null, hub.hourly), peak = hub.hourly.indexOf(mx);
      var from = st.hourly || hub.hourly.map(function () { return 0; }), fromMx = st.hourlyMx || mx;
      var past = 0, next = 0;
      hub.hourly.forEach(function (v, i) { if (i < Math.floor(data.now)) past += v; else next += v; });
      clock.setAttribute('aria-label', 'Parcels per hour at ' + hub.name + '. Peak at ' + hh(peak) + ' with ' + mx + ' parcels.');
      bars.forEach(function (b, i) {
        fx.add({ dur: 520, delay: 120 + i * 32, ease: E.back, tag: 'hub', fn: function (e) {
          barTo(b, Math.max(1.5, lerp(from[i] / fromMx * 38, hub.hourly[i] / mx * 38, e)));
        } });
      });
      fx.add({ dur: 900, delay: 100, ease: E.io, tag: 'hub', fn: function (e) {
        hand.setAttribute('transform', 'rotate(' + (e * 360) + ' 120 120)');
        hand.style.opacity = e > 0 && e < 1 ? Math.sin(e * Math.PI) * 0.9 : 0;
      } });
      var mid = $(root, '[data-rl-peak]'), cnt = $(root, '[data-rl-peakn]');
      if (mid) mid.textContent = hh(peak);
      var p0 = st.peakN || 0;
      fx.add({ dur: 900, delay: 150, ease: E.out, tag: 'hub', fn: function (e) {
        if (cnt) cnt.textContent = fmt(lerp(p0, mx, e)) + ' parcels';
        set('[data-rl-past]', fmt(lerp(st.past || 0, past, e)));
        set('[data-rl-next]', fmt(lerp(st.next || 0, next, e)));
      } });
      st.hourly = hub.hourly.slice(); st.hourlyMx = mx; st.peakN = mx; st.past = past; st.next = next;
    }

    /* --- on-time trend --- */
    var trendBox = $(root, '[data-rl-trend]'), tr = {};
    var TW = 320, TH = 170, X0 = 30, X1 = 312, Y0 = 12, Y1 = 142, LO = 88, HI = 100;
    function ty(v) { return Y1 - (v - LO) / (HI - LO) * (Y1 - Y0); }
    function tx(i, n) { return X0 + i / (n - 1) * (X1 - X0); }
    if (trendBox) {
      tr.svg = S('svg', { viewBox: '0 0 ' + TW + ' ' + TH, role: 'img' }, trendBox);
      var td = S('defs', {}, tr.svg);
      var g1 = S('linearGradient', { id: id + 'tg', x1: 0, y1: 0, x2: 1, y2: 0 }, td);
      S('stop', { offset: 0, 'stop-color': '#3B5BFF' }, g1); S('stop', { offset: 1, 'stop-color': '#22C3EE' }, g1);
      var g2 = S('linearGradient', { id: id + 'tf', x1: 0, y1: 0, x2: 0, y2: 1 }, td);
      S('stop', { offset: 0, 'stop-color': '#22C3EE', 'stop-opacity': 0.28 }, g2); S('stop', { offset: 1, 'stop-color': '#22C3EE', 'stop-opacity': 0 }, g2);
      [90, 95, 100].forEach(function (v) {
        S('line', { 'class': 'rl-gridline', x1: X0, x2: X1, y1: ty(v), y2: ty(v) }, tr.svg);
        S('text', { 'class': 'rl-axis', x: X0 - 6, y: ty(v) + 3.5, 'text-anchor': 'end' }, tr.svg).textContent = v;
      });
      S('line', { 'class': 'rl-target', x1: X0, x2: X1, y1: ty(95), y2: ty(95) }, tr.svg);
      var n = data.days.length;
      [0, Math.floor(n / 2), n - 1].forEach(function (i) {
        S('text', { 'class': 'rl-axis', x: tx(i, n), y: TH - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, tr.svg).textContent = data.days[i];
      });
      tr.area = S('path', { 'class': 'rl-area', fill: 'url(#' + id + 'tf)' }, tr.svg);
      tr.line = S('path', { 'class': 'rl-line', stroke: 'url(#' + id + 'tg)' }, tr.svg);
      tr.pts = []; tr.hits = [];
      for (var i = 0; i < n; i++) {
        tr.pts.push(S('circle', { 'class': 'rl-pt' + (i === n - 1 ? ' is-last' : ''), r: 3.6, cx: tx(i, n) }, tr.svg));
      }
      for (i = 0; i < n; i++) {
        var hr = S('rect', { 'class': 'rl-hit', x: tx(i, n) - (X1 - X0) / (n - 1) / 2, y: 0, width: (X1 - X0) / (n - 1), height: TH - 18 }, tr.svg);
        hr.__i = i; tr.hits.push(hr);
      }
      tr.tip = document.createElement('div'); tr.tip.className = 'rl-tip'; trendBox.appendChild(tr.tip);
      on(tr.svg, 'pointermove', function (ev) {
        var i = ev.target.__i; if (i == null || !st.trendVals) return hideTip();
        tr.pts.forEach(function (p, j) { p.classList.toggle('is-hover', j === i); });
        var r = tr.svg.getBoundingClientRect(), sx = r.width / TW;
        tr.tip.textContent = data.days[i] + ' · ' + st.trendVals[i].toFixed(1) + '%';
        tr.tip.style.left = (tx(i, n) * sx) + 'px'; tr.tip.style.top = (ty(st.trendVals[i]) * sx) + 'px';
        tr.tip.classList.add('is-on');
      });
      on(tr.svg, 'pointerleave', hideTip);
    }
    function hideTip() { if (!tr.tip) return; tr.tip.classList.remove('is-on'); tr.pts.forEach(function (p) { p.classList.remove('is-hover'); }); }
    function drawTrend(hub) {
      if (!tr.svg) return;
      var to = hub.trend, from = st.trend || to.map(function () { return LO; }), n = to.length;
      var avg = to.reduce(function (a, b) { return a + b; }, 0) / n, miss = to.filter(function (v) { return v < 95; }).length;
      tr.svg.setAttribute('aria-label', 'On-time rate, last ' + n + ' days at ' + hub.name + ', average ' + avg.toFixed(1) + '%.');
      set('[data-rl-avg]', avg.toFixed(1) + '%');
      set('[data-rl-miss]', miss + (miss === 1 ? ' day' : ' days'));
      fx.add({ dur: 900, delay: 200, ease: E.io, tag: 'hub', fn: function (e) {
        var vals = to.map(function (v, i) { var k = Math.min(1, Math.max(0, e * 1.6 - i / n * 0.6)); return lerp(from[i], v, E.out(k)); });
        st.trendVals = vals;
        var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + tx(i, n).toFixed(1) + ' ' + ty(v).toFixed(1); }).join(' ');
        tr.line.setAttribute('d', d);
        tr.area.setAttribute('d', d + ' L' + X1 + ' ' + Y1 + ' L' + X0 + ' ' + Y1 + 'Z');
        vals.forEach(function (v, i) { tr.pts[i].setAttribute('cy', ty(v).toFixed(1)); tr.pts[i].classList.toggle('is-miss', to[i] < 95); });
      } });
      st.trend = to.slice();
    }

    /* --- table --- */
    var table = $(root, '[data-rl-table]'), tbody = table && $(table, 'tbody');
    function drawTable(animate) {
      if (!tbody) return;
      var hub = st.hub, q = st.q.toLowerCase();
      var rows = hub.routes.map(function (r, i) { return { r: r, i: i }; }).filter(function (o) {
        var z = o.r.stops.map(function (k) { return data.stops[k][2]; }).join(' ');
        return !q || (o.r.driver + ' ' + o.r.van + ' ' + z + ' ' + STATUS[o.r.status][0]).toLowerCase().indexOf(q) > -1;
      });
      if (st.sort) rows.sort(function (a, b) {
        var x = st.sort === 'prog' ? a.r.done / a.r.total - b.r.done / b.r.total : a.r.eta.localeCompare(b.r.eta);
        return x * st.dir;
      });
      tbody.innerHTML = rows.length ? rows.map(function (o, n) {
        var r = o.r, s = STATUS[r.status], c = COLORS[o.i % COLORS.length];
        var z = data.stops[r.stops[0]][2] + (r.stops.length > 1 ? ' → ' + data.stops[r.stops[r.stops.length - 1]][2] : '');
        return '<tr tabindex="0" data-route="' + o.i + '" class="' + (animate ? 'is-in' : '') + (o.i === st.pinned ? ' is-focus' : '') + '" style="--i:' + n + ';--c:' + c + '">' +
          '<td><span class="rl-who"><i aria-hidden="true">' + esc(initials(r.driver)) + '</i><span>' + esc(r.driver) + '<small>Van ' + esc(r.van) + '</small></span></span></td>' +
          '<td class="rl-col-zone rl-zone">' + esc(z) + '</td>' +
          '<td><span class="rl-prog"><span><i style="width:' + Math.round(r.done / r.total * 100) + '%"></i></span>' + r.done + '/' + r.total + '</span></td>' +
          '<td class="rl-col-eta rl-eta">' + esc(r.eta) + '</td>' +
          '<td><span class="rl-pill" style="--c:' + s[1] + '">' + s[0] + '</span></td></tr>';
      }).join('') : '<tr class="rl-empty"><td colspan="5">No vans match “' + esc(st.q) + '”</td></tr>';
    }
    function focusRoute(i) {
      st.focus = i;
      map.classList.toggle('has-focus', i > -1);
      $$(map, '.rl-r').forEach(function (g) { g.classList.toggle('is-focus', +g.getAttribute('data-route') === i); });
      $$(map, '.rl-stop').forEach(function (g) { g.classList.toggle('is-focus', g.getAttribute('data-route') === String(i)); });
      if (tbody) $$(tbody, 'tr[data-route]').forEach(function (tr) { tr.classList.toggle('is-focus', +tr.getAttribute('data-route') === i); });
    }
    if (tbody) {
      on(tbody, 'pointerover', function (e) { var tr = e.target.closest('tr[data-route]'); if (tr) focusRoute(+tr.getAttribute('data-route')); });
      on(tbody, 'pointerleave', function () { focusRoute(st.pinned); });
      on(tbody, 'focusin', function (e) { var tr = e.target.closest('tr[data-route]'); if (tr) focusRoute(+tr.getAttribute('data-route')); });
      on(tbody, 'focusout', function () { focusRoute(st.pinned); });
      function pin(e) {
        var tr = e.target.closest('tr[data-route]'); if (!tr) return;
        var i = +tr.getAttribute('data-route');
        st.pinned = st.pinned === i ? -1 : i; focusRoute(st.pinned === -1 ? i : st.pinned);
      }
      on(tbody, 'click', pin);
      on(tbody, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(e); } });
      $$(table, 'th[data-sort] button').forEach(function (btn) {
        on(btn, 'click', function () {
          var th = btn.parentNode, k = th.getAttribute('data-sort');
          st.dir = st.sort === k ? -st.dir : 1; st.sort = k;
          $$(table, 'th[data-sort]').forEach(function (h) { h.removeAttribute('aria-sort'); });
          th.setAttribute('aria-sort', st.dir > 0 ? 'ascending' : 'descending');
          drawTable(false);
        });
      });
    }
    var search = $(root, '[data-rl-search]');
    on(search, 'input', function () { st.q = search.value.trim(); drawTable(false); });

    function set(sel, txt) { $$(root, sel).forEach(function (el) { el.textContent = txt; }); }

    /* --- hub switch --- */
    var hubBtns = $$(root, '[data-hub]'), ind = $(root, '.rl-hubs-ind');
    function placeInd() {
      var b = hubBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0];
      if (!b || !ind) return;
      ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    hubBtns.forEach(function (b) { on(b, 'click', function () { setHub(b.getAttribute('data-hub')); }); });
    on(window, 'resize', placeInd);

    function setHub(hid, intro) {
      var hub = data.hubs.filter(function (h) { return h.id === hid; })[0] || data.hubs[0];
      if (st.hub === hub && !intro) return;
      fx.kill('hub');
      st.hub = hub; st.pinned = -1; focusRoute(-1);
      hubBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-hub') === hub.id)); });
      placeInd();
      moveDepot(hub, intro);
      drawRoutes(hub, intro);
      drawKpis(hub);
      drawClock(hub);
      drawTrend(hub);
      drawTable(true);
      set('[data-rl-hubname]', hub.name);
      set('[data-rl-area]', hub.area);
      var vansOut = hub.routes.filter(function (r) { return r.status !== 'done' && r.status !== 'back'; }).length;
      var drops = hub.routes.reduce(function (a, r) { return a + r.stops.length; }, 0);
      set('[data-rl-vans]', vansOut + ' of ' + hub.routes.length + ' vans out');
      set('[data-rl-drops]', drops + ' drop zones');
      set('[data-rl-late]', hub.routes.filter(function (r) { return r.status === 'late'; }).length + ' delayed');
      map.setAttribute('aria-label', 'Live route map for ' + hub.name + ': ' + vansOut + ' vans out across ' + drops + ' drop zones.');
      var f0 = st.foot || { stops: 0, km: 0, delay: 0 }, f = hub.foot;
      fx.add({ dur: 1000, delay: 200, ease: E.out, tag: 'hub', fn: function (e) {
        set('[data-rl-foot="stops"]', fmt(lerp(f0.stops, f.stops, e)) + ' / ' + fmt(f.of));
        set('[data-rl-foot="km"]', fmt(lerp(f0.km, f.km, e)) + ' km');
        set('[data-rl-foot="delay"]', Math.round(lerp(f0.delay, f.delay, e)) + ' min');
      } });
      st.foot = f;
      if (!intro) root.dispatchEvent(new CustomEvent('relay:hub', { detail: { hub: hub.id } }));
    }

    /* --- theme + menu --- */
    var themeBtn = $(root, '[data-rl-theme]');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) {
        themeBtn.setAttribute('aria-pressed', String(t === 'light'));
        themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      }
    }
    on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    var menuBtn = $(root, '[data-rl-menu]'), scrim = $(root, '.rl-scrim');
    function menu(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    on(menuBtn, 'click', function () { menu(!root.classList.contains('is-open')); });
    on(scrim, 'click', function () { menu(false); });
    on(root, 'keydown', function (e) { if (e.key === 'Escape') { menu(false); if (st.pinned > -1) { st.pinned = -1; focusRoute(-1); } } });

    setTheme(root.getAttribute('data-theme') || 'dark');
    var startHub = opts.hub || (data.hubs[0] && data.hubs[0].id);
    setHub(startHub, true);
    requestAnimationFrame(placeInd);

    var api = {
      el: root,
      data: data,
      setHub: function (h) { setHub(h); },
      get hub() { return st.hub.id; },
      focusRoute: function (i) { st.pinned = i == null ? -1 : i; focusRoute(st.pinned); },
      setTheme: setTheme,
      replay: function () {
        st.kpi = {}; st.hourly = null; st.trend = null; st.foot = null; st.peakN = 0; st.past = 0; st.next = 0; depotPos = null;
        while (routesHost.firstChild) routesHost.firstChild.remove();
        while (vansG.firstChild) vansG.firstChild.remove();
        setHub(st.hub.id, true);
      },
      destroy: function () {
        fx.stop(); off.forEach(function (f) { f(); });
        [map, clock, tr.svg, tr.tip].forEach(function (n) { if (n && n.parentNode) n.remove(); });
        delete root.__relay;
      }
    };
    root.__relay = api;
    return api;
  }

  function auto() {
    $$(document, '[data-relay]').forEach(function (el) {
      if (!el.hasAttribute('data-relay-manual')) mount(el, { hub: el.getAttribute('data-relay') || undefined });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();

  window.Relay = { mount: mount, data: DATA, version: '1.0.0' };
})();
