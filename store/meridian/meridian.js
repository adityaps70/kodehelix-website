/* Meridian — SaaS revenue dashboard template · Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Hand-drawn SVG charts, no libraries. Switching the date range re-writes every chart with a
   left-to-right wave while a light beam scans across the revenue chart.
   Usage:
     <div class="meridian" data-meridian> …markup from index.html… </div>
     const dash = Meridian.mount(el, { range: '30d', data: myData });
     dash.setRange('90d'); dash.setTheme('light'); dash.replay();
   Elements with data-meridian auto-mount on DOMContentLoaded unless data-meridian-manual is set. */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var N = 96;                       // resampled points per revenue line (keeps morphs smooth)
  var mq = global.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var now = function () { return performance.now(); };
  var uid = 0;

  /* ---------- formatting ---------- */
  var fmt = {
    money: function (v) { return '$' + Math.round(v).toLocaleString('en-US'); },
    money2: function (v) { return '$' + v.toFixed(2); },
    int: function (v) { return Math.round(v).toLocaleString('en-US'); },
    pct: function (v) { return v.toFixed(1) + '%'; },
    short: function (v) {
      if (v >= 1e6) return '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
      if (v >= 1e3) return '$' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
      return '$' + Math.round(v);
    }
  };

  /* ---------- demo data (replace with your own via options.data) ---------- */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function gen(n, a, b, wob, seed, total) {
    var r = rng(seed), out = [], s = 0, i;
    for (i = 0; i < n; i++) {
      var t = n > 1 ? i / (n - 1) : 0;
      var v = (a + (b - a) * t) * (1 + Math.sin(i * 1.9 + seed) * wob * .55 + (r() - .5) * wob);
      out.push(v); s += v;
    }
    return out.map(function (v) { return v * total / s; });
  }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function days(count, step) {
    var out = [], end = new Date(2026, 9, 30), i;
    for (i = count - 1; i >= 0; i--) { var d = new Date(end); d.setDate(end.getDate() - i * step); out.push(MON[d.getMonth()] + ' ' + d.getDate()); }
    return out;
  }
  function range(cfg) {
    return {
      label: cfg.label, labels: cfg.labels,
      current: gen(cfg.labels.length, 1, cfg.grow, cfg.wob, cfg.seed, cfg.kpi.revenue[0]),
      previous: gen(cfg.labels.length, 1, cfg.grow * .9, cfg.wob, cfg.seed + 7, cfg.kpi.revenue[0] / (1 + cfg.kpi.revenue[1] / 100)),
      kpi: cfg.kpi, plans: cfg.plans, paying: cfg.paying, channels: cfg.channels,
      sparks: {
        revenue: gen(12, 1, 1 + cfg.kpi.revenue[1] / 60, .12, cfg.seed + 1, 12),
        subs: gen(12, 1, 1 + cfg.kpi.subs[1] / 60, .16, cfg.seed + 2, 12),
        churn: gen(12, 1, 1 + cfg.kpi.churn[1] / 3, .14, cfg.seed + 3, 12),
        arpu: gen(12, 1, 1 + cfg.kpi.arpu[1] / 40, .08, cfg.seed + 4, 12)
      }
    };
  }
  var DEMO = {
    '7d': range({ label: 'last 7 days', labels: days(7, 1), grow: 1.12, wob: .16, seed: 11, paying: 2904,
      kpi: { revenue: [32480, 6.2], subs: [184, 9.1], churn: [1.8, -0.3], arpu: [48.2, 2.4] },
      plans: [18, 38, 29, 15], channels: [64, 41, 38, 24, 17] }),
    '30d': range({ label: 'last 30 days', labels: days(30, 1), grow: 1.22, wob: .2, seed: 23, paying: 2871,
      kpi: { revenue: [138920, 11.4], subs: [742, 7.8], churn: [2.1, -0.4], arpu: [47.6, 3.1] },
      plans: [17, 37, 30, 16], channels: [262, 171, 148, 96, 65] }),
    '90d': range({ label: 'last 90 days', labels: days(13, 7), grow: 1.38, wob: .12, seed: 37, paying: 2690,
      kpi: { revenue: [398150, 18.9], subs: [2106, 12.6], churn: [2.4, 0.2], arpu: [46.1, 4.0] },
      plans: [20, 36, 28, 16], channels: [720, 482, 431, 276, 197] }),
    '12m': range({ label: 'last 12 months', labels: MON.slice(10).concat(MON.slice(0, 10)), grow: 1.75, wob: .07, seed: 41, paying: 2312,
      kpi: { revenue: [1462300, 42.7], subs: [8214, 31.5], churn: [2.6, -0.9], arpu: [44.8, 9.6] },
      plans: [24, 35, 26, 15], channels: [2790, 1905, 1640, 1102, 777] })
  };
  var KPI = {
    revenue: { f: fmt.money, unit: '%' }, subs: { f: fmt.int, unit: '%' },
    churn: { f: fmt.pct, unit: ' pt', lowerIsBetter: true }, arpu: { f: fmt.money2, unit: '%' }
  };

  /* ---------- helpers ---------- */
  function svg(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function resample(a, n) {
    var m = a.length, out = new Array(n), j;
    if (m === 1) { for (j = 0; j < n; j++) out[j] = a[0]; return out; }
    for (j = 0; j < n; j++) {
      var t = j / (n - 1) * (m - 1), i = Math.floor(t), f = t - i;
      if (i >= m - 1) { out[j] = a[m - 1]; continue; }
      var p0 = a[Math.max(0, i - 1)], p1 = a[i], p2 = a[i + 1], p3 = a[Math.min(m - 1, i + 2)];
      out[j] = .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
    }
    return out;
  }
  function niceMax(v) {
    var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wave(p, i, n, spread) { return easeIO(clamp((p - spread * i / Math.max(1, n - 1)) / (1 - spread))); }

  /* one animation runner per instance, so a new range cancels the previous morph */
  function Runner() {
    var id = 0;
    return function run(dur, fn, done) {
      var my = ++id, t0 = now();
      if (mq.matches || dur <= 0) { fn(1); if (done) done(); return; }
      (function f() {
        if (my !== id) return;
        var p = clamp((now() - t0) / dur);
        fn(p);
        if (p < 1) requestAnimationFrame(f); else if (done) done();
      })();
    };
  }

  /* ---------- revenue chart ---------- */
  function RevenueChart(box, root) {
    var id = 'mr' + (++uid);
    var s = svg('svg', { 'aria-hidden': 'true' }, box);
    var defs = svg('defs', {}, s);
    var lg = svg('linearGradient', { id: id + 'l', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    svg('stop', { offset: 0, 'stop-color': 'var(--mr-blue)', style: 'stop-color:var(--mr-blue)' }, lg);
    svg('stop', { offset: 1, 'stop-color': 'var(--mr-cyan)', style: 'stop-color:var(--mr-cyan)' }, lg);
    var ag = svg('linearGradient', { id: id + 'a', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    svg('stop', { offset: 0, style: 'stop-color:var(--mr-blue);stop-opacity:.34' }, ag);
    svg('stop', { offset: 1, style: 'stop-color:var(--mr-blue);stop-opacity:0' }, ag);
    var bg = svg('linearGradient', { id: id + 'b', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    svg('stop', { offset: 0, style: 'stop-color:var(--mr-cyan);stop-opacity:0' }, bg);
    svg('stop', { offset: .5, style: 'stop-color:var(--mr-cyan);stop-opacity:.32' }, bg);
    svg('stop', { offset: 1, style: 'stop-color:var(--mr-cyan);stop-opacity:0' }, bg);
    var cp = svg('clipPath', { id: id + 'c' }, defs);
    var clipRect = svg('rect', { x: 0, y: -20, width: 0, height: 2000 }, cp);
    var gGrid = svg('g', {}, s), gY = svg('g', {}, s), gX = svg('g', {}, s);
    var gPlot = svg('g', { 'clip-path': 'url(#' + id + 'c)' }, s);
    var area = svg('path', { fill: 'url(#' + id + 'a)' }, gPlot);
    var prev = svg('path', { class: 'mr-prev' }, gPlot);
    var line = svg('path', { class: 'mr-line', stroke: 'url(#' + id + 'l)' }, gPlot);
    var beam = svg('rect', { y: 0, width: 90, fill: 'url(#' + id + 'b)', opacity: 0 }, s);
    var cross = svg('line', { class: 'mr-crosshair', opacity: 0 }, s);
    var halo = svg('circle', { r: 6, fill: 'none', style: 'stroke:var(--mr-cyan)', 'stroke-width': 2, opacity: 0 }, s);
    var head = svg('circle', { r: 4.5, style: 'fill:var(--mr-cyan);stroke:var(--mr-surface)', 'stroke-width': 2.5 }, s);
    var hov = svg('circle', { r: 5, style: 'fill:var(--mr-surface);stroke:var(--mr-cyan)', 'stroke-width': 2.5, opacity: 0 }, s);
    var tip = document.createElement('div'); tip.className = 'mr-tip'; box.appendChild(tip);

    var W = 0, H = 0, PL = 48, PR = 14, PT = 10, PB = 28;
    var cur = [], prv = [], max = 1, data = null, labelsOld = null, labelAlpha = 1, reveal = 1, beamAt = -1, hover = -1;

    function X(f) { return PL + f * (W - PL - PR); }
    function Y(v) { return PT + (1 - v / max) * (H - PT - PB); }
    function measure() { W = box.clientWidth; H = box.clientHeight; }
    function pathOf(a) {
      var d = '', i, n = a.length;
      for (i = 0; i < n; i++) d += (i ? 'L' : 'M') + X(i / (n - 1)).toFixed(1) + ' ' + Y(a[i]).toFixed(1);
      return d;
    }
    function valAt(a, f) { var t = f * (a.length - 1), i = Math.floor(t), k = t - i; return i >= a.length - 1 ? a[a.length - 1] : lerp(a[i], a[i + 1], k); }
    function labels(g, list, alpha) {
      var n = list.length, m = Math.min(n, W < 420 ? 4 : 6), k;
      for (k = 0; k < m; k++) {
        var i = Math.round(k * (n - 1) / (m - 1)), f = n > 1 ? i / (n - 1) : 0;
        svg('text', { class: 'mr-axis', x: X(f), y: H - 8, 'text-anchor': k === 0 ? 'start' : k === m - 1 ? 'end' : 'middle', opacity: alpha }, g).textContent = list[i];
      }
    }
    function draw() {
      if (!W) return;
      var k;
      gGrid.textContent = ''; gY.textContent = ''; gX.textContent = '';
      for (k = 0; k <= 4; k++) {
        var v = max * k / 4, y = Y(v);
        svg('line', { class: 'mr-gridline', x1: PL, x2: W - PR, y1: y, y2: y }, gGrid);
        svg('text', { class: 'mr-axis', x: PL - 10, y: y + 4, 'text-anchor': 'end' }, gY).textContent = fmt.short(v);
      }
      if (labelsOld && labelAlpha < .34) labels(gX, labelsOld, 1 - labelAlpha * 3);
      labels(gX, data.labels, labelsOld ? clamp((labelAlpha - .4) * 2.5) : 1);
      var d = pathOf(cur);
      line.setAttribute('d', d);
      area.setAttribute('d', d + 'L' + X(1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z');
      prev.setAttribute('d', pathOf(prv));
      clipRect.setAttribute('width', X(reveal) + 1);
      var hf = reveal < 1 ? reveal : 1;
      head.setAttribute('cx', X(hf)); head.setAttribute('cy', Y(valAt(cur, hf)));
      halo.setAttribute('cx', X(hf)); halo.setAttribute('cy', Y(valAt(cur, hf)));
      if (beamAt >= 0) {
        beam.setAttribute('x', X(beamAt) - 45); beam.setAttribute('height', H - PB);
        beam.setAttribute('opacity', Math.sin(Math.PI * clamp(beamAt * 1.1)).toFixed(3));
      } else beam.setAttribute('opacity', 0);
      if (hover >= 0) placeTip(hover);
    }
    function placeTip(i) {
      var n = data.labels.length, f = n > 1 ? i / (n - 1) : 0, x = X(f), y = Y(data.current[i]);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('y1', PT); cross.setAttribute('y2', H - PB);
      hov.setAttribute('cx', x); hov.setAttribute('cy', y);
      var ch = (data.current[i] / data.previous[i] - 1) * 100;
      tip.innerHTML = '<b>' + data.labels[i] + '</b><div><span>Revenue</span><strong>' + fmt.money(data.current[i]) +
        '</strong></div><div><span>Prev. period</span><strong>' + fmt.money(data.previous[i]) + '</strong></div>' +
        '<div><span>Change</span><strong style="color:var(' + (ch >= 0 ? '--mr-good' : '--mr-bad') + ')">' + (ch >= 0 ? '+' : '') + ch.toFixed(1) + '%</strong></div>';
      var tw = tip.offsetWidth || 160, th = tip.offsetHeight || 80;
      var tx = x + 14 + tw > W ? x - 14 - tw : x + 14, ty = Math.max(0, Math.min(H - PB - th, y - th / 2));
      tip.style.transform = 'translate(' + tx.toFixed(0) + 'px,' + ty.toFixed(0) + 'px)';
    }
    function show(i) {
      if (!data) return;
      hover = Math.max(0, Math.min(data.labels.length - 1, i));
      cross.setAttribute('opacity', 1); hov.setAttribute('opacity', 1); tip.classList.add('is-on');
      placeTip(hover);
      box.setAttribute('aria-valuemax', data.labels.length - 1); box.setAttribute('aria-valuenow', hover);
      box.setAttribute('aria-valuetext', data.labels[hover] + ': ' + fmt.money(data.current[hover]));
    }
    function hide() { hover = -1; cross.setAttribute('opacity', 0); hov.setAttribute('opacity', 0); tip.classList.remove('is-on'); }
    function indexFromEvent(e) {
      var r = box.getBoundingClientRect(), sx = box.clientWidth / (r.width || 1);
      var f = clamp(((e.clientX - r.left) * sx - PL) / (W - PL - PR));
      return Math.round(f * (data.labels.length - 1));
    }
    box.addEventListener('pointermove', function (e) { if (data) show(indexFromEvent(e)); });
    box.addEventListener('pointerleave', hide);
    box.addEventListener('blur', hide);
    box.addEventListener('keydown', function (e) {
      if (!data) return;
      var n = data.labels.length, i = hover < 0 ? n - 1 : hover;
      if (e.key === 'ArrowLeft') i--; else if (e.key === 'ArrowRight') i++;
      else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1;
      else if (e.key === 'Escape') { hide(); return; } else return;
      e.preventDefault(); show(i);
    });
    box.addEventListener('focus', function () { if (data) show(data.labels.length - 1); });

    return {
      set: function (d, run, intro) {
        measure();
        var B = resample(d.current, N), Bp = resample(d.previous, N);
        var newMax = niceMax(Math.max.apply(null, d.current.concat(d.previous)) * 1.08);
        hide();
        if (!data || intro) {
          data = d; labelsOld = null; cur = B.slice(); prv = Bp.slice(); max = newMax;
          reveal = 0; beamAt = -1; halo.setAttribute('opacity', 0);
          run(1500, function (p) { reveal = easeOut(p) * .999 + (p >= 1 ? .001 : 0); draw(); });
          return;
        }
        var A = cur.slice(), Ap = prv.slice(), oldMax = max;
        labelsOld = data.labels; data = d; reveal = 1;
        run(1150, function (p) {
          for (var i = 0; i < N; i++) { var w = wave(p, i, N, .45); cur[i] = lerp(A[i], B[i], w); prv[i] = lerp(Ap[i], Bp[i], w); }
          max = lerp(oldMax, newMax, easeIO(p)); labelAlpha = p;
          beamAt = p < 1 ? p * 1.12 - .06 : -1; draw();
        }, function () { labelsOld = null; beamAt = -1; draw(); });
      },
      pulse: function (t) {
        if (reveal < 1 || mq.matches) { halo.setAttribute('opacity', 0); return; }
        var k = (t % 1800) / 1800;
        halo.setAttribute('r', (5 + k * 12).toFixed(2)); halo.setAttribute('opacity', (.7 * (1 - k)).toFixed(3));
      },
      resize: function () { measure(); draw(); },
      show: show, hide: hide
    };
  }

  /* ---------- sparkline ---------- */
  function Spark(el) {
    var id = 'mr' + (++uid);
    var s = svg('svg', { viewBox: '0 0 96 34', preserveAspectRatio: 'none', class: 'mr-spark', 'aria-hidden': 'true' }, el);
    var defs = svg('defs', {}, s);
    var g = svg('linearGradient', { id: id, x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    var s1 = svg('stop', { offset: 0 }, g), s2 = svg('stop', { offset: 1 }, g);
    var cp = svg('clipPath', { id: id + 'c' }, defs), cr = svg('rect', { x: 0, y: -4, height: 44, width: 0 }, cp);
    var gp = svg('g', { 'clip-path': 'url(#' + id + 'c)' }, s);
    var area = svg('path', { fill: 'url(#' + id + ')' }, gp);
    var line = svg('path', { fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, gp);
    var cur = null;
    function draw(a, rev) {
      var lo = Math.min.apply(null, a), hi = Math.max.apply(null, a), d = '';
      for (var i = 0; i < a.length; i++) d += (i ? 'L' : 'M') + (i / (a.length - 1) * 96).toFixed(1) + ' ' + (30 - (a[i] - lo) / (hi - lo || 1) * 26).toFixed(1);
      line.setAttribute('d', d); area.setAttribute('d', d + 'L96 34L0 34Z'); cr.setAttribute('width', 96 * rev + 1);
    }
    return {
      set: function (a, good, run, intro) {
        var c = good ? 'var(--mr-good)' : 'var(--mr-bad)';
        line.style.stroke = c; s1.setAttribute('style', 'stop-color:' + c + ';stop-opacity:.28'); s2.setAttribute('style', 'stop-color:' + c + ';stop-opacity:0');
        var B = resample(a, 32), A = cur || B.map(function () { return B[0]; }), w = [];
        cur = B;
        if (intro) { run(1100, function (p) { draw(B, easeOut(p)); }); return; }
        run(900, function (p) { for (var i = 0; i < 32; i++) w[i] = lerp(A[i], B[i], wave(p, i, 32, .4)); draw(w, 1); });
      }
    };
  }

  /* ---------- mount ---------- */
  function mount(el, opts) {
    if (el._meridian) return el._meridian;
    opts = opts || {};
    var data = opts.data || DEMO, keys = Object.keys(data);
    var state = { range: opts.range || el.getAttribute('data-range') || (data['30d'] ? '30d' : keys[0]) };
    var q = function (s) { return el.querySelector(s); }, qa = function (s) { return [].slice.call(el.querySelectorAll(s)); };
    var runners = {};
    function runner(k) { return runners[k] || (runners[k] = Runner()); }

    if (opts.theme) el.setAttribute('data-theme', opts.theme);
    if (!el.getAttribute('data-theme')) el.setAttribute('data-theme', 'dark');

    // charts
    var chartBox = q('[data-mr-chart="revenue"]');
    var chart = chartBox ? RevenueChart(chartBox, el) : null;
    var kpis = qa('[data-mr-kpi]').map(function (card) {
      var k = card.getAttribute('data-mr-kpi');
      return { k: k, val: card.querySelector('.mr-kpi-val'), delta: card.querySelector('.mr-delta'), note: card.querySelector('.mr-delta-note'),
        spark: card.querySelector('[data-mr-spark]') ? Spark(card.querySelector('[data-mr-spark]')) : null, shown: 0 };
    });
    var donut = q('[data-mr-donut]'), plans = qa('[data-mr-plan]'), segs = [], C = 2 * Math.PI * 58, donutCur = null, payingCur = 0;
    if (donut) {
      var ds = svg('svg', { viewBox: '0 0 150 150', 'aria-hidden': 'true' });
      svg('circle', { class: 'mr-track', cx: 75, cy: 75, r: 58 }, ds);
      ['--mr-peri', '--mr-blue', '--mr-cyan', '--mr-good'].forEach(function (c) { segs.push(svg('circle', { cx: 75, cy: 75, r: 58, style: 'stroke:var(' + c + ')' }, ds)); });
      donut.insertBefore(ds, donut.firstChild);
      plans.forEach(function (li, i) { var dot = li.querySelector('i'); if (dot) dot.style.background = 'var(' + ['--mr-peri', '--mr-blue', '--mr-cyan', '--mr-good'][i % 4] + ')'; });
    }
    var bars = qa('[data-mr-channel]'), barsCur = null;

    function drawDonut(fr, sweep) {
      var cum = 0, gap = 7;
      segs.forEach(function (c, i) {
        var len = Math.max(0, fr[i] * C * sweep - gap);
        c.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + C.toFixed(2));
        c.setAttribute('stroke-dashoffset', (-(cum * C * sweep) - gap / 2).toFixed(2));
        c.setAttribute('opacity', len > .5 ? 1 : 0);
        cum += fr[i];
      });
    }

    function apply(intro) {
      var d = data[state.range];
      if (!d) return;
      qa('[data-mr-range-label]').forEach(function (n) { n.textContent = d.label; });
      if (chart) chart.set(d, runner('chart'), intro);
      kpis.forEach(function (c, i) {
        var def = KPI[c.k] || { f: fmt.int, unit: '%' }, v = d.kpi[c.k]; if (!v) return;
        var from = intro ? 0 : c.shown, to = v[0], dl = v[1];
        var good = def.lowerIsBetter ? dl <= 0 : dl >= 0;
        if (c.delta) {
          c.delta.className = 'mr-delta ' + (good ? 'is-good' : 'is-bad') + (dl < 0 ? ' is-down' : '');
          c.delta.lastChild.textContent = (dl >= 0 ? '+' : '−') + Math.abs(dl).toFixed(1) + def.unit;
        }
        if (c.note) c.note.textContent = 'vs prior ' + d.label.replace('last ', '');
        runner('k' + i)(intro ? 1300 : 900, function (p) { c.val.textContent = def.f(lerp(from, to, easeOut(p))); }, function () { c.shown = to; });
        if (c.spark && d.sparks && d.sparks[c.k]) c.spark.set(d.sparks[c.k], good, runner('s' + i), intro);
      });
      if (donut) {
        var tot = d.plans.reduce(function (a, b) { return a + b; }, 0), B = d.plans.map(function (v) { return v / tot; });
        var A = donutCur || B, pFrom = intro ? 0 : payingCur, center = donut.querySelector('.mr-donut-c b');
        donutCur = B;
        runner('donut')(intro ? 1400 : 1000, function (p) {
          var e = easeIO(p), fr = intro ? B : A.map(function (a, i) { return lerp(a, B[i], e); });
          drawDonut(fr, intro ? easeOut(p) : 1);
          if (center) center.textContent = fmt.int(lerp(pFrom, d.paying, easeOut(p)));
          plans.forEach(function (li, i) { var b = li.querySelector('b'); if (b) b.textContent = Math.round(fr[i] * 100) + '%'; });
        }, function () { payingCur = d.paying; });
      }
      if (bars.length) {
        var mx = Math.max.apply(null, d.channels), BA = d.channels.slice(), AA = intro || !barsCur ? d.channels.map(function () { return 0; }) : barsCur, mxA = intro || !barsCur ? mx : Math.max.apply(null, barsCur);
        barsCur = BA;
        runner('bars')(intro ? 1300 : 1000, function (p) {
          bars.forEach(function (li, i) {
            var w = wave(p, i, bars.length, .35), v = lerp(AA[i], BA[i], w), m = lerp(mxA, mx, easeIO(p));
            var fill = li.querySelector('.mr-track-h i'), val = li.querySelector('b');
            if (fill) fill.style.width = (v / m * 100).toFixed(2) + '%';
            if (val) val.textContent = fmt.int(v);
          });
        });
      }
      el.dispatchEvent(new CustomEvent('meridian:range', { detail: { range: state.range } }));
    }

    // range control with a sliding indicator
    var seg = q('[data-mr-range]'), segBtns = seg ? [].slice.call(seg.querySelectorAll('button[data-range]')) : [];
    var ind = seg ? seg.querySelector('.mr-range-ind') : null, indX = null, indW = 0;
    function moveInd(instant) {
      if (!ind) return;
      var b = seg.querySelector('button[aria-checked="true"]'); if (!b) return;
      var tx = b.offsetLeft, tw = b.offsetWidth;
      if (instant || indX === null) { indX = tx; indW = tw; ind.style.transform = 'translateX(' + tx + 'px)'; ind.style.width = tw + 'px'; return; }
      var fx = indX, fw = indW;
      runner('ind')(520, function (p) {
        var k = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos(p * 9.5);   // springy settle
        indX = lerp(fx, tx, k); indW = lerp(fw, tw, Math.min(1, p * 1.6));
        ind.style.transform = 'translateX(' + indX.toFixed(2) + 'px)'; ind.style.width = indW.toFixed(2) + 'px';
      });
    }
    function syncSeg() { segBtns.forEach(function (b) { var on = b.getAttribute('data-range') === state.range; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; }); }
    segBtns.forEach(function (b, i) {
      b.setAttribute('role', 'radio');
      b.addEventListener('click', function () { setRange(b.getAttribute('data-range')); });
      b.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : null;
        if (j === null) return; e.preventDefault();
        var nb = segBtns[(j + segBtns.length) % segBtns.length]; nb.focus(); nb.click();
      });
    });
    function setRange(k) {
      if (!data[k] || k === state.range) return;
      state.range = k; syncSeg(); moveInd(); apply(false);
    }

    // theme
    var themeBtn = q('[data-mr-theme]');
    function setTheme(t) {
      if (t !== 'light' && t !== 'dark') t = el.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      el.setAttribute('data-theme', t);
      if (themeBtn) { themeBtn.setAttribute('aria-pressed', t === 'light'); themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
      if (opts.onTheme) opts.onTheme(t);
    }
    if (themeBtn) themeBtn.addEventListener('click', function () { setTheme(); });

    // drawer (phones)
    var menu = q('[data-mr-menu]'), scrim = q('.mr-scrim');
    function drawer(open) { el.classList.toggle('is-open', open); if (menu) menu.setAttribute('aria-expanded', open); }
    if (menu) menu.addEventListener('click', function () { drawer(!el.classList.contains('is-open')); });
    if (scrim) scrim.addEventListener('click', function () { drawer(false); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.classList.contains('is-open')) { drawer(false); if (menu) menu.focus(); } });
    qa('.mr-nav a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('href') === '#') e.preventDefault();
        qa('.mr-nav a').forEach(function (o) { o.removeAttribute('aria-current'); });
        a.setAttribute('aria-current', 'page'); drawer(false);
      });
    });

    // table: search + sort
    var tbody = q('[data-mr-table] tbody'), search = q('[data-mr-search]');
    var rows = tbody ? [].slice.call(tbody.rows) : [];
    var empty = document.createElement('tr'); empty.className = 'mr-empty'; empty.innerHTML = '<td colspan="5">No customers match your search</td>';
    function filter() {
      var t = (search.value || '').trim().toLowerCase(), any = false;
      rows.forEach(function (r) { var hit = !t || r.textContent.toLowerCase().indexOf(t) > -1; r.hidden = !hit; any = any || hit; });
      if (!any) tbody.appendChild(empty); else if (empty.parentNode) empty.remove();
    }
    if (search && tbody) search.addEventListener('input', filter);
    qa('[data-mr-table] th[data-sort] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var th = b.parentNode, key = th.getAttribute('data-sort'), col = th.cellIndex;
        var dir = th.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
        qa('[data-mr-table] th[data-sort]').forEach(function (o) { o.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', dir);
        rows.sort(function (a, b2) {
          var x = a.cells[col].getAttribute('data-v') || a.cells[col].textContent, y = b2.cells[col].getAttribute('data-v') || b2.cells[col].textContent;
          var r = key === 'num' ? parseFloat(x) - parseFloat(y) : x.localeCompare(y);
          return dir === 'ascending' ? r : -r;
        });
        rows.forEach(function (r, i) {
          tbody.appendChild(r);
          if (!mq.matches && r.animate) r.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: i * 30, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
        });
      });
    });

    // pulse loop for the live point
    var alive = true;
    (function loop() { if (!alive) return; if (chart) chart.pulse(now()); requestAnimationFrame(loop); })();
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (chart) chart.resize(); moveInd(true); }) : null;
    if (ro) { ro.observe(el); if (chartBox) ro.observe(chartBox); }

    syncSeg();
    if (seg) seg.setAttribute('role', 'radiogroup');
    moveInd(true);
    setTheme(el.getAttribute('data-theme'));
    function replay() {
      apply(true);
      if (!mq.matches && tbody) rows.forEach(function (r, i) {
        if (r.animate) r.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 500 + i * 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      });
    }
    replay();

    var api = {
      setRange: setRange,
      getRange: function () { return state.range; },
      setTheme: setTheme,
      replay: replay,
      showTip: function (i) { if (chart) chart.show(i); },
      hideTip: function () { if (chart) chart.hide(); },
      openMenu: function (o) { drawer(o !== false); },
      destroy: function () { alive = false; if (ro) ro.disconnect(); delete el._meridian; }
    };
    el._meridian = api;
    return api;
  }

  global.Meridian = { mount: mount, data: DEMO, format: fmt };
  function auto() { [].forEach.call(document.querySelectorAll('[data-meridian]'), function (el) { if (!el.hasAttribute('data-meridian-manual')) mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
