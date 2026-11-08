/* Roster — hiring & people dashboard template · Kodehelix UI · kodehelix.in
   Plain JS, no dependencies. Roster.mount(el, { team, data }) → controller. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  /* ---------- demo data (fictional company "Fernway") ---------- */
  var DATA = {
    stages: ['Applied', 'Screened', 'Interview', 'Offer', 'Hired'],
    months: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    sources: ['Referrals', 'LinkedIn', 'Website', 'Agencies'],
    teams: [
      { id: 'all', name: 'All teams',
        kpis: { roles: { v: 14, d: 3, spark: [8, 9, 9, 11, 10, 12, 13, 14] },
                applicants: { v: 412, d: 18, spark: [210, 236, 254, 281, 302, 344, 371, 412] },
                days: { v: 27, d: -4, spark: [36, 34, 35, 32, 31, 30, 29, 27] },
                accept: { v: 78, d: 6, spark: [66, 69, 68, 71, 73, 72, 75, 78] } },
        funnel: [412, 236, 118, 31, 22],
        headcount: [84, 86, 89, 91, 95, 98, 101, 106, 110, 114, 121, 126],
        plan: [84, 87, 90, 94, 97, 100, 104, 108, 112, 116, 120, 124],
        sources: [31, 27, 24, 18],
        joiners: [['Arjun Mehta', 'Backend Engineer', 'Nov 18'], ['Maya Okafor', 'Product Designer', 'Nov 16'], ['Daniel Cho', 'Account Executive', 'Nov 16'], ['Lena Fischer', 'iOS Engineer', 'Dec 1']] },
      { id: 'eng', name: 'Engineering',
        kpis: { roles: { v: 6, d: 2, spark: [3, 4, 4, 5, 4, 5, 6, 6] },
                applicants: { v: 198, d: 24, spark: [92, 104, 118, 126, 141, 160, 172, 198] },
                days: { v: 34, d: -3, spark: [41, 40, 39, 38, 38, 36, 35, 34] },
                accept: { v: 71, d: 4, spark: [62, 64, 63, 66, 67, 66, 69, 71] } },
        funnel: [198, 104, 52, 14, 10],
        headcount: [41, 42, 43, 44, 46, 48, 49, 52, 54, 56, 60, 63],
        plan: [41, 43, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62],
        sources: [38, 29, 15, 18],
        joiners: [['Arjun Mehta', 'Backend Engineer', 'Nov 18'], ['Lena Fischer', 'iOS Engineer', 'Dec 1'], ['Kwame Boateng', 'Platform Engineer', 'Dec 2'], ['Sara Lindqvist', 'QA Engineer', 'Dec 8']] },
      { id: 'design', name: 'Design',
        kpis: { roles: { v: 3, d: 1, spark: [1, 2, 2, 2, 3, 2, 3, 3] },
                applicants: { v: 96, d: 11, spark: [52, 58, 61, 66, 70, 79, 86, 96] },
                days: { v: 22, d: -5, spark: [30, 29, 28, 27, 26, 24, 23, 22] },
                accept: { v: 86, d: 9, spark: [72, 74, 77, 76, 80, 82, 84, 86] } },
        funnel: [96, 61, 29, 8, 6],
        headcount: [14, 14, 15, 15, 16, 16, 17, 18, 19, 19, 20, 22],
        plan: [14, 15, 15, 16, 16, 17, 17, 18, 19, 19, 20, 21],
        sources: [24, 22, 41, 13],
        joiners: [['Maya Okafor', 'Product Designer', 'Nov 16'], ['Ishaan Rao', 'UX Researcher', 'Nov 30'], ['Chloé Martin', 'Brand Designer', 'Dec 7']] },
      { id: 'sales', name: 'Sales',
        kpis: { roles: { v: 5, d: 0, spark: [4, 5, 5, 4, 5, 6, 5, 5] },
                applicants: { v: 118, d: 14, spark: [66, 74, 75, 89, 91, 105, 113, 118] },
                days: { v: 19, d: -2, spark: [24, 23, 23, 22, 21, 21, 20, 19] },
                accept: { v: 83, d: -2, spark: [80, 82, 85, 84, 86, 85, 84, 83] } },
        funnel: [118, 71, 37, 9, 6],
        headcount: [29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 41, 42],
        plan: [29, 29, 31, 32, 33, 33, 35, 36, 37, 39, 40, 42],
        sources: [29, 33, 16, 22],
        joiners: [['Daniel Cho', 'Account Executive', 'Nov 16'], ['Fatima Zahra', 'Sales Dev Rep', 'Nov 23'], ['Ravi Kumar', 'Customer Success', 'Dec 1']] }
    ],
    // stages: candidates currently at Applied, Screened, Interview, Offer, Hired
    roles: [
      { role: 'Senior Frontend Engineer', team: 'eng', where: 'Remote', stages: [28, 12, 7, 2, 1], days: 23, status: 'interview' },
      { role: 'Backend Engineer (Go)', team: 'eng', where: 'Lisbon', stages: [21, 9, 5, 2, 1], days: 31, status: 'offer' },
      { role: 'Staff Platform Engineer', team: 'eng', where: 'Remote', stages: [19, 6, 3, 1, 1], days: 52, status: 'risk' },
      { role: 'iOS Engineer', team: 'eng', where: 'Berlin', stages: [14, 7, 4, 1, 2], days: 18, status: 'track' },
      { role: 'QA Automation Engineer', team: 'eng', where: 'Bengaluru', stages: [13, 7, 4, 2, 2], days: 15, status: 'track' },
      { role: 'Data Engineer', team: 'eng', where: 'Remote', stages: [11, 7, 4, 1, 3], days: 27, status: 'interview' },
      { role: 'Product Designer', team: 'design', where: 'Lisbon', stages: [19, 13, 8, 2, 2], days: 12, status: 'offer' },
      { role: 'Brand Designer', team: 'design', where: 'Remote', stages: [10, 9, 6, 3, 2], days: 20, status: 'track' },
      { role: 'UX Researcher', team: 'design', where: 'Berlin', stages: [6, 10, 3, 1, 2], days: 34, status: 'interview' },
      { role: 'Account Executive', team: 'sales', where: 'London', stages: [13, 10, 7, 2, 2], days: 16, status: 'offer' },
      { role: 'Sales Development Rep', team: 'sales', where: 'Bengaluru', stages: [11, 9, 6, 2, 2], days: 9, status: 'track' },
      { role: 'Customer Success Manager', team: 'sales', where: 'Remote', stages: [9, 6, 4, 2, 1], days: 21, status: 'interview' },
      { role: 'Sales Engineer', team: 'sales', where: 'London', stages: [8, 5, 3, 1, 1], days: 38, status: 'risk' },
      { role: 'Partnerships Lead', team: 'sales', where: 'Dubai', stages: [6, 4, 3, 2, 0], days: 26, status: 'interview' }
    ]
  };
  var TEAM_LABEL = { eng: ['Engineering', 'EN', 'var(--roster-blue)'], design: ['Design', 'DE', 'var(--roster-violet)'], sales: ['Sales', 'SA', 'var(--roster-cyan)'] };
  var STATUS = { track: ['On track', 'var(--roster-good)'], interview: ['Interviewing', 'var(--roster-cyan)'], offer: ['Offer out', 'var(--roster-violet)'], risk: ['At risk', 'var(--roster-bad)'] };
  var STAGE_C = ['var(--roster-s1)', 'var(--roster-s2)', 'var(--roster-s3)', 'var(--roster-s4)', 'var(--roster-s5)'];
  var SRC_C = ['var(--roster-blue)', 'var(--roster-cyan)', 'var(--roster-violet)', 'var(--roster-warn)'];
  var AV_C = ['#3B5BFF', '#A98BFF', '#22A6C8', '#E0702E', '#19A26B'];

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
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var E = {
    io: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    back: function (t) { var c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
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
  Engine.prototype.kill = function (tag) { this.list.forEach(function (t) { if (t.tag === tag) t.dead = true; }); };
  Engine.prototype.stop = function () { cancelAnimationFrame(this.raf); this.raf = 0; this.list = []; };

  function sparkPath(vals, w, h, pad) {
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    return vals.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / (vals.length - 1) * w).toFixed(1) + ' ' + (pad + (1 - (v - mn) / r) * (h - pad * 2)).toFixed(1);
    }).join(' ');
  }
  function smooth(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- the dashboard ---------- */
  function mount(root, opts) {
    if (!root) throw new Error('Roster.mount: element not found');
    if (root.__roster) return root.__roster;
    opts = opts || {};
    var data = opts.data || DATA;
    var id = 'rs' + (++uid);
    var fx = new Engine();
    var st = { team: null, sort: null, dir: 1, q: '', kpi: {}, half: null, hc: null, src: null };
    var off = [];
    function on(el, ev, fn, o) { if (!el) return; el.addEventListener(ev, fn, o); off.push(function () { el.removeEventListener(ev, fn, o); }); }
    function set(sel, txt) { $$(root, sel).forEach(function (el) { el.textContent = txt; }); }
    function teamById(t) { return data.teams.filter(function (x) { return x.id === t; })[0] || data.teams[0]; }

    /* --- pipeline (the hero) --- */
    var W = 640, H = 230, MID = 112, MAXH = 88, COLW = W / 5, GOAL = [604, MID];
    var pipeHost = $(root, '[data-rs-pipe]'), stagesHost = $(root, '[data-rs-stages]');
    var pipe = S('svg', { 'class': 'rs-pipe', viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, pipeHost);
    var defs = S('defs', {}, pipe);
    var bg = S('linearGradient', { id: id + 'band', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
    ['#8FA3FF', '#3B5BFF', '#22C3EE', '#A98BFF', '#19C37D'].forEach(function (c, i) {
      S('stop', { offset: (i / 4 * 100) + '%', 'stop-color': c, 'stop-opacity': '.22' }, bg);
    });
    for (var g = 1; g < 5; g++) S('line', { 'class': 'rs-gate', x1: g * COLW, x2: g * COLW, y1: 10, y2: H - 10 }, pipe);
    var band = S('path', { 'class': 'rs-band', fill: 'url(#' + id + 'band)' }, pipe);
    var edgeT = S('path', { 'class': 'rs-edge' }, pipe), edgeB = S('path', { 'class': 'rs-edge' }, pipe);
    var dotsG = S('g', {}, pipe);
    var goal = S('g', { transform: 'translate(' + GOAL[0] + ' ' + GOAL[1] + ')' }, pipe);
    var gPulse = S('circle', { 'class': 'rs-goalpulse', r: 14 }, goal);
    var gFill = S('circle', { 'class': 'rs-goalfill', r: 15 }, goal);
    S('circle', { 'class': 'rs-goal', r: 19, opacity: '.35' }, goal);
    S('path', { 'class': 'rs-goaltick', d: 'M-6 0.5l4 4 8-8.5' }, goal);
    var stageEls = data.stages.map(function (name, k) {
      var d = document.createElement('div');
      d.className = 'rs-stage'; d.style.setProperty('--c', STAGE_C[k]);
      d.innerHTML = '<small>' + esc(name) + '</small><b>0</b><span>–</span>';
      stagesHost.appendChild(d);
      return { el: d, b: d.querySelector('b'), span: d.querySelector('span') };
    });

    function halves(f) { return f.map(function (v) { return MAXH * (0.14 + 0.86 * Math.sqrt(v / (f[0] || 1))); }); }
    function halfAt(x, hv) {
      var c = x / COLW - 0.5;
      if (c <= 0) return hv[0];
      if (c >= 4) return hv[4];
      var i = Math.floor(c), t = c - i; t = t * t * (3 - 2 * t);
      return lerp(hv[i], hv[i + 1], t);
    }
    function drawBand(hv) {
      var top = [], bot = [];
      for (var x = 0; x <= W; x += 10) { var h = halfAt(x, hv); top.push([x, MID - h]); bot.push([x, MID + h]); }
      var dt = smooth(top), db = smooth(bot.slice().reverse());
      band.setAttribute('d', dt + ' L' + db.slice(1) + 'Z');
      edgeT.setAttribute('d', dt); edgeB.setAttribute('d', smooth(bot));
    }

    var dots = [], praf = 0, run = 0, trickle = 0, joinEls = [], pst = null;
    function showStage(k, v, f) {
      stageEls[k].b.textContent = fmt(v);
      stageEls[k].span.textContent = k === 0 ? 'All in' : Math.round(f[k] / (f[k - 1] || 1) * 100) + '% pass';
    }
    function flash(k) { var el = stageEls[k].el; el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit'); }
    function pulseGoal(big) {
      fx.add({ dur: big ? 700 : 500, ease: E.out, tag: 'goal', fn: function (e) {
        gPulse.setAttribute('r', (15 + e * (big ? 22 : 12)).toFixed(1)); gPulse.style.opacity = (1 - e) * (big ? 0.9 : 0.5);
        gFill.setAttribute('r', (15 + Math.sin(e * Math.PI) * (big ? 3 : 1.5)).toFixed(1));
      } });
    }
    function spawn(o) {
      var c = S('circle', { 'class': 'rs-dot', r: o.r, cx: -10, cy: MID }, dotsG);
      o.el = c; o.stage = -1; o.done = false; dots.push(o);
      if (!praf) praf = requestAnimationFrame(tick);
    }
    function tick(now) {
      praf = 0;
      var hv = st.half;
      for (var i = dots.length - 1; i >= 0; i--) {
        var d = dots[i], t = (now - d.t0) / 1000;
        if (t < 0) { d.el.style.opacity = 0; continue; }
        var x = -8 + d.v * t, y, op = 1, r = d.r;
        if (x < d.xEnd) {
          y = MID + d.u * halfAt(Math.max(0, x), hv) * 0.82;
          var k = clamp(Math.floor(x / COLW), 0, 4);
          if (k !== d.stage && x >= 0) {
            d.stage = k;
            d.el.style.fill = STAGE_C[k];
            if (d.count) d.count(k);
          }
          d.tEnd = t;
        } else if (d.fin === 4) {
          // hired: curve into the goal
          var p = Math.min(1, (t - d.tEnd) / 0.32), e = E.io(p);
          var y0 = MID + d.u * halfAt(d.xEnd, hv) * 0.82;
          x = lerp(d.xEnd, GOAL[0], e); y = lerp(y0, GOAL[1], e);
          r = d.r * (1 - e * 0.7);
          if (d.stage !== 4) { d.stage = 4; d.el.style.fill = STAGE_C[4]; if (d.count) d.count(4); }
          if (p >= 1) { d.done = true; if (d.land) d.land(); }
        } else {
          // not moving on: drop out of the band and fade
          var q = Math.min(1, (t - d.tEnd) / 0.75);
          var yb = MID + d.u * halfAt(d.xEnd, hv) * 0.82;
          x = d.xEnd + q * 26; y = yb + q * q * (H - yb + 10) * 0.55;
          op = 1 - q; r = d.r * (1 - q * 0.4);
          if (q > 0.08 && !d.grey) { d.grey = true; d.el.style.fill = 'var(--roster-drop)'; }
          if (q >= 1) d.done = true;
        }
        if (d.done) { d.el.remove(); dots.splice(i, 1); continue; }
        d.el.setAttribute('cx', x.toFixed(1)); d.el.setAttribute('cy', y.toFixed(1));
        d.el.setAttribute('r', r.toFixed(2)); d.el.style.opacity = op;
      }
      if (dots.length) praf = requestAnimationFrame(tick);
    }
    function clearDots(fade) {
      dots.forEach(function (d) {
        var el = d.el;
        if (fade && !mq.matches) { el.style.transition = 'opacity .25s'; el.style.opacity = 0; setTimeout(function () { el.remove(); }, 260); } else el.remove();
      });
      dots = [];
    }
    function finalStageList(f, n, rand) {
      var reach = f.map(function (v) { return Math.round(n * v / (f[0] || 1)); });
      if (f[4] > 0) reach[4] = Math.max(reach[4], 2);
      for (var k = 1; k < 5; k++) reach[k] = Math.min(reach[k], reach[k - 1]);
      var fins = [];
      for (var i = 0; i < n; i++) { var s = 0; while (s < 4 && i < reach[s + 1]) s++; fins.push(s); }
      for (var j = fins.length - 1; j > 0; j--) { var r = Math.floor(rand() * (j + 1)), tmp = fins[j]; fins[j] = fins[r]; fins[r] = tmp; }
      // keep hires out of the very first and last few so the stream reads well
      return { fins: fins, reach: reach };
    }
    function pour(team, delay) {
      var myRun = ++run, f = team.funnel, N = 84, rand = rng(team.id.length * 977 + f[0]);
      var plan = finalStageList(f, N, rand), entered = [0, 0, 0, 0, 0], landed = 0;
      stageEls.forEach(function (s, k) { showStage(k, 0, f); });
      var now = performance.now() + delay;
      var hires = plan.reach[4];
      plan.fins.forEach(function (fin, i) {
        var o = {
          t0: now + i * 17 + rand() * 30, v: 340 + rand() * 90, u: (rand() * 2 - 1) * 0.92, r: 3.6 + rand() * 1.8, fin: fin,
          xEnd: fin === 4 ? 548 : (fin + 0.5) * COLW + (rand() - 0.5) * 34,
          count: function (k) {
            if (myRun !== run) return;
            entered[k]++;
            showStage(k, Math.min(f[k], Math.round(f[k] * entered[k] / plan.reach[k])), f);
            flash(k);
            if (k === 4) setHires(Math.round(f[4] * entered[4] / plan.reach[4]));
          },
          land: function () {
            if (myRun !== run) return;
            landed++; pulseGoal(true);
            var show = Math.ceil(landed / hires * joinEls.length);
            joinEls.forEach(function (el, j) { if (j < show) el.classList.add('is-in'); });
          }
        };
        spawn(o);
      });
      clearTimeout(trickle);
      var total = delay + N * 17 + 2600;
      trickle = setTimeout(function loop() {
        if (myRun !== run) return;
        joinEls.forEach(function (el) { el.classList.add('is-in'); });
        stageEls.forEach(function (s, k) { showStage(k, f[k], f); });
        var r = Math.random(), fin = 0;
        while (fin < 4 && r < f[fin + 1] / f[0] * 1.6) fin++;
        spawn({ t0: performance.now(), v: 300 + Math.random() * 80, u: (Math.random() * 2 - 1) * 0.9, r: 3.4 + Math.random() * 1.6, fin: fin,
          xEnd: fin === 4 ? 548 : (fin + 0.5) * COLW + (Math.random() - 0.5) * 34,
          land: function () { pulseGoal(false); } });
        trickle = setTimeout(loop, 520 + Math.random() * 500);
      }, total);
    }
    function setHires(n) { set('[data-rs-hires]', fmt(n) + (n === 1 ? ' hire' : ' hires')); }
    function drawJoiners(team) {
      var host = $(root, '[data-rs-joiners]');
      if (!host) return;
      var extra = team.funnel[4] - team.joiners.length;
      host.innerHTML = team.joiners.map(function (j, i) {
        return '<li class="rs-joiner" style="--c:' + AV_C[i % AV_C.length] + '"><i aria-hidden="true">' + esc(initials(j[0])) + '</i><span>' + esc(j[0]) + '<em>' + esc(j[1]) + ' · ' + esc(j[2]) + '</em></span></li>';
      }).join('') + (extra > 0 ? '<li class="rs-joiner is-more">+' + extra + ' more</li>' : '');
      joinEls = $$(host, '.rs-joiner');
    }
    function drawPipe(team, intro) {
      var to = halves(team.funnel), from = st.half || to.map(function () { return 2; });
      st.half = from.slice();
      fx.kill('band');
      fx.add({ dur: intro ? 900 : 700, ease: E.io, tag: 'band', fn: function (e) {
        st.half = to.map(function (v, i) { var k = clamp(e * 1.5 - i * 0.12, 0, 1); return lerp(from[i], v, E.out(k)); });
        drawBand(st.half);
      }, done: function () { st.half = to; drawBand(to); } });
      clearDots(!intro);
      drawJoiners(team);
      setHires(0);
      pipe.setAttribute('aria-label', 'Hiring pipeline for ' + team.name + ': ' + data.stages.map(function (s, k) { return team.funnel[k] + ' ' + s.toLowerCase(); }).join(', ') + '.');
      if (mq.matches) {
        stageEls.forEach(function (s, k) { showStage(k, team.funnel[k], team.funnel); });
        setHires(team.funnel[4]);
        joinEls.forEach(function (el) { el.classList.add('is-in'); });
        return;
      }
      pour(team, intro ? 350 : 220);
    }

    /* --- KPIs --- */
    var KPI = {
      roles: function (v) { return fmt(v); },
      applicants: function (v) { return fmt(v); },
      days: function (v) { return Math.round(v) + '<small>days</small>'; },
      accept: function (v) { return Math.round(v) + '<small>%</small>'; }
    };
    function drawKpis(team) {
      $$(root, '[data-rs-kpi]').forEach(function (card, n) {
        var key = card.getAttribute('data-rs-kpi'), k = team.kpis[key];
        if (!k) return;
        var from = st.kpi[key] || { v: 0, spark: k.spark.map(function () { return k.spark[0]; }) };
        var val = $(card, '.rs-kpi-val'), dl = $(card, '.rs-delta'), sp = $(card, '.rs-spark');
        var good = key === 'days' ? k.d <= 0 : k.d >= 0;
        dl.classList.toggle('is-neg', k.d < 0);
        dl.classList.toggle('is-bad', !good);
        $(dl, 'span').textContent = (k.d > 0 ? '+' : k.d < 0 ? '−' : '') + Math.abs(k.d) + (key === 'accept' ? ' pt' : key === 'days' ? ' d' : key === 'applicants' ? '%' : '');
        if (!sp.firstChild) { S('path', { 'class': 'rs-spark-fill' }, sp); S('path', {}, sp); }
        var fill = sp.firstChild, line = sp.lastChild;
        fx.add({ dur: 1000, delay: 80 + n * 70, ease: E.out, tag: 'team', fn: function (e) {
          val.innerHTML = KPI[key](lerp(from.v, k.v, e));
          var vals = k.spark.map(function (x, i) { return lerp(from.spark[i], x, e); });
          var d = sparkPath(vals, 84, 30, 3);
          line.setAttribute('d', d); fill.setAttribute('d', d + ' L84 30 L0 30Z');
        } });
        st.kpi[key] = { v: k.v, spark: k.spark.slice() };
      });
    }

    /* --- source donut --- */
    var donutHost = $(root, '[data-rs-donut]'), srcList = $(root, '[data-rs-srclist]');
    var donut = S('svg', { viewBox: '0 0 160 160', 'aria-hidden': 'true' }, donutHost);
    donutHost.insertBefore(donut, donutHost.firstChild);
    var R = 60, CIRC = 2 * Math.PI * R;
    S('circle', { 'class': 'rs-ring', cx: 80, cy: 80, r: R }, donut);
    var segs = data.sources.map(function (s, i) { return S('circle', { 'class': 'rs-seg', cx: 80, cy: 80, r: R, style: 'stroke:' + SRC_C[i] }, donut); });
    if (srcList) srcList.innerHTML = data.sources.map(function (s, i) {
      return '<li tabindex="0" data-src="' + i + '" style="--c:' + SRC_C[i] + '"><i></i><span>' + esc(s) + '</span><b>0%</b></li>';
    }).join('');
    var srcItems = srcList ? $$(srcList, 'li') : [];
    function focusSrc(i) {
      donutHost.classList.toggle('has-focus', i > -1);
      segs.forEach(function (s, j) { s.classList.toggle('is-focus', j === i); });
      var t = st.team, k = i > -1 ? i : t.sources.indexOf(Math.max.apply(null, t.sources));
      set('[data-rs-topsrc]', data.sources[k]);
      set('[data-rs-toppct]', t.sources[k] + '% of hires');
      set('[data-rs-topsrc-label]', i > -1 ? 'Source' : 'Top source');
    }
    srcItems.forEach(function (li, i) {
      on(li, 'pointerenter', function () { focusSrc(i); });
      on(li, 'focus', function () { focusSrc(i); });
      on(li, 'pointerleave', function () { focusSrc(-1); });
      on(li, 'blur', function () { focusSrc(-1); });
    });
    function drawDonut(team) {
      var to = team.sources.map(function (v) { return v / sum(team.sources); }), from = st.src || to.map(function () { return 0; });
      fx.add({ dur: 1000, delay: 150, ease: E.io, tag: 'team', fn: function (e) {
        var acc = 0, gap = 2.5;
        segs.forEach(function (s, i) {
          var f = lerp(from[i], to[i], e), len = Math.max(0, f * CIRC * e - gap);
          s.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + CIRC.toFixed(2));
          s.setAttribute('stroke-dashoffset', (-acc * CIRC * e).toFixed(2));
          acc += f;
          if (srcItems[i]) $(srcItems[i], 'b').textContent = Math.round(lerp(from[i] * 100, to[i] * 100, e)) + '%';
        });
      } });
      st.src = to;
      focusSrc(-1);
    }

    /* --- headcount chart --- */
    var X0 = 30, X1 = 350, Y0 = 12, Y1 = 158, TW = 360, TH = 184;
    var trHost = $(root, '[data-rs-trend]');
    var tr = { svg: S('svg', { viewBox: '0 0 ' + TW + ' ' + TH, role: 'img' }, trHost) };
    var tdefs = S('defs', {}, tr.svg);
    var ag = S('linearGradient', { id: id + 'area', x1: '0', x2: '0', y1: '0', y2: '1' }, tdefs);
    S('stop', { offset: '0%', 'stop-color': '#22C3EE', 'stop-opacity': '.32' }, ag);
    S('stop', { offset: '100%', 'stop-color': '#3B5BFF', 'stop-opacity': '0' }, ag);
    var lg = S('linearGradient', { id: id + 'line', x1: '0', x2: '1', y1: '0', y2: '0' }, tdefs);
    S('stop', { offset: '0%', 'stop-color': '#3B5BFF' }, lg); S('stop', { offset: '100%', 'stop-color': '#22C3EE' }, lg);
    tr.grid = S('g', {}, tr.svg);
    tr.gl = [0, 1, 2, 3].map(function (i) {
      return { l: S('line', { 'class': 'rs-gridline', x1: X0, x2: X1 }, tr.grid), t: S('text', { 'class': 'rs-axis', x: X0 - 6, 'text-anchor': 'end', 'dominant-baseline': 'middle' }, tr.grid) };
    });
    data.months.forEach(function (m, i) {
      if (i % 3 === 0 || i === data.months.length - 1) {
        var t = S('text', { 'class': 'rs-axis', x: X0 + i / (data.months.length - 1) * (X1 - X0), y: TH - 6, 'text-anchor': i === data.months.length - 1 ? 'end' : 'middle' }, tr.svg);
        t.textContent = m;
      }
    });
    tr.area = S('path', { 'class': 'rs-area', fill: 'url(#' + id + 'area)' }, tr.svg);
    tr.plan = S('path', { 'class': 'rs-plan' }, tr.svg);
    tr.line = S('path', { 'class': 'rs-line', stroke: 'url(#' + id + 'line)' }, tr.svg);
    tr.pts = data.months.map(function () { return S('circle', { 'class': 'rs-pt', r: 3.6 }, tr.svg); });
    tr.pts[tr.pts.length - 1].classList.add('is-last');
    tr.tip = document.createElement('div'); tr.tip.className = 'rs-tip'; trHost.appendChild(tr.tip);
    function tx(i, n) { return X0 + i / (n - 1) * (X1 - X0); }
    function niceRange(vals) {
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), span = mx - mn || 1;
      var step = [1, 2, 5, 10, 20, 25, 50, 100].filter(function (s) { return span / s <= 3.2; })[0] || 100;
      var lo = Math.floor((mn - span * 0.08) / step) * step; return { lo: Math.max(0, lo), hi: lo + step * 3, step: step };
    }
    on(tr.svg, 'pointermove', function (ev) {
      var r = tr.svg.getBoundingClientRect(), n = data.months.length;
      var x = (ev.clientX - r.left) / r.width * TW, i = clamp(Math.round((x - X0) / (X1 - X0) * (n - 1)), 0, n - 1);
      var t = st.team, sc = r.width / TW;
      tr.pts.forEach(function (p, j) { p.classList.toggle('is-hover', j === i); });
      tr.tip.innerHTML = data.months[i] + ' · ' + t.headcount[i] + ' people <span style="opacity:.6">(plan ' + t.plan[i] + ')</span>';
      tr.tip.style.left = (tx(i, n) * sc) + 'px'; tr.tip.style.top = (+tr.pts[i].getAttribute('cy') * sc) + 'px';
      tr.tip.classList.add('is-on');
    });
    on(tr.svg, 'pointerleave', function () { tr.tip.classList.remove('is-on'); tr.pts.forEach(function (p) { p.classList.remove('is-hover'); }); });
    function drawHead(team) {
      var to = team.headcount, plan = team.plan, n = to.length;
      var rng2 = niceRange(to.concat(plan)), from = st.hc || { v: to.map(function () { return rng2.lo; }), p: plan.map(function () { return rng2.lo; }), r: rng2 };
      tr.svg.setAttribute('aria-label', 'Headcount for ' + team.name + ' grew from ' + to[0] + ' to ' + to[n - 1] + ' people in 12 months, plan ' + plan[n - 1] + '.');
      fx.add({ dur: 1000, delay: 180, ease: E.io, tag: 'team', fn: function (e) {
        var lo = lerp(from.r.lo, rng2.lo, e), hi = lerp(from.r.hi, rng2.hi, e);
        function ty(v) { return Y1 - (v - lo) / (hi - lo) * (Y1 - Y0); }
        tr.gl.forEach(function (g, i) {
          var v = rng2.lo + rng2.step * i, y = ty(v);
          g.l.setAttribute('y1', y.toFixed(1)); g.l.setAttribute('y2', y.toFixed(1));
          g.t.setAttribute('y', y.toFixed(1)); g.t.textContent = v;
          var vis = y >= Y0 - 2 && y <= Y1 + 2; g.l.style.opacity = vis ? 1 : 0; g.t.style.opacity = vis ? 1 : 0;
        });
        var vals = to.map(function (v, i) { var k = clamp(e * 1.6 - i / n * 0.6, 0, 1); return lerp(from.v[i], v, E.out(k)); });
        var pv = plan.map(function (v, i) { return lerp(from.p[i], v, e); });
        var pts = vals.map(function (v, i) { return [tx(i, n), ty(v)]; });
        var d = smooth(pts);
        tr.line.setAttribute('d', d);
        tr.area.setAttribute('d', d + ' L' + X1 + ' ' + Y1 + ' L' + X0 + ' ' + Y1 + 'Z');
        tr.plan.setAttribute('d', pv.map(function (v, i) { return (i ? 'L' : 'M') + tx(i, n).toFixed(1) + ' ' + ty(v).toFixed(1); }).join(' '));
        pts.forEach(function (p, i) { tr.pts[i].setAttribute('cx', p[0].toFixed(1)); tr.pts[i].setAttribute('cy', p[1].toFixed(1)); });
        set('[data-rs-hc]', fmt(lerp(from.v[n - 1], to[n - 1], e)));
        var g0 = lerp(from.v[0] ? (from.v[n - 1] / from.v[0] - 1) * 100 : 0, (to[n - 1] / to[0] - 1) * 100, e);
        set('[data-rs-growth]', '+' + Math.round(g0) + '%');
      } });
      st.hc = { v: to.slice(), p: plan.slice(), r: rng2 };
    }

    /* --- roles table --- */
    var tbody = $(root, '[data-rs-table] tbody'), search = $(root, '[data-rs-search]');
    function drawTable(animate) {
      if (!tbody) return;
      var t = st.team, q = st.q.toLowerCase();
      var rows = data.roles.filter(function (r) {
        if (t.id !== 'all' && r.team !== t.id) return false;
        return !q || (r.role + ' ' + r.where + ' ' + TEAM_LABEL[r.team][0] + ' ' + STATUS[r.status][0]).toLowerCase().indexOf(q) > -1;
      });
      if (st.sort) rows.sort(function (a, b) { return (st.sort === 'cand' ? sum(a.stages) - sum(b.stages) : a.days - b.days) * st.dir; });
      tbody.innerHTML = rows.length ? rows.map(function (r, n) {
        var tl = TEAM_LABEL[r.team], s = STATUS[r.status], tot = sum(r.stages);
        var bar = r.stages.map(function (v, k) { return v ? '<i style="flex:' + v + ';--c:' + STAGE_C[k] + '"></i>' : ''; }).join('');
        var label = data.stages.map(function (s2, k) { return r.stages[k] + ' ' + s2.toLowerCase(); }).join(', ');
        return '<tr class="' + (animate ? 'is-in' : '') + '" style="--i:' + n + '">' +
          '<td><span class="rs-who"><i aria-hidden="true" style="--c:' + tl[2] + '">' + tl[1] + '</i><span>' + esc(r.role) + '<small>' + tl[0] + ' · ' + esc(r.where) + '<span class="rs-st-m" style="--c:' + s[1] + '"> · ' + s[0] + '</span></small></span></span></td>' +
          '<td><span class="rs-cand"><b>' + tot + '</b><span class="rs-sbar" role="img" aria-label="' + esc(label) + '" style="--i:' + n + '">' + bar + '</span></span></td>' +
          '<td class="rs-col-days rs-days">' + r.days + ' days</td>' +
          '<td class="rs-col-st"><span class="rs-pill" style="--c:' + s[1] + '">' + s[0] + '</span></td></tr>';
      }).join('') : '<tr class="rs-empty"><td colspan="4">No roles match “' + esc(st.q) + '”</td></tr>';
    }
    on(search, 'input', function () { st.q = search.value; drawTable(false); });
    $$(root, '[data-rs-table] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () {
        var th = b.parentNode, key = th.getAttribute('data-sort');
        st.dir = st.sort === key ? -st.dir : -1; st.sort = key;
        $$(root, '[data-rs-table] th').forEach(function (h) { h.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', st.dir > 0 ? 'ascending' : 'descending');
        drawTable(false);
      });
    });

    /* --- team switch --- */
    var teamBtns = $$(root, '[data-team]'), ind = $(root, '.rs-teams-ind');
    function placeInd() {
      var b = teamBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0];
      if (!b || !ind) return;
      ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    on(window, 'resize', placeInd);
    teamBtns.forEach(function (b) { on(b, 'click', function () { setTeam(b.getAttribute('data-team')); }); });
    function setTeam(tid, intro) {
      var team = teamById(tid);
      if (!intro && st.team && st.team.id === team.id) { return; }
      fx.kill('team');
      st.team = team;
      teamBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-team') === team.id)); });
      placeInd();
      drawPipe(team, intro);
      drawKpis(team);
      drawDonut(team);
      drawHead(team);
      drawTable(true);
      set('[data-rs-teamname]', team.name);
      if (!intro) root.dispatchEvent(new CustomEvent('roster:team', { detail: { team: team.id } }));
    }

    /* --- theme + menu --- */
    var themeBtn = $(root, '[data-rs-theme]');
    function setTheme(t) {
      root.setAttribute('data-theme', t);
      if (themeBtn) {
        themeBtn.setAttribute('aria-pressed', String(t === 'light'));
        themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      }
    }
    on(themeBtn, 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    var menuBtn = $(root, '[data-rs-menu]'), scrim = $(root, '.rs-scrim');
    function menu(open) { root.classList.toggle('is-open', open); if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open)); }
    on(menuBtn, 'click', function () { menu(!root.classList.contains('is-open')); });
    on(scrim, 'click', function () { menu(false); });
    on(root, 'keydown', function (e) { if (e.key === 'Escape') menu(false); });

    setTheme(root.getAttribute('data-theme') || 'dark');
    setTeam(opts.team || root.getAttribute('data-roster') || data.teams[0].id, true);
    requestAnimationFrame(placeInd);

    var api = {
      el: root,
      data: data,
      setTeam: function (t) { setTeam(t); },
      get team() { return st.team.id; },
      setTheme: setTheme,
      replay: function () {
        st.kpi = {}; st.half = null; st.hc = null; st.src = null;
        setTeam(st.team.id, true);
      },
      destroy: function () {
        run++; clearTimeout(trickle); cancelAnimationFrame(praf); fx.stop(); off.forEach(function (f) { f(); });
        [pipe, donut, tr.svg, tr.tip].forEach(function (n) { if (n && n.parentNode) n.remove(); });
        stagesHost.innerHTML = '';
        delete root.__roster;
      }
    };
    root.__roster = api;
    return api;
  }

  function auto() {
    $$(document, '[data-roster]').forEach(function (el) {
      if (!el.hasAttribute('data-roster-manual')) mount(el, { team: el.getAttribute('data-roster') || undefined });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();

  window.Roster = { mount: mount, data: DATA, version: '1.0.0' };
})();
