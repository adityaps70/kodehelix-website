/* Beacon — uptime & infrastructure monitoring dashboard · Kodehelix UI · kodehelix.in
   Zero dependencies. Beacon.mount(el, options) → controller. Auto-mounts [data-beacon] unless [data-beacon-manual]. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    users: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.2 3.5 4.8 3.5 8s-1.1 5.8-3.5 8c-2.4-2.2-3.5-4.8-3.5-8S9.6 6.2 12 4z"/>',
    edge: '<path d="M7.5 18a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17.6 9.6 4.2 4.2 0 0 1 17 18z"/><path d="M12.5 11l-2 3h3l-2 3"/>',
    gateway: '<rect x="4" y="9" width="6" height="6" rx="1.5"/><path d="M10 12h3M13 7v10M13 7h4M13 17h4M13 12h4"/><circle cx="19" cy="7" r="1.4"/><circle cx="19" cy="12" r="1.4"/><circle cx="19" cy="17" r="1.4"/>',
    auth: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.2v2.3"/>',
    payments: '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7 14.5h4"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20M8.5 11h5"/>',
    notify: '<path d="M6.5 16V11a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5h4"/>',
    postgres: '<ellipse cx="12" cy="6.5" rx="6.5" ry="2.5"/><path d="M5.5 6.5v11c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-11M5.5 12c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5"/>',
    redis: '<path d="M13 3.5 6 13.5h5.5L10.5 20.5 18 10h-5.5z"/>',
    queue: '<rect x="4" y="4.5" width="16" height="4" rx="1.5"/><rect x="4" y="10" width="16" height="4" rx="1.5"/><rect x="4" y="15.5" width="10" height="4" rx="1.5"/>'
  };
  // col 0–4 left to right; services and data stores fan out in their column
  var NODES = [
    { id: 'users', name: 'Users', short: 'Users', col: 0, row: 0, rows: 1, src: true },
    { id: 'edge', name: 'Edge CDN', short: 'Edge', kind: 'CDN · 38 PoPs', col: 1, row: 0, rows: 1, p95: 24, err: 0.01, up: 99.999, share: 1 },
    { id: 'gateway', name: 'API gateway', short: 'Gateway', kind: 'Envoy · 6 pods', col: 2, row: 0, rows: 1, p95: 38, err: 0.02, up: 99.995, share: 0.94 },
    { id: 'auth', name: 'Auth', short: 'Auth', kind: 'Go · 4 pods', col: 3, row: 0, rows: 4, p95: 62, err: 0.03, up: 99.99, share: 0.38 },
    { id: 'payments', name: 'Payments', short: 'Payments', kind: 'Kotlin · 8 pods', col: 3, row: 1, rows: 4, p95: 148, err: 0.05, up: 99.98, share: 0.21 },
    { id: 'search', name: 'Search', short: 'Search', kind: 'Rust · 4 pods', col: 3, row: 2, rows: 4, p95: 96, err: 0.04, up: 99.98, share: 0.27 },
    { id: 'notify', name: 'Notifications', short: 'Notify', kind: 'Node · 3 pods', col: 3, row: 3, rows: 4, p95: 74, err: 0.02, up: 99.97, share: 0.08 },
    { id: 'postgres', name: 'Postgres', short: 'Postgres', kind: 'Primary + 2 replicas', col: 4, row: 0, rows: 3, p95: 9, err: 0, up: 99.999, share: 0.52 },
    { id: 'redis', name: 'Redis cache', short: 'Redis', kind: 'Cluster · 6 shards', col: 4, row: 1, rows: 3, p95: 2, err: 0, up: 99.999, share: 0.71 },
    { id: 'queue', name: 'Job queue', short: 'Queue', kind: '3 brokers', col: 4, row: 2, rows: 3, p95: 6, err: 0, up: 99.995, share: 0.19 }
  ];
  var EDGES = [['users', 'edge'], ['edge', 'gateway'], ['gateway', 'auth'], ['gateway', 'payments'], ['gateway', 'search'], ['gateway', 'notify'],
    ['auth', 'postgres'], ['auth', 'redis'], ['payments', 'postgres'], ['payments', 'queue'], ['search', 'redis'], ['notify', 'queue']];
  var SEV = { ok: 0, warn: 1, down: 2 };
  var STATUS_TXT = { ok: 'Healthy', warn: 'Degraded', down: 'Down' };

  /* ---------- demo data (deterministic) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(h, mu, s) { var d = (h - mu) / s; return Math.exp(-d * d / 2); }
  function latency(r, seed) {
    var rr = rng(seed), p50 = [], p95 = [];
    for (var i = 0; i < 48; i++) {
      var h = (14.5 + i / 2) % 24, di = 1 + 0.26 * gauss(h, 13.5, 3) + 0.2 * gauss(h, 20.5, 2) - 0.12 * gauss(h, 4, 2.5), n = rr() - 0.5;
      var v50 = r.base50 * di * (1 + n * 0.08), v95 = r.base95 * di * (1 + n * 0.1 + (rr() - 0.5) * 0.08);
      (r.events || []).forEach(function (e) {
        if (i < e.at || i >= e.at + e.len) return;
        var k = e.ramp ? (i - e.at + 1) / e.len : Math.sin(Math.PI * (i - e.at + 0.5) / e.len);
        v95 += e.amp * k; v50 += e.amp * k * 0.32;
      });
      p50.push(Math.round(v50)); p95.push(Math.round(v95));
    }
    return { p50: p50, p95: p95 };
  }
  function uptime90(seed, dips) {
    var rr = rng(seed), out = [];
    for (var i = 0; i < 90; i++) out.push(rr() < 0.14 ? +(100 - rr() * 0.012).toFixed(3) : 100);
    Object.keys(dips).forEach(function (k) { out[+k] = dips[k]; });
    return out;
  }
  function spark(seed, from, to, wob, kick) {
    var rr = rng(seed), out = [];
    for (var j = 0; j < 14; j++) { var t = j / 13; out.push(from + (to - from) * t + (rr() - 0.5) * wob + (kick && j >= 12 ? kick * (j - 11) / 2 : 0)); }
    return out;
  }
  function makeData() {
    var regions = {
      mumbai: {
        label: 'Mumbai', code: 'ap-south-1', factor: 1, rpm: 18420, rtt: 184, err: 0.18, up: 99.97, budget: 64, burn: 1.2,
        d: { rpm: 6.2, p95: 8.4, err: 0.06, up: -0.01 },
        base50: 84, base95: 192, events: [{ at: 40, len: 8, amp: 120 }],
        over: { search: { status: 'warn', p95: 640, err: 1.24, up: 99.82, health: 0.52 } },
        days: { 89: 99.912, 61: 99.42, 33: 99.951, 12: 99.978 },
        incidents: [
          { s: 'warn', t: 'Search p95 above 500 ms during index rebuild', m: 'Monitoring · started 38 min ago', live: true },
          { s: 'ok', t: '502s from one edge PoP in Chennai', m: 'Resolved · 6 min · 2 days ago' },
          { s: 'ok', t: 'Auth token refresh errors after key rotation', m: 'Resolved · 11 min · 5 days ago' }
        ]
      },
      frankfurt: {
        label: 'Frankfurt', code: 'eu-central-1', factor: 0.78, rpm: 12650, rtt: 132, err: 0.04, up: 99.99, budget: 91, burn: 0.4,
        d: { rpm: 3.1, p95: -3.2, err: -0.01, up: 0.01 },
        base50: 62, base95: 138, events: [{ at: 18, len: 3, amp: 46 }],
        over: {},
        days: { 70: 99.962, 41: 99.987 },
        incidents: [
          { s: 'info', t: 'Planned Postgres failover drill', m: 'Completed · 2 min read-only · yesterday' },
          { s: 'ok', t: 'Redis memory above 80% on shard 4', m: 'Resolved · 18 min · 3 days ago' },
          { s: 'ok', t: 'Gateway TLS certificates renewed', m: 'Done · no impact · 6 days ago' }
        ]
      },
      virginia: {
        label: 'Virginia', code: 'us-east-1', factor: 1.25, rpm: 26980, rtt: 236, err: 2.61, up: 99.71, budget: 18, burn: 3.6,
        d: { rpm: 11.8, p95: 86, err: 2.38, up: -0.24 },
        base50: 104, base95: 236, events: [{ at: 22, len: 4, amp: 190 }, { at: 43, len: 5, amp: 330, ramp: true }],
        over: {
          queue: { status: 'down', p95: null, err: 100, up: 99.21, health: 0.1 },
          notify: { status: 'warn', p95: 1840, err: 4.8, up: 99.64, health: 0.46 }
        },
        days: { 89: 98.62, 88: 99.71, 52: 99.12, 15: 99.884, 67: 99.96 },
        incidents: [
          { s: 'down', t: 'Job queue unreachable, consumers stalled', m: 'Ongoing · 14 min · paged Riya Sen', live: true },
          { s: 'warn', t: 'Notifications delayed, retry backlog 3.2k', m: 'Ongoing · 12 min · caused by job queue', live: true },
          { s: 'ok', t: 'Payments p95 spike after deploy v4.8.1', m: 'Resolved · rolled back in 22 min · yesterday' }
        ]
      }
    };
    Object.keys(regions).forEach(function (k, n) {
      var r = regions[k], L = latency(r, 31 + n * 7), rr = rng(200 + n);
      r.p50 = L.p50; r.p95 = L.p95;
      r.p95now = Math.round((L.p95[46] + L.p95[47]) / 2);
      r.uptime = uptime90(90 + n, r.days);
      r.spark = {
        rpm: spark(300 + n, 0.78, 1, 0.12),
        p95: L.p95.filter(function (_, i) { return i % 4 === 3 || i === 47; }).slice(-14),
        err: spark(310 + n, 0.5, k === 'virginia' ? 0.7 : 0.45, 0.25, k === 'virginia' ? 3.2 : 0),
        up: spark(320 + n, 0.99, k === 'virginia' ? 0.6 : 1, 0.06)
      };
      r.services = {};
      NODES.forEach(function (nd) {
        if (nd.src) return;
        var o = r.over[nd.id] || {}, st = o.status || 'ok', p = o.p95 !== undefined ? o.p95 : Math.round(nd.p95 * r.factor * (0.9 + rr() * 0.2));
        var line = [];
        for (var j = 0; j < 24; j++) {
          var base = (r.p95[j * 2] / r.base95) * (0.92 + rr() * 0.16);
          if (st === 'warn' && j > 18) base *= 1 + (j - 18) * 0.55;
          if (st === 'down' && j > 20) base = j === 23 ? 0 : base * 2.4;
          line.push(base);
        }
        r.services[nd.id] = {
          status: st, p95: p, err: o.err !== undefined ? o.err : +(nd.err * (0.6 + rr() * 0.8)).toFixed(2), up: o.up || nd.up,
          rpm: Math.round(r.rpm * nd.share), health: o.health || 0.86 + rr() * 0.13, line: line
        };
      });
    });
    return { slo: 300, target: 99.95, today: [2026, 10, 17], regions: regions };
  }

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function spring(t) { t = clamp(t, 0, 1); return 1 - Math.exp(-6 * t) * Math.cos(9 * t) * (1 - t) }
  function now() { return performance.now(); }
  function fmtInt(v) { return Math.round(v).toLocaleString('en-US'); }
  function fmtK(v) { return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2).replace(/\.0+$/, '') + 'k' : String(Math.round(v)); }
  function fmtUp(v) { return (Math.floor(v * 100) / 100).toFixed(2) + '%'; }
  function fmtMs(v) { return v == null ? 'timeout' : v >= 1000 ? (v / 1000).toFixed(2) + ' s' : Math.round(v) + ' ms'; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tween(dur, fn, done, ease) {
    var t0 = now(), id = { stop: false };
    if (reduce) dur = Math.min(dur, 1);
    (function f() { if (id.stop) return; var p = clamp((now() - t0) / dur, 0, 1); fn((ease || easeOut)(p), p); if (p < 1) requestAnimationFrame(f); else if (done) done(); })();
    return id;
  }
  function linePath(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function mount(root, opts) {
    if (!root || root.__beacon) return root && root.__beacon;
    opts = opts || {};
    var D = opts.data || window.Beacon.data, listeners = [], timers = [], alive = true, rafId = 0;
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    function on(t, e, f, o) { if (!t) return; t.addEventListener(e, f, o); listeners.push([t, e, f, o]); }
    function later(f, ms) { var id = setTimeout(f, ms); timers.push(id); return id; }
    var region = opts.region && D.regions[opts.region] ? opts.region : Object.keys(D.regions)[0];
    var R0 = D.regions[region];
    if (opts.theme) root.setAttribute('data-theme', opts.theme);

    /* theme + drawer */
    var themeBtn = $('[data-beacon-theme]'), menuBtn = $('[data-beacon-menu]'), scrim = $('.bc-scrim');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', String(t === 'light')); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
    }
    on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    function drawer(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    on(menuBtn, 'click', function () { drawer(!root.classList.contains('is-open')); });
    on(scrim, 'click', function () { drawer(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') { drawer(false); select(null, true); } });

    /* region switch */
    var regBtns = $$('[data-region]'), ind = $('.bc-regions-ind');
    function moveInd() {
      var b = regBtns.filter(function (x) { return x.getAttribute('data-region') === region; })[0];
      if (b && ind) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)'; }
    }
    regBtns.forEach(function (b) { on(b, 'click', function () { setRegion(b.getAttribute('data-region')); }); });

    var live = document.createElement('span'); live.className = 'bc-sr'; live.setAttribute('aria-live', 'polite'); root.appendChild(live);

    /* ================= service map ================= */
    var map = $('[data-beacon-map]'), svg, gWire, gLit, gPart, gNode, gFx, tip, W = 0, H = 0, R = 20, speed = 0.3;
    var nodes = {}, edges = [], P = null, sel = null, pinned = false;
    function buildMap() {
      map.innerHTML = '';
      svg = el('svg', { 'aria-hidden': 'false', role: 'group', 'aria-label': 'Services' }, map);
      var defs = el('defs', {}, svg), lg = el('linearGradient', { id: 'bc-srcg', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
      el('stop', { offset: 0, style: 'stop-color:var(--beacon-blue)' }, lg); el('stop', { offset: 1, style: 'stop-color:var(--beacon-cyan)' }, lg);
      gWire = el('g', { 'class': 'bc-wire-g' }, svg); gLit = el('g', { 'class': 'bc-lit-g' }, svg); gPart = el('g', {}, svg); gFx = el('g', {}, svg); gNode = el('g', {}, svg);
      EDGES.forEach(function (pair) {
        var e = { a: pair[0], b: pair[1], parts: [], tail: [], sparks: [] };
        e.wire = el('path', { 'class': 'bc-wire' }, gWire);
        e.cut = el('path', { 'class': 'bc-cut', opacity: 0 }, gLit);
        e.lit = el('path', { 'class': 'bc-lit' }, gLit);
        e.head = el('g', { 'class': 'bc-head', opacity: 0 }, gFx);
        for (var k = 0; k < 5; k++) e.tail.push(el('circle', { 'class': 'bc-head-tail', r: 2 }, e.head));
        e.glow2 = el('circle', { 'class': 'bc-head-glow2', r: 18 }, e.head);
        e.glow = el('circle', { 'class': 'bc-head-glow', r: 9 }, e.head);
        e.core = el('circle', { 'class': 'bc-head-core', r: 3.2 }, e.head);
        for (k = 0; k < 4; k++) e.sparks.push(el('circle', { 'class': 'bc-spark-dot', r: 1.8, opacity: 0 }, gFx));
        edges.push(e);
      });
      NODES.forEach(function (nd) {
        var g = el('g', { 'class': 'bc-node' + (nd.src ? ' is-src' : ''), tabindex: 0, role: 'button', 'data-node': nd.id }, gNode);
        var n = { def: nd, g: g, x: 0, y: 0, done: false, arc: 0 };
        n.halo = el('circle', { 'class': 'bc-n-halo', opacity: 0 }, g);
        n.ping = el('circle', { 'class': 'bc-n-ping', opacity: 0 }, g);
        n.ping2 = el('circle', { 'class': 'bc-n-ping', opacity: 0 }, g);
        if (!nd.src) { n.track = el('circle', { 'class': 'bc-n-track' }, g); n.arcEl = el('circle', { 'class': 'bc-n-arc' }, g); }
        n.core = el('circle', { 'class': 'bc-n-core' }, g);
        n.ic = el('g', { 'class': 'bc-n-ic' }, g); n.ic.innerHTML = ICONS[nd.id];
        n.name = el('text', { 'class': 'bc-n-name' }, g);
        n.val = el('text', { 'class': 'bc-n-val' }, g);
        nodes[nd.id] = n;
        on(g, 'pointerenter', function () { if (!pinned) select(nd.id); showTip(nd.id); });
        on(g, 'pointerleave', function () { if (document.activeElement !== g) { hideTip(); if (!pinned) select(null); } });
        on(g, 'focus', function () { showTip(nd.id); if (!pinned) select(nd.id); });
        on(g, 'blur', function () { hideTip(); if (!pinned) select(null); });
        on(g, 'click', function () { pin(nd.id); });
        on(g, 'keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(nd.id); }
          var order = NODES.map(function (x) { return x.id; }), i = order.indexOf(nd.id);
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nodes[order[(i + 1) % order.length]].g.focus(); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); nodes[order[(i + order.length - 1) % order.length]].g.focus(); }
        });
      });
      tip = document.createElement('div'); tip.className = 'bc-tip'; map.appendChild(tip);
    }
    function layout() {
      W = map.clientWidth; H = map.clientHeight; if (!W || !H) return false;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var narrow = W < 560;
      R = clamp(Math.min(W / 30, (H - 50) / 15.5), 12, 21);
      var padX = R + (narrow ? 22 : 34), cols = [0, 0.215, 0.43, 0.69, 1];
      var top = R + 14, bot = H - R - (narrow ? 34 : 38);
      NODES.forEach(function (nd) {
        var n = nodes[nd.id], x = padX + cols[nd.col] * (W - 2 * padX), y;
        if (nd.rows === 1) y = (top + bot) / 2;
        else if (nd.rows === 3) y = top + (bot - top) * (nd.row * 2 + 1) / 6;
        else y = top + (bot - top) * nd.row / (nd.rows - 1);
        n.x = x; n.y = y;
        n.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        n.core.setAttribute('r', R); n.halo.setAttribute('r', R + 12);
        if (n.track) { n.track.setAttribute('r', R + 5); n.arcEl.setAttribute('r', R + 5); n.arcEl.setAttribute('transform', 'rotate(-90)'); n.circ = 2 * Math.PI * (R + 5); n.arcEl.setAttribute('stroke-dasharray', n.circ.toFixed(1) + ' ' + n.circ.toFixed(1)); }
        var s = R / 21 * 0.95; n.ic.setAttribute('transform', 'scale(' + s.toFixed(3) + ') translate(-12 -12)');
        n.name.setAttribute('y', (R + (n.track ? 19 : 16)).toFixed(1)); n.val.setAttribute('y', (R + (n.track ? 32 : 29)).toFixed(1));
        n.name.textContent = narrow ? nd.short : nd.name;
        n.name.style.fontSize = narrow ? '10.5px' : ''; n.val.style.fontSize = narrow ? '9.5px' : '';
      });
      edges.forEach(function (e) {
        var A = nodes[e.a], B = nodes[e.b], sx = A.x + R + (A.track ? 6 : 2), ex = B.x - R - 6, c = (ex - sx) * 0.5;
        var d = 'M' + sx.toFixed(1) + ' ' + A.y.toFixed(1) + 'C' + (sx + c).toFixed(1) + ' ' + A.y.toFixed(1) + ' ' + (ex - c).toFixed(1) + ' ' + B.y.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + B.y.toFixed(1);
        e.wire.setAttribute('d', d); e.lit.setAttribute('d', d); e.cut.setAttribute('d', d);
        e.len = e.lit.getTotalLength(); e.lut = [];
        for (var k = 0; k <= 60; k++) { var p = e.lit.getPointAtLength(e.len * k / 60); e.lut.push([p.x, p.y]); }
        e.lit.setAttribute('stroke-dasharray', e.len.toFixed(1) + ' ' + (e.len + 10).toFixed(1));
      });
      var hr = R / 21;
      edges.forEach(function (e) {
        e.core.setAttribute('r', Math.max(2.6, 4 * hr)); e.glow.setAttribute('r', Math.max(6, 10 * hr)); e.glow2.setAttribute('r', Math.max(11, 19 * hr));
        e.tail.forEach(function (c, k) { c.setAttribute('r', Math.max(1, (3.4 - k * 0.55) * hr)); });
      });
      speed = (W - 2 * padX) / 1250; // px per ms: the pulse crosses the map in ~1.3 s
      schedule();
      return true;
    }
    function lutAt(e, p) { var f = clamp(p, 0, 1) * 60, i = Math.floor(f), t = f - i, a = e.lut[i], b = e.lut[Math.min(60, i + 1)]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    function schedule() {
      var arr = { users: 0 };
      edges.forEach(function (e) {
        e.start = (arr[e.a] || 0) + 70; e.dur = e.len / speed;
        var end = e.start + e.dur; if (arr[e.b] == null || end < arr[e.b]) arr[e.b] = end;
      });
      NODES.forEach(function (nd) { nodes[nd.id].at = arr[nd.id] || 0; });
      map.__total = Math.max.apply(null, NODES.map(function (nd) { return nodes[nd.id].at; }));
    }
    function svcOf(id) { return D.regions[region].services[id]; }
    function nodeVal(id) {
      var r = D.regions[region];
      if (id === 'users') return fmtK(r.rpm) + ' rpm';
      return fmtMs(svcOf(id).p95);
    }
    var RET = 320;
    function probe(animate) {
      var prev = {};
      NODES.forEach(function (nd) { prev[nd.id] = nodes[nd.id].arc || 0; });
      P = { t0: now() - (animate && !reduce ? 0 : 1e6), prev: prev, region: region, counted: {}, healthy: 0, finished: false };
      edges.forEach(function (e) { e.status = e.b === 'users' ? 'ok' : svcOf(e.b).status; });
      var busy = $('[data-beacon-reprobe]'); if (busy) busy.classList.toggle('is-busy', !!animate && !reduce);
      setText('[data-beacon-probe]', animate && !reduce ? 'probing…' : 'every 30 s');
      healthyText(0, true);
      startLoop();
    }
    function healthyText(n, reset) {
      var b = $('[data-beacon-healthy]'), total = NODES.length - 1; if (!b) return;
      b.innerHTML = n + '<span> / ' + total + '</span>';
      if (reset) { b.style.color = ''; return; }
    }
    function startLoop() { if (rafId) return; rafId = requestAnimationFrame(frame); }
    function frame() {
      rafId = 0; if (!alive || !P || !W) return;
      var tNow = now(), t = tNow - P.t0, base = RET, settled = t > base + map.__total + 1600, r = D.regions[region];
      // nodes
      NODES.forEach(function (nd) {
        var n = nodes[nd.id], a = t - base - n.at, s = nd.src ? 'ok' : svcOf(nd.id).status, target = nd.src ? 1 : svcOf(nd.id).health;
        if (a < 0) {
          var k = clamp(t / RET, 0, 1);
          n.arc = P.prev[nd.id] * (1 - easeOut(k));
          if (t >= RET * 0.5 && n.done !== 'pending') { n.g.classList.remove('is-ok', 'is-warn', 'is-down'); n.val.textContent = '—'; n.done = 'pending'; }
          n.ping.setAttribute('opacity', 0); n.ping2.setAttribute('opacity', 0); n.halo.setAttribute('opacity', 0);
        } else {
          if (n.done !== P) {
            n.done = P; n.g.classList.remove('is-ok', 'is-warn', 'is-down'); n.g.classList.add('is-' + s);
            n.g.setAttribute('aria-label', nd.name + ': ' + (nd.src ? 'probe origin ' + r.label : STATUS_TXT[s] + ', p95 ' + fmtMs(svcOf(nd.id).p95)));
            if (!nd.src && s === 'ok') { P.healthy++; healthyText(P.healthy); }
          }
          var pa = clamp(a / 700, 0, 1);
          n.ping.setAttribute('r', (R + 5 + easeOut(pa) * R * 1.3).toFixed(1));
          n.ping.setAttribute('opacity', ((1 - pa) * 0.9).toFixed(3));
          if (s === 'down') { var pb = clamp((a - 380) / 700, 0, 1); n.ping2.setAttribute('r', (R + 5 + easeOut(pb) * R * 1.3).toFixed(1)); n.ping2.setAttribute('opacity', (a > 380 ? (1 - pb) * 0.9 : 0).toFixed(3)); }
          else n.ping2.setAttribute('opacity', 0);
          var hk = clamp(a / 500, 0, 1);
          n.halo.setAttribute('opacity', (s === 'ok' ? (0.22 * (1 - hk)) : (0.28 - 0.14 * hk) + (s === 'down' ? 0.05 * Math.sin(tNow / 240) : 0)).toFixed(3));
          if (nd.src) n.halo.setAttribute('opacity', (0.18 + 0.06 * Math.sin(tNow / 500)).toFixed(3));
          n.arc = target * spring(a / 900);
          if (s === 'warn' && a < 650) n.arcEl.setAttribute('opacity', Math.sin(a / 34) > -0.2 ? 1 : 0.25); else if (n.arcEl) n.arcEl.setAttribute('opacity', 1);
          var v = nd.src ? r.rpm : svcOf(nd.id).p95;
          n.val.textContent = nd.src ? fmtK(r.rpm * easeOut(clamp(a / 700, 0, 1))) + ' rpm' : v == null ? (a < 500 ? 'probing…' : 'timeout') : fmtMs(v * easeOut(clamp(a / 700, 0, 1)));
          if (s === 'down' && a < 520) n.g.setAttribute('transform', 'translate(' + (n.x + Math.sin(a / 18) * 3 * (1 - a / 520)).toFixed(1) + ' ' + n.y.toFixed(1) + ')');
          else if (s === 'down') n.g.setAttribute('transform', 'translate(' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + ')');
        }
        if (n.arcEl) n.arcEl.setAttribute('stroke-dashoffset', (n.circ * (1 - clamp(n.arc, 0, 1.05))).toFixed(1));
      });
      // edges
      edges.forEach(function (e) {
        var s0 = base + e.start, p = (t - s0) / e.dur, down = e.status === 'down', stop = 0.8;
        if (t < RET) { // retract the old state
          e.lit.setAttribute('opacity', (1 - t / RET) * 0.6); e.lit.setAttribute('stroke-dashoffset', 0); e.cut.setAttribute('opacity', 0);
          e.head.setAttribute('opacity', 0);
        } else {
          e.lit.setAttribute('class', 'bc-lit is-' + e.status);
          var pp = down ? Math.min(p, stop) : p, after = t - s0 - e.dur;
          e.lit.setAttribute('stroke-dashoffset', (e.len * (1 - clamp(pp, 0, 1))).toFixed(1));
          var lo = p < 0 ? 0 : down ? (p < stop ? 1 : clamp(1 - (p - stop) * 2.2, 0, 1)) : after < 0 ? 1 : 1 - 0.45 * clamp(after / 700, 0, 1);
          e.lit.setAttribute('opacity', lo.toFixed(3));
          e.lit.setAttribute('stroke-width', (p >= 0 && (after < 0 || down) ? 3 : 2.4 - 0.2 * clamp(after / 700, 0, 1)).toFixed(2));
          e.cut.setAttribute('opacity', down ? clamp((p - stop) * 2.5, 0, 1).toFixed(3) : 0);
          // travelling pulse
          var vis = p >= 0 && (down ? p < stop + 0.12 : p < 1);
          e.head.setAttribute('opacity', vis ? (down && p > stop ? clamp(1 - (p - stop) / 0.12, 0, 1) : 1).toFixed(3) : 0);
          if (vis) {
            e.head.classList.toggle('is-down', down && p > stop - 0.12);
            var hp = down ? Math.min(p, stop) : p, pt = lutAt(e, hp);
            e.core.setAttribute('cx', pt[0].toFixed(1)); e.core.setAttribute('cy', pt[1].toFixed(1));
            e.glow.setAttribute('cx', pt[0].toFixed(1)); e.glow.setAttribute('cy', pt[1].toFixed(1)); e.glow2.setAttribute('cx', pt[0].toFixed(1)); e.glow2.setAttribute('cy', pt[1].toFixed(1));
            e.tail.forEach(function (c, k) { var q = lutAt(e, Math.max(0, hp - (k + 1) * 0.028)); c.setAttribute('cx', q[0].toFixed(1)); c.setAttribute('cy', q[1].toFixed(1)); c.setAttribute('opacity', (0.7 - k * 0.13).toFixed(2)); });
          }
          // sparks where a dead link gives up
          var sa = (p - stop) * e.dur;
          e.sparks.forEach(function (c, k) {
            if (!down || sa < 0 || sa > 520) { c.setAttribute('opacity', 0); return; }
            var q = lutAt(e, stop), ang = -1.9 + k * 1.25, dist = easeOut(sa / 520) * R * 0.9;
            c.setAttribute('cx', (q[0] + Math.cos(ang) * dist).toFixed(1)); c.setAttribute('cy', (q[1] + Math.sin(ang) * dist + (sa / 520) * (sa / 520) * 8).toFixed(1));
            c.setAttribute('opacity', (1 - sa / 520).toFixed(2));
          });
        }
        // steady traffic: particles flow once the link is lit
        var want = down || reduce ? 0 : clamp(Math.round(svcShare(e.b) * 6), 1, 5);
        while (e.parts.length < want) e.parts.push(el('circle', { 'class': 'bc-part', r: 2 }, gPart));
        e.parts.forEach(function (c, j) {
          if (j >= want || t < RET) { c.setAttribute('opacity', 0); return; }
          var after2 = t - base - e.start - e.dur, v = e.status === 'warn' ? 0.045 : 0.09, u = ((tNow * v / e.len) + j / want) % 1, q = lutAt(e, u);
          c.setAttribute('class', 'bc-part' + (e.status === 'warn' ? ' is-warn' : ''));
          c.setAttribute('r', Math.max(1.4, 2.1 * R / 21).toFixed(2));
          c.setAttribute('cx', q[0].toFixed(1)); c.setAttribute('cy', q[1].toFixed(1));
          c.setAttribute('opacity', (clamp(after2 / 500, 0, 1) * Math.sin(Math.PI * u) * 0.95).toFixed(3));
        });
      });
      if (!P.finished && t > base + map.__total + 500) {
        P.finished = true;
        var counts = { ok: 0, warn: 0, down: 0 };
        NODES.forEach(function (nd) { if (!nd.src) counts[svcOf(nd.id).status]++; });
        var b = $('[data-beacon-healthy]'); if (b) b.style.color = counts.down ? 'var(--beacon-bad)' : counts.warn ? 'var(--beacon-warn)' : 'var(--beacon-good)';
        healthyText(counts.ok);
        setText('[data-beacon-probe]', (NODES.length - 1) + ' checks · ' + fmtMs(r.rtt) + ' round trip');
        var busy = $('[data-beacon-reprobe]'); if (busy) busy.classList.remove('is-busy');
        live.textContent = r.label + ' probe finished: ' + counts.ok + ' healthy' + (counts.warn ? ', ' + counts.warn + ' degraded' : '') + (counts.down ? ', ' + counts.down + ' down' : '') + '.';
      }
      if (!(reduce && settled)) rafId = requestAnimationFrame(frame);
    }
    function svcShare(id) { var nd = NODES.filter(function (x) { return x.id === id; })[0]; return nd && nd.share || 1; }

    function showTip(id) {
      var n = nodes[id], r = D.regions[region], nd = n.def, h;
      if (nd.src) h = '<b>Users <span class="bc-pill is-info">' + r.label + '</span></b><div><span>Requests / min</span><span>' + fmtInt(r.rpm) + '</span></div><div><span>Round trip</span><span>' + fmtMs(r.rtt) + '</span></div><div><span>Region</span><span>' + r.code + '</span></div>';
      else {
        var s = svcOf(id);
        h = '<b>' + nd.name + ' <span class="bc-pill is-' + s.status + '">' + STATUS_TXT[s.status] + '</span></b>' +
          '<div><span>p95 latency</span><span>' + fmtMs(s.p95) + '</span></div><div><span>Requests / min</span><span>' + (s.status === 'down' ? '0' : fmtInt(s.rpm)) + '</span></div>' +
          '<div><span>Errors</span><span>' + s.err.toFixed(2) + '%</span></div><div><span>Uptime · 30 d</span><span>' + fmtUp(s.up) + '</span></div>';
      }
      tip.innerHTML = h;
      var below = n.y < 130;
      tip.classList.toggle('is-below', below);
      tip.style.left = clamp(n.x, 96, W - 96) + 'px';
      tip.style.top = (below ? n.y + R + 36 : n.y - R - 8) + 'px';
      tip.classList.add('is-on');
    }
    function hideTip() { if (tip) tip.classList.remove('is-on'); }
    function select(id, force) {
      if (force) pinned = false;
      sel = id;
      map.classList.toggle('has-sel', !!id);
      NODES.forEach(function (nd) { nodes[nd.id].g.classList.toggle('is-sel', nd.id === id); });
      $$('[data-beacon-table] tbody tr').forEach(function (tr) { tr.classList.toggle('is-sel', tr.getAttribute('data-id') === id); });
      if (!id) hideTip();
    }
    function pin(id) { if (pinned && sel === id) { pinned = false; select(null); } else { pinned = true; select(id); showTip(id); } }

    /* ================= KPIs ================= */
    var kpiState = { rpm: 0, p95: 0, err: 0, up: 0 };
    function kpiFmt(k, v) { return k === 'rpm' ? fmtInt(v) : k === 'p95' ? Math.round(v) + '<small>ms</small>' : k === 'err' ? v.toFixed(2) + '%' : v.toFixed(2) + '%'; }
    function kpis(animate) {
      var r = D.regions[region], to = { rpm: r.rpm, p95: r.p95now, err: r.err, up: r.up }, from = {};
      Object.keys(to).forEach(function (k) { from[k] = animate ? kpiState[k] : to[k]; if (k === 'up' && from[k] < 90) from[k] = 99; });
      tween(1100, function (e) {
        Object.keys(to).forEach(function (k) {
          var v = from[k] + (to[k] - from[k]) * e, n = root.querySelector('[data-beacon-kpi="' + k + '"] .bc-kpi-val');
          if (n) n.innerHTML = kpiFmt(k, v); kpiState[k] = v;
        });
      });
      Object.keys(to).forEach(function (k) {
        var card = root.querySelector('[data-beacon-kpi="' + k + '"]'); if (!card) return;
        var dv = r.d[k], dl = card.querySelector('.bc-delta'), up = dv >= 0, good = (k === 'rpm' || k === 'up') ? up : !up;
        if (dl) {
          dl.classList.toggle('is-down', !up); dl.classList.toggle('is-bad', !good);
          dl.querySelector('span').textContent = (up ? '+' : '−') + (k === 'err' || k === 'up' ? Math.abs(dv).toFixed(2) + ' pt' : Math.abs(dv).toFixed(1) + '%');
        }
        var sp = card.querySelector('.bc-spark'); if (sp) drawSpark(sp, r.spark[k], animate);
      });
    }
    function drawSpark(svgEl, vals, animate) {
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = mx - mn || 1;
      var pts = vals.map(function (v, i) { return [i / (vals.length - 1) * 84, 27 - (v - mn) / rg * 24]; });
      var d = smoothPath(pts);
      if (!svgEl.__p) { svgEl.__f = el('path', { 'class': 'bc-sfill' }, svgEl); svgEl.__p = el('path', {}, svgEl); }
      svgEl.__p.setAttribute('d', d); svgEl.__f.setAttribute('d', d + 'L84 30L0 30Z');
      if (animate && !reduce) {
        var L = svgEl.__p.getTotalLength();
        svgEl.__p.style.transition = 'none'; svgEl.__p.style.strokeDasharray = L; svgEl.__p.style.strokeDashoffset = L;
        svgEl.__p.getBoundingClientRect();
        svgEl.__p.style.transition = 'stroke-dashoffset 1s cubic-bezier(.3,.9,.3,1)'; svgEl.__p.style.strokeDashoffset = 0;
      }
    }

    /* ================= error budget + incidents ================= */
    var budgetState = 0;
    function budget(animate) {
      var r = D.regions[region], ring = $('[data-beacon-budget]'); if (!ring) return;
      var arc = ring.querySelector('.bc-ring-arc'), C = 2 * Math.PI * 50, from = animate ? budgetState : r.budget, lbl = ring.querySelector('b');
      arc.setAttribute('stroke-dasharray', C.toFixed(1) + ' ' + C.toFixed(1));
      ring.classList.toggle('is-warn', r.budget < 50 && r.budget >= 25); ring.classList.toggle('is-bad', r.budget < 25);
      tween(1200, function (e) { var v = from + (r.budget - from) * e; budgetState = v; arc.setAttribute('stroke-dashoffset', (C * (1 - v / 100)).toFixed(1)); lbl.textContent = Math.round(v) + '%'; }, null, function (t) { return spring(t); });
      var bar = root.querySelector('.bc-burnbar u'); if (bar) bar.style.transform = 'scaleX(' + clamp(r.burn / 3, 0.02, 1) + ')';
      setText('[data-beacon-burn]', r.burn.toFixed(1) + '×');
      var days = Math.max(1, Math.round(r.budget / 100 * 30 / r.burn));
      setText('[data-beacon-burnnote]', r.burn <= 1 ? 'At this pace the budget lasts the full 30 days.' : 'At this pace the budget runs out in ' + days + ' day' + (days === 1 ? '' : 's') + '.');
    }
    function incidents(animate) {
      var r = D.regions[region], ul = $('[data-beacon-incidents]'); if (!ul) return;
      var col = { down: 'var(--beacon-bad)', warn: 'var(--beacon-warn)', ok: 'var(--beacon-good)', info: 'var(--beacon-peri)' };
      ul.innerHTML = r.incidents.map(function (it, i) {
        return '<li class="' + (animate ? 'is-in' : '') + (it.live ? ' is-live' : '') + '" style="--c:' + col[it.s] + ';animation-delay:' + (i * 90 + 200) + 'ms"><i></i><b>' + it.t + '</b><span>' + it.m + '</span></li>';
      }).join('');
      var lv = r.incidents.filter(function (x) { return x.live; }).length, cnt = $('[data-beacon-inccount]');
      if (cnt) { cnt.textContent = lv; cnt.classList.toggle('is-zero', !lv); }
    }

    /* ================= latency chart ================= */
    var lat = $('[data-beacon-latency]'), L = null, cur50 = null, cur95 = null, curMax = 0, latTw = null, latIdx = -1;
    function buildLat() {
      if (!lat) return;
      lat.innerHTML = '';
      var s = el('svg', { 'aria-hidden': 'true' }, lat), defs = el('defs', {}, s);
      var g1 = el('linearGradient', { id: 'bc-latg', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      el('stop', { offset: 0, style: 'stop-color:var(--beacon-blue)' }, g1); el('stop', { offset: 1, style: 'stop-color:var(--beacon-cyan)' }, g1);
      var g2 = el('linearGradient', { id: 'bc-lata', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, style: 'stop-color:var(--beacon-cyan);stop-opacity:.26' }, g2); el('stop', { offset: 1, style: 'stop-color:var(--beacon-cyan);stop-opacity:0' }, g2);
      L = { svg: s, grid: el('g', {}, s), over: el('g', {}, s), area: el('path', { 'class': 'bc-area' }, s), p50: el('path', { 'class': 'bc-p50' }, s), p95: el('path', { 'class': 'bc-p95' }, s),
        slo: el('line', { 'class': 'bc-slo' }, s), sloT: el('text', { 'class': 'bc-slo-t', 'text-anchor': 'end' }, s), xl: el('g', {}, s), cross: el('g', { 'class': 'bc-cross' }, s) };
      L.cl = el('line', {}, L.cross); L.c50 = el('circle', { 'class': 'c50', r: 4 }, L.cross); L.c95 = el('circle', { 'class': 'c95', r: 4.5 }, L.cross);
      L.tip = document.createElement('div'); L.tip.className = 'bc-tip'; lat.appendChild(L.tip);
      on(lat, 'pointermove', function (e) { var b = lat.getBoundingClientRect(); latHover(Math.round((e.clientX - b.left - L.pl) / L.step)); });
      on(lat, 'pointerleave', function () { if (document.activeElement !== lat) latHover(-1); });
      on(lat, 'blur', function () { latHover(-1); });
      on(lat, 'keydown', function (e) {
        var i = latIdx < 0 ? 47 : latIdx;
        if (e.key === 'ArrowLeft') i--; else if (e.key === 'ArrowRight') i++; else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = 47; else return;
        e.preventDefault(); latHover(clamp(i, 0, 47));
      });
    }
    function latTime(i) { var m = (14 * 60 + 30 + i * 30) % 1440; return (m / 60 < 10 ? '0' : '') + Math.floor(m / 60) + ':' + (m % 60 ? '30' : '00'); }
    function niceMax(v) { var steps = [200, 300, 400, 500, 600, 800, 1000, 1200]; for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i]; return Math.ceil(v / 500) * 500; }
    function drawLat() {
      if (!L) return;
      var w = lat.clientWidth, h = lat.clientHeight; if (!w) return;
      L.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var pl = 40, pr = 8, pt = 10, pb = 24, ih = h - pt - pb, iw = w - pl - pr, mx = curMax, slo = D.slo;
      L.pl = pl; L.step = iw / 47; L.w = w; L.pt = pt; L.ih = ih;
      var y = function (v) { return pt + ih * (1 - Math.min(v, mx * 1.06) / mx); }, x = function (i) { return pl + i * L.step; };
      L.y = y; L.x = x;
      var gh = '';
      for (var k = 0; k <= 4; k++) { var v = mx * k / 4, yy = y(v).toFixed(1); gh += '<line class="bc-gl" x1="' + pl + '" x2="' + (w - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 8) + '" y="' + (+yy + 3.5) + '" text-anchor="end">' + (v >= 1000 ? (v / 1000) + 's' : Math.round(v)) + '</text>'; }
      L.grid.innerHTML = gh;
      var xh = '', every = w < 420 ? 16 : 8;
      for (var i = 3; i < 48; i += every) xh += '<text x="' + x(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle">' + latTime(i) + '</text>';
      L.xl.innerHTML = xh;
      var p95 = cur95.map(function (v, i) { return [x(i), y(v)]; }), p50 = cur50.map(function (v, i) { return [x(i), y(v)]; }), d95 = smoothPath(p95);
      L.p95.setAttribute('d', d95); L.p50.setAttribute('d', smoothPath(p50));
      L.area.setAttribute('d', d95 + 'L' + x(47).toFixed(1) + ' ' + (pt + ih) + 'L' + pl + ' ' + (pt + ih) + 'Z');
      var sy = y(slo).toFixed(1);
      L.slo.setAttribute('x1', pl); L.slo.setAttribute('x2', w - pr); L.slo.setAttribute('y1', sy); L.slo.setAttribute('y2', sy);
      L.sloT.setAttribute('x', w - pr - 2); L.sloT.setAttribute('y', +sy - 6); L.sloT.textContent = 'SLO ' + slo + ' ms';
      var oh = '', st = -1;
      for (i = 0; i <= 48; i++) {
        var o = i < 48 && cur95[i] > slo;
        if (o && st < 0) st = i;
        if (!o && st >= 0) { var x0 = Math.max(pl, x(st) - L.step / 2), x1 = Math.min(w - pr, x(i - 1) + L.step / 2); oh += '<rect class="bc-over" x="' + x0.toFixed(1) + '" y="' + pt + '" width="' + (x1 - x0).toFixed(1) + '" height="' + ih + '" rx="4"/>'; st = -1; }
      }
      L.over.innerHTML = oh;
      if (latIdx >= 0) latHover(latIdx);
    }
    function latency2(animate) {
      var r = D.regions[region], to50 = r.p50.slice(), to95 = r.p95.slice(), toMax = niceMax(Math.max(Math.max.apply(null, to95) * 1.12, D.slo * 1.25));
      if (!cur95 || !animate || reduce) { cur50 = to50; cur95 = to95; curMax = toMax; drawLat(); if (animate && !reduce && L) revealLat(); return; }
      var f50 = cur50.slice(), f95 = cur95.slice(), fMax = curMax;
      if (latTw) latTw.stop = true;
      latTw = tween(1300, function (e, raw) {
        var tt = raw * 1300;
        for (var i = 0; i < 48; i++) {
          var k = easeInOut(clamp((tt - i * 9) / 870, 0, 1));
          cur50[i] = f50[i] + (to50[i] - f50[i]) * k; cur95[i] = f95[i] + (to95[i] - f95[i]) * k;
        }
        curMax = fMax + (toMax - fMax) * easeInOut(raw);
        drawLat();
      }, null, function (t) { return t; });
    }
    function revealLat() {
      [L.p95, L.p50].forEach(function (p) {
        var len = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.getBoundingClientRect();
        p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.45,.1,.2,1)'; p.style.strokeDashoffset = 0;
        later(function () { p.style.strokeDasharray = ''; p.style.transition = ''; }, 1500);
      });
      L.area.style.transition = 'none'; L.area.style.opacity = 0; L.area.getBoundingClientRect(); L.area.style.transition = 'opacity 1s .5s'; L.area.style.opacity = 1;
    }
    function latHover(i) {
      latIdx = i;
      if (i < 0 || i > 47 || !L.x) { L.cross.classList.remove('is-on'); L.tip.classList.remove('is-on'); latIdx = -1; return; }
      var xx = L.x(i), y95 = L.y(cur95[i]), y50 = L.y(cur50[i]);
      L.cl.setAttribute('x1', xx); L.cl.setAttribute('x2', xx); L.cl.setAttribute('y1', L.pt); L.cl.setAttribute('y2', L.pt + L.ih);
      L.c95.setAttribute('cx', xx); L.c95.setAttribute('cy', y95); L.c50.setAttribute('cx', xx); L.c50.setAttribute('cy', y50);
      L.cross.classList.add('is-on');
      var over = cur95[i] > D.slo;
      L.tip.innerHTML = '<b>' + latTime(i) + (over ? ' <span class="bc-pill is-down">Over SLO</span>' : '') + '</b><div><span>p95</span><span>' + fmtMs(cur95[i]) + '</span></div><div><span>p50</span><span>' + fmtMs(cur50[i]) + '</span></div>';
      L.tip.style.left = clamp(xx, 80, L.w - 80) + 'px'; L.tip.style.top = Math.max(y95, 60) + 'px'; L.tip.classList.add('is-on');
    }

    /* ================= 90-day uptime ================= */
    var daysEl = $('[data-beacon-days]'), dayTip = null;
    function dayCol(v) { return v >= 99.99 ? 'var(--beacon-good)' : v >= 99.9 ? 'color-mix(in srgb,var(--beacon-good) 55%,var(--beacon-warn))' : v >= 99 ? 'var(--beacon-warn)' : 'var(--beacon-bad)'; }
    function dayDate(i) { var t = D.today, d = new Date(t[0], t[1], t[2] - (89 - i)); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
    function buildDays() {
      if (!daysEl) return;
      var h = ''; for (var i = 0; i < 90; i++) h += '<i data-i="' + i + '"></i>'; daysEl.innerHTML = h;
      dayTip = document.createElement('div'); dayTip.className = 'bc-tip'; daysEl.appendChild(dayTip);
      on(daysEl, 'pointerover', function (e) {
        var t = e.target; if (t.tagName !== 'I') return;
        var i = +t.getAttribute('data-i'), v = D.regions[region].uptime[i], b = daysEl.getBoundingClientRect(), c = t.getBoundingClientRect();
        dayTip.innerHTML = '<b>' + dayDate(i) + (i === 89 ? ' · today' : '') + '</b><div><span>Uptime</span><span>' + v.toFixed(3) + '%</span></div><div><span>Downtime</span><span>' + Math.round((100 - v) / 100 * 1440) + ' min</span></div>';
        dayTip.style.left = clamp(c.left - b.left + c.width / 2, 70, b.width - 70) + 'px'; dayTip.style.top = (c.top - b.top) + 'px'; dayTip.classList.add('is-on');
      });
      on(daysEl, 'pointerleave', function () { dayTip.classList.remove('is-on'); });
    }
    function days(animate) {
      if (!daysEl) return;
      var r = D.regions[region], cells = daysEl.querySelectorAll('i[data-i]'), sum = 0, bad = 0;
      Array.prototype.forEach.call(cells, function (c, i) {
        var v = r.uptime[i]; sum += v; if (v < 99.9) bad++;
        c.style.setProperty('--c', dayCol(v));
        if (animate && !reduce) { c.classList.remove('is-pop'); c.style.animationDelay = ((i % 15) * 22 + Math.floor(i / 15) * 30) + 'ms'; }
      });
      if (animate && !reduce) { daysEl.getBoundingClientRect(); Array.prototype.forEach.call(cells, function (c) { c.classList.add('is-pop'); }); }
      setText('[data-beacon-up90]', (sum / 90).toFixed(3) + '%');
      var mins = r.uptime.reduce(function (a, v) { return a + (100 - v) / 100 * 1440; }, 0), streak = 0;
      for (var j = 89; j >= 0 && r.uptime[j] >= 99.9; j--) streak++;
      setText('[data-beacon-upbad]', String(bad));
      setText('[data-beacon-updown]', mins >= 90 ? (mins / 60).toFixed(1) + ' h' : Math.round(mins) + ' min');
      setText('[data-beacon-upstreak]', streak + (streak === 1 ? ' day' : ' days'));
      daysEl.setAttribute('aria-label', '90 day uptime ' + (sum / 90).toFixed(3) + '%, ' + bad + ' days below 99.9%');
    }

    /* ================= services table ================= */
    var tbody = root.querySelector('[data-beacon-table] tbody'), search = $('[data-beacon-search]'), sortKey = 'status', sortDir = -1;
    function miniPath(vals) { var mx = Math.max.apply(null, vals) || 1; return linePath(vals.map(function (v, i) { return [i / 23 * 94 + 1, 24 - v / mx * 21]; })); }
    function table(animate) {
      if (!tbody) return;
      var r = D.regions[region], q = (search && search.value || '').trim().toLowerCase();
      var rows = NODES.filter(function (nd) { return !nd.src && (!q || (nd.name + ' ' + nd.kind).toLowerCase().indexOf(q) >= 0); }).map(function (nd) { return { nd: nd, s: r.services[nd.id] }; });
      rows.sort(function (a, b) {
        var va, vb;
        if (sortKey === 'status') { va = SEV[a.s.status] * 1e5 + (a.s.p95 == null ? 9e4 : a.s.p95); vb = SEV[b.s.status] * 1e5 + (b.s.p95 == null ? 9e4 : b.s.p95); }
        else if (sortKey === 'p95') { va = a.s.p95 == null ? 1e9 : a.s.p95; vb = b.s.p95 == null ? 1e9 : b.s.p95; }
        else { va = a.s[sortKey]; vb = b.s[sortKey]; }
        return (va - vb) * sortDir;
      });
      if (!rows.length) { tbody.innerHTML = '<tr class="bc-empty"><td colspan="6">No service matches “' + q.replace(/</g, '&lt;') + '”</td></tr>'; return; }
      tbody.innerHTML = rows.map(function (o, i) {
        var s = o.s, nd = o.nd, pc = s.status === 'down' ? 'is-bad' : s.p95 > D.slo ? 'is-warn' : '';
        return '<tr data-id="' + nd.id + '" class="' + (animate ? 'is-in' : '') + (sel === nd.id ? ' is-sel' : '') + '" style="animation-delay:' + (i * 45) + 'ms">' +
          '<td><div class="bc-svc"><span class="bc-thumb"><svg class="bc-ic" viewBox="0 0 24 24">' + ICONS[nd.id] + '</svg></span><div><b>' + nd.name + '</b><small>' + nd.kind + '</small></div></div></td>' +
          '<td><span class="bc-pill is-' + s.status + '">' + STATUS_TXT[s.status] + '</span></td>' +
          '<td class="bc-num ' + pc + '">' + fmtMs(s.p95) + '</td>' +
          '<td class="bc-num bc-col-err' + (s.err >= 1 ? ' is-bad' : s.err >= 0.5 ? ' is-warn' : '') + '">' + s.err.toFixed(2) + '%</td>' +
          '<td class="bc-num bc-col-up">' + fmtUp(s.up) + '</td>' +
          '<td class="bc-col-spark"><svg class="bc-mini is-' + s.status + '" viewBox="0 0 96 26" aria-hidden="true"><path d="' + miniPath(s.line) + '"/></svg></td></tr>';
      }).join('');
    }
    $$('[data-beacon-table] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () {
        var th = b.parentNode, k = th.getAttribute('data-sort');
        if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'up' ? 1 : -1; }
        $$('[data-beacon-table] th[data-sort]').forEach(function (x) { x.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', sortDir > 0 ? 'ascending' : 'descending');
        table(true);
      });
    });
    on(search, 'input', function () { table(false); });
    on(tbody, 'pointerover', function (e) { var tr = e.target.closest && e.target.closest('tr[data-id]'); if (tr && !pinned && sel !== tr.getAttribute('data-id')) select(tr.getAttribute('data-id')); });
    on(tbody, 'pointerleave', function () { if (!pinned) select(null); });
    on(tbody, 'click', function (e) { var tr = e.target.closest && e.target.closest('tr[data-id]'); if (tr) pin(tr.getAttribute('data-id')); });

    function setText(s, t) { $$(s).forEach(function (n) { n.textContent = t; }); }

    /* ================= region ================= */
    function setRegion(id, animate) {
      if (!D.regions[id]) return;
      animate = animate !== false;
      region = id;
      regBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-region') === id)); });
      moveInd();
      setText('[data-beacon-regionname]', D.regions[id].label);
      if (pinned) { pinned = false; } select(null);
      probe(animate); kpis(animate); budget(animate); incidents(animate); latency2(animate); days(animate); table(animate);
      ctrl.region = id;
    }

    buildMap(); buildLat(); buildDays();
    var ctrl = {
      region: region, data: D,
      setRegion: function (id) { setRegion(id, true); },
      replay: function () { setRegion(region, true); },
      setTheme: setTheme,
      destroy: function () {
        alive = false; if (rafId) cancelAnimationFrame(rafId);
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); timers.forEach(clearTimeout);
        if (ro) ro.disconnect(); delete root.__beacon;
      }
    };
    on($('[data-beacon-reprobe]'), 'click', function () { ctrl.replay(); });
    root.__beacon = ctrl;
    layout();
    setRegion(region, opts.animate !== false);
    requestAnimationFrame(moveInd);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { layout(); drawLat(); moveInd(); startLoop(); }) : null;
    if (ro) { ro.observe(map); if (lat) ro.observe(lat); } else on(window, 'resize', function () { layout(); drawLat(); moveInd(); startLoop(); });
    return ctrl;
  }

  window.Beacon = { mount: mount, data: makeData(), version: '1.0.0' };
  function auto() { Array.prototype.forEach.call(document.querySelectorAll('[data-beacon]:not([data-beacon-manual])'), function (n) { mount(n); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
