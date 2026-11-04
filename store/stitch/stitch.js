/* Stitch — a multi-step form stepper that sews each step to the next.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <div data-stitch data-title="Set up your shop">
       <section data-step="Profile"> ...fields... </section>
       <section data-step="Store"> ... </section>
       <section data-stitch-done> ...shown after Finish (optional)... </section>
     </div>
     const steps = Stitch.mount(el, { onChange: (step, finished) => {} });
   Elements with data-stitch mount themselves on DOMContentLoaded unless data-stitch-manual is set. */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mq = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var uid = 0;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var now = function () { return global.performance ? performance.now() : Date.now(); };
  var raf = global.requestAnimationFrame || function (f) { return setTimeout(function () { f(now()); }, 16); };

  function svg(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function kids(root, sel) { return [].filter.call(root.children, function (c) { return c.matches(sel); }); }

  function mount(root, opts) {
    if (root._stitch) return root._stitch;
    opts = opts || {};
    var d = root.dataset, id = 'stitch' + (++uid);
    var speed = +(opts.speed || d.speed || 1) || 1;
    var sections = kids(root, '[data-step]');
    var doneSec = kids(root, '[data-stitch-done]')[0];
    var labels = opts.steps || (sections.length ? sections.map(function (s) { return s.getAttribute('data-step'); }) : (d.steps || 'Account|Details|Review').split('|'));
    var n = Math.max(2, labels.length);
    var title = opts.title != null ? opts.title : d.title;
    var L = {
      next: opts.nextLabel || d.next || 'Continue', finish: opts.finishLabel || d.finish || 'Finish',
      back: opts.backLabel || d.back || 'Back', again: opts.restartLabel || d.restart || 'Start over'
    };
    var free = opts.free || 'free' in d;          // allow jumping ahead by clicking future steps

    // ---- build ----
    root.classList.add('stitch');
    if (!sections.length) sections = labels.map(function (l, i) {
      var s = document.createElement('section');
      s.innerHTML = '<h3>' + esc(l) + '</h3><p>Step ' + (i + 1) + ' of ' + n + '.</p>';
      return s;
    });
    if (!doneSec) {
      doneSec = document.createElement('section');
      doneSec.innerHTML = '<div class="stitch-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.6"/></svg><h3>All stitched up</h3><p>Everything is saved.</p></div>';
    }
    var head = document.createElement('div');
    head.innerHTML = (title ? '<p class="stitch__title" id="' + id + '-t">' + esc(title) + '</p>' : '') +
      '<ol class="stitch__steps" style="--stitch-n:' + n + '" aria-label="' + esc(opts.ariaLabel || 'Progress') + '">' +
      labels.map(function (l, i) {
        return '<li class="stitch__step"><button type="button" class="stitch__node"><span class="stitch__num" aria-hidden="true">' + (i + 1) +
          '</span></button><span class="stitch__label" aria-hidden="true">' + esc(l) + '</span></li>';
      }).join('') + '</ol>';
    var body = document.createElement('div'); body.className = 'stitch__body';
    sections.concat(doneSec).forEach(function (s, i) {
      s.classList.add('stitch__panel'); s.id = s.id || id + '-p' + i;
      s.setAttribute('role', 'group'); s.setAttribute('aria-label', i < n ? labels[i] : 'Done');
      body.appendChild(s);
    });
    var foot = document.createElement('div'); foot.className = 'stitch__foot';
    foot.innerHTML = '<span class="stitch__count" aria-hidden="true"></span><span class="stitch__btns">' +
      '<button type="button" class="stitch__btn stitch__btn--ghost" data-act="back">' + esc(L.back) + '</button>' +
      '<button type="button" class="stitch__btn" data-act="next"></button></span><span class="stitch__sr" aria-live="polite"></span>';
    root.innerHTML = '';
    while (head.firstChild) root.appendChild(head.firstChild);
    root.appendChild(body); root.appendChild(foot);

    var ol = root.querySelector('.stitch__steps');
    var stepEls = [].slice.call(ol.children), nodes = stepEls.map(function (li) { return li.firstChild; });
    var panels = sections.concat(doneSec);
    var countEl = foot.querySelector('.stitch__count'), sr = foot.querySelector('.stitch__sr');
    var backBtn = foot.querySelector('[data-act="back"]'), nextBtn = foot.querySelector('[data-act="next"]');

    // rail svg (behind the nodes)
    var track = svg('svg', { class: 'stitch__track', 'aria-hidden': 'true' });
    ol.insertBefore(track, ol.firstChild);
    var defs = svg('defs', {}, track);
    var tg = svg('linearGradient', { id: id + '-th', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 300, y2: 0 }, defs);
    svg('stop', { offset: 0, class: 'stitch__s1' }, tg); svg('stop', { offset: 1, class: 'stitch__s2' }, tg);
    var fg = svg('linearGradient', { id: id + '-f', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    svg('stop', { offset: 0, class: 'stitch__s1' }, fg); svg('stop', { offset: 1, class: 'stitch__s2' }, fg);
    var shg = svg('linearGradient', { id: id + '-sh', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, shg);
    svg('stop', { offset: .5, 'stop-color': '#fff', 'stop-opacity': .95 }, shg);
    svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, shg);
    var segs = [];
    for (var s = 0; s < n - 1; s++) segs.push({
      guide: svg('path', { class: 'stitch__guide' }, track),
      thread: svg('path', { class: 'stitch__thread', stroke: 'url(#' + id + '-th)' }, track),
      p: 0
    });
    var shine = svg('path', { class: 'stitch__shine', stroke: 'url(#' + id + '-sh)' }, track);
    var needle = svg('g', { class: 'stitch__needle', opacity: 0 }, track);
    svg('path', { d: 'M-3 -1.8L17 -.45Q20.5 0 17 .45L-3 1.8Q-5.2 0 -3 -1.8Z' }, needle);
    svg('ellipse', { cx: -.4, cy: 0, rx: 1.7, ry: .55 }, needle);

    // node graphics
    var N = nodes.map(function (b, i) {
      var g = svg('svg', { viewBox: '-25 -25 50 50', 'aria-hidden': 'true' });
      b.insertBefore(g, b.firstChild);
      var o = {
        ripple: svg('circle', { class: 'stitch__ripple', r: 19 }, g),
        ring: svg('circle', { class: 'stitch__ring', r: 18.2 }, g),
        fill: svg('circle', { class: 'stitch__fill', r: 19, fill: 'url(#' + id + '-f)' }, g),
        rim: svg('circle', { r: 14.6, fill: 'none', stroke: 'rgba(255,255,255,.3)', 'stroke-width': 1, 'stroke-dasharray': '2 2.4', opacity: 0 }, g),
        holes: [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]].map(function (h) { return svg('circle', { class: 'stitch__hole', cx: h[0], cy: h[1], r: 1.9 }, g); }),
        x1: svg('path', { class: 'stitch__x', d: 'M-4.4 -4.4L4.4 4.4', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, g),
        x2: svg('path', { class: 'stitch__x', d: 'M4.4 -4.4L-4.4 4.4', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, g),
        num: b.querySelector('.stitch__num'),
        done: 0, target: 0, pulse: -1e9, bump: -1e9
      };
      b.addEventListener('click', function () { if (!b.disabled) go(i); });
      return o;
    });

    // ---- state ----
    var cur = clamp01i(+(opts.start || d.start || 0)), finished = false;
    var vcur = cur;                       // the step the thread has visually reached
    var jobs = [], job = null, running = false, last = 0, wave = -1e9, destroyed = false;
    var geo = { w: 0, h: 0, c: [], y: 0, r: 19 };
    var panelAnim = null, shownPanel = cur;
    function clamp01i(v) { return Math.max(0, Math.min(n - 1, v | 0)); }
    function reduced() { return opts.reducedMotion != null ? opts.reducedMotion : !!(mq && mq.matches); }
    for (var k = 0; k < cur; k++) { segs[k].p = 1; N[k].done = N[k].target = 1; }

    function measure() {
      var r = ol.getBoundingClientRect(), k = ol.offsetWidth ? r.width / ol.offsetWidth : 1;   // k: CSS transform scale of ancestors
      if (!k) k = 1;
      geo.w = r.width / k; geo.h = r.height / k;
      geo.c = nodes.map(function (b) { var q = b.getBoundingClientRect(); return (q.left - r.left + q.width / 2) / k; });
      var q0 = nodes[0].getBoundingClientRect(); geo.y = (q0.top - r.top + q0.height / 2) / k; geo.r = q0.width / 2 / k;
      track.setAttribute('width', geo.w); track.setAttribute('height', geo.h);
      track.setAttribute('viewBox', '0 0 ' + geo.w + ' ' + geo.h);
      tg.setAttribute('x1', geo.c[0]); tg.setAttribute('x2', geo.c[n - 1]);
      segs.forEach(function (sg, i) {
        var a = ends(i);
        sg.guide.setAttribute('d', 'M' + a[0] + ' ' + geo.y + 'H' + a[1]);
      });
      draw(now());
    }
    function ends(i) { var g = geo.r + 4; return [geo.c[i] + g, geo.c[i + 1] - g]; }

    // ---- jobs: fwd i (sew segment i), back i (unpick segment i), fin, unfin ----
    function queue(type, i) { jobs.push({ type: type, i: i }); kick(); }
    function kick() { if (!running && !destroyed) { running = true; last = now(); raf(loop); } }
    function start(j, t) {
      var D = 980 / speed, fast = jobs.length > 0 ? .55 : 1;
      j.t0 = t;
      j.dur = reduced() ? 0 : (j.type === 'fwd' ? D : j.type === 'back' ? D * .5 : j.type === 'fin' ? 1300 / speed : 260 / speed) * fast;
      if (j.type === 'fwd') { N[j.i].target = 1; }
      if (j.type === 'back') { vcur = j.i; N[j.i].target = 0; }
      if (j.type === 'fin') { N[n - 1].target = 1; wave = t; }
      if (j.type === 'unfin') { N[n - 1].target = 0; }
      classes();
    }
    function end(j, t) {
      if (j.type === 'fwd') { segs[j.i].p = 1; vcur = j.i + 1; N[j.i + 1].pulse = t; }
      if (j.type === 'back') { segs[j.i].p = 0; N[j.i].pulse = t; }
      classes();
    }
    function loop(t) {
      if (destroyed) return;
      var dt = Math.min(64, t - last); last = t;
      if (!job && jobs.length) { job = jobs.shift(); start(job, t); }
      if (job && t - job.t0 >= job.dur) { end(job, t); job = jobs.length ? jobs.shift() : null; if (job) start(job, t); }
      var busy = !!job;
      N.forEach(function (o) {
        var rate = reduced() ? 1 : dt / (380 / speed);
        if (o.done < o.target) o.done = Math.min(o.target, o.done + rate);
        else if (o.done > o.target) o.done = Math.max(o.target, o.done - rate * 1.6);
        if (o.done !== o.target || t - o.pulse < 700 || t - o.bump < 600) busy = true;
      });
      if (t - wave < 1700) busy = true;
      if (panelAnim && t - panelAnim.t0 < panelAnim.dur) busy = true;
      draw(t);
      if (busy) raf(loop); else running = false;
    }

    // ---- render ----
    function draw(t) {
      var y = geo.y;
      needle.setAttribute('opacity', 0);
      segs.forEach(function (sg, i) {
        var a = ends(i), A = a[0], B = a[1], len = B - A, dd = '';
        var j = job && job.i === i && (job.type === 'fwd' || job.type === 'back') ? job : null;
        if (j) {
          var u = j.dur ? clamp((t - j.t0) / j.dur) : 1, P, sag, S = Math.min(11, len * .16);
          if (j.type === 'fwd') {
            var q = easeIO(clamp(u / .7));
            P = A + len * q;
            if (u < .7) sag = S * clamp(q * 5) * (1 - q * .35);
            else { var v = (u - .7) / .3; sag = S * .65 * Math.exp(-4.2 * v) * Math.cos(11 * v); if (v > .02 && N[i + 1].bump < j.t0) N[i + 1].bump = t; }
            if (u < .7) {
              var cx = (A + P) / 2, cy = y + sag * 2, ang = Math.atan2(y - cy, P - cx) + .32 * Math.sin(q * Math.PI * 7) * (1 - q);
              needle.setAttribute('transform', 'translate(' + P.toFixed(2) + ' ' + (y + Math.sin(q * Math.PI * 7) * 1.4).toFixed(2) + ') rotate(' + (ang * 57.2958).toFixed(2) + ') scale(1.3)');
              needle.setAttribute('opacity', clamp(q * 12));
            }
          } else {
            var b = easeIO(u); P = B - len * b; sag = Math.sin(u * Math.PI) * S * .9;
          }
          if (P - A > .5) dd = 'M' + A.toFixed(2) + ' ' + y + 'Q' + ((A + P) / 2).toFixed(2) + ' ' + (y + sag * 2).toFixed(2) + ' ' + P.toFixed(2) + ' ' + y;
        } else if (sg.p) dd = 'M' + A.toFixed(2) + ' ' + y + 'H' + B.toFixed(2);
        sg.thread.setAttribute('d', dd);
      });
      // finish: light runs along the whole seam, nodes bounce in a wave
      var w = (t - wave) / 1100;
      if (w >= 0 && w <= 1 && n > 1) {
        var x0 = geo.c[0], x1 = geo.c[n - 1], span = x1 - x0, hx = x0 - 60 + (span + 120) * easeIO(w);
        shine.setAttribute('d', 'M' + x0 + ' ' + y + 'H' + x1);
        shg.setAttribute('x1', hx - 60); shg.setAttribute('x2', hx + 60);
        shine.setAttribute('opacity', Math.sin(w * Math.PI) * .9);
      } else shine.setAttribute('opacity', 0);
      N.forEach(function (o, i) {
        var e = easeOut(o.done);
        o.fill.setAttribute('opacity', e);
        o.fill.setAttribute('r', (13 + 6 * e).toFixed(2));
        o.rim.setAttribute('opacity', e);
        o.holes.forEach(function (h) { h.setAttribute('opacity', clamp(o.done * 3 - .3)); });
        o.x1.setAttribute('stroke-dashoffset', (1 - easeOut(clamp(o.done * 2 - .45))).toFixed(3));
        o.x2.setAttribute('stroke-dashoffset', (1 - easeOut(clamp(o.done * 2 - 1.05))).toFixed(3));
        o.num.style.opacity = (1 - clamp(o.done * 2.5)).toFixed(3);
        o.num.style.transform = 'scale(' + (1 - .4 * clamp(o.done * 2.5)).toFixed(3) + ')';
        var p = (t - o.pulse) / 650;
        if (p >= 0 && p <= 1) { o.ripple.setAttribute('r', (19 + 10 * easeOut(p)).toFixed(2)); o.ripple.setAttribute('opacity', (.75 * (1 - p)).toFixed(3)); }
        else o.ripple.setAttribute('opacity', 0);
        var sc = 1, bp = (t - o.bump) / 520, wp = (t - wave - 160 - i * 95) / 460;
        if (bp >= 0 && bp <= 1) sc += .14 * Math.sin(bp * Math.PI) * (1 - bp * .5);
        if (wp >= 0 && wp <= 1) sc += .2 * Math.sin(wp * Math.PI);
        nodes[i].style.transform = sc !== 1 ? 'scale(' + sc.toFixed(3) + ')' : '';
      });
      // panels
      if (panelAnim) {
        var pa = panelAnim, k = pa.dur ? clamp((t - pa.t0) / pa.dur) : 1, e2 = easeOut(k), dx = 26 * pa.dir;
        if (pa.from !== pa.to) {
          panels[pa.from].style.opacity = (1 - clamp(k * 2.6)).toFixed(3);
          panels[pa.from].style.transform = 'translateX(' + (-dx * e2).toFixed(2) + 'px)';
        }
        panels[pa.to].style.opacity = clamp(k * 1.7 - .45).toFixed(3);
        panels[pa.to].style.transform = 'translateX(' + (dx * (1 - e2)).toFixed(2) + 'px)';
        if (k >= 1) {
          panels.forEach(function (p, i) { if (i !== pa.to) p.hidden = true; p.style.opacity = ''; p.style.transform = ''; });
          panelAnim = null;
        }
      }
    }

    function classes() {
      stepEls.forEach(function (li, i) {
        var done = i < vcur || (finished && i === n - 1 && N[i].target), current = i === vcur && !(finished && N[i].target);
        li.classList.toggle('is-done', !!done); li.classList.toggle('is-current', current);
        N[i].ring.style.stroke = current ? 'url(#' + id + '-f)' : '';
      });
    }

    function showPanel(to) {
      var from = shownPanel; if (from === to) return;
      shownPanel = to;
      panels.forEach(function (p, i) { p.hidden = i !== to && i !== from; p.setAttribute('aria-hidden', i === to ? 'false' : 'true'); if ('inert' in p) p.inert = i !== to; });
      panelAnim = { from: from, to: to, dir: to > from ? 1 : -1, t0: now(), dur: reduced() ? 0 : 420 / speed };
      kick();
    }

    function ui(announce) {
      var label = finished ? 'All done' : 'Step ' + (cur + 1) + ' of ' + n;
      countEl.textContent = label;
      nextBtn.textContent = finished ? L.again : cur === n - 1 ? L.finish : L.next;
      backBtn.disabled = cur === 0 && !finished;
      nodes.forEach(function (b, i) {
        var st = finished || i < cur ? 'completed' : i === cur ? 'current' : 'not started';
        b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + labels[i] + ', ' + st);
        if (i === cur && !finished) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.disabled = !(i <= cur || free || finished);
      });
      showPanel(finished ? n : cur);
      if (announce) {
        sr.textContent = finished ? 'All steps complete' : 'Step ' + (cur + 1) + ' of ' + n + ': ' + labels[cur];
        var detail = { step: cur, label: labels[cur], finished: finished };
        if (opts.onChange) opts.onChange(cur, finished);
        root.dispatchEvent(new CustomEvent('stitch:change', { bubbles: true, detail: detail }));
        if (finished) { if (opts.onFinish) opts.onFinish(); root.dispatchEvent(new CustomEvent('stitch:finish', { bubbles: true })); }
      }
    }

    // ---- public actions ----
    function canLeave() { return !opts.validate || opts.validate(cur, panels[cur]) !== false; }
    function next() {
      if (finished) return reset();
      if (!canLeave()) return;
      if (cur < n - 1) { cur++; queue('fwd', cur - 1); }
      else { finished = true; queue('fin'); }
      ui(true);
    }
    function back() {
      if (finished) { finished = false; queue('unfin'); }
      else if (cur > 0) { cur--; queue('back', cur); }
      else return;
      ui(true);
    }
    function go(i) {
      i = clamp01i(i);
      if (finished) { finished = false; queue('unfin'); }
      if (i > cur && !free) return ui(true);
      while (cur < i) { cur++; queue('fwd', cur - 1); }
      while (cur > i) { cur--; queue('back', cur); }
      ui(true);
    }
    function reset() {
      if (finished) { finished = false; queue('unfin'); }
      while (cur > 0) { cur--; queue('back', cur); }
      ui(true);
    }
    function onClick(e) {
      var act = e.target.closest && e.target.closest('[data-act]');
      if (!act || !foot.contains(act)) return;
      if (act.getAttribute('data-act') === 'next') next(); else back();
    }
    foot.addEventListener('click', onClick);

    var ro = global.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(ol); else global.addEventListener('resize', measure);
    panels.forEach(function (p, i) { p.hidden = i !== cur; p.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); if ('inert' in p) p.inert = i !== cur; });
    classes(); ui(false); measure();

    var api = {
      get step() { return cur; }, get finished() { return finished; }, get steps() { return labels.slice(); },
      next: next, back: back, go: go, reset: reset,
      destroy: function () { destroyed = true; foot.removeEventListener('click', onClick); if (ro) ro.disconnect(); else global.removeEventListener('resize', measure); delete root._stitch; }
    };
    root._stitch = api;
    return api;
  }

  global.Stitch = { mount: mount };
  function auto() { [].forEach.call(document.querySelectorAll('[data-stitch]:not([data-stitch-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
