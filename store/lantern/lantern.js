/* Lantern — hotel front-desk dashboard template · Kodehelix UI · kodehelix.in
   Lantern.mount(el, { night: 'tonight', data: {...} }) → { setNight, replay, select, setTheme, destroy }
   Elements with [data-lantern] auto-mount unless [data-lantern-manual] is present. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', uid = 0;

  /* ---------- helpers ---------- */
  function rng(s) { return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fmt(v, d) { return v.toLocaleString('en-GB', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function hhmm(h) { var m = Math.round(h * 60); return ('0' + (Math.floor(m / 60) % 24)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function rgbA(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mixA(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
  function css(a) { return 'rgb(' + a.map(Math.round).join(',') + ')'; }
  function svg(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) {
      var v = attrs[k];
      if (typeof v === 'string' && v.indexOf('var(') === 0) el.style.setProperty(k, v); else el.setAttribute(k, v);
    }
    if (parent) parent.appendChild(el);
    return el;
  }
  function shuffle(a, R) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  function smooth(p) {
    if (p.length < 2) return '';
    var d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- demo data (fictional) ---------- */
  var CHANNELS = [
    { id: 'direct', name: 'Direct web', color: 'var(--lantern-cyan)' },
    { id: 'ota', name: 'Online agencies', color: 'var(--lantern-blue)' },
    { id: 'corp', name: 'Corporate', color: 'var(--lantern-peri)' },
    { id: 'phone', name: 'Phone & walk-in', color: 'var(--lantern-glow)' }
  ];
  var NAMES = ['Ana Ribeiro', 'Tomás Duarte', 'Lena Hoffmann', 'Kenji Mori', 'Priya Nair', 'Lucas Martin', 'Sofia Esposito', 'Daniel Okafor', 'Emma Larsen', 'Mateo Gómez',
    'Aisha Rahman', 'Oliver Grant', 'Inês Carvalho', 'Noah Fischer', 'Maya Cohen', 'Hugo Lefèvre', 'Chloé Dubois', 'Arjun Mehta', 'Freya Nilsson', 'Rafael Costa',
    'Zara Ahmed', 'Leo Novak', 'Mila Petrova', 'Sam Whitaker', 'Yuki Tanaka', 'Clara Weiss', 'Diego Navarro', 'Hannah Brooks', 'Omar Haddad', 'Elif Yilmaz',
    'Jonas Berg', 'Nora Lindqvist', 'Ivy Chen', 'Marco Bianchi', 'Ruth Adeyemi', 'Felix Wagner', 'Julia Sousa', 'Theo Laurent', 'Anya Volkova', 'Ben Carter',
    'Laila Haidari', 'Pedro Alves', 'Grace Kim', 'Viktor Horvat', 'Isla Murray', 'Kofi Mensah', 'Lucía Romero', 'Ethan Shaw', 'Amara Diallo', 'Henrik Dahl',
    'Sara Lopes', 'Ravi Iyer', 'Lotte de Vries', 'Mei Lin', 'Adam Kowalski', 'Bea Santos', 'Karim Saleh', 'Olivia Reed', 'Tariq Aziz', 'Nina Hartmann'];

  function demoData() {
    var R = rng(9137), used = 0;
    var rooms = [];
    for (var f = 1; f <= 6; f++) for (var c = 0; c < 7; c++) rooms.push({ no: f * 100 + c + 1, floor: f, col: c, type: f === 6 ? 'Suite' : f >= 4 ? 'Deluxe' : 'Classic' });
    var mult = { Classic: 0.86, Deluxe: 1.08, Suite: 1.62 };
    var base = [0.66, 0.62, 0.69, 0.8, 0.92, 0.96, 0.74], series = [], t0 = Date.UTC(2026, 9, 24);
    for (var i = 0; i < 30; i++) {
      var d = new Date(t0 + i * 864e5), wd = (d.getUTCDay() + 6) % 7;
      var occ = clamp(base[wd] + (R() - 0.5) * 0.09, 0.4, 0.99);
      if (i > 21) occ *= 1 - 0.05 * (i - 21);
      series.push({ date: d.toISOString().slice(0, 10), occ: Math.round(occ * 1000) / 1000, adr: Math.round(126 + 74 * (occ - 0.55) + (R() - 0.5) * 14) });
    }
    function chan() { var r = R(); return r < 0.34 ? 'direct' : r < 0.72 ? 'ota' : r < 0.88 ? 'corp' : 'phone'; }
    var defs = [
      { id: 'tonight', label: 'Tonight', idx: 19, now: 19 + 40 / 60, ooo: [213, 405], arrivals: 12 },
      { id: 'fri', label: 'Fri 13', idx: 20, ooo: [213] },
      { id: 'sat', label: 'Sat 14', idx: 21, ooo: [213] }
    ];
    var nights = [], prev = null;
    defs.forEach(function (nd) {
      var sell = rooms.filter(function (r) { return nd.ooo.indexOf(r.no) < 0; });
      var target = Math.round(series[nd.idx].occ * sell.length), taken = {}, books = [];
      function book(room, arrive, n) {
        return { room: room.no, guest: NAMES[used++ % NAMES.length], channel: chan(), arrive: arrive, nights: n,
          party: R() < 0.55 ? 2 : R() < 0.6 ? 1 : 3, rate: Math.round(series[nd.idx].adr * mult[room.type] * (0.9 + R() * 0.2)) };
      }
      if (prev) prev.books.forEach(function (b) { if (b.arrive + b.nights > nd.idx && nd.ooo.indexOf(b.room) < 0) { books.push(b); taken[b.room] = 1; } });
      var free = shuffle(sell.filter(function (r) { return !taken[r.no]; }), R);
      var arr = prev ? Math.max(0, target - books.length) : nd.arrivals;
      if (!prev) for (var k = 0; k < target - arr; k++) { var back = 1 + Math.floor(R() * 3); books.push(book(free.shift(), nd.idx - back, back + 1 + Math.floor(R() * 3))); }
      for (k = 0; k < arr && free.length; k++) {
        var n = R() < 0.3 ? 1 : R() < 0.55 ? 2 : R() < 0.65 ? 3 : 4 + Math.floor(R() * 3);
        var b = book(free.shift(), nd.idx, n); b.eta = 12.5 + Math.floor(R() * 42) / 4; books.push(b);
      }
      var stays = books.map(function (b) {
        var arriving = b.arrive === nd.idx, s = { room: b.room, guest: b.guest, channel: b.channel, nights: b.nights, night: nd.idx - b.arrive + 1, party: b.party, rate: b.rate, arriving: arriving };
        if (arriving) {
          s.eta = b.eta;
          if (nd.now != null) s.status = b.eta <= nd.now - 0.4 ? 'in' : b.eta <= nd.now ? 'late' : 'due';
          else s.status = R() < 0.18 ? 'hold' : 'conf';
        } else s.status = 'stay';
        var lit = s.status === 'in' || s.status === 'stay' || s.status === 'conf' || s.status === 'hold';
        if (lit) s.light = arriving ? Math.min(b.eta + 0.2 + R() * 0.4, nd.now != null ? nd.now - 0.05 : 23) : 16.1 + R() * (nd.now != null ? 3.3 : 5.6);
        return s;
      });
      nights.push({ id: nd.id, label: nd.label, index: nd.idx, now: nd.now != null ? nd.now : null, ooo: nd.ooo, stays: stays });
      prev = { books: books };
    });
    return {
      hotel: { name: 'Casa Alfama', city: 'Lisbon', currency: '€' },
      rooms: rooms, series: series, today: 19, nights: nights, channels: CHANNELS
    };
  }

  /* derive KPIs from the raw data */
  function prepare(data) {
    var total = data.rooms.length, chans = data.channels || CHANNELS, byId = {};
    var roomBy = {}; data.rooms.forEach(function (r) { roomBy[r.no] = r; });
    data.nights.forEach(function (n) {
      var sell = total - n.ooo.length, rev = 0, cnt = {};
      chans.forEach(function (c) { cnt[c.id] = 0; });
      n.stays.forEach(function (s) { rev += s.rate; cnt[s.channel] = (cnt[s.channel] || 0) + 1; });
      n.booked = n.stays.length; n.sellable = sell; n.rev = rev;
      n.occ = n.booked / sell; n.adr = n.booked ? rev / n.booked : 0; n.revpar = rev / total;
      n.chan = chans.map(function (c) { return cnt[c.id] || 0; });
      n.byRoom = {}; n.stays.forEach(function (s) { n.byRoom[s.room] = s; });
      var sr = data.series[n.index]; if (sr) { sr.occ = n.occ; sr.adr = Math.round(n.adr); sr.sellable = sell; }
      byId[n.id] = n;
    });
    data.series.forEach(function (s) {
      var sell = s.sellable || total - 1;
      s.rev = s.occ * sell * s.adr; s.revpar = s.rev / total;
    });
    data._roomBy = roomBy;
    return byId;
  }

  var STATUS = {
    stay: ['In house', 'var(--lantern-glow)'], in: ['Checked in', 'var(--lantern-good)'], due: ['Arriving', 'var(--lantern-due)'],
    late: ['Running late', 'var(--lantern-warn)'], conf: ['Confirmed', 'var(--lantern-peri)'], hold: ['Card pending', 'var(--lantern-warn)']
  };

  /* scene palette: [day, night] */
  var PAL = {
    skyTop: ['#5B86C9', '#060918'], skyBot: ['#F2C08C', '#1C2350'], wall: ['#D99A74', '#2A2B44'], band: ['#F3E3CF', '#3B3D57'],
    glass: ['#86A5C8', '#121524'], frame: ['#FBF3E8', '#4D5170'], street: ['#5A5D6C', '#12141E'], walk: ['#8A8C99', '#1C1F2C'],
    nL: ['#9CB8CC', '#1B2034'], nR: ['#E9C877', '#232338'], roof: ['#B4624A', '#2A1F2C']
  };
  Object.keys(PAL).forEach(function (k) { PAL[k] = PAL[k].map(rgbA); });
  var SUNSET = rgbA('#FF8752');

  /* ---------- mount ---------- */
  function mount(root, opts) {
    if (root.__lantern) return root.__lantern;
    opts = opts || {};
    var data = opts.data || demoData();
    var byId = prepare(data), id = 'ln' + (++uid), cur = (data.hotel && data.hotel.currency) || '€';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return [].slice.call(root.querySelectorAll(s)); };
    var listeners = [], raf = 0, alive = true;
    function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); }
    var st = { night: null, h: 16, a: null, sel: null, sort: { key: 'eta', dir: 1 }, q: '', kpi: null, hlX: null, hlV: 0, hlT: 0, intro: 0, donut: null };

    /* theme + drawer */
    var themeBtn = $('[data-ln-theme]');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', String(t === 'light')); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
    }
    if (themeBtn) on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    var menuBtn = $('[data-ln-menu]'), scrim = $('.ln-scrim');
    function drawer(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    if (menuBtn) on(menuBtn, 'click', function () { drawer(!root.classList.contains('is-open')); });
    if (scrim) on(scrim, 'click', function () { drawer(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') { drawer(false); select(null); } });

    /* night switch */
    var nightBtns = $$('[data-night]'), ind = $('.ln-nights-ind');
    function placeInd() {
      var b = nightBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0];
      if (b && ind) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    }
    nightBtns.forEach(function (b) { on(b, 'click', function () { setNight(b.getAttribute('data-night')); }); });

    /* ---------- the hotel scene ---------- */
    var scene = $('[data-ln-scene]'), SC = { wins: {} };
    var clockEl = document.createElement('div'); clockEl.className = 'ln-clock';
    clockEl.innerHTML = '<svg class="ln-ic" viewBox="0 0 24 24"><path d="M19 14.6A7.6 7.6 0 0 1 9.4 5a7.6 7.6 0 1 0 9.6 9.6z"/></svg><div><b data-ln-clock>16:00</b><small data-ln-clocknote>Tonight</small></div>';
    var tip = document.createElement('div'); tip.className = 'ln-tip'; tip.setAttribute('aria-hidden', 'true');
    if (scene) { scene.appendChild(clockEl); scene.appendChild(tip); }

    function buildScene() {
      if (!scene) return;
      var R = rng(77);
      var s = svg('svg', { viewBox: '0 0 720 440', preserveAspectRatio: 'xMidYMax meet', 'class': 'ln-svg', 'aria-hidden': 'true' });
      scene.insertBefore(s, scene.firstChild);
      var defs = svg('defs', {}, s);
      var sky = svg('linearGradient', { id: id + '-sky', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 410 }, defs);
      SC.s1 = svg('stop', { offset: 0 }, sky); SC.s2 = svg('stop', { offset: 1 }, sky);
      var warm = svg('linearGradient', { id: id + '-warm', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, 'stop-color': '#FFE9B0' }, warm); svg('stop', { offset: 0.55, 'stop-color': '#FFB65C' }, warm); svg('stop', { offset: 1, 'stop-color': '#FF8A3D' }, warm);
      var lampG = svg('radialGradient', { id: id + '-lamp' }, defs);
      svg('stop', { offset: 0, 'stop-color': '#FFD58A', 'stop-opacity': 0.75 }, lampG); svg('stop', { offset: 1, 'stop-color': '#FFB257', 'stop-opacity': 0 }, lampG);
      var moonG = svg('radialGradient', { id: id + '-moon' }, defs);
      svg('stop', { offset: 0, 'stop-color': '#FFF4D6', 'stop-opacity': 0.35 }, moonG); svg('stop', { offset: 1, 'stop-color': '#FFF4D6', 'stop-opacity': 0 }, moonG);
      var blur = svg('filter', { id: id + '-blur', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
      svg('feGaussianBlur', { stdDeviation: 7 }, blur);
      var tiles = svg('pattern', { id: id + '-tiles', width: 14, height: 14, patternUnits: 'userSpaceOnUse' }, defs);
      svg('path', { d: 'M7 1.5L12.5 7 7 12.5 1.5 7z M7 5L9 7 7 9 5 7z', fill: 'none', stroke: '#fff', 'stroke-width': 0.8 }, tiles);
      var hatch = svg('pattern', { id: id + '-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      svg('rect', { width: 5, height: 5, fill: '#2B2E40' }, hatch); svg('path', { d: 'M0 0V5', stroke: '#8F95A6', 'stroke-width': 1.4 }, hatch);

      SC.sky = svg('rect', { x: -3000, y: -3000, width: 6720, height: 3420, fill: 'url(#' + id + '-sky)' }, s);
      // stars + moon
      SC.stars = svg('g', {}, s);
      for (var i = 0; i < 70; i++) {
        var st_ = svg('circle', { cx: (-260 + R() * 1240).toFixed(1), cy: (-180 + R() * 440).toFixed(1), r: (0.5 + R() * 1.1).toFixed(2), fill: '#fff', 'class': 'ln-star' }, SC.stars);
        st_.style.animationDelay = (-R() * 3.2).toFixed(2) + 's'; st_.style.animationDuration = (2.4 + R() * 2.4).toFixed(2) + 's';
      }
      SC.moon = svg('g', {}, s);
      svg('circle', { r: 46, fill: 'url(#' + id + '-moon)' }, SC.moon);
      svg('path', { d: 'M8 -15A16 16 0 1 0 8 15A12.5 12.5 0 1 1 8 -15z', fill: '#FFF2CF' }, SC.moon);
      // neighbours
      SC.nL = svg('path', { d: 'M-3000 410V250H40l20-22h70l18 22h27v160z' }, s);
      SC.nR = svg('path', { d: 'M545 410V214h120l18-18 22 18H3720V410z' }, s);
      SC.nWins = [];
      [[52, 266], [96, 266], [140, 266], [52, 322], [96, 322], [140, 322], [52, 366], [140, 366],
        [566, 232], [610, 232], [654, 232], [566, 290], [610, 290], [654, 290], [610, 348], [654, 348]].forEach(function (p, k) {
        SC.nWins.push({ el: svg('rect', { x: p[0], y: p[1], width: 16, height: 22, rx: 2 }, s), at: 16.6 + ((k * 7) % 11) * 0.42, o: 0 });
      });
      // street
      SC.street = svg('rect', { x: -3000, y: 410, width: 6720, height: 3000 }, s);
      SC.walk = svg('rect', { x: -3000, y: 410, width: 6720, height: 7 }, s);
      // building body
      SC.roof = svg('path', { d: 'M196 66L222 44h276l26 22z' }, s);
      SC.wall = svg('rect', { x: 190, y: 72, width: 340, height: 338 }, s);
      svg('rect', { x: 190, y: 72, width: 340, height: 280, fill: 'url(#' + id + '-tiles)', opacity: 0.1 }, s);
      SC.bands = [];
      SC.bands.push(svg('rect', { x: 182, y: 62, width: 356, height: 12, rx: 3 }, s));
      for (var b = 1; b < 6; b++) SC.bands.push(svg('rect', { x: 190, y: 72 + b * 46 - 2, width: 340, height: 3, opacity: 0.55 }, s));
      SC.bands.push(svg('rect', { x: 186, y: 348, width: 348, height: 9, rx: 2 }, s));
      // ground floor: shop windows, door, sign
      SC.shop = [svg('rect', { x: 212, y: 374, width: 86, height: 28, rx: 4, fill: 'url(#' + id + '-warm)' }, s), svg('rect', { x: 422, y: 374, width: 86, height: 28, rx: 4, fill: 'url(#' + id + '-warm)' }, s)];
      svg('path', { d: 'M344 410V384a16 16 0 0 1 32 0V410z', fill: 'url(#' + id + '-warm)' }, s);
      SC.awning = svg('path', { d: 'M332 372h56l-6 9h-44z', fill: '#B4473C' }, s);
      SC.sign = svg('text', { x: 360, y: 368, 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 700, 'letter-spacing': 3, fill: '#FFE3B0' }, s);
      SC.sign.textContent = (data.hotel && data.hotel.name || 'Hotel').toUpperCase();
      // window glow layer (blurred) drawn on the wall
      SC.glow = svg('g', { filter: 'url(#' + id + '-blur)' }, s);
      SC.winG = svg('g', {}, s);
      var cw = 340 / 7;
      data.rooms.forEach(function (r) {
        var x = 190 + cw * (r.col + 0.5) - 12, y = 72 + (6 - r.floor) * 46 + 9, w = 24, h = 30;
        var arch = 'M' + x + ' ' + (y + h) + 'V' + (y + 12) + 'a12 12 0 0 1 24 0V' + (y + h) + 'z';
        var gl = svg('rect', { x: x - 7, y: y - 4, width: w + 14, height: h + 12, rx: 10, fill: '#FFAA4D', opacity: 0 }, SC.glow);
        var g = svg('g', { 'class': 'ln-win', 'data-room': r.no }, SC.winG);
        var glass = svg('path', { d: arch }, g);
        var lit = svg('g', { opacity: 0 }, g);
        svg('path', { d: arch, fill: 'url(#' + id + '-warm)' }, lit);
        var side = R() < 0.5;
        svg('path', { d: side ? 'M' + x + ' ' + (y + h) + 'V' + (y + 12) + 'a12 12 0 0 1 9-11.6q-3 14 0 41.6z' : 'M' + (x + w) + ' ' + (y + h) + 'V' + (y + 12) + 'a12 12 0 0 0 -9-11.6q3 14 0 41.6z', fill: '#B5521F', opacity: 0.45 }, lit);
        svg('path', { d: arch, fill: 'url(#' + id + '-hatch)', 'class': 'ln-ooo' }, g);
        var frame = svg('path', { d: arch + 'M' + (x + 12) + ' ' + y + 'V' + (y + h) + 'M' + x + ' ' + (y + 16) + 'H' + (x + w), fill: 'none', 'stroke-width': 1.5 }, g);
        svg('path', { d: arch, 'class': 'ln-due' }, g);
        svg('rect', { x: x - 4, y: y - 4, width: w + 8, height: h + 8, rx: 9, 'class': 'ln-ring' }, g);
        var sill = svg('rect', { x: x - 4, y: y + h, width: w + 8, height: 3, rx: 1 }, g);
        var rail = null;
        if (r.floor % 2 === 0) rail = svg('path', { d: 'M' + (x - 5) + ' ' + (y + h - 9) + 'H' + (x + w + 5) + 'M' + (x - 5) + ' ' + (y + h - 9) + 'V' + (y + h) + 'M' + (x + w + 5) + ' ' + (y + h - 9) + 'V' + (y + h) + 'M' + (x + 3) + ' ' + (y + h - 9) + 'V' + (y + h) + 'M' + (x + 9) + ' ' + (y + h - 9) + 'V' + (y + h) + 'M' + (x + 15) + ' ' + (y + h - 9) + 'V' + (y + h) + 'M' + (x + 21) + ' ' + (y + h - 9) + 'V' + (y + h), fill: 'none', stroke: '#1A1C29', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g);
        svg('rect', { x: x - 6, y: y - 6, width: w + 12, height: h + 12, fill: 'transparent' }, g);
        SC.wins[r.no] = { r: r, g: g, glass: glass, lit: lit, glow: gl, frame: frame, sill: sill, rail: rail, cx: x + 12, cy: y, o: 0, from: 0, onAt: null, offAt: 0, at: null };
      });
      // street lamps
      SC.lamps = [];
      [150, 570].forEach(function (lx) {
        var g = svg('g', {}, s);
        var halo = svg('circle', { cx: lx, cy: 336, r: 46, fill: 'url(#' + id + '-lamp)', opacity: 0 }, g);
        svg('path', { d: 'M' + lx + ' 410V342M' + (lx - 6) + ' 410h12', stroke: '#1B1D29', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        svg('path', { d: 'M' + (lx - 7) + ' 330h14l-2 13h-10z', fill: '#1B1D29' }, g);
        var bulb = svg('rect', { x: lx - 4.5, y: 332, width: 9, height: 9, rx: 1.5, fill: '#FFD58A', opacity: 0.15 }, g);
        svg('path', { d: 'M' + (lx - 8) + ' 330l8-6 8 6z', fill: '#1B1D29' }, g);
        SC.lamps.push({ halo: halo, bulb: bulb });
      });
      layoutScene();
    }
    function layoutScene() {
      if (!scene || !scene.firstChild) return;
      var W = scene.clientWidth || 600, H = scene.clientHeight || 400;
      var vw = clamp(440 * W / H, 390, 720);
      scene.querySelector('svg').setAttribute('viewBox', (360 - vw / 2).toFixed(1) + ' 0 ' + vw.toFixed(1) + ' 440');
    }
    function flick(ms) {
      if (ms < 0) return 0;
      var u = ms / 460; if (u >= 1) return 1;
      if (u < 0.16) return u / 0.16 * 0.95;
      if (u < 0.3) return 0.95 - (u - 0.16) / 0.14 * 0.7;
      if (u < 0.46) return 0.25 + (u - 0.3) / 0.16 * 0.75;
      return 1 - 0.1 * Math.sin((u - 0.46) / 0.54 * Math.PI);
    }
    function paintScene(h, t) {
      if (!SC.sky) return;
      var night = clamp((h - 16.4) / 3.4, 0, 1), sunset = Math.exp(-Math.pow((h - 18.2) / 0.9, 2));
      function P(k) { return mixA(PAL[k][0], PAL[k][1], easeInOut(night)); }
      SC.s1.setAttribute('stop-color', css(P('skyTop')));
      SC.s2.setAttribute('stop-color', css(mixA(P('skyBot'), SUNSET, sunset * 0.6)));
      SC.wall.setAttribute('fill', css(P('wall')));
      SC.roof.setAttribute('fill', css(P('roof')));
      SC.bands.forEach(function (b) { b.setAttribute('fill', css(P('band'))); });
      SC.street.setAttribute('fill', css(P('street'))); SC.walk.setAttribute('fill', css(P('walk')));
      SC.nL.setAttribute('fill', css(P('nL'))); SC.nR.setAttribute('fill', css(P('nR')));
      var glass = css(P('glass')), frame = css(P('frame'));
      SC.stars.setAttribute('opacity', clamp((h - 18.6) / 1.3, 0, 1).toFixed(3));
      var mt = clamp((h - 17.2) / 4.5, 0, 1);
      SC.moon.setAttribute('transform', 'translate(' + (612 - 30 * mt).toFixed(1) + ' ' + (150 - 96 * easeOut(mt)).toFixed(1) + ')');
      SC.moon.setAttribute('opacity', clamp((h - 17.4) / 1.2, 0, 1).toFixed(3));
      SC.lamps.forEach(function (l, k) { var o = h >= 17.7 + k * 0.08 ? 1 : 0; l.halo.setAttribute('opacity', o); l.bulb.setAttribute('opacity', o ? 1 : 0.15); });
      var shopO = clamp((h - 16.8) / 0.6, 0, 1) * 0.85 + 0.15;
      SC.shop.forEach(function (e) { e.setAttribute('opacity', shopO.toFixed(3)); });
      SC.nWins.forEach(function (w) { w.el.setAttribute('fill', h >= w.at ? '#E8A65C' : css(mixA(rgbA('#A9C2DA'), rgbA('#0F1220'), easeInOut(night)))); w.el.setAttribute('opacity', h >= w.at ? 0.55 : 0.9); });
      for (var k in SC.wins) {
        var w = SC.wins[k];
        w.glass.setAttribute('fill', glass); w.frame.setAttribute('stroke', frame); w.sill.setAttribute('fill', frame);
        if (w.rail) w.rail.setAttribute('stroke', css(mixA(rgbA('#3A2F2A'), rgbA('#0E0F18'), night)));
        w.lit.setAttribute('opacity', w.o.toFixed(3));
        w.glow.setAttribute('opacity', (w.o * 0.75).toFixed(3));
      }
    }

    function sceneTarget(n) {
      for (var k in SC.wins) {
        var w = SC.wins[k], s = n.byRoom[k];
        w.at = s && s.light != null ? s.light : null;
        w.g.classList.toggle('is-ooo', n.ooo.indexOf(+k) >= 0);
        w.g.classList.remove('is-due');
        var lbl = 'Room ' + k + ', ' + (n.ooo.indexOf(+k) >= 0 ? 'out of order' : s ? s.guest + ', ' + STATUS[s.status][0] : 'vacant');
        w.g.setAttribute('aria-label', lbl);
      }
    }
    function playScene(n, instant) {
      if (!scene) return;
      sceneTarget(n);
      var now = performance.now(), end = n.now != null ? n.now : 23;
      for (var k in SC.wins) { var w = SC.wins[k]; w.from = w.o; w.offAt = now; w.onAt = null; }
      st.a = { n: n, t0: now, from: st.h, end: end, rew: instant || reduce ? 0 : 420, dur: instant || reduce ? 0 : 1500 + 150 * (end - 16), done: false };
      $$('[data-ln-clocknote]').forEach(function (e) { e.textContent = n.now != null ? n.label + ' · now' : n.label + ' · forecast'; });
      kick();
    }
    function stepScene(t) {
      var a = st.a; if (!a) return false;
      var e = t - a.t0, h;
      if (e < a.rew) h = lerp(a.from, 16, easeInOut(e / a.rew));
      else h = a.dur ? lerp(16, a.end, easeInOut(clamp((e - a.rew) / a.dur, 0, 1))) : a.end;
      st.h = h;
      var lit = 0;
      for (var k in SC.wins) {
        var w = SC.wins[k];
        if (w.onAt == null && w.at != null && e >= a.rew && h >= w.at) w.onAt = t;
        if (w.onAt != null) { w.o = a.dur ? flick(t - w.onAt) : 1; lit++; }
        else w.o = a.rew ? w.from * (1 - clamp(e / 220, 0, 1)) : 0;
      }
      paintScene(h, t);
      var c = $('[data-ln-clock]'); if (c) c.textContent = hhmm(h);
      var l = $('[data-ln-lit]'); if (l) l.textContent = lit;
      var fin = e >= a.rew + a.dur + 480;
      if (e >= a.rew + a.dur && !a.done) {
        a.done = true;
        a.n.stays.forEach(function (s) { if (s.status === 'due' || s.status === 'late') SC.wins[s.room].g.classList.add('is-due'); });
      }
      return !fin;
    }

    /* scene tooltip + keyboard */
    function roomInfo(no) {
      var n = byId[st.night], r = data._roomBy[no], s = n.byRoom[no];
      var html = '<b>Room ' + no + ' · ' + r.type + '</b>';
      if (n.ooo.indexOf(+no) >= 0) return html + '<span>Out of order · maintenance</span><i style="--c:var(--lantern-muted)">Not sellable</i>';
      if (!s) return html + '<span>Vacant · clean and ready</span><i style="--c:var(--lantern-good)">Available</i>';
      var ch = (data.channels || CHANNELS).filter(function (c) { return c.id === s.channel; })[0];
      html += '<span>' + s.guest + ' · ' + s.party + (s.party > 1 ? ' guests' : ' guest') + '</span>';
      html += '<span>Night ' + s.night + ' of ' + s.nights + ' · ' + cur + fmt(s.rate) + ' · ' + (ch ? ch.name : '') + '</span>';
      var stx = STATUS[s.status];
      return html + '<i style="--c:' + stx[1] + '">' + stx[0] + (s.eta != null ? ' · ETA ' + hhmm(s.eta) : '') + '</i>';
    }
    function showTip(no) {
      var w = SC.wins[no]; if (!w || !scene) return;
      var svgEl = scene.querySelector('svg'), m = svgEl.getScreenCTM(), sr = scene.getBoundingClientRect();
      var pt = svgEl.createSVGPoint(); pt.x = w.cx; pt.y = w.cy - 4; pt = pt.matrixTransform(m);
      tip.innerHTML = roomInfo(no);
      var x = clamp(pt.x - sr.left, 100, sr.width - 100), y = pt.y - sr.top;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      if (y < tip.offsetHeight + 20) { tip.style.top = (y + 60 + tip.offsetHeight) + 'px'; }
      tip.classList.add('is-on');
    }
    function hideTip() { tip.classList.remove('is-on'); }
    function select(no) {
      if (st.sel && SC.wins[st.sel]) SC.wins[st.sel].g.classList.remove('is-sel');
      $$('.ln-table tbody tr').forEach(function (tr) { tr.classList.toggle('is-sel', no != null && tr.getAttribute('data-room') === String(no)); });
      st.sel = no;
      if (no == null || !SC.wins[no]) { hideTip(); return; }
      SC.wins[no].g.classList.add('is-sel'); showTip(no);
    }
    if (scene) {
      on(scene, 'pointermove', function (e) {
        var g = e.target.closest && e.target.closest('[data-room]');
        if (g) { var no = +g.getAttribute('data-room'); if (st.hov !== no) { st.hov = no; showTip(no); } }
        else if (st.hov != null) { st.hov = null; if (st.sel) showTip(st.sel); else hideTip(); }
      });
      on(scene, 'pointerleave', function () { st.hov = null; if (st.sel) showTip(st.sel); else hideTip(); });
      on(scene, 'click', function (e) { var g = e.target.closest && e.target.closest('[data-room]'); select(g ? +g.getAttribute('data-room') : null); });
      on(scene, 'keydown', function (e) {
        var cur_ = st.sel ? data._roomBy[st.sel] : null, f = cur_ ? cur_.floor : 6, c = cur_ ? cur_.col : -1;
        var k = e.key;
        if (k === 'ArrowRight') c = Math.min(6, c + 1); else if (k === 'ArrowLeft') c = Math.max(0, c - 1);
        else if (k === 'ArrowUp') f = Math.min(6, f + 1); else if (k === 'ArrowDown') f = Math.max(1, f - 1);
        else return;
        e.preventDefault(); if (c < 0) c = 0;
        select(f * 100 + c + 1);
      });
      on(scene, 'blur', function () { if (st.sel) select(null); });
    }

    /* ---------- KPIs ---------- */
    var KPI = {
      occ: { v: function (n) { return n.occ * 100; }, s: function (s) { return s.occ * 100; }, f: function (v) { return fmt(v, 1) + '<small>%</small>'; }, d: 'pt' },
      adr: { v: function (n) { return n.adr; }, s: function (s) { return s.adr; }, f: function (v) { return cur + fmt(v); }, d: '%' },
      revpar: { v: function (n) { return n.revpar; }, s: function (s) { return s.revpar; }, f: function (v) { return cur + fmt(v); }, d: '%' },
      rev: { v: function (n) { return n.rev; }, s: function (s) { return s.rev; }, f: function (v) { return cur + fmt(v); }, d: '%' }
    };
    function kpiTargets(n) {
      var o = {}, i = n.index;
      Object.keys(KPI).forEach(function (k) {
        var spark = []; for (var j = Math.max(0, i - 13); j <= i; j++) spark.push(KPI[k].s(data.series[j]));
        var prevS = data.series[i - 7], v = KPI[k].v(n), p = prevS ? KPI[k].s(prevS) : v;
        o[k] = { v: v, spark: spark, delta: KPI[k].d === 'pt' ? v - p : (v - p) / p * 100 };
      });
      return o;
    }
    function paintKpis(cur_, deltasFrom) {
      $$('[data-ln-kpi]').forEach(function (card) {
        var k = card.getAttribute('data-ln-kpi'), c = cur_[k]; if (!c) return;
        card.querySelector('.ln-kpi-val').innerHTML = KPI[k].f(c.v);
        var sp = card.querySelector('.ln-spark');
        if (sp) {
          var a = c.spark, mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), rg = mx - mn || 1;
          var pts = a.map(function (v, j) { return [j / (a.length - 1) * 84, 27 - (v - mn) / rg * 23]; });
          var line = smooth(pts);
          if (!sp.firstChild) { svg('path', { 'class': 'ln-sa' }, sp); svg('path', { 'class': 'ln-sl' }, sp); svg('circle', { r: 2.6 }, sp); }
          sp.childNodes[0].setAttribute('d', line + 'L84 30L0 30z');
          sp.childNodes[1].setAttribute('d', line);
          var last = pts[pts.length - 1]; sp.childNodes[2].setAttribute('cx', last[0]); sp.childNodes[2].setAttribute('cy', last[1]);
        }
        if (deltasFrom) {
          var dEl = card.querySelector('.ln-delta'), d = deltasFrom[k].delta;
          if (dEl) { dEl.classList.toggle('is-down', d < 0); dEl.querySelector('span').textContent = (d >= 0 ? '+' : '−') + fmt(Math.abs(d), 1) + (KPI[k].d === 'pt' ? ' pt' : '%'); }
        }
      });
    }
    function stepKpis(t) {
      var a = st.kpi; if (!a) return false;
      var p = a.dur ? easeOut(clamp((t - a.t0) / a.dur, 0, 1)) : 1, out = {};
      Object.keys(a.to).forEach(function (k) {
        var f = a.from ? a.from[k] : null, to = a.to[k];
        out[k] = { v: f ? lerp(f.v, to.v, p) : to.v * p, spark: to.spark.map(function (v, j) { return f ? lerp(f.spark[j], v, p) : v; }) };
      });
      paintKpis(out, p === 1 || !a.dDone ? a.to : null); a.dDone = true;
      if (p === 1) { st.kpiNow = a.to; return false; }
      return true;
    }

    /* ---------- trend: 30 nights, occupancy bars + ADR line ---------- */
    var trend = $('[data-ln-trend]'), TR = {};
    var ttip = document.createElement('div'); ttip.className = 'ln-ttip'; if (trend) trend.appendChild(ttip);
    function buildTrend() {
      if (!trend) return;
      var old = trend.querySelector('svg'); if (old) old.remove();
      var W = trend.clientWidth || 500, H = trend.clientHeight || 190, ser = data.series, N = ser.length;
      var small = W < 420, L = small ? 30 : 36, Rr = small ? 34 : 40, T = 12, B = 24;
      var s = svg('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Occupancy and average daily rate for ' + N + ' nights' });
      trend.insertBefore(s, ttip);
      var defs = svg('defs', {}, s), g = svg('linearGradient', { id: 'ln-bar-g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, 'stop-color': 'var(--lantern-cyan)' }, g); svg('stop', { offset: 1, 'stop-color': 'var(--lantern-blue)' }, g);
      var gw = svg('linearGradient', { id: id + '-tw', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      svg('stop', { offset: 0, 'stop-color': '#FFD27A' }, gw); svg('stop', { offset: 1, 'stop-color': 'var(--lantern-glow-2)' }, gw);
      var bw = (W - L - Rr) / N, X = function (i) { return L + bw * (i + 0.5); }, Y = function (o) { return T + (1 - o) * (H - T - B); };
      var adrs = ser.map(function (x) { return x.adr; }), amin = Math.floor((Math.min.apply(null, adrs) - 6) / 10) * 10, amax = Math.ceil((Math.max.apply(null, adrs) + 6) / 10) * 10;
      var YA = function (a) { return T + (1 - (a - amin) / (amax - amin)) * (H - T - B); };
      var today = data.today != null ? data.today : N;
      if (today < N) {
        svg('rect', { x: L + bw * today, y: T - 4, width: W - Rr - (L + bw * today), height: H - T - B + 4, fill: 'var(--lantern-otb)', rx: 6 }, s);
        svg('line', { x1: L + bw * today, x2: L + bw * today, y1: T - 4, y2: H - B, 'class': 'ln-divider' }, s);
        var tx = svg('text', { x: L + bw * today + 6, y: T + 6, 'class': 'ln-axis' }, s); tx.textContent = 'On the books';
      }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (o) {
        svg('line', { x1: L, x2: W - Rr, y1: Y(o), y2: Y(o), 'class': 'ln-gridl' }, s);
        if (o === 0 || o === 0.5 || o === 1) { var t = svg('text', { x: L - 6, y: Y(o) + 3.5, 'text-anchor': 'end', 'class': 'ln-axis' }, s); t.textContent = o * 100 + '%'; }
      });
      [amin, (amin + amax) / 2, amax].forEach(function (a) { var t = svg('text', { x: W - Rr + 6, y: YA(a) + 3.5, 'class': 'ln-axis' }, s); t.textContent = cur + Math.round(a); });
      TR.hl = svg('rect', { x: 0, y: T - 4, width: bw, height: H - T - B + 4, rx: Math.min(6, bw / 2), 'class': 'ln-hl' }, s);
      TR.bars = ser.map(function (x, i) {
        var bwi = Math.max(2, bw * 0.62);
        return { el: svg('rect', { x: X(i) - bwi / 2, width: bwi, rx: Math.min(3, bwi / 2), 'class': 'ln-bar' + (i > today ? ' is-otb' : '') }, s), h: Y(0) - Y(x.occ), y0: Y(0) };
      });
      var pts = ser.map(function (x, i) { return [X(i), YA(x.adr)]; });
      TR.line = svg('path', { d: smooth(pts), 'class': 'ln-adr' }, s);
      TR.len = TR.line.getTotalLength ? TR.line.getTotalLength() : 1000;
      TR.dot = svg('circle', { r: 4, fill: 'var(--lantern-surface)', stroke: 'var(--lantern-soft)', 'stroke-width': 2 }, s);
      ser.forEach(function (x, i) {
        if (i % 7 !== 0 && i !== N - 1) return;
        if (i === N - 1 && (N - 1) % 7 < 4) return;
        var t = svg('text', { x: X(i), y: H - 6, 'text-anchor': 'middle', 'class': 'ln-axis' }, s);
        var d = new Date(x.date + 'T00:00:00Z'); t.textContent = d.getUTCDate() + ' ' + d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
      });
      TR.X = X; TR.YA = YA; TR.bw = bw; TR.L = L; TR.N = N; TR.pts = pts;
      if (st.hlX == null && st.night) st.hlX = X(byId[st.night].index);
      paintTrend(performance.now());
    }
    function paintTrend(t) {
      if (!TR.bars) return false;
      var e = t - st.intro, busy = false, selI = st.night ? byId[st.night].index : -1;
      TR.bars.forEach(function (b, i) {
        var p = reduce ? 1 : easeOut(clamp((e - i * 22) / 620, 0, 1)); if (p < 1) busy = true;
        var h = b.h * p; b.el.setAttribute('y', (b.y0 - h).toFixed(1)); b.el.setAttribute('height', Math.max(0, h).toFixed(1));
        b.el.classList.toggle('is-sel', i === selI);
        b.el.setAttribute('fill', i === selI ? 'url(#' + id + '-tw)' : 'url(#ln-bar-g)');
      });
      var lp = reduce ? 1 : easeInOut(clamp((e - 200) / 1100, 0, 1)); if (lp < 1) busy = true;
      TR.line.style.strokeDasharray = TR.len; TR.line.style.strokeDashoffset = (TR.len * (1 - lp)).toFixed(1);
      if (selI >= 0) {
        var tx = TR.X(selI) - TR.bw / 2;
        if (st.hlX == null || reduce) st.hlX = tx;
        var dt = Math.min(0.05, (t - (st.hlT || t)) / 1000); st.hlT = t;
        st.hlV += ((tx - st.hlX) * 170 - st.hlV * 20) * dt; st.hlX += st.hlV * dt;
        if (Math.abs(tx - st.hlX) < 0.3 && Math.abs(st.hlV) < 0.3) { st.hlX = tx; st.hlV = 0; } else busy = true;
        TR.hl.setAttribute('x', st.hlX.toFixed(2));
        var i0 = clamp(Math.round((st.hlX + TR.bw / 2 - TR.L) / TR.bw - 0.5), 0, TR.N - 1);
        TR.dot.setAttribute('cx', TR.pts[i0][0]); TR.dot.setAttribute('cy', TR.pts[i0][1]);
        TR.dot.setAttribute('opacity', lp >= 1 ? 1 : 0);
      }
      return busy;
    }
    if (trend) {
      on(trend, 'pointermove', function (e) {
        if (!TR.bars) return;
        var r = trend.getBoundingClientRect(), i = Math.floor((e.clientX - r.left - TR.L) / TR.bw);
        if (i < 0 || i >= TR.N) { ttip.classList.remove('is-on'); return; }
        var x = data.series[i], d = new Date(x.date + 'T00:00:00Z');
        ttip.innerHTML = '<b>' + d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) + (i > data.today ? ' · on the books' : '') + '</b>' + fmt(x.occ * 100, 1) + '% occupied · ADR ' + cur + fmt(x.adr);
        ttip.style.left = clamp(TR.X(i), 80, r.width - 80) + 'px'; ttip.style.top = '4px';
        ttip.classList.add('is-on');
      });
      on(trend, 'pointerleave', function () { ttip.classList.remove('is-on'); });
    }

    /* ---------- channels donut ---------- */
    var donut = $('[data-ln-donut]'), chanList = $('[data-ln-chanlist]'), DN = {};
    function buildDonut() {
      if (!donut) return;
      var s = svg('svg', { viewBox: '0 0 200 200', 'aria-hidden': 'true' }); donut.insertBefore(s, donut.firstChild);
      svg('circle', { cx: 100, cy: 100, r: 76, 'class': 'ln-trk' }, s);
      DN.C = 2 * Math.PI * 76;
      DN.arcs = (data.channels || CHANNELS).map(function (c) { return svg('circle', { cx: 100, cy: 100, r: 76, stroke: c.color, 'stroke-linecap': 'butt' }, s); });
      if (chanList) chanList.innerHTML = (data.channels || CHANNELS).map(function (c) {
        return '<li style="--c:' + c.color + '"><i></i><span>' + c.name + '</span><b data-n>0<small>0%</small></b><div class="ln-cbar"><u style="transform:scaleX(0)"></u></div></li>';
      }).join('');
    }
    function paintDonut(vals) {
      if (!DN.arcs) return;
      var tot = vals.reduce(function (a, b) { return a + b; }, 0) || 1, off = 0, gap = 3;
      DN.arcs.forEach(function (a, i) {
        var len = vals[i] / tot * DN.C;
        a.setAttribute('stroke-dasharray', Math.max(0, len - gap).toFixed(2) + ' ' + DN.C.toFixed(2));
        a.setAttribute('stroke-dashoffset', (-off).toFixed(2));
        off += len;
      });
      var c = $('[data-ln-booked]'); if (c) c.textContent = Math.round(tot);
      if (chanList) [].slice.call(chanList.children).forEach(function (li, i) {
        li.querySelector('[data-n]').innerHTML = Math.round(vals[i]) + '<small>' + Math.round(vals[i] / tot * 100) + '%</small>';
      });
    }
    function stepDonut(t) {
      var a = st.donut; if (!a) return false;
      var p = a.dur ? easeInOut(clamp((t - a.t0) / a.dur, 0, 1)) : 1;
      paintDonut(a.to.map(function (v, i) { return lerp(a.from[i], v, p); }));
      return p < 1;
    }

    /* ---------- arrivals table ---------- */
    var table = $('[data-ln-table]'), tbody = table ? table.querySelector('tbody') : null, search = $('[data-ln-search]');
    function renderTable() {
      if (!tbody) return;
      var n = byId[st.night], q = st.q.trim().toLowerCase(), chans = data.channels || CHANNELS;
      var rows = n.stays.filter(function (s) { return s.arriving; }).map(function (s) {
        var ch = chans.filter(function (c) { return c.id === s.channel; })[0] || { name: s.channel, color: 'var(--lantern-muted)' };
        return { s: s, ch: ch, total: s.rate * s.nights };
      }).filter(function (r) { return !q || (r.s.guest + ' ' + r.s.room + ' ' + r.ch.name).toLowerCase().indexOf(q) >= 0; });
      var k = st.sort.key, d = st.sort.dir;
      rows.sort(function (a, b) { var x = k === 'total' ? a.total : k === 'room' ? a.s.room : a.s.eta, y = k === 'total' ? b.total : k === 'room' ? b.s.room : b.s.eta; return (x - y) * d; });
      if (!rows.length) { tbody.innerHTML = '<tr class="ln-empty"><td colspan="7">No arrivals match “' + st.q.replace(/[<&]/g, '') + '”</td></tr>'; return; }
      tbody.innerHTML = rows.map(function (r) {
        var s = r.s, rm = data._roomBy[s.room], stx = STATUS[s.status];
        return '<tr data-room="' + s.room + '"' + (st.sel === s.room ? ' class="is-sel"' : '') + '>' +
          '<td><button type="button" class="ln-guest" data-find="' + s.room + '" aria-label="Show ' + s.guest + '’s window"><i style="--c:' + r.ch.color + '">' + initials(s.guest) + '</i><span><b>' + s.guest + '</b><small>' + s.party + (s.party > 1 ? ' guests' : ' guest') + '</small></span></button></td>' +
          '<td class="ln-room"><b>' + s.room + '</b><small>' + rm.type + '</small></td>' +
          '<td class="ln-col-stay">' + s.nights + (s.nights > 1 ? ' nights' : ' night') + '</td>' +
          '<td class="ln-col-ch">' + r.ch.name + '</td>' +
          '<td class="ln-col-eta">' + hhmm(s.eta) + '</td>' +
          '<td><span class="ln-pill" style="--c:' + stx[1] + '">' + stx[0] + '</span></td>' +
          '<td class="ln-num">' + cur + fmt(r.total) + '</td></tr>';
      }).join('');
    }
    if (tbody) on(tbody, 'click', function (e) { var b = e.target.closest('[data-find]'); if (b) { var no = +b.getAttribute('data-find'); select(st.sel === no ? null : no); } });
    if (search) on(search, 'input', function () { st.q = search.value; renderTable(); });
    if (table) $$('[data-sort]').forEach(function (th) {
      on(th.querySelector('button'), 'click', function () {
        var k = th.getAttribute('data-sort');
        st.sort = { key: k, dir: st.sort.key === k ? -st.sort.dir : (k === 'eta' || k === 'room' ? 1 : -1) };
        $$('[data-sort]').forEach(function (x) { x.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', st.sort.dir > 0 ? 'ascending' : 'descending');
        renderTable();
      });
    });

    /* ---------- loop ---------- */
    function frame(t) {
      raf = 0; if (!alive) return;
      var busy = stepScene(t); busy = stepKpis(t) || busy; busy = paintTrend(t) || busy; busy = stepDonut(t) || busy;
      if (busy) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && alive) raf = requestAnimationFrame(frame); }

    /* ---------- public ---------- */
    function setNight(nid, force) {
      var n = byId[nid]; if (!n || (nid === st.night && !force)) return;
      var first = st.night == null; st.night = nid;
      nightBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-night') === nid)); });
      placeInd();
      $$('[data-ln-nightname]').forEach(function (e) { e.textContent = n.label; });
      var title = $('[data-ln-scenetitle]'); if (title) title.textContent = n.now != null ? n.label + ' at the hotel' : n.label + ', on the books';
      var due = n.stays.filter(function (s) { return s.status === 'due' || s.status === 'late'; }).length;
      var ll = $('[data-ln-litlabel]');
      if (ll) ll.textContent = n.now != null ? 'rooms lit · ' + due + ' arriving later' : 'rooms booked of ' + n.sellable;
      var lt = $('[data-ln-littotal]'); if (lt) lt.textContent = n.now != null ? ' / ' + n.booked : '';
      select(null);
      playScene(n, false);
      var to = kpiTargets(n), now = performance.now();
      st.kpi = { t0: now + (first ? 150 : 0), dur: reduce ? 0 : 950, from: first ? null : (st.kpiNow || null), to: to };
      st.donut = { t0: now, dur: reduce ? 0 : 800, from: st.donut ? st.donut.to : n.chan.map(function () { return 0; }), to: n.chan.slice() };
      if (chanList) { var tot = n.chan.reduce(function (a, b) { return a + b; }, 0) || 1, mx = Math.max.apply(null, n.chan) || 1; [].slice.call(chanList.querySelectorAll('u')).forEach(function (u, i) { u.style.transform = 'scaleX(' + (n.chan[i] / mx).toFixed(3) + ')'; }); void tot; }
      st.hlT = 0;
      renderTable();
      kick();
    }
    function replay() { if (st.night) setNight(st.night, true); }

    buildScene(); buildTrend(); buildDonut();
    st.intro = performance.now();
    setTheme(opts.theme || root.getAttribute('data-theme') || 'dark');
    st.h = 16;
    setNight(opts.night && byId[opts.night] ? opts.night : data.nights[0].id);

    var ro = window.ResizeObserver ? new ResizeObserver(function () { layoutScene(); var w = trend ? trend.clientWidth : 0; if (w !== TR.w) { TR.w = w; buildTrend(); } placeInd(); if (st.sel) showTip(st.sel); }) : null;
    if (ro) { if (scene) ro.observe(scene); if (trend) ro.observe(trend); ro.observe(root); }
    else on(window, 'resize', function () { layoutScene(); buildTrend(); placeInd(); });

    var api = {
      setNight: function (n) { setNight(n); }, replay: replay, select: select, setTheme: setTheme, data: data,
      destroy: function () {
        alive = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect();
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        delete root.__lantern;
      }
    };
    root.__lantern = api;
    return api;
  }

  var Lantern = { mount: mount, demoData: demoData };
  Object.defineProperty(Lantern, 'data', { get: demoData });
  window.Lantern = Lantern;
  function auto() { [].forEach.call(document.querySelectorAll('[data-lantern]:not([data-lantern-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
