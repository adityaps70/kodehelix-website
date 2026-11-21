/*!
 * Aisle — warehouse inventory dashboard · v1.0
 * Kodehelix UI · https://kodehelix.in/store/aisle/
 * Plain JavaScript, zero dependencies.
 *
 *   const app = Aisle.mount(document.querySelector('#aisle'), { theme: 'dark' });
 *   app.setWarehouse(1);   // switch warehouse → runs a cycle count on the floor map
 *   app.recount();         // replay the count for the current warehouse
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var now = function () { return global.performance && performance.now ? performance.now() : Date.now(); };
  var raf = function (fn) { return global.requestAnimationFrame(fn); };
  var reduced = function () { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); };

  /* ---------------- tiny helpers ---------------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
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
  function spring(t) { return t >= 1.4 ? 1 : 1 - Math.exp(-t * 7.5) * Math.cos(t * 14); } // t in seconds
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }
  function money(n, cur) {
    cur = cur || '$';
    if (Math.abs(n) >= 1e6) return cur + (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return cur + (n / 1e3).toFixed(1) + 'k';
    return cur + Math.round(n);
  }

  /* a single rAF loop that runs every active tween; the clock is performance.now() */
  function Ticker() {
    var jobs = [], running = false;
    function loop() {
      var t = now(), i = 0;
      while (i < jobs.length) {
        var j = jobs[i];
        if (t < j.start) { i++; continue; }
        var done = j.fn(t - j.start) === false;
        if (done) jobs.splice(i, 1); else i++;
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
        return this.add(function (e) {
          var p = clamp(e / dur, 0, 1);
          fn(ease(p), p);
          if (p >= 1) return false;
        }, delay);
      },
      cancel: function (job) { var i = jobs.indexOf(job); if (i > -1) jobs.splice(i, 1); },
      clear: function () { jobs.length = 0; }
    };
  }

  /* ---------------- demo data (fictional) ---------------- */
  var CATS = [
    { id: 'el', name: 'Electronics', color: '#3B5BFF', supplier: 'Voltline Traders' },
    { id: 'hk', name: 'Home & Kitchen', color: '#22C3EE', supplier: 'Hearthware Supply' },
    { id: 'ap', name: 'Apparel', color: '#F472B6', supplier: 'Loomfield Textiles' },
    { id: 'bt', name: 'Beauty', color: '#FFB020', supplier: 'Dewleaf Labs' },
    { id: 'sp', name: 'Sports', color: '#19C37D', supplier: 'Stridewell Goods' }
  ];
  var BASE = [
    ['el', 'USB-C Cable', ['1 m', '2 m', 'Braided 2 m'], 4],
    ['el', 'Wireless Earbuds', ['Black', 'White', 'Sand'], 28],
    ['el', 'Power Bank', ['10,000 mAh', '20,000 mAh', 'Slim 5,000'], 19],
    ['el', 'LED Desk Lamp', ['Matte Black', 'White', 'Oak'], 22],
    ['hk', 'Steel Bottle', ['500 ml', '750 ml', '1 L'], 9],
    ['hk', 'Ceramic Mug', ['350 ml', '450 ml', 'Set of 2'], 6],
    ['hk', 'Non-stick Pan', ['20 cm', '24 cm', '28 cm'], 17],
    ['hk', 'Glass Jar Set', ['3 pc', '6 pc', 'Spice 12 pc'], 11],
    ['ap', 'Crew Tee', ['S', 'M', 'L'], 7],
    ['ap', 'Zip Hoodie', ['S', 'M', 'L'], 21],
    ['ap', 'Running Socks', ['3-pack', '6-pack', 'Ankle 3-pack'], 5],
    ['bt', 'Face Serum', ['15 ml', '30 ml', 'Travel'], 12],
    ['bt', 'Sunscreen SPF 50', ['50 ml', '100 ml', 'Stick'], 9],
    ['bt', 'Lip Balm', ['Duo', 'Mint', 'Berry'], 3],
    ['sp', 'Yoga Mat', ['4 mm', '6 mm', 'Travel'], 16],
    ['sp', 'Resistance Bands', ['Light', 'Medium', 'Set of 5'], 8]
  ];
  var SKUS = [];
  BASE.forEach(function (b, bi) {
    b[2].forEach(function (v, vi) {
      SKUS.push({ sku: b[0].toUpperCase() + '-' + (1040 + bi * 37 + vi * 7), name: b[1] + ' · ' + v, cat: b[0], unit: b[3] * (1 + vi * .12) });
    });
  });

  var DEFAULT_WAREHOUSES = [
    { name: 'Lucknow', code: 'LKO-1', seed: 17, out: .06, low: .15, over: .06, flow: 2300, fill: 98.4, util: 82 },
    { name: 'Pune', code: 'PNQ-2', seed: 41, out: .1, low: .19, over: .04, flow: 2900, fill: 96.1, util: 91 },
    { name: 'Bengaluru', code: 'BLR-3', seed: 73, out: .03, low: .09, over: .11, flow: 1900, fill: 99.2, util: 74 }
  ];

  function buildWarehouse(w, binCount) {
    var r = rng(w.seed || 7), order = [], i;
    for (i = 0; i < SKUS.length; i++) order.push(i);
    for (i = order.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    var bins = [];
    if (w.bins) {
      // your own stock: one entry per bin, filled A-01 → A-12, B-01 … D-12
      bins = w.bins.slice(0, binCount).map(function (b, k) {
        var cat = b.cat || 'el', max = b.max || 500, demand = b.demand || 10, reorder = b.reorder != null ? b.reorder : demand * (b.lead || 6);
        var onHand = b.onHand || 0, system = b.system != null ? b.system : onHand;
        return { i: k, sku: b.sku || '', name: b.name || '', cat: cat, unit: b.unit || 10, max: max, demand: demand, lead: b.lead || 6, reorder: reorder,
          onHand: onHand, system: system, diff: onHand - system, level: onHand / max, status: statusOf(onHand, reorder, max) };
      });
    }
    for (i = bins.length; i < binCount; i++) {
      var p = SKUS[order[i % order.length]];
      var max = Math.round((260 + r() * 1700) / 10) * 10;
      var demand = Math.max(3, Math.round(max * (.012 + r() * .03)));
      var lead = 4 + Math.floor(r() * 6);
      var reorder = demand * lead;
      if (reorder > max * .55) reorder = Math.round(max * .45);
      var roll = r(), onHand;
      if (roll < w.out) onHand = 0;
      else if (roll < w.out + w.low) onHand = Math.max(1, Math.round(reorder * (.15 + r() * .8)));
      else if (roll > 1 - w.over) onHand = Math.round(max * (.95 + r() * .05));
      else onHand = Math.round(reorder + (max - reorder) * (.12 + r() * .72));
      var diff = 0;
      if (onHand > 0 && r() < .12) diff = (r() < .5 ? -1 : 1) * Math.ceil(1 + r() * 9);
      bins.push({
        i: i, sku: p.sku, name: p.name, cat: p.cat, unit: p.unit, max: max, demand: demand, lead: lead, reorder: reorder,
        onHand: onHand, system: onHand - diff, diff: diff, level: onHand / max, status: statusOf(onHand, reorder, max)
      });
    }
    var days = [], base = w.flow || 2000;
    for (i = 0; i < 30; i++) {
      var wk = Math.sin((i + w.seed % 7) / 7 * Math.PI * 2);
      var trend = 1 + (i / 29 - .5) * .14;
      var inb = base * trend * (1 + .18 * wk + (r() - .5) * .32);
      var outb = base * trend * (1.02 + .12 * Math.sin((i + 2 + w.seed % 5) / 7 * Math.PI * 2) + (r() - .5) * .22);
      if (r() < .08) inb *= 1.5; // big inbound delivery days
      days.push({ inb: Math.round(inb), out: Math.round(outb) });
    }
    if (w.days) days = w.days.slice(-30).map(function (d) { return { inb: d[0], out: d[1] }; });
    var spark = function (b, v) { var a = [], x = b; for (var k = 0; k < 12; k++) { x = x * (1 + (r() - .47) * v); a.push(x); } return a; };
    var sp = [spark(100, .06), spark(100, .07), spark(100, .02), spark(100, .14)];
    var dl = [((r() - .35) * 9).toFixed(1), ((r() - .3) * 11).toFixed(1), ((r() - .45) * 2).toFixed(1), Math.round((r() - .5) * 6)];
    return { meta: w, bins: bins, days: days, sparks: w.sparks || sp, deltas: w.deltas || dl };
  }
  function statusOf(onHand, reorder, max) {
    if (onHand <= 0) return 'out';
    if (onHand <= reorder) return 'low';
    if (onHand >= max * .95) return 'over';
    return 'ok';
  }
  var STATUS_LABEL = { ok: 'In stock', low: 'Low stock', out: 'Out of stock', over: 'Overstock' };
  var STATUS_RANK = { out: 0, low: 1, over: 2, ok: 3 };

  /* ---------------- icons (1.7px line, rounded) ---------------- */
  var I = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    cart: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2"/><path d="M16 4.6a3.2 3.2 0 0 1 0 6.3M18 14.9c1.6.6 2.7 2.2 3 5.1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    stack: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    dollar: '<path d="M12 2v20M17 6.5c-.8-1.5-2.6-2.5-5-2.5-3 0-5 1.5-5 3.8 0 5.2 10 2.7 10 8 0 2.3-2.1 4.2-5 4.2-2.6 0-4.6-1.1-5.4-2.8"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    pallet: '<path d="M4 4h16v11H4zM4 9h16M10 4v5M14 4v5"/><path d="M3 19h18M6 15v4M12 15v4M18 15v4"/>',
    sort: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>'
  };
  function icon(n, cls) { return '<svg class="as-ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }
  var LOGO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12"/><path d="M8 20v-6h8v6M8 17h8"/></svg>';

  /* ---------------- map geometry ---------------- */
  var MAP = { w: 690, h: 320, cols: 12, rows: ['A', 'B', 'C', 'D'], rowY: [22, 102, 178, 258], binW: 42, binH: 40, gap: 4, x0: 100, aisleY: [82, 82, 238, 238] };
  var ROUTE = 'M 64 160 Q 78 160 78 146 V 92 Q 78 82 88 82 H 660 Q 670 82 670 92 V 228 Q 670 238 660 238 H 88 Q 78 238 78 228 V 174 Q 78 160 64 160';

  /* ---------------- the app ---------------- */
  function mount(root, opts) {
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) throw new Error('Aisle: mount element not found');
    if (root._aisle) root._aisle.destroy();
    opts = Object.assign({
      title: 'Inventory',
      company: 'Kestrel Supply Co.',
      user: 'RS',
      currency: '$',
      theme: root.getAttribute('data-theme') || 'dark',
      warehouses: DEFAULT_WAREHOUSES,
      start: 0,
      duration: 5200,      // ms the cart takes to walk the floor
      autoplay: true,      // run a count when mounted
      onCount: null        // callback(summary) when a count finishes
    }, opts || {});

    var tick = Ticker();
    var binCount = MAP.cols * MAP.rows.length;
    var data = (opts.data || opts.warehouses).map(function (w) { return buildWarehouse(w, binCount); });
    var cur = -1, counting = false, countJob = null, lastShown = null;
    var shown = { kpi: [0, 0, 0, 0], days: null, cats: null, cover: null, sparks: null };

    root.classList.add('aisle');
    root.setAttribute('data-theme', opts.theme);
    // use the markup already on the page (index.html) or render the default layout
    if (!root.querySelector('.as-main')) root.innerHTML = template(opts);

    var $ = function (s) { return root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

    /* ----- segmented warehouse switch ----- */
    var seg = $('.as-seg'), thumb = $('.as-seg-thumb');
    Array.prototype.slice.call(seg.querySelectorAll('button')).forEach(function (b) { b.remove(); });
    opts.warehouses.forEach(function (w, i) {
      var b = h('<button type="button" aria-pressed="false" data-wh="' + i + '">' + esc(w.name) + '</button>');
      b.addEventListener('click', function () { setWarehouse(i); });
      seg.appendChild(b);
    });
    function placeThumb() {
      var b = seg.querySelectorAll('button')[cur]; if (!b) return;
      thumb.style.width = b.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }

    $('[data-as="recount"]').addEventListener('click', function () { recount(); });
    $('[data-as="theme"]').addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    $('[data-as="menu"]').addEventListener('click', function () { root.classList.toggle('nav-open'); });
    $('.as-scrim').addEventListener('click', function () { root.classList.remove('nav-open'); });

    /* ----- floor map ----- */
    var svg = $('.as-map'), tip = $('.as-tip'), wrap = $('.as-map-wrap');
    var defs = el('defs', {}, svg);
    defs.innerHTML =
      '<pattern id="as-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="rgba(0,0,0,.35)"/></pattern>' +
      '<pattern id="as-dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor"/></pattern>' +
      '<radialGradient id="as-glow-g"><stop offset="0" stop-color="var(--aisle-accent-2)" stop-opacity=".55"/><stop offset="1" stop-color="var(--aisle-accent-2)" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="as-beam-g" x1="0" x2="1"><stop offset="0" stop-color="var(--aisle-accent-2)" stop-opacity=".55"/><stop offset="1" stop-color="var(--aisle-accent-2)" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="as-trail-g"><stop offset="0" stop-color="var(--aisle-accent-2)"/><stop offset="1" stop-color="var(--aisle-accent)"/></linearGradient>' +
      '<filter id="as-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<filter id="as-blur-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter>';
    var scene = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: MAP.w, height: MAP.h, fill: 'url(#as-dots)', style: 'color:var(--aisle-line-2)' }, scene);

    // dock
    el('rect', { x: 8, y: 112, width: 58, height: 96, rx: 8, class: 'as-dock' }, scene);
    [130, 160, 190].forEach(function (y) { el('line', { x1: 8, y1: y - 9, x2: 8, y2: y + 9, class: 'as-door' }, scene); });
    var dockLabel = el('text', { x: 37, y: 127, 'text-anchor': 'middle', class: 'as-dock-label as-up' }, scene); dockLabel.textContent = 'DOCK';
    var pallets = el('g', {}, scene);
    var dockPulse = el('circle', { cx: 37, cy: 160, r: 10, class: 'as-dock-pulse' }, scene);

    // rack labels
    MAP.rows.forEach(function (r, ri) {
      var t = el('text', { x: 90, y: MAP.rowY[ri] + MAP.binH / 2 + 4, 'text-anchor': 'middle', class: 'as-rack-label as-up' }, scene);
      t.textContent = r;
    });

    // route
    var route = el('path', { d: ROUTE, class: 'as-route' }, scene);
    var done = el('path', { d: ROUTE, class: 'as-route-done' }, scene);
    var trail = el('path', { d: ROUTE, class: 'as-trail' }, scene);
    var total = route.getTotalLength();
    done.style.strokeDasharray = '0 ' + (total + 10);
    trail.style.strokeDasharray = '0 ' + (total + 200);

    // bins
    var binsG = el('g', {}, scene), badgesG = el('g', {}, scene), binEls = [];
    for (var i = 0; i < binCount; i++) {
      var ri = Math.floor(i / MAP.cols), ci = i % MAP.cols;
      var x = MAP.x0 + ci * (MAP.binW + MAP.gap), y = MAP.rowY[ri];
      var g = el('g', { class: 'as-bin is-idle', 'data-i': i, tabindex: 0, role: 'button' }, binsG);
      el('rect', { x: x, y: y, width: MAP.binW, height: MAP.binH, rx: 6, class: 'as-frame' }, g);
      var f = el('rect', { x: x + 3, y: y + MAP.binH - 3, width: MAP.binW - 6, height: 0, rx: 3, class: 'as-fill' }, g);
      var st = el('rect', { x: x + 3, y: y + MAP.binH - 3, width: MAP.binW - 6, height: 0, rx: 3, class: 'as-stripe' }, g);
      var fl = el('rect', { x: x - 1, y: y - 1, width: MAP.binW + 2, height: MAP.binH + 2, rx: 7, class: 'as-flash' }, g);
      var ring = el('rect', { x: x - 4, y: y - 4, width: MAP.binW + 8, height: MAP.binH + 8, rx: 9, class: 'as-ring' }, g);
      var badge = el('g', { class: 'as-badge', transform: 'translate(' + (x + MAP.binW - 2) + ' ' + (y + 2) + ') scale(0)' }, badgesG);
      el('circle', { r: 7 }, badge);
      var bt = el('text', { x: 0, y: 3.2, class: 'as-up0' }, badge); bt.textContent = '!';
      binEls.push({ g: g, fill: f, stripe: st, flash: fl, ring: ring, badge: badge, x: x, y: y, cx: x + MAP.binW / 2, row: ri, level: 0, status: 'idle' });
      g.addEventListener('mouseenter', onBinEnter);
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('focus', onBinEnter);
      g.addEventListener('blur', hideTip);
      g.addEventListener('click', onBinClick);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBinClick(e); } });
    }
    var lasers = el('g', {}, scene), flyers = el('g', {}, scene);

    // cart
    var cart = el('g', { class: 'as-cart', transform: 'translate(64 160)' }, scene);
    el('circle', { r: 22, class: 'as-cart-glow' }, cart);
    el('path', { d: 'M8 -5 L40 -15 L40 15 L8 5 Z', class: 'as-cart-beam' }, cart);
    el('rect', { x: -10, y: -7, width: 20, height: 14, rx: 4, class: 'as-cart-body' }, cart);
    el('rect', { x: -5, y: -4.5, width: 9, height: 9, rx: 2, class: 'as-cart-top' }, cart);
    el('circle', { cx: 9, cy: -4, r: 1.6, fill: '#fff' }, cart);
    el('circle', { cx: 9, cy: 4, r: 1.6, fill: '#fff' }, cart);

    // where along the route each bin gets scanned
    var samples = [], N = 700;
    for (i = 0; i <= N; i++) { var pt = route.getPointAtLength(total * i / N); samples.push({ s: total * i / N, x: pt.x, y: pt.y }); }
    binEls.forEach(function (b) {
      var ay = MAP.aisleY[b.row], best = 1e9, bs = 0;
      samples.forEach(function (p) { var d = Math.abs(p.x - b.cx) + Math.abs(p.y - ay) * 3; if (d < best) { best = d; bs = p.s; } });
      b.scanAt = bs; b.aisleY = ay; b.edgeY = b.row % 2 === 0 ? b.y + MAP.binH : b.y;
    });

    var portrait = false;
    function layoutMap() {
      var p = wrap.clientWidth > 0 && wrap.clientWidth < 520;
      if (p === portrait && svg.getAttribute('data-l')) return;
      portrait = p; svg.setAttribute('data-l', p ? 'portrait' : 'landscape');
      svg.setAttribute('viewBox', p ? '0 0 ' + MAP.h + ' ' + MAP.w : '0 0 ' + MAP.w + ' ' + MAP.h);
      if (p) scene.setAttribute('transform', 'matrix(0 1 1 0 0 0)'); else scene.removeAttribute('transform');
      // keep the labels upright when the map is turned on its side
      Array.prototype.forEach.call(svg.querySelectorAll('.as-up0'), function (t) {
        if (p) t.setAttribute('transform', 'matrix(0 1 1 0 0 0)'); else t.removeAttribute('transform');
      });
      // the DOCK label sits under the pallets when the map is upright
      dockLabel.setAttribute('x', p ? 62 : 37); dockLabel.setAttribute('y', 127);
      Array.prototype.forEach.call(svg.querySelectorAll('.as-up'), function (t) {
        var x = +t.getAttribute('x'), y = +t.getAttribute('y');
        if (p) t.setAttribute('transform', 'matrix(0 1 1 0 ' + (x - y) + ' ' + (y - x) + ')'); else t.removeAttribute('transform');
      });
    }
    layoutMap();

    function setLevel(b, lv) {
      b.level = lv;
      var ih = MAP.binH - 6, show = b.status === 'low' ? Math.max(lv, .14 * clamp(lv * 40, 0, 1)) : lv, hh = clamp(show, 0, 1.08) * ih;
      var y = b.y + 3 + ih - hh;
      b.fill.setAttribute('y', y); b.fill.setAttribute('height', Math.max(0, hh));
      b.stripe.setAttribute('y', y); b.stripe.setAttribute('height', Math.max(0, hh));
    }
    function setStatus(b, s) {
      b.status = s;
      b.g.setAttribute('class', 'as-bin is-' + s);
    }

    /* ----- tooltip ----- */
    function onBinEnter(e) {
      var i = +e.currentTarget.getAttribute('data-i'), b = binEls[i], d = cur > -1 ? data[cur].bins[i] : null;
      if (!d || b.status === 'idle') return;
      var cover = d.onHand / d.demand;
      tip.innerHTML = '<b>' + esc(d.name) + '</b><small>' + d.sku + ' · Bin ' + binCode(i) + '</small><br>' +
        fmtInt(d.onHand) + ' / ' + fmtInt(d.max) + ' units · ' + cover.toFixed(1) + ' days cover' +
        (d.diff ? '<br><small>Counted ' + fmtInt(d.onHand) + ', system said ' + fmtInt(d.system) + ' (' + (d.diff > 0 ? '+' : '') + d.diff + ')</small>' : '');
      var sr = svg.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), k = sr.width / MAP.w;
      var bx = portrait ? b.y + MAP.binH / 2 : b.cx, by = portrait ? b.x : b.y, k2 = sr.width / (portrait ? MAP.h : MAP.w);
      var tx = clamp(bx * k2 + sr.left - wr.left, 110, wr.width - 110);
      tip.style.left = tx + 'px'; tip.style.top = (by * k2 + sr.top - wr.top) + 'px';
      tip.classList.add('on');
    }
    function hideTip() { tip.classList.remove('on'); }
    function onBinClick(e) { var i = +e.currentTarget.getAttribute('data-i'); highlightBin(i); markRow(i); }
    function highlightBin(i) {
      var b = binEls[i];
      tick.tween(900, function (p) {
        b.ring.style.opacity = (1 - p).toFixed(3);
        var s = 1 + p * .12;
        b.ring.setAttribute('transform', 'translate(' + b.cx + ' ' + (b.y + MAP.binH / 2) + ') scale(' + s + ') translate(' + -b.cx + ' ' + -(b.y + MAP.binH / 2) + ')');
      }, 0, function (t) { return t; });
    }
    function binCode(i) { return MAP.rows[Math.floor(i / MAP.cols)] + '-' + String(i % MAP.cols + 1).padStart(2, '0'); }

    /* ----- cycle count: the hero moment ----- */
    function runCount(w, instant) {
      if (countJob) { tick.cancel(countJob); countJob = null; }
      lasers.innerHTML = ''; flyers.innerHTML = ''; pallets.innerHTML = '';
      binEls.forEach(function (b) { b.scanned = false; b.badge.setAttribute('transform', 'translate(' + (b.x + MAP.binW - 2) + ' ' + (b.y + 2) + ') scale(0)'); });
      var D = data[w], bins = D.bins;
      kpiFor = null;
      var stats = { counted: 0, disc: 0, tickets: 0, pallets: 0 };
      var queue = $('[data-as="queue"]'); queue.innerHTML = '';
      setQueueCount(0);
      setStat('counted', '0 / ' + binCount, 0); setStat('disc', '0'); setStat('acc', '—'); setStat('tickets', '0');

      if (instant) {
        bins.forEach(function (d, i) { scanBin(i, d, stats, true); });
        cart.setAttribute('transform', 'translate(64 160)');
        done.style.strokeDasharray = '0 ' + (total + 10);
        trail.style.strokeDasharray = '0 ' + (total + 200);
        finishCount(w, stats, true);
        return;
      }
      counting = true;
      $('[data-as="recount"]').setAttribute('disabled', '');
      binEls.forEach(function (b) { if (b.status !== 'idle') setStatus(b, 'idle'); });
      var dur = opts.duration, order = binEls.slice().sort(function (a, b) { return a.scanAt - b.scanAt; }), next = 0;
      countJob = tick.add(function (e) {
        var p = clamp(e / dur, 0, 1), s = total * (1 - Math.cos(Math.PI * p)) / 2;
        var a = route.getPointAtLength(s), c = route.getPointAtLength(Math.min(total, s + 2)), z = route.getPointAtLength(Math.max(0, s - 2));
        var ang = Math.atan2(c.y - z.y, c.x - z.x) * 180 / Math.PI;
        cart.setAttribute('transform', 'translate(' + a.x.toFixed(2) + ' ' + a.y.toFixed(2) + ') rotate(' + ang.toFixed(1) + ')');
        done.style.strokeDasharray = s.toFixed(1) + ' ' + (total + 10);
        trail.style.opacity = 1; var tl = 110; trail.style.strokeDasharray = tl + ' ' + (total + 400); trail.style.strokeDashoffset = (tl - s).toFixed(1);
        while (next < order.length && order[next].scanAt <= s) {
          var idx = +order[next].g.getAttribute('data-i');
          scanBin(idx, bins[idx], stats, false, a);
          next++;
        }
        // KPIs count up while the cart walks
        rollKpis(D, easeInOut(p));
        if (p >= 1) {
          countJob = null;
          trail.style.strokeDasharray = '0 ' + (total + 400); trail.style.opacity = 0;
          finishCount(w, stats, false);
          return false;
        }
      });
    }

    function scanBin(i, d, stats, instant, at) {
      var b = binEls[i];
      if (b.scanned) return; b.scanned = true;
      stats.counted++;
      if (d.diff) stats.disc++;
      setStat('counted', stats.counted + ' / ' + binCount, stats.counted / binCount);
      setStat('disc', String(stats.disc));
      var from = b.level, to = d.level;
      setStatus(b, d.status);
      if (instant) { setLevel(b, to); if (d.diff) b.badge.setAttribute('transform', 'translate(' + (b.x + MAP.binW - 2) + ' ' + (b.y + 2) + ') scale(1)'); }
      else {
        // laser from the cart to the bin face
        var ln = el('line', { x1: b.cx, y1: b.aisleY, x2: b.cx, y2: b.aisleY, class: 'as-laser' }, lasers);
        tick.tween(320, function (q, raw) {
          var grow = clamp(raw / .3, 0, 1);
          ln.setAttribute('y2', lerp(b.aisleY, b.edgeY, grow).toFixed(1));
          ln.style.opacity = raw < .55 ? 1 : (1 - (raw - .55) / .45).toFixed(3);
          if (raw >= 1) ln.remove();
        }, 0, function (t) { return t; });
        b.flash.style.opacity = 1;
        tick.add(function (e) {
          var t = e / 1000;
          setLevel(b, from + (to - from) * spring(t * 1.2));
          b.flash.style.opacity = Math.max(0, 1 - t * 2.4).toFixed(3);
          if (t >= 1.25) { setLevel(b, to); b.flash.style.opacity = 0; return false; }
        });
        if (d.diff) {
          tick.add(function (e) {
            var t = e / 1000, sc = spring(t * 1.1);
            b.badge.setAttribute('transform', 'translate(' + (b.x + MAP.binW - 2) + ' ' + (b.y + 2) + ') scale(' + Math.max(0, sc).toFixed(3) + ')');
            if (t >= 1.3) return false;
          }, 160);
        }
      }
      if (d.status === 'out' || d.status === 'low') {
        stats.tickets++;
        setStat('tickets', String(stats.tickets));
        addTicket(d, i, instant);
        if (stats.pallets < 12) flyPallet(b, d, stats.pallets++, instant);
      }
    }

    function flyPallet(b, d, slot, instant) {
      var tx = 14 + (slot % 3) * 14, ty = 136 + Math.floor(slot / 3) * 14;
      var p = el('rect', { width: 11, height: 11, rx: 2.5, class: 'as-pallet' + (d.status === 'out' ? ' is-out' : '') }, instant ? pallets : flyers);
      if (instant) { p.setAttribute('x', tx); p.setAttribute('y', ty); return; }
      var sx = b.cx - 6, sy = b.y + MAP.binH / 2 - 6, mx = (sx + tx) / 2, my = Math.min(sy, ty) - 70;
      tick.tween(780, function (q, raw) {
        var t = easeInOut(raw);
        var x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * tx;
        var y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * ty;
        var sc = raw < .15 ? raw / .15 : 1;
        p.setAttribute('x', x.toFixed(1)); p.setAttribute('y', y.toFixed(1));
        p.setAttribute('transform', 'rotate(' + (raw * 180).toFixed(1) + ' ' + (x + 6).toFixed(1) + ' ' + (y + 6).toFixed(1) + ') scale(1)');
        p.style.opacity = sc;
        if (raw >= 1) {
          p.removeAttribute('transform');
          pallets.appendChild(p);
          // squash on landing
          tick.add(function (e) {
            var t2 = e / 1000, k = 1 - Math.exp(-t2 * 9) * Math.cos(t2 * 22) * .35;
            var hgt = 11 * k, wdt = 11 * (2 - k);
            p.setAttribute('x', (tx + 5.5 - wdt / 2).toFixed(2)); p.setAttribute('width', wdt.toFixed(2));
            p.setAttribute('y', (ty + 11 - hgt).toFixed(2)); p.setAttribute('height', hgt.toFixed(2));
            if (t2 > .7) { p.setAttribute('x', tx); p.setAttribute('y', ty); p.setAttribute('width', 11); p.setAttribute('height', 11); return false; }
          });
        }
      }, 0, function (t) { return t; });
    }

    function finishCount(w, stats, instant) {
      counting = false;
      $('[data-as="recount"]').removeAttribute('disabled');
      var D = data[w], sys = 0, diff = 0;
      D.bins.forEach(function (d) { sys += d.system; diff += Math.abs(d.diff); });
      var acc = 100 * (1 - diff / Math.max(1, sys));
      rollKpis(D, 1);
      if (instant) setStat('acc', acc.toFixed(1) + '%', acc / 100);
      else {
        tick.tween(900, function (p) { setStat('acc', (acc * p).toFixed(1) + '%', acc / 100 * p); });
        tick.tween(900, function (p, raw) {
          dockPulse.setAttribute('r', (10 + raw * 46).toFixed(1));
          dockPulse.style.opacity = (1 - raw).toFixed(3);
        }, 0, function (t) { return t; });
      }
      renderTable(D, !instant);
      if (opts.onCount) opts.onCount({ warehouse: D.meta, counted: stats.counted, discrepancies: stats.disc, accuracy: acc, restock: stats.tickets });
    }

    /* ----- side stats under the map ----- */
    function setStat(k, txt, bar) {
      var s = root.querySelector('[data-stat="' + k + '"]'); if (!s) return;
      s.querySelector('b').textContent = txt;
      var i = s.querySelector('.as-stat-bar i'); if (i && bar != null) i.style.width = (bar * 100).toFixed(1) + '%';
    }

    /* ----- restock queue ----- */
    function setQueueCount(n) { $('[data-as="qcount"]').textContent = n + ' open'; }
    var qItems = 0;
    function addTicket(d, i, instant) {
      var queue = $('[data-as="queue"]');
      var cat = CATS.filter(function (c) { return c.id === d.cat; })[0];
      var qty = Math.round((d.max - d.onHand) / 10) * 10;
      var li = h('<li class="is-' + d.status + '"><span class="as-q-ico">' + icon('pallet') + '</span>' +
        '<div><b>' + esc(d.name) + '</b><small>' + binCode(i) + ' · ' + esc(cat.supplier) + ' · ETA ' + d.lead + 'd</small></div>' +
        '<div class="as-q-qty as-num">+' + fmtInt(qty) + '<small>' + (d.status === 'out' ? 'urgent' : 'units') + '</small></div></li>');
      if (instant) li.style.animation = 'none';
      queue.insertBefore(li, queue.firstChild);
      qItems = queue.children.length;
      setQueueCount(qItems);
      while (queue.children.length > 5) queue.removeChild(queue.lastChild);
    }

    /* ----- KPIs ----- */
    function kpiTargets(D) {
      var units = 0, value = 0, low = 0, out = 0;
      D.bins.forEach(function (d) { units += d.onHand; value += d.onHand * d.unit; if (d.status === 'low') low++; if (d.status === 'out') out++; });
      return { units: units, value: value, fill: D.meta.fill || 98, alerts: low + out, out: out };
    }
    var kpiFrom = null, kpiFor = null;
    function rollKpis(D, p) {
      var T = kpiTargets(D);
      if (kpiFor !== D) { kpiFrom = shown.kpi.slice(); kpiFor = D; }
      var v = [lerp(kpiFrom[0], T.units, p), lerp(kpiFrom[1], T.value, p), lerp(kpiFrom[2], T.fill, p), lerp(kpiFrom[3], T.alerts, p)];
      shown.kpi = v;
      $('[data-kpi="0"]').textContent = fmtInt(v[0]);
      $('[data-kpi="1"]').textContent = money(v[1], opts.currency);
      $('[data-kpi="2"]').textContent = v[2].toFixed(1) + '%';
      $('[data-kpi="3"]').textContent = Math.round(v[3]);
      if (p >= 1) $('[data-kpi-sub="3"]').textContent = T.out + ' out';
    }
    function setDeltas(D) {
      [0, 1, 2].forEach(function (k) {
        var n = parseFloat(D.deltas[k]), s = $('[data-delta="' + k + '"]');
        s.className = 'as-delta ' + (n >= 0 ? 'up' : 'down');
        s.textContent = (n >= 0 ? '+' : '') + n + '%';
      });
      var n3 = D.deltas[3], s3 = $('[data-delta="3"]');
      s3.className = 'as-delta ' + (n3 <= 0 ? 'up' : 'down');
      s3.textContent = (n3 > 0 ? '+' : '') + n3 + ' wk';
    }
    function sparkPath(a, w, hh) {
      var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a), r = mx - mn || 1;
      return smooth(a.map(function (v, i) { return [i / (a.length - 1) * w, hh - 3 - (v - mn) / r * (hh - 6)]; }));
    }
    function morphSparks(D) {
      var from = shown.sparks || D.sparks.map(function (s) { var m = s.reduce(function (a, b) { return a + b; }, 0) / s.length; return s.map(function () { return m; }); });
      var to = D.sparks;
      tick.tween(900, function (p) {
        var cur2 = to.map(function (s, k) { return s.map(function (v, i) { return lerp(from[k][i], v, p); }); });
        shown.sparks = cur2;
        cur2.forEach(function (s, k) { $('[data-spark="' + k + '"]').setAttribute('d', sparkPath(s, 92, 28)); });
      }, 0, easeInOut);
    }

    /* ----- donut + days of cover ----- */
    var donut = $('.as-donut svg'), R = 70, C = 2 * Math.PI * R, arcs = [];
    CATS.forEach(function (c, k) {
      var a = el('circle', { cx: 85, cy: 85, r: R, class: 'as-seg-arc', stroke: c.color, 'stroke-dasharray': '0 ' + C }, donut);
      var t = el('title', {}, a); t.textContent = c.name;
      arcs.push(a);
    });
    var catList = $('[data-as="cats"]'), coverBox = $('[data-as="cover"]');
    CATS.forEach(function (c) {
      catList.appendChild(h('<li><i style="background:' + c.color + '"></i><span>' + esc(c.name) + '</span><b class="as-num" data-cat="' + c.id + '">0%</b></li>'));
      coverBox.appendChild(h('<div><span>' + esc(c.name.split(' ')[0]) + '</span><em><i data-cov="' + c.id + '" style="background:' + c.color + '"></i></em><b class="as-num" data-covn="' + c.id + '">0d</b></div>'));
    });
    function catStats(D) {
      var val = {}, oh = {}, dm = {}, tot = 0;
      CATS.forEach(function (c) { val[c.id] = 0; oh[c.id] = 0; dm[c.id] = 0; });
      D.bins.forEach(function (d) { var v = d.onHand * d.unit; val[d.cat] += v; tot += v; oh[d.cat] += d.onHand; dm[d.cat] += d.demand; });
      return { share: CATS.map(function (c) { return val[c.id] / (tot || 1); }), cover: CATS.map(function (c) { return oh[c.id] / (dm[c.id] || 1); }), total: tot };
    }
    function morphDonut(D) {
      var S = catStats(D), from = shown.cats || CATS.map(function () { return 0; }), fromT = shown.total || 0;
      var fromC = shown.cover || CATS.map(function () { return 0; });
      tick.tween(1100, function (p) {
        var sh = S.share.map(function (v, k) { return lerp(from[k], v, p); }), acc = 0;
        shown.cats = sh;
        sh.forEach(function (v, k) {
          var len = Math.max(0, v * C - 3);
          arcs[k].setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + C.toFixed(2));
          arcs[k].setAttribute('stroke-dashoffset', (-acc * C).toFixed(2));
          acc += v;
          root.querySelector('[data-cat="' + CATS[k].id + '"]').textContent = Math.round(v * 100) + '%';
        });
        shown.total = lerp(fromT, S.total, p);
        $('[data-as="dtotal"]').textContent = money(shown.total, opts.currency);
        var cv = S.cover.map(function (v, k) { return lerp(fromC[k], v, p); });
        shown.cover = cv;
        cv.forEach(function (v, k) { root.querySelector('[data-covn="' + CATS[k].id + '"]').textContent = v.toFixed(0) + 'd'; });
      }, 0, easeInOut);
      S.cover.forEach(function (v, k) { root.querySelector('[data-cov="' + CATS[k].id + '"]').style.width = clamp(v / 60 * 100, 4, 100) + '%'; });
    }

    /* ----- inbound vs outbound chart ----- */
    var flow = $('.as-flow svg'), FW = 640, FH = 230, PL = 38, PR = 8, PT = 12, PB = 26;
    function sizeFlow() {
      FW = Math.max(200, flow.clientWidth || 640); FH = Math.max(150, flow.clientHeight || 230);
      flow.setAttribute('viewBox', '0 0 ' + FW + ' ' + FH);
      cross.setAttribute('y2', FH - PB);
      drawAxes(); if (shown.days) setFlow(shown.days);
    }
    var fdefs = el('defs', {}, flow);
    fdefs.innerHTML = '<linearGradient id="as-area-in" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--aisle-in)" stop-opacity=".28"/><stop offset="1" stop-color="var(--aisle-in)" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="as-area-out" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--aisle-outb)" stop-opacity=".2"/><stop offset="1" stop-color="var(--aisle-outb)" stop-opacity="0"/></linearGradient>';
    var gridG = el('g', {}, flow), axisG = el('g', {}, flow);
    var areaIn = el('path', { class: 'as-area-in' }, flow), areaOut = el('path', { class: 'as-area-out' }, flow);
    var lineOut = el('path', { class: 'as-line-out', pathLength: 1 }, flow), lineIn = el('path', { class: 'as-line-in', pathLength: 1 }, flow);
    var cross = el('line', { class: 'as-cross', y1: PT, y2: FH - PB }, flow);
    var dotIn = el('circle', { r: 4.5, class: 'as-dot', fill: 'var(--aisle-in)' }, flow), dotOut = el('circle', { r: 4.5, class: 'as-dot', fill: 'var(--aisle-outb)' }, flow);
    var fTip = $('.as-flow .as-tip');
    var yMax = 5000;
    function fx(i) { return PL + i / 29 * (FW - PL - PR); }
    function fy(v) { return PT + (1 - v / yMax) * (FH - PT - PB); }
    function drawAxes() {
      gridG.innerHTML = ''; axisG.innerHTML = '';
      for (var k = 0; k <= 4; k++) {
        var v = yMax / 4 * k, y = fy(v);
        el('line', { x1: PL, x2: FW - PR, y1: y, y2: y, class: 'as-gridline' }, gridG);
        var t = el('text', { x: PL - 8, y: y + 3.5, 'text-anchor': 'end', class: 'as-axis' }, axisG); t.textContent = v ? (v / 1000) + 'k' : '0';
      }
      var today = new Date();
      [0, 7, 14, 21, 29].forEach(function (i) {
        var d = new Date(today.getTime() - (29 - i) * 864e5);
        var t = el('text', { x: fx(i), y: FH - 6, 'text-anchor': i === 0 ? 'start' : i === 29 ? 'end' : 'middle', class: 'as-axis' }, axisG);
        t.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
    }
    function setFlow(days) {
      var pin = days.map(function (d, i) { return [fx(i), fy(d.inb)]; }), pout = days.map(function (d, i) { return [fx(i), fy(d.out)]; });
      var li = smooth(pin), lo = smooth(pout), base = fy(0);
      lineIn.setAttribute('d', li); lineOut.setAttribute('d', lo);
      areaIn.setAttribute('d', li + ' L' + fx(29) + ' ' + base + ' L' + fx(0) + ' ' + base + ' Z');
      areaOut.setAttribute('d', lo + ' L' + fx(29) + ' ' + base + ' L' + fx(0) + ' ' + base + ' Z');
    }
    function morphFlow(D, first) {
      var to = D.days, from = shown.days || to.map(function () { return { inb: 0, out: 0 }; });
      var tin = 0, tout = 0; to.forEach(function (d) { tin += d.inb; tout += d.out; });
      var fin = $('[data-as="tin"]'), fout = $('[data-as="tout"]'), sIn = shown.tin || 0, sOut = shown.tout || 0;
      if (first) {
        setFlow(to); shown.days = to;
        [lineIn, lineOut].forEach(function (l) { l.style.strokeDasharray = '1 1'; l.style.strokeDashoffset = 1; });
        areaIn.style.opacity = 0; areaOut.style.opacity = 0;
        tick.tween(1400, function (p) {
          lineIn.style.strokeDashoffset = (1 - p).toFixed(4);
          lineOut.style.strokeDashoffset = (1 - clamp(p * 1.1 - .1, 0, 1)).toFixed(4);
          areaIn.style.opacity = areaOut.style.opacity = clamp(p * 1.6 - .6, 0, 1).toFixed(3);
          fin.textContent = fmtInt(tin * p); fout.textContent = fmtInt(tout * p);
          if (p >= 1) { lineIn.style.strokeDasharray = lineOut.style.strokeDasharray = ''; }
        }, 0, easeInOut);
      } else {
        tick.tween(1100, function (p, raw) {
          // each day eases on its own slightly later than the one before → a left-to-right ripple
          var mid = to.map(function (d, i) {
            var q = easeInOut(clamp((raw * 1.45) - i / 29 * .45, 0, 1));
            return { inb: lerp(from[i].inb, d.inb, q), out: lerp(from[i].out, d.out, q) };
          });
          shown.days = mid; setFlow(mid);
          fin.textContent = fmtInt(lerp(sIn, tin, p)); fout.textContent = fmtInt(lerp(sOut, tout, p));
        }, 0, function (t) { return t; });
      }
      shown.tin = tin; shown.tout = tout;
    }
    var flowBox = $('.as-flow');
    flowBox.addEventListener('pointermove', function (e) {
      if (!shown.days) return;
      var r = flow.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * FW;
      var i = clamp(Math.round((x - PL) / (FW - PL - PR) * 29), 0, 29), d = shown.days[i];
      var X = fx(i);
      cross.setAttribute('x1', X); cross.setAttribute('x2', X); cross.style.opacity = 1;
      dotIn.setAttribute('cx', X); dotIn.setAttribute('cy', fy(d.inb)); dotIn.style.opacity = 1;
      dotOut.setAttribute('cx', X); dotOut.setAttribute('cy', fy(d.out)); dotOut.style.opacity = 1;
      var day = new Date(Date.now() - (29 - i) * 864e5).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      fTip.innerHTML = '<b>' + day + '</b>In ' + fmtInt(d.inb) + ' · Out ' + fmtInt(d.out);
      var br = flowBox.getBoundingClientRect();
      fTip.style.left = clamp(X / FW * r.width + r.left - br.left, 80, br.width - 80) + 'px';
      fTip.style.top = (fy(Math.max(d.inb, d.out)) / FH * r.height + r.top - br.top) + 'px';
      fTip.classList.add('on');
    });
    flowBox.addEventListener('pointerleave', function () { cross.style.opacity = dotIn.style.opacity = dotOut.style.opacity = 0; fTip.classList.remove('on'); });

    /* ----- table ----- */
    var sortKey = 'status', sortDir = 1, tableRows = [];
    $$('.as-table th button').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
        if (cur > -1) renderTable(data[cur], false);
      });
    });
    function renderTable(D, animate) {
      var rows = D.bins.map(function (d) { return d; });
      rows.sort(function (a, b) {
        var r;
        if (sortKey === 'onhand') r = a.onHand - b.onHand;
        else if (sortKey === 'cover') r = a.onHand / a.demand - b.onHand / b.demand;
        else if (sortKey === 'name') r = a.name.localeCompare(b.name);
        else r = STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.onHand / a.demand - b.onHand / b.demand;
        return r * sortDir;
      });
      rows = rows.slice(0, 10);
      var tb = $('.as-table tbody'); tb.innerHTML = ''; tableRows = [];
      rows.forEach(function (d, k) {
        var cat = CATS.filter(function (c) { return c.id === d.cat; })[0];
        var w = clamp(d.onHand / d.max * 100, 0, 100), rp = clamp(d.reorder / d.max * 100, 0, 100);
        var col = { ok: 'var(--aisle-ok)', low: 'var(--aisle-low)', out: 'var(--aisle-out)', over: 'var(--aisle-over)' }[d.status];
        var tr = h('<table><tbody><tr data-i="' + d.i + '">' +
          '<td><div class="as-item"><i style="background:' + cat.color + '">' + cat.id.toUpperCase() + '</i><div><b>' + esc(d.name) + '</b><small>' + d.sku + '</small></div></div></td>' +
          '<td><span class="as-loc">' + binCode(d.i) + '</span></td>' +
          '<td><div class="as-onhand"><b class="as-num">' + fmtInt(d.onHand) + '</b><em title="Reorder point ' + fmtInt(d.reorder) + '"><i style="width:' + w + '%;background:' + col + '"></i><u style="left:' + rp + '%"></u></em></div></td>' +
          '<td class="as-num">' + (d.onHand / d.demand).toFixed(1) + ' d</td>' +
          '<td class="as-num">' + fmtInt(d.demand) + '/day</td>' +
          '<td><span class="as-status is-' + d.status + '">' + STATUS_LABEL[d.status] + '</span></td></tr></tbody></table>').querySelector('tr');
        if (animate) { tr.classList.add('as-in'); tr.style.animationDelay = (k * 45) + 'ms'; }
        tr.addEventListener('click', function () { highlightBin(d.i); markRow(d.i); });
        tb.appendChild(tr); tableRows.push(tr);
      });
    }
    function markRow(i) { tableRows.forEach(function (tr) { tr.classList.toggle('on', +tr.getAttribute('data-i') === i); }); }

    /* ----- public actions ----- */
    function setWarehouse(i, instant) {
      i = ((i % data.length) + data.length) % data.length;
      var first = cur === -1;
      cur = i;
      var D = data[i], m = D.meta;
      seg.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      placeThumb();
      $('[data-as="sub"]').textContent = m.name + ' DC · ' + m.code + ' · ' + binCount + ' bins on the floor';
      $('[data-as="wh"]').textContent = m.name + ' DC';
      $('[data-as="whsub"]').textContent = (m.util || 80) + '% of rack space used';
      $('[data-as="cap"]').style.width = (m.util || 80) + '%';
      $('[data-as="maptitle"]').textContent = 'Floor map · ' + m.code;
      setDeltas(D);
      var inst = instant || reduced();
      morphSparks(D);
      morphDonut(D);
      morphFlow(D, first);
      runCount(i, inst);
      if (inst) rollKpis(D, 1);
      return api;
    }
    function recount() { if (cur < 0) return setWarehouse(opts.start); runCount(cur, reduced()); return api; }
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      $('[data-as="theme"]').innerHTML = icon(t === 'light' ? 'moon' : 'sun');
      $('[data-as="theme"]').setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      return api;
    }
    function destroy() { tick.clear(); if (ro) ro.disconnect(); global.removeEventListener('resize', onResize); root.innerHTML = ''; root._aisle = null; }

    function onResize() { placeThumb(); sizeFlow(); layoutMap(); }
    global.addEventListener('resize', onResize);
    var ro = global.ResizeObserver ? new ResizeObserver(function () { sizeFlow(); layoutMap(); }) : null;
    if (ro) { ro.observe(flowBox); ro.observe(wrap); }
    sizeFlow();
    setTheme(opts.theme);

    var api = {
      setWarehouse: setWarehouse,
      next: function () { return setWarehouse(cur + 1); },
      recount: recount,
      setTheme: setTheme,
      destroy: destroy,
      get warehouse() { return cur; },
      get counting() { return counting; }
    };
    root._aisle = api;
    if (opts.autoplay) setWarehouse(opts.start);
    else setWarehouse(opts.start, true);
    return api;
  }

  /* catmull-rom → cubic bezier, tension .5 */
  function smooth(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------------- markup ---------------- */
  function template(o) {
    var nav = [['grid', 'Overview', 1], ['box', 'Inventory'], ['truck', 'Inbound', 0, '4'], ['cart', 'Orders'], ['users', 'Suppliers'], ['chart', 'Reports']];
    return '' +
      '<aside class="as-side" aria-label="Main">' +
      '<div class="as-brand"><span class="as-brand-mark">' + LOGO + '</span><div>Aisle<small>' + esc(o.company) + '</small></div></div>' +
      '<nav class="as-nav"><div class="as-nav-label">Warehouse</div>' +
      nav.map(function (n) { return '<a href="#"' + (n[2] ? ' aria-current="page"' : '') + '>' + icon(n[0]) + '<span>' + n[1] + '</span>' + (n[3] ? '<em class="as-pill">' + n[3] + '</em>' : '') + '</a>'; }).join('') +
      '<div class="as-nav-label">Account</div><a href="#">' + icon('gear') + '<span>Settings</span></a></nav>' +
      '<div class="as-side-card"><b data-as="wh">—</b><span data-as="whsub"></span><div class="as-cap"><i data-as="cap"></i></div></div>' +
      '</aside><div class="as-scrim"></div>' +
      '<main class="as-main">' +
      '<header class="as-top">' +
      '<button class="as-icon-btn as-menu" type="button" data-as="menu" aria-label="Open menu">' + icon('menu') + '</button>' +
      '<div class="as-title"><h1>' + esc(o.title) + '</h1><p data-as="sub"></p></div>' +
      '<div class="as-seg" role="group" aria-label="Warehouse"><span class="as-seg-thumb"></span></div>' +
      '<button class="as-icon-btn" type="button" data-as="theme" aria-label="Toggle theme"></button>' +
      '<button class="as-btn" type="button" data-as="recount">' + icon('scan') + 'Run cycle count</button>' +
      '<span class="as-avatar" aria-hidden="true">' + esc(o.user) + '</span>' +
      '</header>' +
      '<section class="as-kpis">' +
      kpi(0, 'stack', 'Units on hand', 'vs last wk', 'var(--aisle-accent)') +
      kpi(1, 'dollar', 'Stock value', 'at cost', 'var(--aisle-in)') +
      kpi(2, 'check', 'Order fill rate', '30 days', 'var(--aisle-over)') +
      kpi(3, 'alert', 'Low &amp; out of stock', '', 'var(--aisle-low)') +
      '</section>' +
      '<section class="as-row">' +
      '<article class="as-card"><div class="as-card-h"><div><h2 data-as="maptitle">Floor map</h2><p>The pick cart scans every bin as it walks the aisles</p></div>' +
      '<div class="as-legend"><span><i style="background:var(--aisle-ok)"></i>In stock</span><span><i style="background:var(--aisle-low)"></i>Low</span><span><i style="background:var(--aisle-out)"></i>Out</span><span><i style="background:var(--aisle-over)"></i>Overstock</span></div></div>' +
      '<div class="as-map-wrap"><svg class="as-map" viewBox="0 0 690 320" role="img" aria-label="Warehouse floor map with stock level per bin"></svg><div class="as-tip"></div></div>' +
      '<div class="as-map-stats">' +
      '<div class="as-stat" data-stat="counted"><span>Bins counted</span><b class="as-num">0</b><div class="as-stat-bar"><i></i></div></div>' +
      '<div class="as-stat" data-stat="acc"><span>Count accuracy</span><b class="as-num">—</b><div class="as-stat-bar"><i style="background:var(--aisle-accent)"></i></div></div>' +
      '<div class="as-stat" data-stat="disc"><span>Discrepancies</span><b class="as-num">0</b></div>' +
      '<div class="as-stat" data-stat="tickets"><span>Restock requests</span><b class="as-num">0</b></div>' +
      '</div></article>' +
      '<article class="as-card"><div class="as-card-h"><div><h2>Stock value by category</h2><p>Share of value on hand</p></div></div>' +
      '<div class="as-donut-wrap"><div class="as-donut"><svg viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="70" fill="none" stroke="var(--aisle-raise)" stroke-width="18"/></svg><div class="as-donut-c"><b class="as-num" data-as="dtotal">$0</b><span>on hand</span></div></div><ul class="as-cats" data-as="cats"></ul></div>' +
      '<div class="as-cover"><div class="as-cover-h"><span>Days of cover</span><span>at current demand</span></div><div class="as-cover-bars" data-as="cover"></div></div>' +
      '</article></section>' +
      '<section class="as-row">' +
      '<article class="as-card as-grow"><div class="as-card-h"><div><h2>Inbound vs outbound</h2><p>Units per day · last 30 days</p></div>' +
      '<div class="as-flow-totals"><div><span><i style="background:var(--aisle-in)"></i>Received</span><b class="as-num" data-as="tin">0</b></div><div><span><i style="background:var(--aisle-outb)"></i>Shipped</span><b class="as-num" data-as="tout">0</b></div></div></div>' +
      '<div class="as-flow"><svg aria-label="Inbound and outbound units per day"></svg><div class="as-tip"></div></div></article>' +
      '<article class="as-card"><div class="as-card-h"><div><h2>Restock queue</h2><p>Raised by the cycle count</p></div><span class="as-status is-low" data-as="qcount">0 open</span></div>' +
      '<ul class="as-queue" data-as="queue"></ul></article>' +
      '</section>' +
      '<section class="as-card"><div class="as-card-h"><div><h2>SKUs that need attention</h2><p>Click a row to find its bin on the floor map</p></div></div>' +
      '<div class="as-table-wrap"><table class="as-table"><thead><tr>' +
      '<th><button type="button" data-sort="name">Item ' + icon('sort') + '</button></th><th>Bin</th>' +
      '<th><button type="button" data-sort="onhand">On hand ' + icon('sort') + '</button></th>' +
      '<th><button type="button" data-sort="cover">Cover ' + icon('sort') + '</button></th><th>Demand</th>' +
      '<th><button type="button" data-sort="status">Status ' + icon('sort') + '</button></th>' +
      '</tr></thead><tbody></tbody></table></div></section>' +
      '</main>';
  }
  function kpi(k, ic, label, foot, color) {
    return '<article class="as-card as-kpi"><div class="as-kpi-top">' + icon(ic) + label + '</div>' +
      '<div class="as-kpi-val as-num" data-kpi="' + k + '">0</div>' +
      '<div class="as-kpi-foot"><span><span class="as-delta up" data-delta="' + k + '">+0%</span> <span data-kpi-sub="' + k + '">' + foot + '</span></span>' +
      '<svg class="as-spark" viewBox="0 0 92 28" aria-hidden="true"><path data-spark="' + k + '" stroke="' + color + '"/></svg></div></article>';
  }

  var Aisle = { mount: mount, template: function (o) { return template(Object.assign({ title: 'Inventory', company: 'Kestrel Supply Co.', user: 'RS' }, o || {})); }, version: '1.0.0', categories: CATS, data: DEFAULT_WAREHOUSES };
  global.Aisle = Aisle;

  // auto-mount: <div data-aisle></div> (options as JSON in data-aisle; add data-aisle-manual to mount it yourself)
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aisle]'), function (n) {
      if (n._aisle || n.hasAttribute('data-aisle-manual')) return;
      var o = {}; try { o = JSON.parse(n.getAttribute('data-aisle') || '{}'); } catch (e) { }
      mount(n, o);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
