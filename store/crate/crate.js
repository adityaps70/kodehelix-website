/* Crate — e-commerce store dashboard template · Kodehelix UI · kodehelix.in
   Zero dependencies. Crate.mount(el, options) → controller. Auto-mounts [data-crate] unless [data-crate-manual]. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var CATS = [
    { id: 'kitchen', name: 'Kitchen', v: '--crate-c1' },
    { id: 'home', name: 'Home decor', v: '--crate-c2' },
    { id: 'textiles', name: 'Textiles', v: '--crate-c3' },
    { id: 'garden', name: 'Garden', v: '--crate-c4' }
  ];
  var ICONS = {
    kitchen: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10.5h1.5a2 2 0 0 1 0 4H16M8 3.5c-.6.9-.6 1.6 0 2.5M11.5 3.5c-.6.9-.6 1.6 0 2.5"/>',
    home: '<path d="M9 3.5h6M10 3.5c0 2-2.5 3.2-2.5 7.5 0 4.5 1.8 9.5 4.5 9.5s4.5-5 4.5-9.5c0-4.3-2.5-5.5-2.5-7.5"/><path d="M8 12h8"/>',
    textiles: '<path d="M4 7.5 12 4l8 3.5-8 3.5z"/><path d="M4 7.5v4l8 3.5 8-3.5v-4M4 15.5 12 19l8-3.5"/>',
    garden: '<path d="M12 20v-8M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5zM12 14.5c0-3-2-5-5.5-5 0 3.5 2 5 5.5 5z"/><path d="M7.5 20h9"/>'
  };

  /* ---------- demo data (deterministic) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(h, mu, s) { var d = (h - mu) / s; return Math.exp(-d * d / 2); }
  function hourly(total, seed, sale) {
    var r = rng(seed), w = [], sum = 0, h;
    for (h = 0; h < 24; h++) {
      var v = 0.09 + 0.42 * gauss(h, 9, 1.5) + 0.95 * gauss(h, 13, 1.9) + 1.1 * gauss(h, 20.4, 1.8);
      if (sale) v += 1.25 * gauss(h, 9.2, 0.9) + 0.4 * gauss(h, 21, 1.2);
      v *= 0.85 + r() * 0.3; w.push(v); sum += v;
    }
    return w.map(function (x) { return Math.round(x / sum * total); });
  }
  function mix(h) {
    var m = [0.37, 0.25, 0.22, 0.16];
    if (h >= 6 && h <= 11) { m[3] += 0.12; m[0] -= 0.07; m[2] -= 0.05; }
    if (h >= 18) { m[0] += 0.08; m[2] += 0.04; m[3] -= 0.08; m[1] -= 0.04; }
    return m;
  }
  function makeData() {
    var r = rng(77), trend = [], prev = [], i;
    for (i = 0; i < 30; i++) {
      var dow = (i + 6) % 7, base = 38000 + i * 210 + (dow === 5 || dow === 6 ? 6200 : 0) + (r() - 0.5) * 5200;
      trend.push(Math.round(base)); prev.push(Math.round(base * (0.8 + r() * 0.12)));
    }
    trend[20] = 71180; prev[20] = 40120; // autumn sale
    var days = {
      today: { label: 'Today', title: 'Today · Sun 15 Nov', short: 'Today', idx: 29, now: 16.4, orders: hourly(690, 11), aov: 58.4, conv: 2.9, dOrders: 6.4, dRev: 8.1, dAov: 1.6, dConv: 0.3 },
      yesterday: { label: 'Yesterday', title: 'Yesterday · Sat 14 Nov', short: 'Sat 14', idx: 28, orders: hourly(712, 23), aov: 61.2, conv: 3.1, dOrders: 4.2, dRev: 5.9, dAov: 1.7, dConv: 0.2 },
      sale: { label: 'Sale day', title: 'Autumn sale · Fri 6 Nov', short: 'Sale', idx: 20, orders: hourly(1486, 41, true), aov: 47.9, conv: 5.4, dOrders: 112, dRev: 77.4, dAov: -16.5, dConv: 2.4 }
    };
    Object.keys(days).forEach(function (k, n) {
      var d = days[k], rr = rng(100 + n);
      d.rev = d.orders.map(function (o) { return Math.round(o * d.aov * (0.9 + rr() * 0.2)); });
      d.spark = { rev: [], orders: [], aov: [], conv: [] };
      for (var j = 0; j < 14; j++) {
        var t = j / 13, s = 0.75 + 0.25 * t + (rr() - 0.5) * 0.18;
        d.spark.rev.push(s); d.spark.orders.push(s * (0.95 + rr() * 0.1)); d.spark.aov.push(0.9 + (rr() - 0.5) * 0.2 + (k === 'sale' ? -0.2 * t : 0.08 * t)); d.spark.conv.push(0.8 + 0.2 * t + (rr() - 0.5) * 0.2);
      }
    });
    // today's trend value = revenue so far
    trend[29] = days.today.rev.slice(0, 17).reduce(function (a, b) { return a + b; }, 0);
    trend[28] = days.yesterday.rev.reduce(function (a, b) { return a + b; }, 0);
    trend[20] = days.sale.rev.reduce(function (a, b) { return a + b; }, 0);
    var products = [
      { name: 'Stoneware pour-over set', sku: 'KT-1042', cat: 0, price: 48, units: 46, stock: 132, cap: 220 },
      { name: 'Wool throw blanket', sku: 'TX-2210', cat: 2, price: 89, units: 31, stock: 18, cap: 120 },
      { name: 'Ribbed glass vase', sku: 'HD-3307', cat: 1, price: 29, units: 52, stock: 240, cap: 300 },
      { name: 'Cast-iron skillet 26 cm', sku: 'KT-1188', cat: 0, price: 54, units: 28, stock: 64, cap: 160 },
      { name: 'Terracotta herb trio', sku: 'GD-4051', cat: 3, price: 32, units: 37, stock: 0, cap: 140 },
      { name: 'Linen tea towels ×3', sku: 'TX-2034', cat: 2, price: 24, units: 61, stock: 310, cap: 400 },
      { name: 'Brass candle holder', sku: 'HD-3119', cat: 1, price: 22, units: 40, stock: 27, cap: 180 },
      { name: 'Copper watering can', sku: 'GD-4120', cat: 3, price: 46, units: 19, stock: 85, cap: 120 }
    ];
    return { store: 'Fernwood Goods', currency: '$', unit: 10, days: days, trend: trend, prevTrend: prev, trendStart: '17 Oct', products: products, categories: CATS };
  }

  /* ---------- helpers ---------- */
  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function now() { return performance.now(); }
  function fmtMoney(v, cur, dec) { return cur + (dec ? v.toFixed(2) : Math.round(v).toLocaleString('en-US')); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function hh(h) { return (h < 10 ? '0' : '') + h + ':00'; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tween(dur, fn, done, ease) {
    var t0 = now(), id = { stop: false };
    (function f() { if (id.stop) return; var p = clamp((now() - t0) / dur, 0, 1); fn((ease || easeOut)(p), p); if (p < 1) requestAnimationFrame(f); else if (done) done(); })();
    return id;
  }

  function mount(root, opts) {
    opts = opts || {};
    var D = opts.data || makeData(), cur = D.currency || '$', UNIT = opts.unit || D.unit || 10;
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    var listeners = [];
    function on(t, e, f, o) { t.addEventListener(e, f, o); listeners.push([t, e, f, o]); }
    function cvar(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
    var day = opts.day && D.days[opts.day] ? opts.day : 'today';

    /* theme + drawer */
    var themeBtn = $('[data-crate-theme]');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', String(t === 'light')); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
      requestAnimationFrame(function () { paintColours(); drawTrend(false); drawDonut(false); });
    }
    if (themeBtn) on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    var menuBtn = $('[data-crate-menu]'), scrim = $('.cr-scrim');
    function drawer(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    if (menuBtn) on(menuBtn, 'click', function () { drawer(!root.classList.contains('is-open')); });
    if (scrim) on(scrim, 'click', function () { drawer(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') { drawer(false); selectCol(-1); } });

    /* day switch */
    var dayBtns = $$('[data-day]'), ind = $('.cr-days-ind');
    function moveInd() {
      var b = root.querySelector('[data-day="' + day + '"]'); if (!b || !ind) return;
      ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    dayBtns.forEach(function (b) { on(b, 'click', function () { setDay(b.getAttribute('data-day')); }); });

    /* ---------- hero: crates ---------- */
    var hero = $('[data-crate-hero]'), svg, gGrid, gGhost, gBoxes, gFx, gHit, colSel, nowG, tip, W = 0, H = 0, geo = {};
    var crates = [], dust = [], loopOn = false, landed = 0, landedRev = 0, selCol = -1;
    var landedEl = $('[data-crate-landed]'), totalEl = $('[data-crate-total]'), landedLbl = $('[data-crate-landedlabel]');
    function setupHero() {
      hero.innerHTML = '';
      svg = el('svg', { 'aria-hidden': 'true' }, hero);
      gGrid = el('g', {}, svg); colSel = el('rect', { 'class': 'cr-colsel', rx: 8 }, svg);
      gGhost = el('g', {}, svg); gBoxes = el('g', {}, svg); gFx = el('g', {}, svg); nowG = el('g', { 'class': 'cr-now' }, svg); gHit = el('g', {}, svg);
      tip = document.createElement('div'); tip.className = 'cr-tip'; hero.appendChild(tip);
    }
    function axisMax() {
      var m = 0; Object.keys(D.days).forEach(function (k) { D.days[k].orders.forEach(function (o) { m = Math.max(m, o); }); });
      return Math.ceil((m / UNIT + 1) / 2) * 2 * UNIT;
    }
    function layout() {
      W = hero.clientWidth; H = hero.clientHeight; if (!W || !H) return false;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var small = W < 520, pl = small ? 30 : 40, pr = small ? 8 : 14, pt = 30, pb = 26;
      var rows = axisMax() / UNIT, pw = W - pl - pr, ph = H - pt - pb, cw = pw / 24;
      var bw = Math.min(cw - Math.max(2, cw * 0.18), 38), bh = ph / rows, gap = Math.max(1.5, Math.min(3, bh * 0.14));
      geo = { pl: pl, pr: pr, pt: pt, pb: pb, pw: pw, ph: ph, cw: cw, bw: bw, bh: bh, gap: gap, rows: rows, floor: pt + ph, small: small };
      gGrid.innerHTML = '';
      var step = rows > 12 ? 4 : 2;
      for (var r = 0; r <= rows; r += step) {
        var y = geo.floor - r * bh;
        if (r) el('line', { 'class': 'cr-gl', x1: pl, x2: W - pr, y1: y, y2: y }, gGrid);
        var t = el('text', { x: pl - 8, y: y + 4, 'text-anchor': 'end' }, gGrid); t.textContent = r * UNIT;
      }
      el('line', { 'class': 'cr-floor', x1: pl, x2: W - pr, y1: geo.floor + 1, y2: geo.floor + 1 }, gGrid);
      for (var h = 0; h < 24; h += (small ? 6 : 3)) {
        var tx = el('text', { x: colX(h), y: H - 8, 'text-anchor': 'middle' }, gGrid); tx.textContent = hh(h);
      }
      gHit.innerHTML = '';
      for (var c = 0; c < 24; c++) {
        var hr = el('rect', { 'class': 'cr-colhit', x: pl + c * cw, y: pt - 8, width: cw, height: ph + 8 }, gHit);
        hr.setAttribute('data-col', c);
      }
      return true;
    }
    function colX(h) { return geo.pl + (h + 0.5) * geo.cw; }
    function slotY(i) { return geo.floor - i * geo.bh; } // bottom edge of slot i

    function colour(i) { return cvar(CATS[i].v) || '#3B5BFF'; }
    function crateCounts(d, h) {
      var o = d.orders[h], n = Math.max(o > 0 ? 1 : 0, Math.round(o / UNIT)), m = mix(h), raw = m.map(function (x) { return x * n; }),
        out = raw.map(Math.floor), left = n - sum(out);
      raw.map(function (x, i) { return [x - Math.floor(x), i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, left).forEach(function (p) { out[p[1]]++; });
      return out;
    }
    function actualHours(d) { return d.now != null ? Math.floor(d.now) : 24; }

    function buildBox(cat) {
      var g = el('g', { 'class': 'cr-box' }, gBoxes);
      var w = geo.bw, h = Math.max(2, geo.bh - geo.gap), rx = Math.min(3, h / 4);
      el('rect', { x: -w / 2, y: -h, width: w, height: h, rx: rx, 'data-f': cat }, g);
      if (h >= 9) {
        el('rect', { x: -w / 2 + 1, y: -h + 1, width: w - 2, height: Math.min(2, h * .14), rx: 1, fill: 'rgba(255,255,255,.32)' }, g);
        el('rect', { x: -Math.max(1.5, w * 0.09), y: -h, width: Math.max(3, w * 0.18), height: h, fill: 'rgba(255,255,255,.16)' }, g);
      }
      g.firstChild.setAttribute('fill', colour(cat));
      return g;
    }
    function paintColours() {
      $$('.cr-box rect[data-f]').forEach(function (r) { r.setAttribute('fill', colour(+r.getAttribute('data-f'))); });
      $$('[data-crate-catcolour]').forEach(function (n) { n.style.setProperty('--c', 'var(' + CATS[+n.getAttribute('data-crate-catcolour')].v + ')'); });
    }

    /* plan the drop for the current day */
    function plan(d) {
      var list = [], acts = actualHours(d), seq = 0;
      for (var h = 0; h < 24; h++) {
        var counts = crateCounts(d, h), tot = sum(counts), real = h < acts ? tot : h === acts && d.now != null ? Math.round(tot * (d.now - acts)) : 0;
        var per = d.orders[h] / Math.max(1, tot), perRev = d.rev[h] / Math.max(1, tot), i = 0;
        counts.forEach(function (c, cat) { for (var k = 0; k < c; k++) { list.push({ h: h, slot: i, cat: cat, ghost: i >= real, orders: per, rev: perRev, seq: seq }); i++; } });
        seq++;
      }
      return list;
    }
    function totalReal(d) { var acts = actualHours(d), t = 0, r = 0; for (var h = 0; h < 24; h++) { if (h < acts) { t += d.orders[h]; r += d.rev[h]; } else if (h === acts && d.now != null) { var f = d.now - acts; t += d.orders[h] * f; r += d.rev[h] * f; } } return { o: Math.round(t), r: r }; }

    function startLoop() { if (loopOn) return; loopOn = true; requestAnimationFrame(frame); }
    function frame() {
      var t = now(), busy = false, i;
      for (i = 0; i < crates.length; i++) {
        var c = crates[i];
        if (c.state === 'wait') { if (t >= c.t0) { c.state = 'fall'; c.g.style.opacity = 1; } else { busy = true; continue; } }
        if (c.state === 'fall') {
          busy = true;
          var p = clamp((t - c.t0) / c.dur, 0, 1), y = c.y0 + (c.y1 - c.y0) * p * p, rot = c.rot * (1 - p);
          c.g.setAttribute('transform', 'translate(' + (c.x + c.dx * (1 - p)) + ',' + y + ') rotate(' + rot + ')');
          if (p >= 1) { c.state = 'land'; c.tl = t; onLand(c); }
        } else if (c.state === 'land') {
          busy = true;
          var q = (t - c.tl) / 420, e = Math.exp(-6 * q) * Math.cos(q * 15), sy = 1 - 0.3 * e, sx = 1 + 0.18 * e;
          c.g.setAttribute('transform', 'translate(' + c.x + ',' + c.y1 + ') scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')');
          if (q >= 1) { c.state = 'rest'; c.g.setAttribute('transform', 'translate(' + c.x + ',' + c.y1 + ')'); }
        } else if (c.state === 'leave') {
          busy = true;
          var lp = clamp((t - c.t0) / 380, 0, 1);
          if (lp > 0) { c.g.style.opacity = 1 - lp; c.g.setAttribute('transform', 'translate(' + c.x + ',' + (c.y1 - 46 * easeInOut(lp)) + ') scale(' + (1 - 0.35 * lp) + ')'); }
          if (lp >= 1) { c.g.remove(); c.dead = true; }
        }
      }
      for (i = 0; i < dust.length; i++) {
        var u = dust[i], dp = (t - u.t0) / 380;
        if (dp >= 1) { u.n.remove(); u.dead = true; continue; }
        busy = true; u.n.setAttribute('cx', u.x + u.vx * easeOut(dp)); u.n.setAttribute('cy', u.y - 6 * Math.sin(dp * Math.PI)); u.n.setAttribute('opacity', (0.7 * (1 - dp)).toFixed(2));
      }
      crates = crates.filter(function (c) { return !c.dead; }); dust = dust.filter(function (u) { return !u.dead; });
      if (busy) requestAnimationFrame(frame); else loopOn = false;
    }
    function onLand(c) {
      landed += c.orders; landedRev += c.rev; showLanded();
      if (geo.bh > 8 && !reduce) for (var s = -1; s <= 1; s += 2) {
        dust.push({ n: el('circle', { 'class': 'cr-dust', r: 1.6, cx: c.x, cy: c.y1 }, gFx), x: c.x + s * geo.bw * 0.45, y: c.y1, vx: s * (6 + Math.random() * 6), t0: now() });
      }
    }
    function showLanded() {
      var d = D.days[day], tr = totalReal(d);
      if (landedEl) landedEl.textContent = Math.min(Math.round(landed), tr.o).toLocaleString('en-US');
      kpiSet('orders', Math.min(landed, tr.o)); kpiSet('rev', Math.min(landedRev, tr.r));
    }

    function dropDay(animate) {
      var d = D.days[day], t = now(), list = plan(d), tr = totalReal(d);
      // old crates fly up and away in a left-to-right wave
      crates.forEach(function (c) { c.state = 'leave'; c.t0 = t + c.h * 12; });
      gGhost.innerHTML = '';
      landed = 0; landedRev = 0;
      if (totalEl) totalEl.textContent = ' / ' + (d.now != null ? '~' + sum(d.orders).toLocaleString('en-US') + ' forecast' : tr.o.toLocaleString('en-US'));
      if (landedLbl) landedLbl.textContent = d.now != null ? 'orders so far today' : 'orders landed';
      var startAt = t + (crates.length ? 260 : 120), hourStep = animate ? 78 : 0, inStep = animate ? 52 : 0;
      list.forEach(function (it) {
        var x = colX(it.h), y1 = slotY(it.slot);
        if (it.ghost) {
          var gh = Math.max(2, geo.bh - geo.gap);
          var r = el('rect', { 'class': 'cr-ghost', x: x - geo.bw / 2 + .6, y: y1 - gh + .6, width: geo.bw - 1.2, height: gh - 1.2, rx: 2.5 }, gGhost);
          r.style.opacity = 0; r.style.transition = 'opacity .5s ' + (animate ? (0.9 + it.h * 0.07) : 0) + 's';
          requestAnimationFrame(function () { requestAnimationFrame(function () { r.style.opacity = 1; }); });
          return;
        }
        var g = buildBox(it.cat), c = { g: g, h: it.h, x: x, y1: y1, cat: it.cat, orders: it.orders, rev: it.rev };
        if (!animate || reduce) {
          c.state = 'rest'; g.setAttribute('transform', 'translate(' + x + ',' + y1 + ')'); landed += it.orders; landedRev += it.rev;
          if (reduce && animate) { g.style.opacity = 0; g.style.transition = 'opacity .4s'; requestAnimationFrame(function () { requestAnimationFrame(function () { g.style.opacity = 1; }); }); }
        } else {
          c.state = 'wait'; c.t0 = startAt + it.h * hourStep + it.slot * inStep;
          c.y0 = geo.pt - 30 - Math.random() * 40; var dist = c.y1 - c.y0; c.dur = 1000 * Math.sqrt(2 * dist / 2600);
          c.dx = (Math.random() - 0.5) * geo.cw * 0.8; c.rot = (Math.random() - 0.5) * 22; g.style.opacity = 0;
          g.setAttribute('transform', 'translate(' + (x + c.dx) + ',' + c.y0 + ')');
        }
        crates.push(c);
      });
      drawNow(d);
      showLanded();
      startLoop();
    }
    function drawNow(d) {
      nowG.innerHTML = '';
      if (d.now == null) return;
      var x = geo.pl + d.now * geo.cw, hh2 = Math.floor(d.now), mm = Math.round((d.now - hh2) * 60);
      el('line', { x1: x, x2: x, y1: geo.pt - 6, y2: geo.floor }, nowG);
      var label = 'Now ' + hh2 + ':' + (mm < 10 ? '0' : '') + mm, w = 66;
      el('rect', { x: x - w / 2, y: geo.pt - 26, width: w, height: 19, rx: 9.5 }, nowG);
      var t = el('text', { x: x, y: geo.pt - 12.5, 'text-anchor': 'middle' }, nowG); t.textContent = label;
    }

    /* column selection + tooltip */
    function selectCol(c) {
      selCol = c;
      if (c < 0) { colSel.classList.remove('is-on'); tip.classList.remove('is-on'); return; }
      var d = D.days[day], counts = sum(crateCounts(d, c)), top = slotY(counts) - 4;
      colSel.setAttribute('x', geo.pl + c * geo.cw + 1); colSel.setAttribute('width', geo.cw - 2);
      colSel.setAttribute('y', Math.min(top, geo.floor - 20) - 4); colSel.setAttribute('height', geo.floor - Math.min(top, geo.floor - 20) + 6);
      colSel.classList.add('is-on');
      var m = mix(c), best = m.indexOf(Math.max.apply(null, m)), fc = d.now != null && c > Math.floor(d.now);
      tip.innerHTML = '<b>' + hh(c) + ' – ' + hh((c + 1) % 24) + (fc ? ' · forecast' : '') + '</b>' +
        '<div><span>Orders</span><span>' + d.orders[c] + '</span></div><div><span>Revenue</span><span>' + fmtMoney(d.rev[c], cur) + '</span></div>' +
        '<div><span>Top category</span><span>' + CATS[best].name + '</span></div>';
      var tx = clamp(colX(c), 90, W - 90), ty = Math.max(top, 92);
      tip.style.left = tx + 'px'; tip.style.top = ty + 'px'; tip.classList.add('is-on');
      hero.setAttribute('aria-label', 'Orders by hour. ' + hh(c) + ': ' + d.orders[c] + ' orders, ' + fmtMoney(d.rev[c], cur) + ' revenue. Use the arrow keys to move between hours.');
    }
    on(hero, 'pointermove', function (e) { var t = e.target; if (t.getAttribute && t.getAttribute('data-col') != null) { var c = +t.getAttribute('data-col'); if (c !== selCol) selectCol(c); } });
    on(hero, 'pointerleave', function () { if (document.activeElement !== hero) selectCol(-1); });
    on(hero, 'click', function (e) { var t = e.target; if (t.getAttribute && t.getAttribute('data-col') != null) selectCol(+t.getAttribute('data-col')); });
    on(hero, 'keydown', function (e) {
      var k = e.key, c = selCol < 0 ? (D.days[day].now != null ? Math.floor(D.days[day].now) : 12) : selCol;
      if (k === 'ArrowRight' || k === 'ArrowUp') c = Math.min(23, selCol < 0 ? c : c + 1); else if (k === 'ArrowLeft' || k === 'ArrowDown') c = Math.max(0, selCol < 0 ? c : c - 1);
      else if (k === 'Home') c = 0; else if (k === 'End') c = 23; else return;
      e.preventDefault(); selectCol(c);
    });
    on(hero, 'blur', function () { selectCol(-1); });

    /* ---------- KPIs ---------- */
    var kpiState = {};
    function kpiFmt(k, v) { return k === 'rev' ? fmtMoney(v, cur) : k === 'aov' ? fmtMoney(v, cur, true) : k === 'conv' ? v.toFixed(2) + '%' : Math.round(v).toLocaleString('en-US'); }
    function kpiSet(k, v) { var n = root.querySelector('[data-crate-kpi="' + k + '"] .cr-kpi-val'); if (n) n.textContent = kpiFmt(k, v); kpiState[k] = v; }
    function kpis(animate) {
      var d = D.days[day], dd = { rev: d.dRev, orders: d.dOrders, aov: d.dAov, conv: d.dConv };
      ['aov', 'conv'].forEach(function (k) {
        var from = kpiState[k] || 0, to = d[k];
        if (!animate || reduce) kpiSet(k, to); else tween(900, function (e) { kpiSet(k, from + (to - from) * e); });
      });
      Object.keys(dd).forEach(function (k) {
        var card = root.querySelector('[data-crate-kpi="' + k + '"]'); if (!card) return;
        var del = card.querySelector('.cr-delta'), v = dd[k];
        del.classList.toggle('is-down', v < 0);
        del.querySelector('span').textContent = (k === 'conv' ? Math.abs(v).toFixed(1) + ' pt' : Math.abs(v).toFixed(1) + '%');
        spark(card.querySelector('.cr-spark'), d.spark[k], animate);
      });
    }
    function spark(s, pts, animate) {
      if (!s) return;
      var mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts), w = 84, h = 30;
      var target = pts.map(function (p, i) { return [i / (pts.length - 1) * w, h - 3 - (p - mn) / (mx - mn || 1) * (h - 8)]; });
      var line = s.querySelector('polyline'), dot = s.querySelector('circle');
      if (!line) { line = el('polyline', { fill: 'none', stroke: 'var(--k)', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); dot = el('circle', { r: 2.6, fill: 'var(--k)' }, s); s._pts = target.map(function (p) { return [p[0], h - 3]; }); }
      var from = s._pts;
      function put(e) {
        var cur2 = target.map(function (p, i) { return [p[0], from[i][1] + (p[1] - from[i][1]) * e]; });
        line.setAttribute('points', cur2.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
        dot.setAttribute('cx', cur2[cur2.length - 1][0]); dot.setAttribute('cy', cur2[cur2.length - 1][1]); s._pts = cur2;
      }
      if (!animate || reduce) put(1); else tween(800, put);
    }

    /* ---------- revenue trend ---------- */
    var trendBox = $('[data-crate-trend]'), trendSvg, tLine, tPrev, tArea, tSpot, tTag, spotX = null, spotAnim = null, drawn = false;
    function drawTrend(animate) {
      if (!trendBox) return;
      var w = trendBox.clientWidth, h = trendBox.clientHeight; if (!w) return;
      trendBox.innerHTML = '';
      trendSvg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, 'aria-hidden': 'true' }, trendBox);
      var defs = el('defs', {}, trendSvg), lg = el('linearGradient', { id: 'cr-lg', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      el('stop', { offset: 0, 'stop-color': cvar('--crate-blue') }, lg); el('stop', { offset: 1, 'stop-color': cvar('--crate-cyan') }, lg);
      var ag = el('linearGradient', { id: 'cr-ag', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': cvar('--crate-cyan'), 'stop-opacity': .26 }, ag); el('stop', { offset: 1, 'stop-color': cvar('--crate-cyan'), 'stop-opacity': 0 }, ag);
      var pl = 40, pr = 10, pt = 26, pb = 22, all = D.trend.concat(D.prevTrend), mx = Math.ceil(Math.max.apply(null, all) / 20000) * 20000;
      var X = function (i) { return pl + i / (D.trend.length - 1) * (w - pl - pr); }, Y = function (v) { return pt + (1 - v / mx) * (h - pt - pb); };
      for (var g = 0; g <= mx; g += 20000) {
        el('line', { 'class': 'cr-gl', x1: pl, x2: w - pr, y1: Y(g), y2: Y(g) }, trendSvg);
        var tx = el('text', { x: pl - 8, y: Y(g) + 4, 'text-anchor': 'end' }, trendSvg); tx.textContent = g ? (g / 1000) + 'k' : '0';
      }
      [0, 7, 14, 21, 29].forEach(function (i) {
        var d = new Date(2026, 9, 17 + i), t = el('text', { x: X(i), y: h - 4, 'text-anchor': i === 0 ? 'start' : i === 29 ? 'end' : 'middle' }, trendSvg);
        t.textContent = d.getDate() + ' ' + ['Oct', 'Nov'][d.getMonth() - 9];
      });
      function path(a) { var s = ''; for (var i = 0; i < a.length; i++) { var x = X(i), y = Y(a[i]); if (!i) s = 'M' + x + ',' + y; else { var px = X(i - 1), py = Y(a[i - 1]), cx = (px + x) / 2; s += ' C' + cx + ',' + py + ' ' + cx + ',' + y + ' ' + x + ',' + y; } } return s; }
      tPrev = el('path', { 'class': 'cr-prev', d: path(D.prevTrend) }, trendSvg);
      var lp = path(D.trend), solid = path(D.trend.slice(0, 29));
      tArea = el('path', { d: lp + ' L' + X(29) + ',' + Y(0) + ' L' + X(0) + ',' + Y(0) + ' Z', fill: 'url(#cr-ag)' }, trendSvg);
      tLine = el('path', { 'class': 'cr-line', d: solid }, trendSvg);
      var live = el('path', { 'class': 'cr-live', d: 'M' + X(28) + ',' + Y(D.trend[28]) + ' L' + X(29) + ',' + Y(D.trend[29]) }, trendSvg);
      if (animate && !reduce && !drawn) { live.style.opacity = 0; setTimeout(function () { live.style.transition = 'opacity .4s'; live.style.opacity = 1; }, 1300); }
      tSpot = el('g', { 'class': 'cr-spot' }, trendSvg);
      var sl = el('line', { y1: pt - 4, y2: h - pb }, tSpot), sh = el('circle', { 'class': 'cr-halo', r: 11 }, tSpot), sc = el('circle', { r: 5 }, tSpot);
      tTag = document.createElement('div'); tTag.className = 'cr-trend-tag'; trendBox.appendChild(tTag);
      for (var i = 0; i < 30; i++) {
        var hr = el('rect', { 'class': 'cr-hit', x: X(i) - (w - pl - pr) / 58, y: pt, width: (w - pl - pr) / 29, height: h - pt - pb }, trendSvg);
        (function (i) { hr.addEventListener('click', function () { var k = Object.keys(D.days).filter(function (k) { return D.days[k].idx === i; })[0]; if (k) setDay(k); }); })(i);
      }
      trendBox._geo = { X: X, Y: Y, sl: sl, sh: sh, sc: sc };
      if (animate && !reduce && !drawn) {
        var L = tLine.getTotalLength(); tLine.style.strokeDasharray = L; tLine.style.strokeDashoffset = L; tArea.style.opacity = 0;
        tween(1400, function (e) { tLine.style.strokeDashoffset = L * (1 - e); tArea.style.opacity = e; }, function () { tLine.style.strokeDasharray = ''; }, easeInOut);
      }
      drawn = true;
      spot(false);
    }
    function spot(animate) {
      var g = trendBox && trendBox._geo; if (!g) return;
      var d = D.days[day], tx = g.X(d.idx), from = spotX == null ? tx : spotX;
      function put(x) {
        spotX = x;
        var i = clamp((x - g.X(0)) / (g.X(1) - g.X(0)), 0, 29), i0 = Math.floor(i), i1 = Math.min(29, i0 + 1), f = i - i0, v = D.trend[i0] + (D.trend[i1] - D.trend[i0]) * f, y = g.Y(v);
        g.sl.setAttribute('x1', x); g.sl.setAttribute('x2', x); g.sh.setAttribute('cx', x); g.sh.setAttribute('cy', y); g.sc.setAttribute('cx', x); g.sc.setAttribute('cy', y);
        tTag.style.left = clamp(x, 50, trendBox.clientWidth - 50) + 'px'; tTag.style.top = y - 10 + 'px';
      }
      tTag.textContent = d.short + ' · ' + fmtMoney(D.trend[d.idx], cur) + (d.now != null ? ' so far' : '');
      if (spotAnim) spotAnim.stop = true;
      if (!animate || reduce) put(tx);
      else spotAnim = tween(900, function (e) { put(from + (tx - from) * e); }, null, function (t) { return 1 - Math.exp(-6 * t) * Math.cos(t * 9); });
    }

    /* ---------- category donut ---------- */
    var donut = $('[data-crate-donut]'), catList = $('[data-crate-catlist]'), donutShare = [0, 0, 0, 0];
    function shares(d) {
      var s = [0, 0, 0, 0], acts = actualHours(d);
      for (var h = 0; h < 24; h++) { if (d.now != null && h > acts) break; var m = mix(h); for (var i = 0; i < 4; i++) s[i] += d.rev[h] * m[i]; }
      return s;
    }
    function drawDonut(animate) {
      if (!donut) return;
      var d = D.days[day], s = shares(d), tot = sum(s), to = s.map(function (v) { return v / tot; }), from = donutShare.slice();
      var svgD = donut.querySelector('svg');
      if (!svgD) {
        svgD = el('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' }); donut.insertBefore(svgD, donut.firstChild);
        el('circle', { cx: 60, cy: 60, r: 46, fill: 'none', stroke: 'var(--crate-track)', 'stroke-width': 14 }, svgD);
        CATS.forEach(function (c, i) { el('circle', { cx: 60, cy: 60, r: 46, fill: 'none', stroke: 'var(' + c.v + ')', 'stroke-width': 14, 'stroke-linecap': 'butt', 'data-seg': i }, svgD); });
      }
      var C = 2 * Math.PI * 46, segs = svgD.querySelectorAll('[data-seg]');
      function put(e) {
        var acc = 0;
        for (var i = 0; i < 4; i++) {
          var f = from[i] + (to[i] - from[i]) * e, len = Math.max(0, f * C - 3);
          segs[i].setAttribute('stroke-dasharray', len + ' ' + (C - len)); segs[i].setAttribute('stroke-dashoffset', -acc * C); acc += f;
        }
        donutShare = from.map(function (v, i) { return v + (to[i] - v) * e; });
      }
      if (!animate || reduce) put(1); else tween(1000, put, null, function (t) { return 1 - Math.exp(-5.5 * t) * Math.cos(t * 7); });
      var b = donut.querySelector('[data-crate-catrev]');
      if (b) b.textContent = cur + (tot / 1000).toFixed(1) + 'k';
      if (catList) {
        if (!catList.children.length) catList.innerHTML = CATS.map(function (c, i) { return '<li data-crate-catcolour="' + i + '" style="--c:var(' + c.v + ')"><i></i><span>' + c.name + '</span><em></em><strong></strong><span class="cr-catbar"><u></u></span></li>'; }).join('');
        var mxs = Math.max.apply(null, to);
        Array.prototype.forEach.call(catList.children, function (li, i) {
          li.querySelector('em').textContent = Math.round(to[i] * 100) + '%';
          li.querySelector('strong').textContent = cur + (s[i] / 1000).toFixed(1) + 'k';
          li.querySelector('u').style.transform = 'scaleX(' + (to[i] / mxs).toFixed(3) + ')';
        });
      }
    }

    /* ---------- checkout funnel ---------- */
    var funnel = $('[data-crate-funnel]'), fnote = $('[data-crate-funnelnote]');
    function drawFunnel() {
      if (!funnel) return;
      var d = D.days[day], o = totalReal(d).o, ses = Math.round(o / (d.conv / 100)), cart = Math.round(ses * (day === 'sale' ? 0.17 : 0.11)), chk = Math.round(ses * (day === 'sale' ? 0.081 : 0.052));
      var st = [['Sessions', ses], ['Added to cart', cart], ['Checkout', chk], ['Purchased', o]];
      if (!funnel.children.length) funnel.innerHTML = st.map(function () { return '<li><span></span><b></b><span class="cr-fbar"><u style="transform:scaleX(0)"></u></span></li>'; }).join('');
      Array.prototype.forEach.call(funnel.children, function (li, i) {
        li.children[0].textContent = st[i][0];
        li.children[1].innerHTML = st[i][1].toLocaleString('en-US') + (i ? '<em>' + (st[i][1] / st[i - 1][1] * 100).toFixed(0) + '%</em>' : '');
        var u = li.querySelector('u'), v = Math.max(0.025, Math.pow(st[i][1] / ses, 0.55));
        requestAnimationFrame(function () { u.style.transform = 'scaleX(' + v.toFixed(3) + ')'; });
      });
      if (fnote) fnote.textContent = d.label;
    }

    /* ---------- products table ---------- */
    var tbody = $('[data-crate-table] tbody'), search = $('[data-crate-search]'), sortKey = 'rev', sortDir = -1;
    function rows() {
      var d = D.days[day], f = sum(d.orders) / 712 * (d.now != null ? (d.now / 24) * 1.25 : 1);
      return D.products.map(function (p, i) {
        var units = Math.max(1, Math.round(p.units * f * (day === 'sale' ? (0.8 + (i % 3) * 0.25) : 1)));
        var stock = Math.max(0, p.stock - (day === 'yesterday' ? -units : day === 'sale' ? -Math.round(units * 0.6) : 0));
        if (p.stock === 0 && day !== 'today') stock = Math.round(p.cap * 0.22);
        var price = day === 'sale' ? p.price * 0.8 : p.price;
        return { p: p, units: units, stock: stock, rev: units * price };
      });
    }
    function drawTable(animate) {
      if (!tbody) return;
      var q = (search && search.value || '').trim().toLowerCase();
      var rs = rows().filter(function (r) { return !q || (r.p.name + ' ' + r.p.sku + ' ' + CATS[r.p.cat].name).toLowerCase().indexOf(q) > -1; });
      rs.sort(function (a, b) { return (a[sortKey] - b[sortKey]) * sortDir; });
      if (!rs.length) { tbody.innerHTML = '<tr class="cr-empty"><td colspan="5">No products match “' + q.replace(/[<>&"]/g, '') + '”</td></tr>'; return; }
      tbody.innerHTML = rs.map(function (r, i) {
        var c = CATS[r.p.cat], st = r.stock === 0 ? 'is-out' : r.stock < 30 ? 'is-low' : '', sl = r.stock === 0 ? 'Sold out' : r.stock < 30 ? r.stock + ' left' : r.stock;
        return '<tr' + (animate && !reduce ? ' class="is-in" style="animation-delay:' + (i * 40) + 'ms"' : '') + '>' +
          '<td><div class="cr-prod"><span class="cr-thumb" style="--c:var(' + c.v + ')"><svg class="cr-ic" viewBox="0 0 24 24">' + ICONS[c.id] + '</svg></span><div><b>' + r.p.name + '</b><small>' + r.p.sku + '</small></div></div></td>' +
          '<td class="cr-col-cat"><span class="cr-chip" style="--c:var(' + c.v + ')"><i></i>' + c.name + '</span></td>' +
          '<td class="cr-num cr-col-units">' + r.units + '</td>' +
          '<td><div class="cr-stock ' + st + '"><span class="cr-sbar"><u style="width:' + Math.round(Math.min(1, r.stock / r.p.cap) * 100) + '%"></u></span><em>' + sl + '</em></div></td>' +
          '<td class="cr-num"><b>' + fmtMoney(r.rev, cur) + '</b></td></tr>';
      }).join('');
    }
    $$('[data-crate-table] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () {
        var th = b.parentNode, k = th.getAttribute('data-sort');
        if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
        $$('[data-crate-table] th[data-sort]').forEach(function (t) { t.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', sortDir < 0 ? 'descending' : 'ascending'); drawTable(true);
      });
    });
    if (search) on(search, 'input', function () { drawTable(false); });

    /* ---------- titles ---------- */
    function titles() {
      var d = D.days[day];
      $$('[data-crate-dayname]').forEach(function (n) { n.textContent = d.label; });
      var t = $('[data-crate-herotitle]'); if (t) t.textContent = d.title;
      var u = $('[data-crate-unit]'); if (u) u.textContent = '1 parcel = ' + UNIT + ' orders';
      dayBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-day') === day)); });
      moveInd();
    }

    function setDay(k, force) {
      if (!D.days[k] || (k === day && !force)) return;
      day = k; selectCol(-1); titles(); dropDay(true); kpis(true); spot(true); drawDonut(true); drawFunnel(); drawTable(true);
    }

    /* resize: re-layout without replaying */
    var rq = null, lastW = 0, lastH = 0;
    function resize() {
      if (hero.clientWidth === lastW && hero.clientHeight === lastH) { moveInd(); return; }
      lastW = hero.clientWidth; lastH = hero.clientHeight;
      crates.forEach(function (c) { c.g.remove(); }); crates = []; dust.forEach(function (u) { u.n.remove(); }); dust = [];
      if (layout()) dropDay(false);
      drawTrend(false); moveInd();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { cancelAnimationFrame(rq); rq = requestAnimationFrame(resize); }) : null;

    /* init */
    setupHero(); titles(); layout(); lastW = hero.clientWidth; lastH = hero.clientHeight;
    kpis(false); drawTrend(true); drawDonut(true); drawFunnel(); drawTable(true); dropDay(opts.animate !== false);
    if (ro) { ro.observe(hero); ro.observe(root); } else on(window, 'resize', resize);
    if (opts.theme) setTheme(opts.theme); else if (themeBtn) themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'light'));
    setTimeout(moveInd, 50);

    return {
      setDay: function (k) { setDay(k); },
      replay: function () { setDay(day, true); },
      setTheme: setTheme,
      get day() { return day; },
      data: D,
      destroy: function () { listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); if (ro) ro.disconnect(); }
    };
  }

  window.Crate = { mount: mount, data: makeData(), categories: CATS };
  function auto() { Array.prototype.forEach.call(document.querySelectorAll('[data-crate]:not([data-crate-manual])'), function (n) { if (!n._crate) n._crate = mount(n); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
