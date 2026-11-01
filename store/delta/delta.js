/* Delta — personal finance dashboard template · Kodehelix UI · kodehelix.in
   Delta.mount(el, { month, data, theme, onTheme }) — see README.md. Zero dependencies. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- demo data (same shape you pass as options.data) ---------- */
  function tx(list) {
    // [day, merchant, category key or 'income', account, amount] -> objects
    return list.map(function (t) { return { day: t[0], name: t[1], cat: t[2], account: t[3], amount: t[4], status: t[5] || 'cleared' }; });
  }
  var DATA = {
    currency: '$',
    sources: [
      { key: 'salary', name: 'Salary', color: '#3B5BFF' },
      { key: 'freelance', name: 'Freelance', color: '#7C8EFF' },
      { key: 'interest', name: 'Interest', color: '#22C3EE' }
    ],
    categories: [
      { key: 'housing', name: 'Housing', color: '#8FA3FF', budget: 2150, icon: 'home' },
      { key: 'food', name: 'Food', color: '#22C3EE', budget: 850, icon: 'food' },
      { key: 'transport', name: 'Transport', color: '#FFB020', budget: 400, icon: 'car' },
      { key: 'bills', name: 'Bills & subs', color: '#B07CFF', budget: 320, icon: 'bolt' },
      { key: 'lifestyle', name: 'Lifestyle', color: '#FF7AA2', budget: 900, icon: 'star' }
    ],
    savings: { name: 'Savings', color: '#19C37D' },
    history: [
      { label: 'May', income: 6420, spend: 4310, worth: 79880 },
      { label: 'Jun', income: 6890, spend: 4760, worth: 81960 }
    ],
    months: [
      { key: 'jul', label: 'July', short: 'Jul', days: 31, worth: 84210,
        income: { salary: 5400, freelance: 1200, interest: 31 },
        spend: { housing: 2150, food: 780, transport: 320, bills: 298, lifestyle: 640 },
        tx: tx([[1, 'Northwind Payroll', 'income', 'Checking ··42', 5400], [2, 'Copperleaf Apartments', 'housing', 'Checking ··42', -2150], [6, 'Greenbasket Market', 'food', 'Card ··07', -142.6], [10, 'Lumen Fiber', 'bills', 'Card ··07', -64.99], [14, 'Studio Arc · invoice', 'income', 'Checking ··42', 1200], [18, 'Northline Transit', 'transport', 'Card ··07', -86], [21, 'Pinewood Cinema', 'lifestyle', 'Card ··07', -38.5], [24, 'Ferro Coffee', 'food', 'Card ··07', -18.4], [27, 'Voltway Energy', 'bills', 'Checking ··42', -96.2]]) },
      { key: 'aug', label: 'August', short: 'Aug', days: 31, worth: 86930,
        income: { salary: 5400, freelance: 2100, interest: 34 },
        spend: { housing: 2150, food: 860, transport: 465, bills: 312, lifestyle: 1420 },
        tx: tx([[1, 'Northwind Payroll', 'income', 'Checking ··42', 5400], [2, 'Copperleaf Apartments', 'housing', 'Checking ··42', -2150], [5, 'Greenbasket Market', 'food', 'Card ··07', -168.2], [9, 'Studio Arc · invoice', 'income', 'Checking ··42', 2100], [10, 'Lumen Fiber', 'bills', 'Card ··07', -64.99], [13, 'Harbor Lights Festival', 'lifestyle', 'Card ··07', -480], [16, 'Northline Transit', 'transport', 'Card ··07', -112], [22, 'Kite & Co. Rentals', 'transport', 'Card ··07', -164], [27, 'Ferro Coffee', 'food', 'Card ··07', -22.1]]) },
      { key: 'sep', label: 'September', short: 'Sep', days: 30, worth: 88640,
        income: { salary: 5400, freelance: 650, interest: 36 },
        spend: { housing: 2150, food: 735, transport: 280, bills: 305, lifestyle: 520 },
        tx: tx([[1, 'Northwind Payroll', 'income', 'Checking ··42', 5400], [2, 'Copperleaf Apartments', 'housing', 'Checking ··42', -2150], [7, 'Greenbasket Market', 'food', 'Card ··07', -131.4], [10, 'Lumen Fiber', 'bills', 'Card ··07', -64.99], [15, 'Pinewood Cinema', 'lifestyle', 'Card ··07', -42], [19, 'Northline Transit', 'transport', 'Card ··07', -74], [22, 'Studio Arc · invoice', 'income', 'Checking ··42', 650], [25, 'Ferro Coffee', 'food', 'Card ··07', -15.8], [28, 'Voltway Energy', 'bills', 'Checking ··42', -99.1]]) },
      { key: 'oct', label: 'October', short: 'Oct', days: 31, worth: 92870,
        income: { salary: 5400, freelance: 2800, interest: 41 },
        spend: { housing: 2150, food: 810, transport: 355, bills: 318, lifestyle: 890 },
        tx: tx([[1, 'Northwind Payroll', 'income', 'Checking ··42', 5400], [2, 'Copperleaf Apartments', 'housing', 'Checking ··42', -2150], [4, 'Greenbasket Market', 'food', 'Card ··07', -155.9], [10, 'Lumen Fiber', 'bills', 'Card ··07', -64.99], [12, 'Studio Arc · invoice', 'income', 'Checking ··42', 2800], [17, 'Northline Transit', 'transport', 'Card ··07', -92], [23, 'Atlas Outfitters', 'lifestyle', 'Card ··07', -214.3], [28, 'Ferro Coffee', 'food', 'Card ··07', -19.6, 'pending'], [30, 'Voltway Energy', 'bills', 'Checking ··42', -108.3, 'pending']]) }
    ]
  };

  var ICONS = {
    home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V19h12V9.5M10 19v-5h4v5"/>',
    food: '<path d="M4 11.5h16a8 8 0 0 1-16 0z"/><path d="M9.5 8c0-1.6 1.2-1.6 1.2-3.5M13.5 8c0-1.6 1.2-1.6 1.2-3.5"/>',
    car: '<path d="M4.5 15.5V12l2-5h11l2 5v3.5z"/><path d="M4.5 12h15M7.5 18.5v-3M16.5 18.5v-3"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    star: '<path d="M12 4l2.2 5 5.3.4-4 3.5 1.2 5.2L12 15.4l-4.7 2.7 1.2-5.2-4-3.5 5.3-.4z"/>'
  };

  /* ---------- helpers ---------- */
  function now() { return performance.now(); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function c01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function spring(t) { return t >= 1 ? 1 : 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-5.2 * t); }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bez(a, b, c, d, s) { var u = 1 - s; return u * u * u * a + 3 * u * u * s * b + 3 * u * s * s * c + s * s * s * d; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mount(root, opts) {
    if (!root) throw new Error('Delta.mount: element not found');
    if (root.__delta) return root.__delta;
    opts = opts || {};
    var D = opts.data || DATA, CUR = D.currency || '$';
    var months = D.months, idx = {};
    months.forEach(function (m, i) { idx[m.key] = i; });
    var cats = D.categories, srcs = D.sources;
    var rightNodes = cats.map(function (c) { return { name: c.name, color: c.color }; }).concat([{ name: D.savings.name, color: D.savings.color, savings: true }]);
    var alive = true, cleanups = [];
    var mi = idx[opts.month] != null ? idx[opts.month] : months.length - 1;
    var $ = function (s) { return root.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
    function money(v, dec) { var neg = v < 0; v = Math.abs(v); return (neg ? '−' : '') + CUR + v.toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); }
    function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); cleanups.push(function () { t.removeEventListener(ev, fn, o); }); }
    function tween(dur, fn, delay) {
      var t0 = now() + (delay || 0), h = { stop: false };
      if (reduce || dur <= 0) { fn(1); return h; }
      fn(0);
      (function f() { if (h.stop || !alive) return; var p = c01((now() - t0) / dur); fn(p); if (p < 1) requestAnimationFrame(f); })();
      return h;
    }

    function stats(i) {
      var m = months[i];
      var inc = 0, sp = 0, k;
      for (k in m.income) inc += m.income[k];
      for (k in m.spend) sp += m.spend[k];
      return { inc: inc, sp: sp, saved: inc - sp, rate: (inc - sp) / inc * 100, worth: m.worth, label: m.short };
    }
    var series = (D.history || []).map(function (h) { return { inc: h.income, sp: h.spend, saved: h.income - h.spend, rate: (h.income - h.spend) / h.income * 100, worth: h.worth, label: h.label }; })
      .concat(months.map(function (m, i) { return stats(i); }));
    var hOff = (D.history || []).length;
    function prev(i) { return series[hOff + i - 1] || null; }

    if (opts.theme) root.setAttribute('data-theme', opts.theme);
    if (!root.getAttribute('data-theme')) root.setAttribute('data-theme', 'dark');

    /* ---------- month switch ---------- */
    var mWrap = $('[data-dl-months]'), mInd = mWrap && mWrap.querySelector('.dl-months-ind'), indPos = null, indTw;
    function indTarget() {
      var b = mWrap.querySelector('[data-month="' + months[mi].key + '"]');
      return b ? { x: b.offsetLeft, w: b.offsetWidth } : null;
    }
    function moveInd(anim) {
      if (!mInd) return;
      var t = indTarget(); if (!t) return;
      if (!anim || !indPos) { indPos = t; mInd.style.transform = 'translateX(' + t.x + 'px)'; mInd.style.width = t.w + 'px'; return; }
      var from = { x: indPos.x, w: indPos.w };
      if (indTw) indTw.stop = true;
      indTw = tween(520, function (p) {
        var e = spring(p);
        indPos = { x: lerp(from.x, t.x, e), w: lerp(from.w, t.w, easeOut(p)) };
        mInd.style.transform = 'translateX(' + indPos.x + 'px)'; mInd.style.width = indPos.w + 'px';
      });
    }
    if (mWrap) {
      on(mWrap, 'click', function (e) { var b = e.target.closest('[data-month]'); if (b) api.setMonth(b.getAttribute('data-month')); });
      on(mWrap, 'keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        var n = c01((mi + (e.key === 'ArrowRight' ? 1 : -1)) / (months.length - 1)) * (months.length - 1);
        api.setMonth(months[Math.round(n)].key);
        var b = mWrap.querySelector('[data-month="' + months[mi].key + '"]'); if (b) b.focus();
        e.preventDefault();
      });
    }

    /* ---------- KPIs ---------- */
    var kpiDefs = {
      worth: { v: function (s) { return s.worth; }, f: function (v) { return money(v); }, d: function (s, p) { return pct(s.worth, p.worth); }, upGood: true },
      income: { v: function (s) { return s.inc; }, f: function (v) { return money(v); }, d: function (s, p) { return pct(s.inc, p.inc); }, upGood: true },
      spend: { v: function (s) { return s.sp; }, f: function (v) { return money(v); }, d: function (s, p) { return pct(s.sp, p.sp); }, upGood: false },
      saved: { v: function (s) { return s.saved; }, f: function (v) { return money(v); }, d: function (s, p) { return [s.rate - p.rate, ' pt']; }, upGood: true, note: function (s) { return s.rate.toFixed(1) + '% of income'; } }
    };
    function pct(a, b) { return [(a - b) / b * 100, '%']; }
    var kpis = $$('[data-dl-kpi]').map(function (card) {
      var key = card.getAttribute('data-dl-kpi');
      return { key: key, def: kpiDefs[key], val: card.querySelector('.dl-kpi-val'), delta: card.querySelector('.dl-delta'), dtext: card.querySelector('.dl-delta span'), note: card.querySelector('.dl-kpi-note'), spark: card.querySelector('.dl-spark'), shown: 0, dot: null };
    }).filter(function (k) { return k.def; });
    function buildSpark(k) {
      var s = k.spark; if (!s) return;
      s.innerHTML = '';
      var vals = series.map(k.def.v), mn = Math.min.apply(0, vals), mx = Math.max.apply(0, vals), r = mx - mn || 1;
      var pts = vals.map(function (v, i) { return [3 + i * (78 / (vals.length - 1)), 26 - (v - mn) / r * 21]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('');
      el('path', { d: d + 'L81,30L3,30Z', class: 'dl-spark-fill' }, s);
      el('path', { d: d }, s);
      k.pts = pts;
      k.dot = el('circle', { r: 2.8, cx: pts[hOff + mi][0], cy: pts[hOff + mi][1] }, s);
    }
    kpis.forEach(buildSpark);
    function updateKpis(anim) {
      var s = stats(mi), p = prev(mi);
      kpis.forEach(function (k, n) {
        var to = k.def.v(s), from = anim ? k.shown : to;
        tween(anim ? 950 : 0, function (q) { k.shown = lerp(from, to, easeOut(q)); k.val.textContent = k.def.f(k.shown); }, n * 70);
        if (p && k.delta) {
          var d = k.def.d(s, p), up = d[0] >= 0, good = up === k.def.upGood;
          k.delta.className = 'dl-delta ' + (good ? 'is-good' : 'is-bad') + (up ? '' : ' is-down');
          k.dtext.textContent = (up ? '+' : '−') + Math.abs(d[0]).toFixed(1) + d[1];
        }
        if (k.def.note && k.note) k.note.textContent = k.def.note(s);
        if (k.dot && k.pts) {
          var a = { x: +k.dot.getAttribute('cx'), y: +k.dot.getAttribute('cy') }, b = k.pts[hOff + mi];
          tween(anim ? 600 : 0, function (q) { var e = spring(q); k.dot.setAttribute('cx', lerp(a.x, b[0], e).toFixed(2)); k.dot.setAttribute('cy', lerp(a.y, b[1], e).toFixed(2)); }, n * 70);
        }
      });
    }

    /* ---------- the delta (sankey) ---------- */
    var flowBox = $('[data-dl-flow]'), F = null;
    var uid = 'dl' + Math.random().toString(36).slice(2, 7);
    function target(i) {
      var m = months[i], s = stats(i);
      return { src: srcs.map(function (x) { return m.income[x.key] || 0; }), cat: cats.map(function (c) { return m.spend[c.key] || 0; }).concat([Math.max(0, s.saved)]) };
    }
    var maxTotal = Math.max.apply(0, months.map(function (m, i) { return stats(i).inc; }));
    function buildFlow() {
      if (!flowBox) return;
      flowBox.innerHTML = '';
      var svg = el('svg', { role: 'group', 'aria-label': 'Money flow from income sources to spending and savings' }, flowBox);
      var defs = el('defs', null, svg);
      var hg = el('linearGradient', { id: uid + 'hub', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#3B5BFF' }, hg); el('stop', { offset: 1, 'stop-color': '#22C3EE' }, hg);
      var sg = el('linearGradient', { id: uid + 'surge', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      [[0, 0], [.45, .38], [.62, .62], [1, 0]].forEach(function (s) { el('stop', { offset: s[0], 'stop-color': '#d8f4ff', 'stop-opacity': s[1] }, sg); });
      var clip = el('clipPath', { id: uid + 'clip' }, defs);
      var gR = el('g', null, svg), gS = el('g', { 'clip-path': 'url(#' + uid + 'clip)' }, svg);
      var surge = el('rect', { class: 'dl-surge', y: 0, height: 0, width: 0, x: -9999, fill: 'url(#' + uid + 'surge)' }, gS);
      var gP = el('g', { class: 'dl-particles', 'aria-hidden': 'true' }, svg), gN = el('g', null, svg), gL = el('g', { 'aria-hidden': 'true' }, svg);
      var ribbons = [], clips = [], R = rng(7);
      function ribbon(kind, i, c0, c1) {
        var g = el('linearGradient', { id: uid + 'r' + kind + i, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
        el('stop', { offset: 0, 'stop-color': c0 }, g); el('stop', { offset: 1, 'stop-color': c1 }, g);
        var p = el('path', { class: 'dl-ribbon', fill: 'url(#' + uid + 'r' + kind + i + ')', tabindex: 0, role: 'img' }, gR);
        clips.push(el('path', null, clip));
        var share = Math.max.apply(0, months.map(function (m, mm) { var t = target(mm); return (kind === 'l' ? t.src[i] : t.cat[i]) / stats(mm).inc; }));
        var n = Math.max(2, Math.min(16, Math.round(share * 46))), parts = [];
        for (var j = 0; j < n; j++) parts.push({ s: R(), lane: (R() - .5) * .74, sp: .15 + R() * .09, c: el('circle', { r: (1.1 + R() * 1.2).toFixed(2), cx: -50, cy: -50 }, gP) });
        var rb = { kind: kind, i: i, path: p, parts: parts };
        ribbons.push(rb);
        on(p, 'pointerenter', function () { hot(rb, true); });
        on(p, 'pointermove', function (e) { var b = flowBox.getBoundingClientRect(), sx = flowBox.offsetWidth / b.width || 1; tipAt((e.clientX - b.left) * sx, (e.clientY - b.top) * sx); });
        on(p, 'pointerleave', function () { hot(rb, false); });
        on(p, 'focus', function () { hot(rb, true); var g2 = F.geo.rib[ribbons.indexOf(rb)]; tipAt((g2.x0 + g2.x1) / 2, (g2.y0 + g2.y1) / 2 + g2.w / 2); });
        on(p, 'blur', function () { hot(rb, false); });
        return rb;
      }
      srcs.forEach(function (s, i) { ribbon('l', i, s.color, '#3B5BFF'); });
      rightNodes.forEach(function (c, i) { ribbon('r', i, '#22C3EE', c.color); });
      var nodesL = srcs.map(function (s) { return el('rect', { class: 'dl-node', fill: s.color, width: 10, rx: 3 }, gN); });
      var hub = el('rect', { fill: 'url(#' + uid + 'hub)', width: 14, rx: 4 }, gN);
      var nodesR = rightNodes.map(function (c) { return el('rect', { class: 'dl-node', fill: c.color, width: 10, rx: 3 }, gN); });
      function label(name) { var t = el('text', { class: 'dl-lbl' }, gL); var a = el('tspan', null, t); a.textContent = name; var b = el('tspan', { class: 'dl-v' }, t); return { t: t, a: a, b: b }; }
      var lblL = srcs.map(function (s) { return label(s.name); }), lblR = rightNodes.map(function (c) { return label(c.name); });
      var hubLbl = el('text', { class: 'dl-lbl dl-lbl-hub', 'text-anchor': 'middle' }, gL); hubLbl.textContent = 'Income';
      var tip = document.createElement('div'); tip.className = 'dl-tip'; tip.setAttribute('aria-hidden', 'true'); flowBox.appendChild(tip);
      F = { svg: svg, ribbons: ribbons, clips: clips, surge: surge, nodesL: nodesL, nodesR: nodesR, hub: hub, lblL: lblL, lblR: lblR, hubLbl: hubLbl, tip: tip, vals: F ? F.vals : { src: srcs.map(function () { return 0; }), cat: rightNodes.map(function () { return 0; }) } };
      sizeFlow();
    }
    function hot(rb, yes) {
      flowBox.classList.toggle('is-dim', yes);
      F.ribbons.forEach(function (r) { r.path.classList.toggle('is-hot', yes && r === rb); });
      if (!yes) { F.tip.classList.remove('is-on'); return; }
      var t = target(mi), s = stats(mi), v, name;
      if (rb.kind === 'l') { v = t.src[rb.i]; name = srcs[rb.i].name + ' → Income'; }
      else { v = t.cat[rb.i]; name = 'Income → ' + rightNodes[rb.i].name; }
      var extra = rb.kind === 'r' && cats[rb.i] && cats[rb.i].budget ? ' · budget ' + money(cats[rb.i].budget) : '';
      F.tip.innerHTML = '<small>' + esc(name) + '</small><b>' + money(v) + '</b><small>' + (v / s.inc * 100).toFixed(1) + '% of income' + esc(extra) + '</small>';
      F.tip.classList.add('is-on');
    }
    function tipAt(x, y) {
      var w = flowBox.clientWidth, tw = F.tip.offsetWidth;
      F.tip.style.left = Math.max(tw / 2 + 4, Math.min(w - tw / 2 - 4, x)) + 'px';
      F.tip.style.top = Math.max(F.tip.offsetHeight + 16, y) + 'px';
    }
    function sizeFlow() {
      if (!F) return;
      F.W = flowBox.clientWidth || 600; F.H = flowBox.clientHeight || 300;
      F.svg.setAttribute('viewBox', '0 0 ' + F.W + ' ' + F.H);
      F.gap = F.H < 290 ? 8 : 10; F.pad = 16;
      F.k = (F.H - 2 * F.pad - (rightNodes.length - 1) * F.gap) / maxTotal;
      F.out = F.W >= 600;
      F.svg.classList.toggle('is-compact', !F.out);
      renderFlow(F.vals);
    }
    function layoutCol(vals, gap, H, k) {
      var tot = sum(vals) * k + (vals.length - 1) * gap, y = (H - tot) / 2, out = [];
      vals.forEach(function (v) { var h = v * k; out.push({ y: y, h: h }); y += h + gap; });
      return out;
    }
    function band(x0, y0, x1, y1, w) {
      var xm = (x0 + x1) / 2, f = function (n) { return n.toFixed(2); };
      return 'M' + f(x0) + ',' + f(y0) + 'C' + f(xm) + ',' + f(y0) + ' ' + f(xm) + ',' + f(y1) + ' ' + f(x1) + ',' + f(y1) +
        'L' + f(x1) + ',' + f(y1 + w) + 'C' + f(xm) + ',' + f(y1 + w) + ' ' + f(xm) + ',' + f(y0 + w) + ' ' + f(x0) + ',' + f(y0 + w) + 'Z';
    }
    function spread(cs, min, H) {
      for (var i = 1; i < cs.length; i++) cs[i] = Math.max(cs[i], cs[i - 1] + min);
      var lim = H - 14;
      if (cs[cs.length - 1] > lim) { cs[cs.length - 1] = lim; for (i = cs.length - 2; i >= 0; i--) cs[i] = Math.min(cs[i], cs[i + 1] - min); }
      if (cs[0] < 14) { var d = 14 - cs[0]; for (i = 0; i < cs.length; i++) cs[i] += d; }
      return cs;
    }
    function renderFlow(vals) {
      if (!F) return;
      F.vals = vals;
      var W = F.W, H = F.H, k = F.k, nw = 10, hw = 14;
      var xL = F.out ? 118 : 2, xR = F.out ? W - 132 : W - 92, xH = Math.round((xL + nw + xR) / 2 - hw / 2);
      var L = layoutCol(vals.src, F.gap * 2.2, H, k), Rn = layoutCol(vals.cat, F.gap, H, k);
      var Ls = sum(vals.src) * k, Rs = sum(vals.cat) * k, hubH = Math.max(Ls, Rs), hubY = (H - hubH) / 2;
      var geo = { rib: [], hub: { x: xH, y: hubY, h: hubH } };
      var yl = hubY + (hubH - Ls) / 2, yr = hubY + (hubH - Rs) / 2;
      L.forEach(function (n, i) { geo.rib.push({ x0: xL + nw, y0: n.y, x1: xH, y1: yl, w: n.h }); yl += n.h; });
      Rn.forEach(function (n, i) { geo.rib.push({ x0: xH + hw, y0: yr, x1: xR, y1: n.y, w: n.h }); yr += n.h; });
      F.geo = geo;
      geo.rib.forEach(function (g, i) {
        var d = g.w > .05 ? band(g.x0, g.y0, g.x1, g.y1, g.w) : '';
        F.ribbons[i].path.setAttribute('d', d); F.clips[i].setAttribute('d', d);
      });
      L.forEach(function (n, i) { var r = F.nodesL[i]; r.setAttribute('x', xL); r.setAttribute('y', n.y.toFixed(2)); r.setAttribute('height', Math.max(n.h, vals.src[i] > 0 ? 2 : 0).toFixed(2)); });
      Rn.forEach(function (n, i) { var r = F.nodesR[i]; r.setAttribute('x', xR); r.setAttribute('y', n.y.toFixed(2)); r.setAttribute('height', Math.max(n.h, vals.cat[i] > 0 ? 2 : 0).toFixed(2)); });
      F.hub.setAttribute('x', xH); F.hub.setAttribute('y', hubY.toFixed(2)); F.hub.setAttribute('height', Math.max(hubH, 0).toFixed(2));
      F.hubLbl.setAttribute('x', xH + hw / 2); F.hubLbl.setAttribute('y', Math.max(11, hubY - 8).toFixed(1));
      F.hubLbl.style.opacity = hubH > 4 ? 1 : 0;
      function place(lbls, nodes, vs, x, anchor) {
        var cs = spread(nodes.map(function (n) { return n.y + n.h / 2; }), 31, H);
        lbls.forEach(function (l, i) {
          l.t.setAttribute('text-anchor', anchor);
          l.a.setAttribute('x', x); l.a.setAttribute('y', (cs[i] - 3).toFixed(1));
          l.b.setAttribute('x', x); l.b.setAttribute('y', (cs[i] + 12).toFixed(1));
          l.b.textContent = money(vs[i]);
        });
      }
      if (F.out) { place(F.lblL, L, vals.src, xL - 9, 'end'); place(F.lblR, Rn, vals.cat, xR + nw + 9, 'start'); }
      else { place(F.lblL, L, vals.src, xL + nw + 6, 'start'); place(F.lblR, Rn, vals.cat, xR + nw + 7, 'start'); }
    }
    function labelRibbons() {
      if (!F) return;
      var t = target(mi);
      F.ribbons.forEach(function (rb) {
        var v = rb.kind === 'l' ? t.src[rb.i] : t.cat[rb.i];
        rb.path.setAttribute('aria-label', (rb.kind === 'l' ? srcs[rb.i].name + ' to income: ' : 'Income to ' + rightNodes[rb.i].name + ': ') + money(v));
      });
    }
    var morph = null, surgeAt = -1e9, boostAt = -1e9;
    function flowTo(i, fromZero) {
      if (!F) return;
      var to = target(i), from = fromZero ? { src: to.src.map(function () { return 0; }), cat: to.cat.map(function () { return 0; }) } : { src: F.vals.src.slice(), cat: F.vals.cat.slice() };
      labelRibbons();
      if (reduce) { renderFlow(to); return; }
      morph = { from: from, to: to, t0: now(), dur: fromZero ? 1500 : 1250 };
      surgeAt = now() + (fromZero ? 250 : 0); boostAt = now();
    }
    function frame() {
      if (!alive) return;
      requestAnimationFrame(frame);
      if (!F || reduce) return;
      var t = now();
      if (morph) {
        var p = (t - morph.t0) / morph.dur, el1 = spring(c01(p / .7)), er = spring(c01((p - .24) / .76));
        renderFlow({ src: morph.from.src.map(function (a, i) { return Math.max(0, lerp(a, morph.to.src[i], el1)); }), cat: morph.from.cat.map(function (a, i) { return Math.max(0, lerp(a, morph.to.cat[i], er)); }) });
        if (p >= 1) { renderFlow(morph.to); morph = null; }
      }
      // light surge sweeping through every stream
      var sp = (t - surgeAt) / 1150, sw = F.W * .34;
      if (sp >= 0 && sp <= 1) { var e = easeInOut(sp); F.surge.setAttribute('x', (-sw + e * (F.W + sw)).toFixed(1)); F.surge.setAttribute('width', sw.toFixed(1)); F.surge.setAttribute('height', F.H); }
      else F.surge.setAttribute('x', -9999);
      // particles riding the streams
      var dt = Math.min(.05, F.last ? (t - F.last) / 1000 : 0); F.last = t;
      var boost = 1 + 3.4 * Math.exp(-(t - boostAt) / 650);
      F.ribbons.forEach(function (rb, n) {
        var g = F.geo && F.geo.rib[n];
        rb.parts.forEach(function (q) {
          q.s += q.sp * boost * dt; if (q.s > 1) q.s -= 1;
          if (!g || g.w < 1.6) { q.c.setAttribute('opacity', 0); return; }
          var lane = g.w * (.5 + q.lane), xm = (g.x0 + g.x1) / 2;
          q.c.setAttribute('cx', bez(g.x0, xm, xm, g.x1, q.s).toFixed(1));
          q.c.setAttribute('cy', bez(g.y0 + lane, g.y0 + lane, g.y1 + lane, g.y1 + lane, q.s).toFixed(1));
          q.c.setAttribute('opacity', (Math.pow(Math.sin(Math.PI * q.s), .6) * Math.min(1, .55 + (boost - 1) * .3)).toFixed(2));
        });
      });
    }

    /* ---------- budgets ---------- */
    var bList = $('[data-dl-budgets]'), bRows = [];
    if (bList) {
      bList.innerHTML = '';
      cats.forEach(function (c) {
        if (!c.budget) return;
        var li = document.createElement('li'); li.style.setProperty('--c', c.color);
        li.innerHTML = '<svg class="dl-ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[c.icon] || ICONS.star) + '</svg>' +
          '<span class="dl-b-name">' + esc(c.name) + '<span class="dl-over">OVER</span></span><span class="dl-b-amt"><b>' + money(0) + '</b> of ' + money(c.budget) + '</span>' +
          '<div class="dl-b-track" role="progressbar" aria-label="' + esc(c.name) + ' budget used" aria-valuemin="0" aria-valuemax="100"><i></i></div>';
        bList.appendChild(li);
        bRows.push({ c: c, li: li, amt: li.querySelector('.dl-b-amt b'), bar: li.querySelector('.dl-b-track i'), track: li.querySelector('.dl-b-track'), shown: 0, w: 0 });
      });
    }
    function updateBudgets(anim) {
      var m = months[mi], over = 0, left = 0, s = stats(mi);
      bRows.forEach(function (r, n) {
        var spent = m.spend[r.c.key] || 0, isOver = spent > r.c.budget, w = Math.min(1, spent / r.c.budget) * 100, fa = r.shown, fw = r.w;
        if (isOver) over++;
        left += r.c.budget - spent;
        r.track.setAttribute('aria-valuenow', Math.round(spent / r.c.budget * 100));
        tween(anim ? 900 : 0, function (q) {
          var e = spring(q);
          r.w = lerp(fw, w, e); r.bar.style.width = Math.max(0, Math.min(100, r.w)) + '%';
          r.shown = lerp(fa, spent, easeOut(q)); r.amt.textContent = money(r.shown);
          if (q >= .5 || !anim) r.li.classList.toggle('is-over', isOver);
        }, anim ? n * 70 : 0);
      });
      var note = $('[data-dl-budget-note]');
      if (note) note.textContent = m.label + ' · ' + (over ? over + ' over budget' : 'all ' + bRows.length + ' on track');
      var lf = $('[data-dl-left]'); if (lf) { lf.textContent = left >= 0 ? money(left) : 'Over ' + money(-left); lf.style.color = left >= 0 ? '' : 'var(--delta-bad)'; }
      var pd = $('[data-dl-perday]'); if (pd) pd.textContent = money(s.sp / (m.days || 30));
    }

    /* ---------- six-month bars ---------- */
    var barsBox = $('[data-dl-bars]'), B = null, barsP = 1, hlPos = hOff + mi;
    function buildBars() {
      if (!barsBox) return;
      barsBox.innerHTML = '';
      var W = barsBox.clientWidth || 360, H = barsBox.clientHeight || 236, pl = 38, pb = 26, pt = 12, n = series.length;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': 'Income, spending and savings for the last six months' }, barsBox);
      var defs = el('defs', null, svg), g = el('linearGradient', { id: uid + 'bar', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: 0, 'stop-color': '#22C3EE' }, g); el('stop', { offset: 1, 'stop-color': '#3B5BFF' }, g);
      var top = Math.ceil(Math.max.apply(0, series.map(function (s) { return s.inc; })) / 3000) * 3000, ch = H - pb - pt;
      var y = function (v) { return pt + ch - v / top * ch; };
      for (var t = 0; t <= top; t += 3000) {
        el('line', { class: 'dl-gridline', x1: pl, x2: W, y1: y(t), y2: y(t) }, svg);
        el('text', { class: 'dl-axis', x: pl - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent = t ? CUR + t / 1000 + 'k' : CUR + '0';
      }
      var gw = (W - pl) / n, bw = Math.max(6, Math.min(16, gw * .22));
      var hl = el('rect', { class: 'dl-col-hl', y: pt - 6, height: ch + 6 + pb, width: gw - 6, rx: 12 }, svg);
      svg.insertBefore(hl, svg.firstChild.nextSibling);
      var bars = series.map(function (s, i) {
        var cx = pl + gw * i + gw / 2;
        return { cx: cx, s: s, a: el('rect', { class: 'dl-bar-in', x: cx - bw - 2, width: bw, rx: Math.min(4, bw / 2), fill: 'url(#' + uid + 'bar)' }, svg), b: el('rect', { class: 'dl-bar-out', x: cx + 2, width: bw, rx: Math.min(4, bw / 2) }, svg) };
      });
      var pts = series.map(function (s, i) { return [bars[i].cx, y(s.saved)]; });
      var net = el('path', { class: 'dl-net', d: pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('') }, svg);
      var dots = pts.map(function (p) { return el('circle', { class: 'dl-net-dot', cx: p[0], cy: p[1], r: 3.4 }, svg); });
      var xl = series.map(function (s, i) { var tx = el('text', { class: 'dl-xlbl', x: bars[i].cx, y: H - 6, 'text-anchor': 'middle' }, svg); tx.textContent = s.label; return tx; });
      series.forEach(function (s, i) {
        var mIdx = i - hOff, hit = el('rect', { class: 'dl-hit', x: pl + gw * i + 3, y: pt - 6, width: gw - 6, height: ch + 6 + pb, rx: 12 }, svg);
        var lab = s.label + ': in ' + money(s.inc) + ', out ' + money(s.sp) + ', saved ' + money(s.saved);
        if (mIdx >= 0) {
          hit.setAttribute('tabindex', 0); hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', 'Open ' + lab);
          var go = function () { api.setMonth(months[mIdx].key); };
          on(hit, 'click', go);
          on(hit, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        } else { hit.setAttribute('role', 'img'); hit.setAttribute('aria-label', lab); hit.setAttribute('aria-disabled', 'true'); }
      });
      var len = net.getTotalLength ? net.getTotalLength() : 600;
      net.style.strokeDasharray = len;
      B = { y: y, bars: bars, net: net, dots: dots, len: len, hl: hl, gw: gw, pl: pl, xl: xl, base: y(0) };
      drawBars();
    }
    function drawBars() {
      if (!B) return;
      B.bars.forEach(function (b, i) {
        var e = easeOut(c01(barsP * 1.5 - i * .1)), hi = (B.base - B.y(b.s.inc)) * e, ho = (B.base - B.y(b.s.sp)) * e;
        b.a.setAttribute('y', (B.base - hi).toFixed(1)); b.a.setAttribute('height', Math.max(0, hi).toFixed(1));
        b.b.setAttribute('y', (B.base - ho).toFixed(1)); b.b.setAttribute('height', Math.max(0, ho).toFixed(1));
      });
      var lp = c01((barsP - .35) / .65);
      B.net.style.strokeDashoffset = (B.len * (1 - easeInOut(lp))).toFixed(1);
      B.dots.forEach(function (d, i) { d.style.opacity = lp * (B.dots.length) > i ? 1 : 0; });
      B.hl.setAttribute('x', (B.pl + B.gw * hlPos + 3).toFixed(1));
      B.xl.forEach(function (x, i) { x.classList.toggle('is-on', i === hOff + mi); });
    }
    function updateBars(anim) {
      var from = hlPos, to = hOff + mi;
      tween(anim ? 600 : 0, function (q) { hlPos = lerp(from, to, spring(q)); drawBars(); });
    }

    /* ---------- table ---------- */
    var tbody = $('[data-dl-table] tbody'), sort = { key: 'day', dir: -1 }, query = '';
    var catBy = {}; cats.forEach(function (c) { catBy[c.key] = c; });
    function initials(n) { return n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
    function renderTable(anim) {
      if (!tbody) return;
      var m = months[mi];
      var rows = m.tx.filter(function (t) {
        if (!query) return true;
        var c = t.cat === 'income' ? 'income' : (catBy[t.cat] || {}).name || '';
        return (t.name + ' ' + t.account + ' ' + c).toLowerCase().indexOf(query) > -1;
      }).sort(function (a, b) { return (a[sort.key] - b[sort.key]) * sort.dir || (b.day - a.day); });
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" class="dl-empty">No transactions match “' + esc(query) + '”</td></tr>'; return; }
      tbody.innerHTML = rows.map(function (t) {
        var inc = t.amount > 0, c = inc ? { name: 'Income', color: '#19C37D' } : catBy[t.cat] || { name: t.cat, color: '#8F95A6' };
        return '<tr><td><div class="dl-merch"><i style="--c:' + c.color + '">' + initials(t.name) + '</i><div>' + esc(t.name) + '<small>' + esc(c.name) + '</small></div></div></td>' +
          '<td class="dl-col-cat">' + esc(t.account) + '</td><td>' + m.short + ' ' + t.day + '</td>' +
          '<td class="dl-col-status"><span class="dl-pill" data-s="' + t.status + '">' + (t.status === 'pending' ? 'Pending' : 'Cleared') + '</span></td>' +
          '<td class="dl-r"><span class="dl-amt' + (inc ? ' is-in' : '') + '">' + (inc ? '+' : '') + money(t.amount, 2) + '</span></td></tr>';
      }).join('');
      if (anim && !reduce) {
        Array.prototype.forEach.call(tbody.rows, function (r, n) {
          tween(420, function (q) { var e = easeOut(q); r.style.opacity = e; r.style.transform = 'translateY(' + ((1 - e) * 8).toFixed(1) + 'px)'; }, 180 + n * 45);
        });
      }
    }
    var search = $('[data-dl-search]');
    if (search) on(search, 'input', function () { query = search.value.trim().toLowerCase(); renderTable(false); });
    $$('[data-dl-table] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () {
        var th = b.parentNode, key = th.getAttribute('data-sort');
        sort = { key: key, dir: sort.key === key ? -sort.dir : -1 };
        $$('[data-dl-table] th[data-sort]').forEach(function (h) { h.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', sort.dir > 0 ? 'ascending' : 'descending');
        renderTable(false);
      });
    });
    var thDay = $('[data-dl-table] th[data-sort="day"]'); if (thDay) thDay.setAttribute('aria-sort', 'descending');

    /* ---------- theme + drawer ---------- */
    var themeBtn = $('[data-dl-theme]');
    function syncTheme() {
      var light = root.getAttribute('data-theme') === 'light';
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', light); themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme'); }
    }
    if (themeBtn) on(themeBtn, 'click', function () { api.setTheme(); });
    var menuBtn = $('[data-dl-menu]'), scrim = $('.dl-scrim');
    if (menuBtn) on(menuBtn, 'click', function () { api.openMenu(!root.classList.contains('is-open')); });
    if (scrim) on(scrim, 'click', function () { api.openMenu(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) { api.openMenu(false); if (menuBtn) menuBtn.focus(); } });

    /* ---------- resize ---------- */
    var ro = null, lastW = -1, lastBH = -1;
    function onResize() {
      var w = root.clientWidth, bh = barsBox ? barsBox.clientHeight : 0; if (w === lastW && bh === lastBH) return; lastW = w; lastBH = bh;
      sizeFlow(); buildBars(); moveInd(false);
    }
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(root); if (barsBox) ro.observe(barsBox); } else on(window, 'resize', onResize);

    /* ---------- API ---------- */
    function apply(anim, intro) {
      $$('[data-month]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-month') === months[mi].key); });
      $$('[data-dl-month-label]').forEach(function (s) { s.textContent = months[mi].label; });
      var s = stats(mi);
      [['in', s.inc], ['out', s.sp], ['kept', s.saved]].forEach(function (f, n) {
        var e2 = $('[data-dl-foot="' + f[0] + '"]'); if (!e2) return;
        var from = anim ? (e2.__v || 0) : f[1];
        tween(anim ? 900 : 0, function (q) { e2.__v = lerp(from, f[1], easeOut(q)); e2.textContent = money(e2.__v); }, 120 + n * 80);
      });
      moveInd(anim); updateKpis(anim); updateBudgets(anim); updateBars(anim); renderTable(anim);
      flowTo(mi, intro);
    }
    var api = {
      setMonth: function (key) {
        if (idx[key] == null || idx[key] === mi) return api;
        mi = idx[key]; apply(true, false);
        root.dispatchEvent(new CustomEvent('delta:month', { detail: { month: key } }));
        return api;
      },
      getMonth: function () { return months[mi].key; },
      setTheme: function (t) {
        var next = t || (root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        root.setAttribute('data-theme', next); syncTheme();
        if (opts.onTheme) opts.onTheme(next);
        return api;
      },
      replay: function () {
        kpis.forEach(function (k) { k.shown = 0; });
        bRows.forEach(function (r) { r.shown = 0; r.w = 0; });
        $$('[data-dl-foot]').forEach(function (e2) { e2.__v = 0; });
        barsP = 0; tween(1400, function (q) { barsP = q; drawBars(); }, 150);
        apply(true, true);
        return api;
      },
      pulse: function () { surgeAt = now(); boostAt = now(); return api; },
      openMenu: function (open) {
        root.classList.toggle('is-open', !!open);
        if (menuBtn) { menuBtn.setAttribute('aria-expanded', !!open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
        return api;
      },
      destroy: function () { alive = false; if (ro) ro.disconnect(); cleanups.forEach(function (f) { f(); }); delete root.__delta; },
      el: root
    };
    root.__delta = api;

    renderTable(false); buildFlow(); buildBars(); syncTheme();
    lastW = root.clientWidth; lastBH = barsBox ? barsBox.clientHeight : 0;
    var avg = $('[data-dl-avg]'), best = $('[data-dl-best]');
    if (avg) avg.textContent = money(sum(series.map(function (s) { return s.saved; })) / series.length);
    if (best) { var bs = series.reduce(function (a, b) { return b.rate > a.rate ? b : a; }); best.textContent = bs.label + ' · ' + Math.round(bs.rate) + '%'; }
    api.replay();
    requestAnimationFrame(frame);
    return api;
  }

  window.Delta = { mount: mount, data: DATA, version: '1.0.0' };
  function auto() { Array.prototype.forEach.call(document.querySelectorAll('[data-delta]:not([data-delta-manual])'), function (e) { mount(e); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
