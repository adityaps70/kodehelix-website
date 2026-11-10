/* Zenith — solar energy dashboard template · Kodehelix UI · kodehelix.in
   Zenith.mount(el, { day: 'today', data: {...} }) → { setDay, replay, setTheme, destroy }
   Elements with [data-zenith] auto-mount unless [data-zenith-manual] is present. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var T0 = 6, T1 = 18, STEP = 0.25;
  var uid = 0;

  /* ---------- demo data (same shape you pass as options.data) ---------- */
  function lerpPts(pts, h) {
    for (var i = 0; i < pts.length - 1; i++) {
      if (h <= pts[i + 1][0]) { var a = pts[i], b = pts[i + 1], t = (h - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (0.5 - Math.cos(Math.PI * t) / 2); }
    }
    return pts[pts.length - 1][1];
  }
  function cloudF(clouds, h) {
    var c = 1;
    clouds.forEach(function (k) { var z = (h - k[0]) / k[1]; c *= 1 - k[2] * Math.exp(-z * z); });
    return c;
  }
  function series(fn) { var a = []; for (var h = T0; h <= T1 + 1e-9; h += STEP) a.push(Math.round(fn(h) * 100) / 100); return a; }
  function solar(peak, rise, set, clouds) {
    return series(function (h) {
      if (h <= rise || h >= set) return 0;
      return peak * Math.pow(Math.sin(Math.PI * (h - rise) / (set - rise)), 1.3) * cloudF(clouds, h);
    });
  }
  var WORK = [[6, 6], [7, 9], [8.2, 17], [11.5, 19], [12.5, 13.5], [13.5, 18.5], [16.3, 17], [17.3, 10], [18, 7.5]];
  var WEEKEND = [[6, 5], [8, 8], [12, 10.5], [14, 9], [17, 7], [18, 6]];
  function usage(pts, k) { return series(function (h) { return lerpPts(pts, h) + 0.6 * Math.sin(h * 3.1 + k); }); }

  function demoData() {
    var rise = 6.25, set = 17.4;
    var c1 = [[10.6, 0.3, 0.18]], c2 = [[9.4, 0.35, 0.42], [12.1, 0.45, 0.55], [14.9, 0.3, 0.38]], c3 = [[8.6, 0.9, 0.45], [11.2, 1.1, 0.55], [14, 1, 0.5], [16.3, 0.7, 0.4]];
    return {
      site: { battery: 115, reserve: 0.2, rate: 0.16, exportRate: 0.07, currency: '$', sunrise: rise, sunset: set },
      days: [
        { id: 'today', name: 'Today', date: 'Tue 10 Nov', now: 13 + 40 / 60, startSoc: 24, clouds: c1, gen: solar(39.5, rise, set, c1), use: usage(WORK, 0),
          weather: { temp: 29, sky: 'Clear sky', uv: 7, icon: 'sun' } },
        { id: 'yday', name: 'Yesterday', date: 'Mon 9 Nov', now: null, startSoc: 21, clouds: c2, gen: solar(38.8, rise, set, c2), use: usage(WORK, 1.7),
          weather: { temp: 27, sky: 'Passing clouds', uv: 5, icon: 'part' } },
        { id: 'sat', name: 'Sat 7 Nov', date: 'Sat 7 Nov', now: null, startSoc: 26, clouds: c3, gen: solar(33, rise, set, c3), use: usage(WEEKEND, 0.6),
          weather: { temp: 24, sky: 'Overcast', uv: 2, icon: 'cloud' } }
      ],
      // seven days ending today; null = filled in from the matching day above
      week: {
        labels: ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'],
        days: [null, null, null, 'sat', null, 'yday', 'today'],
        made: [271, 248, 203, null, 242, null, null],
        used: [184, 179, 188, null, 96, null, null],
        self: [88, 85, 83, null, 92, null, null],
        batt: [71, 64, 49, null, 77, null, null],
        saved: [31.2, 30.1, 28.6, null, 16.4, null, null]
      },
      strings: [
        { id: 'A1', roof: 'South roof', panels: 12, watt: 500, share: 1.02, status: 'ok' },
        { id: 'A2', roof: 'South roof', panels: 12, watt: 500, share: 1.01, status: 'ok' },
        { id: 'A3', roof: 'South roof', panels: 12, watt: 500, share: 0.99, status: 'ok' },
        { id: 'A4', roof: 'South roof', panels: 12, watt: 500, share: 0.86, status: 'clean' },
        { id: 'B1', roof: 'West roof', panels: 12, watt: 500, share: 0.97, status: 'ok' },
        { id: 'B2', roof: 'West roof', panels: 12, watt: 500, share: 0.9, status: 'shade' },
        { id: 'C1', roof: 'Carport', panels: 12, watt: 500, share: 1.0, status: 'ok' },
        { id: 'C2', roof: 'Carport', panels: 12, watt: 500, share: 0.98, status: 'ok' }
      ]
    };
  }
  var STATUS = { ok: ['Healthy', 'var(--zenith-good)'], clean: ['Needs cleaning', 'var(--zenith-warn)'], shade: ['Shaded after 3 pm', 'var(--zenith-warn)'], fault: ['Offline', 'var(--zenith-bad)'] };

  /* ---------- helpers ---------- */
  function svg(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function fmt(v, d) { return v.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function clock(h) {
    var hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh++; mm = 0; }
    var ap = hh >= 12 ? 'pm' : 'am', h12 = hh % 12 || 12;
    return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }
  function at(arr, h) {
    var x = (h - T0) / STEP, i = Math.floor(x);
    if (i < 0) return arr[0];
    if (i >= arr.length - 1) return arr[arr.length - 1];
    return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
  }
  function smooth(pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  var ICON = {
    sun: '<circle cx="24" cy="24" r="8"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8"/>',
    part: '<circle cx="19" cy="18" r="6.5"/><path d="M19 5.5v3M8.4 9.4l2 2M29.6 9.4l-2 2M6.5 18h3"/><path class="zn-wcl" d="M14 38h20a6 6 0 0 0 0-12 8 8 0 0 0-15.4-1.4A6.8 6.8 0 0 0 14 38z"/>',
    cloud: '<path class="zn-wcl" d="M12 36h24a7 7 0 0 0 0-14 10 10 0 0 0-19.2-2.2A8 8 0 0 0 12 36z"/><path class="zn-wcl" d="M18 42l-1.5 2.5M25 42l-1.5 2.5M32 42l-1.5 2.5"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    panel: '<path d="M6 5h12l2.5 10h-17z"/><path d="M4.8 10h14.4M10.2 5l-.9 10M13.8 5l.9 10M12 15v4M8.5 19.5h7"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    batt: '<rect x="3.5" y="7.5" width="15" height="9" rx="2.2"/><path d="M21 10.5v3M7 10.5v3M10.5 10.5v3"/>',
    grid: '<path d="M12 3.5L7.5 20.5M12 3.5l4.5 17M8.6 9h6.8M7.4 13.5h9.2M5 9h14M9 20.5h6"/>'
  };
  var CLOUD = 'M-15 8H15A6.5 6.5 0 0 0 14 -4.5A9 9 0 0 0 -2 -8A7 7 0 0 0 -14 -2A5 5 0 0 0 -15 8Z';

  /* ---------- model ---------- */
  function simulate(site, day, endH) {
    var cap = site.battery, soc = day.startSoc / 100 * cap, floor = cap * site.reserve;
    var r = { gen: 0, use: 0, imp: 0, exp: 0, direct: 0, charged: 0, dis: 0 };
    for (var i = 0; i < day.gen.length - 1; i++) {
      var h = T0 + i * STEP;
      if (h >= endH) break;
      var f = Math.min(1, (endH - h) / STEP);
      var g = (day.gen[i] + day.gen[i + 1]) / 2 * STEP * f, u = (day.use[i] + day.use[i + 1]) / 2 * STEP * f;
      r.gen += g; r.use += u; r.direct += Math.min(g, u);
      if (g > u) { var s = g - u, c = Math.min(s, cap - soc); soc += c; r.charged += c; r.exp += s - c; }
      else { var need = u - g, x = Math.min(need, Math.max(0, soc - floor)); soc -= x; r.dis += x; r.imp += need - x; }
    }
    r.soc = soc / cap * 100;
    r.self = r.use ? (r.use - r.imp) / r.use * 100 : 100;
    r.saved = (r.use - r.imp) * site.rate + r.exp * site.exportRate;
    return r;
  }
  function prepare(data) {
    var byId = {};
    data.days.forEach(function (d) {
      byId[d.id] = d;
      d.full = simulate(data.site, d, T1);
      d.end = d.now != null ? d.now : T1;
      d.fin = simulate(data.site, d, d.end);
    });
    var w = data.week;
    w.days.forEach(function (id, i) {
      var d = id && byId[id];
      if (!d) return;
      w.made[i] = Math.round(d.full.gen); w.used[i] = Math.round(d.full.use);
      w.self[i] = Math.round(d.fin.self); w.batt[i] = Math.round(d.fin.soc); w.saved[i] = Math.round(d.fin.saved * 10) / 10;
    });
    return byId;
  }
  function avgExcept(arr, i) { var s = 0, n = 0; arr.forEach(function (v, j) { if (j !== i && v != null) { s += v; n++; } }); return n ? s / n : 0; }

  /* ---------- mount ---------- */
  function mount(root, opts) {
    if (root.__zenith) return root.__zenith;
    opts = opts || {};
    var data = opts.data || demoData();
    var site = data.site, byId = prepare(data), id = 'zn' + (++uid);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return [].slice.call(root.querySelectorAll(s)); };
    var cur = site.currency || '$';
    var listeners = [];
    function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); }

    var st = { day: null, h: T0, from: T0, sweepT0: 0, sweepDur: 0, sweeping: false, hover: null, sort: null, q: '', grow: 1, growT0: 0, bubX: null, bubFrom: null, bubT0: 0, last: 0, rot: 0, dash: [0, 0, 0, 0] };

    /* theme + drawer */
    var themeBtn = $('[data-zn-theme]');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', String(t === 'light')); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
    }
    if (themeBtn) on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    var menuBtn = $('[data-zn-menu]'), scrim = $('.zn-scrim');
    function drawer(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    if (menuBtn) on(menuBtn, 'click', function () { drawer(!root.classList.contains('is-open')); });
    if (scrim) on(scrim, 'click', function () { drawer(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') drawer(false); });

    /* day switch */
    var dayBtns = $$('[data-day]'), ind = $('.zn-days-ind');
    function placeInd() {
      var b = dayBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0];
      if (b && ind) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    }
    dayBtns.forEach(function (b) { on(b, 'click', function () { setDay(b.getAttribute('data-day')); }); });

    /* ---------- sun chart ---------- */
    var sunWrap = $('[data-zn-sun]'), S = {};
    var tip = document.createElement('div'); tip.className = 'zn-tip'; tip.setAttribute('aria-hidden', 'true');
    if (sunWrap) sunWrap.appendChild(tip);
    function buildSun() {
      if (!sunWrap) return;
      var old = sunWrap.querySelector('svg'); if (old) old.remove();
      var W = sunWrap.clientWidth || 600, H = sunWrap.clientHeight || 280;
      var small = W < 520, L = small ? 30 : 38, R = small ? 8 : 14, top = 16, yb = H - 24;
      var maxKw = 45, pH = (yb - top) * 0.6;
      S = { W: W, H: H, L: L, R: R, yb: yb, top: top };
      S.X = function (h) { return L + (h - T0) / (T1 - T0) * (W - L - R); };
      S.Y = function (kw) { return yb - kw / maxKw * pH; };
      S.arcH = yb - top - 14;
      S.arcY = function (h) { var t = (h - site.sunrise) / (site.sunset - site.sunrise); return yb - S.arcH * Math.sin(Math.PI * clamp(t, 0, 1)); };
      var s = svg('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
      var defs = svg('defs', {}, s);
      var gl = svg('linearGradient', { id: id + 'gl', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-sun-2)' }, gl); svg('stop', { offset: 0.5, style: 'stop-color:var(--zenith-sun)' }, gl); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-cyan)' }, gl);
      var ga = svg('linearGradient', { id: id + 'ga', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-sun);stop-opacity:.42' }, ga); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-sun);stop-opacity:0' }, ga);
      var gs = svg('radialGradient', { id: id + 'gs' }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-sun);stop-opacity:.55' }, gs); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-sun);stop-opacity:0' }, gs);
      var gsky = svg('linearGradient', { id: id + 'sky', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-sun);stop-opacity:0' }, gsky); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-sun);stop-opacity:.07' }, gsky);
      S.clip = svg('rect', { x: 0, y: 0, width: 0, height: H }, svg('clipPath', { id: id + 'c' }, defs));
      S.clipF = svg('rect', { x: W, y: 0, width: W, height: H }, svg('clipPath', { id: id + 'f' }, defs));

      // grid + axes
      [0, 15, 30, 45].forEach(function (k) {
        var y = S.Y(k);
        svg('line', { class: 'zn-gridln', x1: L, x2: W - R, y1: y, y2: y }, s);
        svg('text', { class: 'zn-axis', x: L - 8, y: y + 4, 'text-anchor': 'end' }, s).textContent = k ? k + (small ? '' : ' kW') : '0';
      });
      for (var h = 6; h <= 18; h += small ? 4 : 3) {
        svg('text', { class: 'zn-axis', x: S.X(h), y: yb + 17, 'text-anchor': h === 6 ? 'start' : h === 18 ? 'end' : 'middle' }, s).textContent = h === 12 ? '12 pm' : (h % 12 || 12) + (h < 12 ? ' am' : ' pm');
      }
      // sky dome + arc
      var arcPts = [];
      for (var a = 0; a <= 48; a++) { var hh = site.sunrise + (site.sunset - site.sunrise) * a / 48; arcPts.push([S.X(hh), S.arcY(hh)]); }
      var arcD = smooth(arcPts);
      svg('path', { d: arcD + 'Z', fill: 'url(#' + id + 'sky)' }, s);
      svg('path', { class: 'zn-arc', d: arcD }, s);
      S.arcDone = svg('path', { class: 'zn-arc-done', d: arcD, 'clip-path': 'url(#' + id + 'c)' }, s);
      svg('line', { class: 'zn-horizon', x1: L, x2: W - R, y1: yb, y2: yb }, s);
      S.curveLayer = svg('g', {}, s); S.clouds = [];
      S.cloudLayer = svg('g', {}, s);
      // now marker
      S.nowG = svg('g', { opacity: 0 }, s);
      S.nowLine = svg('line', { class: 'zn-now', y1: top + 4, y2: yb }, S.nowG);
      S.nowLbl = svg('text', { class: 'zn-nowlbl', y: yb - 6, 'text-anchor': 'start' }, S.nowG);
      // sun
      S.drop = svg('line', { class: 'zn-drop' }, s);
      S.pt = svg('circle', { class: 'zn-pt', r: 4.5 }, s);
      S.sun = svg('g', {}, s);
      S.glow = svg('circle', { r: 30, fill: 'url(#' + id + 'gs)' }, S.sun);
      S.rays = svg('g', { class: 'zn-rays' }, S.sun);
      for (var r = 0; r < 8; r++) { var an = r * Math.PI / 4; svg('path', { d: 'M' + (Math.cos(an) * 13).toFixed(1) + ' ' + (Math.sin(an) * 13).toFixed(1) + 'L' + (Math.cos(an) * 17).toFixed(1) + ' ' + (Math.sin(an) * 17).toFixed(1) }, S.rays); }
      svg('circle', { class: 'zn-sunbody', r: 8.5 }, S.sun);
      // hover guide
      S.hov = svg('g', { opacity: 0 }, s);
      S.hovLine = svg('line', { class: 'zn-now', y1: top, y2: yb }, S.hov);
      S.hovPt = svg('circle', { class: 'zn-pt', r: 4 }, S.hov);
      sunWrap.insertBefore(s, tip);
      S.svg = s;
      if (st.day) { buildCurves(st.day, false); renderSun(); }
    }
    function buildCurves(day, fade) {
      if (!S.svg) return;
      var olds = [].slice.call(S.curveLayer.children);
      olds.forEach(function (g) { if (fade && !reduce) { g.classList.add('is-old'); if (g.firstChild) g.firstChild.removeAttribute('clip-path'); setTimeout(function () { g.remove(); }, 400); } else g.remove(); });
      // keep the old curves visible while fading: give them their own frozen clip
      var g = svg('g', { class: 'zn-curves' }, S.curveLayer);
      var gp = [], up = [];
      day.gen.forEach(function (v, i) { var h = T0 + i * STEP; gp.push([S.X(h), S.Y(v)]); up.push([S.X(h), S.Y(day.use[i])]); });
      var line = smooth(gp);
      var inner = svg('g', { 'clip-path': 'url(#' + id + 'c)' }, g);
      svg('path', { class: 'zn-area', d: line + 'L' + S.X(T1) + ' ' + S.yb + 'L' + S.X(T0) + ' ' + S.yb + 'Z', fill: 'url(#' + id + 'ga)' }, inner);
      svg('path', { class: 'zn-useline', d: smooth(up) }, inner);
      svg('path', { class: 'zn-genline', d: line, stroke: 'url(#' + id + 'gl)' }, inner);
      S.fc = svg('path', { class: 'zn-fcline', d: line, 'clip-path': 'url(#' + id + 'f)' }, g);
      // clouds
      S.cloudLayer.textContent = '';
      S.clouds = [];
      (day.clouds || []).forEach(function (c) {
        if (c[2] < 0.15) return;
        var sc = 0.75 + c[2] * 0.9, x = S.X(c[0]), y = S.arcY(c[0]) - 4;
        var cg = svg('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')', opacity: 0 }, S.cloudLayer);
        var inner2 = svg('g', {}, cg);
        svg('path', { class: 'zn-cloud', d: CLOUD, transform: 'scale(' + sc.toFixed(2) + ')' }, inner2);
        S.clouds.push({ g: cg, inner: inner2, at: c[0], x: x, y: y, seed: Math.random() * 6 });
      });
      S.curveDay = day;
    }
    function renderSun() {
      if (!S.svg || !st.day) return;
      var day = st.day, h = st.h, x = S.X(h);
      S.clip.setAttribute('x', S.X(T0) - 3);
      S.clip.setAttribute('width', Math.max(0, x - S.X(T0) + 3));
      var kw = at(day.gen, h), py = S.Y(kw);
      var up = h > site.sunrise && h < site.sunset;
      var sy = up ? S.arcY(h) : S.yb + 12;
      var near = Math.min(clamp((h - site.sunrise) / 0.35, 0, 1), clamp((site.sunset - h) / 0.35, 0, 1));
      var cf = cloudF(day.clouds || [], h);
      S.sun.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + sy.toFixed(1) + ')');
      S.sun.setAttribute('opacity', (near * (0.45 + 0.55 * cf)).toFixed(3));
      S.glow.setAttribute('r', (18 + 16 * cf).toFixed(1));
      S.drop.setAttribute('x1', x); S.drop.setAttribute('x2', x); S.drop.setAttribute('y1', sy + 12); S.drop.setAttribute('y2', py - 6);
      S.drop.setAttribute('opacity', up && py - 6 > sy + 12 ? 0.7 * near : 0);
      S.pt.setAttribute('cx', x); S.pt.setAttribute('cy', py);
      S.pt.setAttribute('opacity', st.hover == null ? 1 : 0.35);
      S.clouds.forEach(function (c) {
        var d = (c.at - h);
        var o = clamp(1 - (d - 0.4) / 1.4, 0, 1);
        c.g.setAttribute('opacity', (reduce ? 1 : o).toFixed(3));
      });
      var showNow = day.now != null && !st.sweeping;
      S.nowG.setAttribute('opacity', showNow ? 1 : 0);
      if (day.now != null) {
        var nx = S.X(day.now);
        S.nowLine.setAttribute('x1', nx); S.nowLine.setAttribute('x2', nx);
        S.nowLbl.setAttribute('x', nx + 6); S.nowLbl.textContent = 'Now ' + clock(day.now);
        S.clipF.setAttribute('x', nx);
      } else S.clipF.setAttribute('x', S.W);
      if (S.fc) S.fc.classList.toggle('is-on', showNow);
    }
    function showHover(h) {
      if (!st.day || st.sweeping || !S.svg) return;
      var day = st.day, lim = day.now != null ? day.now : T1;
      h = clamp(Math.round(h * 4) / 4, T0, lim);
      st.hover = h;
      var x = S.X(h), g = at(day.gen, h), u = at(day.use, h), y = S.Y(g);
      S.hov.setAttribute('opacity', 1);
      S.hovLine.setAttribute('x1', x); S.hovLine.setAttribute('x2', x);
      S.hovPt.setAttribute('cx', x); S.hovPt.setAttribute('cy', y);
      tip.innerHTML = '<b>' + clock(h) + '</b><span><i style="--c:var(--zenith-sun)"></i>Solar ' + fmt(g, 1) + ' kW</span><span><i style="--c:var(--zenith-peri)"></i>Site ' + fmt(u, 1) + ' kW</span>';
      tip.classList.add('is-on');
      var tw = tip.offsetWidth, tx = x + 12; if (tx + tw > S.W) tx = x - tw - 12;
      tip.style.transform = 'translate(' + tx + 'px,' + Math.max(0, Math.min(y - 30, S.H - 80)) + 'px)';
      renderSun();
    }
    function hideHover() { st.hover = null; if (S.hov) S.hov.setAttribute('opacity', 0); tip.classList.remove('is-on'); renderSun(); }
    if (sunWrap) {
      on(sunWrap, 'pointermove', function (e) { var r = sunWrap.getBoundingClientRect(); showHover(T0 + (e.clientX - r.left - S.L) / (S.W - S.L - S.R) * (T1 - T0)); });
      on(sunWrap, 'pointerleave', hideHover);
      on(sunWrap, 'blur', hideHover);
      on(sunWrap, 'keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var base = st.hover != null ? st.hover : (st.day.now != null ? st.day.now : 12);
        showHover(base + (e.key === 'ArrowRight' ? 0.25 : -0.25));
      });
    }

    /* ---------- flow ---------- */
    var flowEl = $('[data-zn-flow]'), F = {};
    function buildFlow() {
      if (!flowEl) return;
      var s = svg('svg', { viewBox: '0 0 320 262', role: 'img', 'aria-label': 'Energy flow between solar, site, battery and grid' });
      var defs = svg('defs', {}, s);
      var hg = svg('linearGradient', { id: id + 'hub', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-sun-2)' }, hg); svg('stop', { offset: 0.5, style: 'stop-color:var(--zenith-sun)' }, hg); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-cyan)' }, hg);
      var nodes = [
        { k: 'solar', x: 160, y: 36, ic: 'panel', c: 'var(--zenith-sun)', name: 'Solar', path: 'M160 62 Q166 86 160 106', lx: 194, ly: 32, la: 'start' },
        { k: 'home', x: 280, y: 131, ic: 'home', c: 'var(--zenith-peri)', name: 'Site', path: 'M184 131 Q220 123 254 131', lx: 280, ly: 172, la: 'middle' },
        { k: 'batt', x: 160, y: 226, ic: 'batt', c: 'var(--zenith-good)', name: 'Battery', path: 'M160 155 Q154 178 160 200', lx: 194, ly: 222, la: 'start' },
        { k: 'grid', x: 40, y: 131, ic: 'grid', c: 'var(--zenith-cyan)', name: 'Grid', path: 'M136 131 Q100 139 66 131', lx: 40, ly: 172, la: 'middle' }
      ];
      F.lines = [];
      nodes.forEach(function (n) {
        svg('path', { class: 'zn-fpath', d: n.path }, s);
        var dsh = svg('path', { class: 'zn-fdash', d: n.path, style: 'stroke:' + n.c }, s);
        F.lines.push(dsh);
      });
      nodes.forEach(function (n) {
        var g = svg('g', { class: 'zn-node', style: '--c:' + n.c }, s);
        svg('circle', { cx: n.x, cy: n.y, r: 25 }, g);
        var ic = svg('svg', { class: 'zn-ic', x: n.x - 11, y: n.y - 11, width: 22, height: 22, viewBox: '0 0 24 24' }, g);
        ic.innerHTML = ICON[n.ic];
        var t1 = svg('text', { x: n.lx, y: n.ly, 'text-anchor': n.la }, g); t1.textContent = n.name;
        var t2 = svg('text', { class: 'zn-nval', x: n.lx, y: n.ly + 16, 'text-anchor': n.la }, g);
        F[n.k] = t2;
      });
      var hub = svg('g', { class: 'zn-hub' }, s);
      svg('circle', { cx: 160, cy: 131, r: 23, fill: 'url(#' + id + 'hub)' }, hub);
      var hi = svg('svg', { class: 'zn-ic', x: 149, y: 120, width: 22, height: 22, viewBox: '0 0 24 24', style: 'color:#fff' }, hub);
      hi.innerHTML = ICON.bolt;
      flowEl.appendChild(s);
    }
    var flowList = $('[data-zn-flowlist]'), flowNote = $('[data-zn-flownote]');
    function renderFlow(r, h) {
      if (!F.solar) return;
      F.solar.textContent = fmt(r.gen) + ' kWh';
      F.home.textContent = fmt(r.use) + ' kWh';
      F.batt.textContent = fmt(r.soc) + '%';
      var net = r.exp - r.imp;
      F.grid.textContent = (net >= 0 ? '+' : '−') + fmt(Math.abs(net)) + ' kWh';
      if (flowList) flowList.innerHTML =
        '<li><b>' + fmt(r.direct) + ' kWh</b>Used on site</li><li><b>' + fmt(r.charged) + ' kWh</b>Into battery</li>' +
        '<li><b>' + fmt(r.exp) + ' kWh</b>Sold to grid</li><li><b>' + fmt(r.imp) + ' kWh</b>Bought from grid</li>';
      // instantaneous power drives the dash speed (past days: their midday flow)
      var day = st.day, hh = st.sweeping || day.now != null ? h : 12.5;
      var g = at(day.gen, hh), u = at(day.use, hh), sur = g - u, batt = 0, grid = 0;
      if (sur > 0) { batt = r.soc < 99.5 ? sur : 0; grid = sur - batt; }
      else { batt = r.soc > site.reserve * 100 + 0.5 ? sur : 0; grid = sur - batt; }
      F.speed = [g, u, batt, grid];
    }
    function tickFlow(dt) {
      if (!F.lines || !F.speed) return;
      // paths run solar→hub, hub→site, hub→battery (+ charging), hub→grid (+ export)
      for (var i = 0; i < 4; i++) {
        var v = F.speed[i], live = Math.abs(v) > 0.2;
        if (!reduce) {
          var speed = clamp(Math.abs(v), 0, 40) * 1.4 + (live ? 9 : 0);
          st.dash[i] = (st.dash[i] - Math.sign(v) * speed * dt) % 1400;
          F.lines[i].style.strokeDashoffset = st.dash[i].toFixed(1);
        }
        F.lines[i].style.opacity = live ? 1 : 0.15;
      }
    }

    /* ---------- week ---------- */
    var weekEl = $('[data-zn-week]'), Wk = {};
    function buildWeek() {
      if (!weekEl) return;
      weekEl.textContent = '';
      var W = weekEl.clientWidth || 300, H = weekEl.clientHeight || 240, L = 30, R = 4, top = 30, yb = H - 22;
      var w = data.week, n = w.labels.length, max = 0;
      w.made.concat(w.used).forEach(function (v) { if (v > max) max = v; });
      max = Math.ceil(max / 100) * 100;
      var s = svg('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Solar made vs site used over the last seven days' });
      var defs = svg('defs', {}, s);
      var wg = svg('linearGradient', { id: id + 'wg', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, style: 'stop-color:var(--zenith-cyan)' }, wg); svg('stop', { offset: 1, style: 'stop-color:var(--zenith-blue)' }, wg);
      for (var k = 0; k <= 4; k++) {
        var v = max * k / 4, y = yb - (yb - top) * k / 4;
        svg('line', { class: 'zn-gridln', x1: L, x2: W - R, y1: y, y2: y }, s);
        svg('text', { class: 'zn-axis', x: L - 7, y: y + 4, 'text-anchor': 'end' }, s).textContent = fmt(v);
      }
      var gw = (W - L - R) / n, bw = clamp(gw * 0.27, 6, 15);
      Wk = { s: s, days: [], yb: yb, top: top, max: max, H: yb - top };
      for (var i = 0; i < n; i++) {
        var cx = L + gw * (i + 0.5);
        var g = svg('g', { class: 'zn-wday' }, s);
        var fc = svg('rect', { class: 'zn-bar-fc', x: cx - bw - 1.5, width: bw, rx: Math.min(4, bw / 2), fill: 'url(#' + id + 'wg)' }, g);
        var mb = svg('rect', { class: 'zn-bar-made', x: cx - bw - 1.5, width: bw, rx: Math.min(4, bw / 2), fill: 'url(#' + id + 'wg)' }, g);
        var ub = svg('rect', { class: 'zn-bar-used', x: cx + 1.5, width: bw, rx: Math.min(4, bw / 2) }, g);
        var lb = svg('text', { class: 'zn-wlbl', x: cx, y: yb + 16 }, g); lb.textContent = w.labels[i];
        var tt = svg('title', {}, g); tt.textContent = w.labels[i] + ': made ' + w.made[i] + ' kWh, used ' + w.used[i] + ' kWh';
        Wk.days.push({ g: g, fc: fc, mb: mb, ub: ub, cx: cx, bw: bw });
      }
      Wk.bub = svg('g', { class: 'zn-wbub' }, s);
      Wk.bubR = svg('rect', { height: 20, rx: 6, y: -24 }, Wk.bub);
      Wk.bubT = svg('text', { y: -10 }, Wk.bub);
      svg('path', { d: 'M-4 -4.5L0 0L4 -4.5Z', style: 'fill:var(--zenith-text)' }, Wk.bub);
      weekEl.appendChild(s);
      var tm = 0; w.made.forEach(function (v) { tm += v; });
      var wm = $('[data-zn-wmade]'), wc = $('[data-zn-wco2]');
      if (wm) wm.textContent = fmt(tm) + ' kWh'; if (wc) wc.textContent = fmt(tm * 0.71 / 1000, 2) + ' t';
      st.bubX = null;
      renderWeek(performance.now());
    }
    function renderWeek(now) {
      if (!Wk.days || !st.day) return;
      var w = data.week, selIdx = w.days.indexOf(st.day.id);
      var gp = st.growT0 ? clamp((now - st.growT0) / 1100, 0, 1) : 1;
      Wk.days.forEach(function (d, i) {
        var p = reduce ? 1 : easeOut(clamp((gp * 1100 - i * 70) / 700, 0, 1));
        var made = w.made[i], used = w.used[i], dd = w.days[i] && byId[w.days[i]];
        var solid = made;
        if (dd && dd.now != null) solid = dd.fin.gen;
        var hM = solid / Wk.max * Wk.H * p, hF = made / Wk.max * Wk.H * p, hU = used / Wk.max * Wk.H * p;
        d.mb.setAttribute('y', Wk.yb - hM); d.mb.setAttribute('height', Math.max(0, hM));
        d.fc.setAttribute('y', Wk.yb - hF); d.fc.setAttribute('height', Math.max(0, hF));
        d.ub.setAttribute('y', Wk.yb - hU); d.ub.setAttribute('height', Math.max(0, hU));
        d.g.classList.toggle('is-sel', i === selIdx);
        d.g.classList.toggle('is-dim', selIdx >= 0 && i !== selIdx);
      });
      if (selIdx >= 0) {
        var d = Wk.days[selIdx], dayObj = st.day;
        var target = d.cx, val = dayObj.now != null ? fmt(dayObj.fin.gen) + ' so far' : fmt(w.made[selIdx]) + ' kWh';
        if (st.bubX == null) { st.bubX = target; st.bubFrom = target; }
        if (st.bubTarget !== target) { st.bubFrom = st.bubX; st.bubTarget = target; st.bubT0 = now; }
        var bp = reduce ? 1 : ease(clamp((now - st.bubT0) / 600, 0, 1));
        st.bubX = st.bubFrom + (target - st.bubFrom) * bp;
        var topY = Wk.yb - w.made[selIdx] / Wk.max * Wk.H * (reduce ? 1 : easeOut(clamp((gp * 1100 - selIdx * 70) / 700, 0, 1))) - 6;
        Wk.bubT.textContent = val;
        var tw = Wk.bubT.getComputedTextLength ? Wk.bubT.getComputedTextLength() + 14 : 60;
        var minX = tw / 2 + 2, maxX = (weekEl.clientWidth || 300) - tw / 2 - 2;
        var bx = clamp(st.bubX, minX, maxX);
        Wk.bubR.setAttribute('width', tw);
        Wk.bubR.setAttribute('x', bx - st.bubX - tw / 2);
        Wk.bubT.setAttribute('x', bx - st.bubX);
        Wk.bub.setAttribute('transform', 'translate(' + st.bubX.toFixed(1) + ' ' + topY.toFixed(1) + ')');
        Wk.bub.setAttribute('opacity', gp > 0.5 ? 1 : 0);
      }
    }

    /* ---------- KPIs ---------- */
    var kpis = {};
    $$('[data-zn-kpi]').forEach(function (k) { kpis[k.getAttribute('data-zn-kpi')] = { val: k.querySelector('.zn-kpi-val'), delta: k.querySelector('.zn-delta'), dtxt: k.querySelector('.zn-delta span'), spark: k.querySelector('.zn-spark') }; });
    function setDelta(k, v, unit) {
      if (!k) return;
      k.delta.classList.toggle('is-down', v < 0);
      k.dtxt.textContent = (v < 0 ? '' : '+') + fmt(v, Math.abs(v) < 10 && unit === '%' ? 1 : 0) + (unit === '%' ? '%' : ' pt');
    }
    function drawSpark(k, arr, idx) {
      if (!k || !k.spark) return;
      var s = k.spark; s.textContent = '';
      var mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), rg = mx - mn || 1;
      var pts = arr.map(function (v, i) { return [2 + i * 80 / (arr.length - 1), 26 - (v - mn) / rg * 22]; });
      var d = smooth(pts);
      svg('path', { class: 'zn-sp-area', d: d + 'L82 30L2 30Z' }, s);
      svg('path', { d: d }, s);
      if (idx >= 0) svg('circle', { cx: pts[idx][0], cy: pts[idx][1], r: 3.2 }, s);
    }
    function renderKpis(r) {
      var day = st.day;
      if (kpis.gen) kpis.gen.val.innerHTML = fmt(r.gen) + '<small>kWh</small>';
      if (kpis.self) kpis.self.val.innerHTML = fmt(r.self) + '<small>%</small>';
      if (kpis.batt) kpis.batt.val.innerHTML = fmt(r.soc) + '<small>%</small>';
      if (kpis.saved) kpis.saved.val.innerHTML = cur + fmt(r.saved, 2);
      var so = $('[data-zn-sofar]'); if (so) so.textContent = fmt(r.gen);
    }
    function dayStatic(day) {
      var w = data.week, i = w.days.indexOf(day.id);
      var gAvg = avgExcept(w.made, i), sAvg = avgExcept(w.self, i), vAvg = avgExcept(w.saved, i);
      setDelta(kpis.gen, (day.full.gen - gAvg) / gAvg * 100, '%');
      setDelta(kpis.self, day.fin.self - sAvg, 'pt');
      setDelta(kpis.batt, day.fin.soc - day.startSoc, 'pt');
      setDelta(kpis.saved, (day.full.saved - vAvg) / vAvg * 100, '%');
      var sn = kpis.saved && kpis.saved.val.parentNode.querySelector('.zn-kpi-note'); if (sn) sn.textContent = day.now != null ? 'forecast vs avg' : 'vs 7-day avg';
      if (kpis.gen) kpis.gen.val.parentNode.querySelector('.zn-kpi-note').textContent = day.now != null ? 'forecast vs avg' : 'vs 7-day avg';
      drawSpark(kpis.gen, w.made, i); drawSpark(kpis.self, w.self, i); drawSpark(kpis.batt, w.batt, i); drawSpark(kpis.saved, w.saved, i);
      $$('[data-zn-dayname]').forEach(function (n) { n.textContent = day.now != null ? day.name : day.date; });
      var lbl = $('[data-zn-sofar-label]'); if (lbl) lbl.textContent = day.now != null ? 'Generated so far' : 'Generated that day';
      if (flowNote) flowNote.textContent = day.now != null ? 'Energy so far today' : 'Energy on ' + day.date;
      // weather card
      var wx = day.weather || {};
      var set = function (sel, v) { var n = $(sel); if (n) n.textContent = v; };
      set('[data-zn-wdate]', day.date); set('[data-zn-wtemp]', wx.temp + '°'); set('[data-zn-wsky]', wx.sky); set('[data-zn-wuv]', wx.uv);
      var wi = $('[data-zn-wicon]'); if (wi) wi.innerHTML = '<svg viewBox="0 0 48 48">' + (ICON[wx.icon] || ICON.sun) + '</svg>';
      if (sunWrap) sunWrap.setAttribute('aria-label', 'Solar output on ' + day.date + ': ' + fmt(day.fin.gen) + ' kWh generated' + (day.now != null ? ' by ' + clock(day.now) : '') + ', peak ' + fmt(Math.max.apply(null, day.gen), 1) + ' kW. Use arrow keys to read values by time.');
    }

    /* ---------- table ---------- */
    var tbody = $('[data-zn-table] tbody'), search = $('[data-zn-search]');
    function renderTable() {
      if (!tbody || !st.day) return;
      var day = st.day, tot = 0;
      data.strings.forEach(function (s) { tot += s.share; });
      var rows = data.strings.map(function (s) {
        return { s: s, yield: day.fin.gen * s.share / tot, perf: Math.round(s.share * 96 * (0.93 + 0.07 * cloudF(day.clouds || [], 12))) };
      }).filter(function (r) { var q = st.q; return !q || (r.s.id + ' ' + r.s.roof + ' ' + (STATUS[r.s.status] || [''])[0]).toLowerCase().indexOf(q) >= 0; });
      if (st.sort) rows.sort(function (a, b) { return (a[st.sort.k] - b[st.sort.k]) * st.sort.dir; });
      if (!rows.length) { tbody.innerHTML = '<tr class="zn-empty"><td colspan="5">No strings match “' + st.q.replace(/[<>&"]/g, '') + '”</td></tr>'; return; }
      tbody.innerHTML = rows.map(function (r) {
        var stt = STATUS[r.s.status] || STATUS.ok;
        return '<tr><td><div class="zn-str"><i>' + r.s.id + '</i><span><b>String ' + r.s.id + '</b><small>' + r.s.roof + '</small></span></div></td>' +
          '<td class="zn-col-panels">' + r.s.panels + ' × ' + r.s.watt + ' W</td>' +
          '<td><b>' + fmt(r.yield, 1) + '</b> kWh</td>' +
          '<td class="zn-col-perf"><div class="zn-perf"><div class="zn-pbar' + (r.perf < 88 ? ' is-low' : '') + '"><span style="transform:scaleX(0)" data-p="' + r.perf + '"></span></div>' + r.perf + '%</div></td>' +
          '<td class="zn-col-st"><span class="zn-pill" style="--c:' + stt[1] + '">' + stt[0] + '</span></td></tr>';
      }).join('');
      requestAnimationFrame(function () { [].forEach.call(tbody.querySelectorAll('[data-p]'), function (b) { b.style.transform = 'scaleX(' + (b.getAttribute('data-p') / 100) + ')'; }); });
    }
    if (search) on(search, 'input', function () { st.q = search.value.trim().toLowerCase(); renderTable(); });
    $$('[data-zn-table] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () {
        var th = b.parentNode, k = th.getAttribute('data-sort');
        var dir = st.sort && st.sort.k === k ? -st.sort.dir : -1;
        st.sort = { k: k, dir: dir };
        $$('[data-zn-table] th[data-sort]').forEach(function (t) { t.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
        renderTable();
      });
    });

    /* ---------- day switch + loop ---------- */
    function setDay(did, intro) {
      var day = byId[did] || data.days[0];
      var same = st.day === day;
      st.day = day;
      dayBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-day') === day.id)); });
      placeInd();
      hideHover();
      dayStatic(day);
      if (!same || intro) buildCurves(day, !intro);
      renderTable();
      st.from = T0; st.h = T0;
      st.sweepDur = reduce ? 0 : 2500;
      st.sweepT0 = performance.now();
      st.sweeping = !reduce;
      if (intro) st.growT0 = performance.now();
      if (reduce) { st.h = day.end; st.sweeping = false; }
      frame(performance.now());
    }
    var raf = 0;
    function frame(now) {
      var dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0; st.last = now;
      var day = st.day;
      if (day) {
        if (st.sweeping) {
          var p = clamp((now - st.sweepT0) / st.sweepDur, 0, 1);
          st.h = T0 + (day.end - T0) * ease(p);
          if (p >= 1) { st.sweeping = false; st.h = day.end; }
        }
        var r = st.h >= day.end - 1e-6 ? day.fin : simulate(site, day, st.h);
        renderSun(); renderKpis(r); renderFlow(r, st.h);
        if (!reduce) { st.rot += dt * 22; if (S.rays) S.rays.setAttribute('transform', 'rotate(' + st.rot.toFixed(1) + ')'); }
        if (S.clouds) S.clouds.forEach(function (c) { c.inner.setAttribute('transform', 'translate(' + (reduce ? 0 : Math.sin(now / 1400 + c.seed) * 3).toFixed(2) + ' 0)'); });
        tickFlow(dt);
        renderWeek(now);
      }
    }
    function loop(now) { frame(now); raf = requestAnimationFrame(loop); }

    buildSun(); buildFlow(); buildWeek();
    var ro = window.ResizeObserver ? new ResizeObserver(function () {
      var w1 = sunWrap ? sunWrap.clientWidth : 0, w2 = weekEl ? weekEl.clientWidth : 0;
      var h2 = weekEl ? weekEl.clientHeight : 0, h1 = sunWrap ? sunWrap.clientHeight : 0;
      if (w1 !== S.W || h1 !== S.H) buildSun();
      if (Wk.s && (w2 !== +Wk.s.getAttribute('width') || h2 !== +Wk.s.getAttribute('height'))) buildWeek();
      placeInd();
    }) : null;
    if (ro) { if (sunWrap) ro.observe(sunWrap); if (weekEl) ro.observe(weekEl); ro.observe(root); }
    on(window, 'resize', placeInd);

    setDay(opts.day || data.days[0].id, true);
    raf = requestAnimationFrame(loop);
    if (opts.theme) setTheme(opts.theme);

    var api = {
      setDay: function (d) { setDay(d); },
      replay: function () { setDay(st.day.id, true); },
      setTheme: setTheme,
      get day() { return st.day.id; },
      destroy: function () {
        cancelAnimationFrame(raf); if (ro) ro.disconnect();
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        delete root.__zenith;
      }
    };
    root.__zenith = api;
    return api;
  }

  window.Zenith = { mount: mount, get data() { return demoData(); } };
  function auto() {
    [].forEach.call(document.querySelectorAll('[data-zenith]:not([data-zenith-manual])'), function (el) { mount(el, { day: el.getAttribute('data-zenith') || undefined }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
