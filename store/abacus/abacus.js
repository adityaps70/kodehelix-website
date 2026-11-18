/* Abacus — fisheye bead pagination · Kodehelix UI · kodehelix.in
   Abacus.mount(el, options) -> { go, next, prev, page, total, setTotal, destroy, root }
   Auto-mounts [data-abacus] on DOMContentLoaded unless data-abacus-manual is present.
   Every page is a bead on a rod. Beads near the current page swell into numbered beads,
   far ones shrink to dust. Changing page sends the glowing bead flying down the rod: the
   swell travels with it, beads hop and light up as it passes, and it lands with a clack. */
(function () {
  'use strict';
  var NS = 'abacus';
  var ICON = {
    prev: '<path d="M14.5 6.5L9 12l5.5 5.5"/>',
    next: '<path d="M9.5 6.5L15 12l-5.5 5.5"/>'
  };
  function svg(b) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b + '</svg>'; }
  function now() { return performance.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function inOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function mount(el, o) {
    if (!el) throw new Error('Abacus.mount: element missing');
    if (el.__abacus) return el.__abacus;
    o = o || {};
    var d = el.dataset || {};
    var N = Math.max(1, parseInt(o.total != null ? o.total : d.abacusTotal || 12, 10) || 1);
    var cur = clamp(parseInt(o.page != null ? o.page : d.abacusPage || 1, 10) || 1, 1, N);
    var perPage = o.perPage != null ? +o.perPage : (d.abacusPerPage ? +d.abacusPerPage : 0);
    var items = o.totalItems != null ? +o.totalItems : (d.abacusItems ? +d.abacusItems : 0);
    var spread = o.spread || 2.4;          // how many pages the swell reaches (sigma)
    var unit = o.itemLabel || 'results';
    var showCap = o.caption !== false;

    var root = document.createElement('nav');
    root.className = NS;
    root.setAttribute('aria-label', o.label || 'Pagination');
    root.innerHTML =
      (showCap ? '<div class="abacus__cap"><span class="abacus__now">Page <span class="abacus__roll"><i></i></span><span class="abacus__of"></span></span><span class="abacus__range"></span></div>' : '') +
      '<div class="abacus__frame">' +
        '<button type="button" class="abacus__post abacus__post--prev" aria-label="Previous page">' + svg(ICON.prev) + '</button>' +
        '<div class="abacus__rail">' +
          '<span class="abacus__rod" aria-hidden="true"></span>' +
          '<span class="abacus__trail" aria-hidden="true"></span>' +
          '<div class="abacus__beads" role="group" aria-label="Pages"></div>' +
          '<span class="abacus__ring" aria-hidden="true"></span>' +
          '<span class="abacus__puck" aria-hidden="true"><b></b></span>' +
          '<span class="abacus__end abacus__end--a" aria-hidden="true">1</span><span class="abacus__end abacus__end--b" aria-hidden="true"></span>' +
        '</div>' +
        '<button type="button" class="abacus__post abacus__post--next" aria-label="Next page">' + svg(ICON.next) + '</button>' +
      '</div>' +
      '<span class="abacus__sr" aria-live="polite"></span>';
    el.innerHTML = '';
    el.appendChild(root);

    var q = function (s) { return root.querySelector(s); };
    var rail = q('.abacus__rail'), beadsEl = q('.abacus__beads'), puck = q('.abacus__puck'), puckN = puck.firstChild;
    var trail = q('.abacus__trail'), ring = q('.abacus__ring'), sr = q('.abacus__sr');
    var prevB = q('.abacus__post--prev'), nextB = q('.abacus__post--next');
    var endA = q('.abacus__end--a'), endB = q('.abacus__end--b');
    var roll = q('.abacus__roll'), ofEl = q('.abacus__of'), rangeEl = q('.abacus__range');

    var beads = [], st = [];   // st[i]: { oy, vy, ox, vx, lit, s, x, label }
    var W = 300, H = 64, M = 38, BASE = 38;
    var f = cur, fly = null, drag = null, raf = 0, last = 0, xs = [], ws = [];
    var pk = { sx: 1, vsx: 0, ox: 0, vox: 0 };   // puck squash + nudge springs
    var lastLabel = 0, trailA = 0, trailFrom = 0;

    function build() {
      beadsEl.innerHTML = '';
      beads = []; st = [];
      for (var i = 1; i <= N; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'abacus__bead';
        b.dataset.page = i;
        b.tabIndex = -1;
        b.setAttribute('aria-label', 'Page ' + i);
        b.innerHTML = '<span>' + i + '</span>';
        beadsEl.appendChild(b);
        beads.push(b);
        st.push({ oy: 0, vy: 0, ox: 0, vx: 0, lit: 0, s: -1, small: null });
      }
      endB.textContent = N;
      if (ofEl) ofEl.textContent = ' of ' + fmt(N);
      mark();
    }

    function measure() {
      W = Math.max(60, rail.offsetWidth - 12);   // layout size: unaffected by CSS transforms on ancestors
      H = rail.offsetHeight || 64;
      var cs = getComputedStyle(root);
      M = parseFloat(cs.getPropertyValue('--abacus-bead')) || 38;
      M = Math.min(M, W / 3.2);
    }

    // fisheye layout around focus f -> xs (centre x of each bead), ws (slot width)
    function layout(fc) {
      var S = 0, g = [], i, sg = spread;
      for (i = 0; i < N; i++) { var dd = (i + 1 - fc) / sg; g[i] = Math.exp(-dd * dd); S += g[i]; }
      var Mx = M, m;
      if (N - S < 1e-3) m = Mx; else m = (W - Mx * S) / (N - S);
      if (m > Mx) m = Mx;
      var mMin = 1.4;
      if (m < mMin) { m = mMin; Mx = m + (W - N * m) / S; }
      var tot = 0;
      for (i = 0; i < N; i++) { ws[i] = m + (Mx - m) * g[i]; tot += ws[i]; }
      var x = 6 + (W - tot) / 2;
      for (i = 0; i < N; i++) { xs[i] = x + ws[i] / 2; x += ws[i]; }
    }
    function xAt(fc) {   // x of a fractional page on the current layout
      var i = Math.floor(fc) - 1, t = fc - Math.floor(fc);
      if (i < 0) return xs[0];
      if (i >= N - 1) return xs[N - 1];
      return xs[i] + (xs[i + 1] - xs[i]) * t;
    }
    function wAt(fc) {
      var i = Math.round(fc) - 1;
      return ws[clamp(i, 0, N - 1)];
    }
    function pageAtX(px) {   // fractional page under a rail x
      if (px <= xs[0]) return 1;
      for (var i = 0; i < N - 1; i++) if (px < xs[i + 1]) return i + 1 + (px - xs[i]) / (xs[i + 1] - xs[i]);
      return N;
    }

    function render() {
      layout(f);
      var cy = H / 2, i, b, s, sm;
      for (i = 0; i < N; i++) {
        var p = st[i];
        s = ws[i] / BASE;
        b = beads[i];
        b.style.transform = 'translate(' + (xs[i] + p.ox).toFixed(2) + 'px,' + (cy + p.oy).toFixed(2) + 'px) translate(-50%,-50%) scale(' + s.toFixed(4) + ')';
        if (Math.abs(p.lit - (p._l || 0)) > .01 || (p.lit === 0 && p._l)) { b.style.setProperty('--lit', p.lit.toFixed(3)); p._l = p.lit; }
        var cov = clamp(1.6 - Math.abs(i + 1 - f) * 1.7, 0, 1);   // number fades where the flying bead covers it
        if (cov !== (p._c || 0)) { b.firstChild.style.opacity = cov ? (1 - cov).toFixed(2) : ''; p._c = cov; }
        sm = s < .42 ? 2 : s < .6 ? 1 : 0;
        if (sm !== p.small) { p.small = sm; b.classList.toggle('is-dim', sm === 1); b.classList.toggle('is-dust', sm === 2); }
      }
      var px = xAt(f) + pk.ox, pw = Math.max(wAt(f), M * .9) / BASE * 1.06;
      puck.style.transform = 'translate(' + px.toFixed(2) + 'px,' + cy + 'px) translate(-50%,-50%) scale(' + (pw * pk.sx).toFixed(4) + ',' + (pw * (2 - pk.sx)).toFixed(4) + ')';
      var lab = clamp(Math.round(f), 1, N);
      if (lab !== lastLabel) { puckN.textContent = lab; lastLabel = lab; }
      // trail between the launch point and the flying bead
      if (trailA > .01) {
        var ax = xAt(trailFrom), len = px - ax;
        trail.style.opacity = trailA.toFixed(3);
        trail.style.transform = 'translate(' + ax.toFixed(2) + 'px,' + cy + 'px) scaleX(' + len.toFixed(2) + ')';
      } else trail.style.opacity = 0;
      // end labels hide when their bead is big enough to read itself
      endA.style.opacity = clamp((.62 - ws[0] / BASE) * 4, 0, 1).toFixed(2);
      endB.style.opacity = clamp((.62 - ws[N - 1] / BASE) * 4, 0, 1).toFixed(2);
    }

    function step(t) {
      var dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
      var busy = false, prevF = f;
      if (fly) {
        var k = clamp((t - fly.t0) / fly.dur, 0, 1);
        f = fly.a + (fly.b - fly.a) * inOut(k);
        if (k >= 1) { f = fly.b; land(fly); fly = null; }
        busy = true;
      } else if (drag && drag.moved) {
        f += (drag.tgt - f) * (1 - Math.exp(-dt * 16));
        busy = true;
      }
      // beads the flying bead passes over hop and light up
      if (f !== prevF && !reduce.matches) {
        var lo = Math.min(prevF, f), hi = Math.max(prevF, f), speed = Math.abs(f - prevF) / dt;
        for (var pg = Math.ceil(lo); pg <= Math.floor(hi); pg++) {
          if (pg === lo && lo === prevF) continue;
          var sp = st[pg - 1];
          if (!sp) continue;
          sp.lit = 1;
          sp.vy -= clamp(40 + speed * 9, 40, 260);
        }
      }
      // springs
      for (var i = 0; i < N; i++) {
        var p = st[i];
        if (p.oy || p.vy || p.ox || p.vx || p.lit) {
          p.vy += (-260 * p.oy - 15 * p.vy) * dt; p.oy += p.vy * dt;
          p.vx += (-300 * p.ox - 16 * p.vx) * dt; p.ox += p.vx * dt;
          p.lit = Math.max(0, p.lit - dt * 1.5);
          if (Math.abs(p.oy) < .02 && Math.abs(p.vy) < .2 && Math.abs(p.ox) < .02 && Math.abs(p.vx) < .2) { p.oy = p.vy = p.ox = p.vx = 0; }
          busy = true;
        }
      }
      pk.vsx += (-420 * (pk.sx - 1) - 18 * pk.vsx) * dt; pk.sx += pk.vsx * dt;
      pk.vox += (-380 * pk.ox - 17 * pk.vox) * dt; pk.ox += pk.vox * dt;
      if (Math.abs(pk.sx - 1) > .002 || Math.abs(pk.vsx) > .02 || Math.abs(pk.ox) > .05 || Math.abs(pk.vox) > .3) busy = true;
      else { pk.sx = 1; pk.vsx = 0; pk.ox = 0; pk.vox = 0; }
      if (trailA > 0) { if (!fly) trailA = Math.max(0, trailA - dt * 2.6); busy = true; }
      render();
      raf = busy ? requestAnimationFrame(step) : 0;
    }
    function kick() { if (!raf) { last = now(); raf = requestAnimationFrame(step); } }

    function land(fl) {
      if (reduce.matches) return;
      var dir = fl.b > fl.a ? 1 : -1, far = Math.abs(fl.b - fl.a);
      var hit = clamp(.5 + far / 10, .5, 1);
      pk.vsx += 5.5 * hit;                         // squash on impact
      for (var j = 1; j <= 3; j++) {               // clack: neighbours get knocked outwards
        var amp = (90 / j) * hit;
        var a = st[fl.b - 1 + j], b = st[fl.b - 1 - j];
        if (a) { a.vx += amp * (dir > 0 ? 1.35 : .7); a.vy -= amp * .25; }
        if (b) { b.vx -= amp * (dir > 0 ? .7 : 1.35); b.vy -= amp * .25; }
      }
      ring.classList.remove('is-on'); void ring.offsetWidth;
      ring.style.transform = 'translate(' + xAt(fl.b).toFixed(1) + 'px,' + (H / 2) + 'px) translate(-50%,-50%)';
      ring.classList.add('is-on');
      root.classList.remove('is-flying');
      if (o.onSettle) o.onSettle(fl.b);
    }

    function mark() {
      for (var i = 0; i < beads.length; i++) {
        var on = i + 1 === cur;
        beads[i].tabIndex = on ? 0 : -1;
        if (on) beads[i].setAttribute('aria-current', 'page'); else beads[i].removeAttribute('aria-current');
      }
      var aStart = cur <= 1, aEnd = cur >= N;
      prevB.setAttribute('aria-disabled', aStart); nextB.setAttribute('aria-disabled', aEnd);
      if (!showCap) return;
      if (perPage && items) {
        var a = (cur - 1) * perPage + 1, z = Math.min(items, cur * perPage);
        rangeEl.textContent = fmt(a) + '–' + fmt(z) + ' of ' + fmt(items) + ' ' + unit;
      } else rangeEl.textContent = '';
    }
    function rollTo(n, dir) {
      if (!roll) return;
      var old = roll.querySelector('i:last-child');
      var nw = document.createElement('i');
      nw.textContent = fmt(n);
      if (reduce.matches || !old || !old.textContent) { roll.innerHTML = ''; roll.appendChild(nw); return; }
      roll.querySelectorAll('i.out').forEach(function (x) { x.remove(); });
      old.className = 'out ' + (dir > 0 ? 'up' : 'down');
      nw.className = 'in ' + (dir > 0 ? 'up' : 'down');
      roll.appendChild(nw);
      setTimeout(function () { if (old.parentNode) old.remove(); nw.className = ''; }, 420);
    }

    function bump(dir) {   // pressed past an end: nudge into the post
      if (reduce.matches) return;
      pk.vox += 260 * dir;
      var post = dir > 0 ? nextB : prevB;
      post.classList.remove('is-bump'); void post.offsetWidth; post.classList.add('is-bump');
      kick();
    }

    function go(n, opt) {
      opt = opt || {};
      n = clamp(Math.round(+n) || 1, 1, N);
      if (n === cur && !fly) { if (opt.focus) beads[n - 1].focus(); return api; }
      var from = cur, a = f;
      cur = n;
      mark();
      rollTo(n, n > from ? 1 : -1);
      if (reduce.matches || opt.animate === false) {
        f = n; fly = null; trailA = 0; render();
      } else {
        var dist = Math.abs(n - a);
        fly = { a: a, b: n, t0: now(), dur: clamp(330 + 190 * Math.sqrt(dist), 360, 1150) };
        if (o.duration) fly.dur = o.duration;
        trailFrom = a; trailA = dist > 1.2 ? 1 : .6;
        root.classList.add('is-flying');
        kick();
      }
      if (opt.focus) beads[n - 1].focus({ preventScroll: true });
      announce(n, from);
      return api;
    }
    function announce(n, from) {
      sr.textContent = 'Page ' + n + ' of ' + N;
      if (o.onChange) o.onChange(n, { from: from, total: N });
      el.dispatchEvent(new CustomEvent('abacus:change', { detail: { page: n, from: from, total: N } }));
    }

    // events
    function onPost(dir) {
      return function () {
        var t = cur + dir;
        if (t < 1 || t > N) { bump(dir); return; }
        go(t);
      };
    }
    prevB.addEventListener('click', onPost(-1));
    nextB.addEventListener('click', onPost(1));

    function railX(cx) {   // client x -> rail x, correct even inside a scaled container
      var r = rail.getBoundingClientRect(), k = rail.offsetWidth ? r.width / rail.offsetWidth : 1;
      return (cx - r.left) / (k || 1);
    }
    var suppress = false;
    rail.addEventListener('click', function (e) {
      if (suppress) { suppress = false; return; }
      var b = e.target.closest && e.target.closest('.abacus__bead');
      var keyboardish = e.detail === 0;
      if (b && keyboardish) { go(+b.dataset.page, { focus: true }); return; }
      if (!e.clientX && !e.clientY && b) { go(+b.dataset.page); return; }
      go(Math.round(pageAtX(railX(e.clientX))), { focus: !!b && b === document.activeElement });
    });
    rail.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { id: e.pointerId, x0: e.clientX, moved: false, tgt: f, start: cur };
    });
    rail.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) < 6) return;
      if (!drag.moved) { drag.moved = true; fly = null; trailA = 0; root.classList.add('is-scrub'); try { rail.setPointerCapture(e.pointerId); } catch (x) {} }
      drag.tgt = clamp(pageAtX(railX(e.clientX)), 1, N);
      var lab = Math.round(drag.tgt);
      if (lab !== cur) { var fr = cur; cur = lab; mark(); rollTo(lab, lab > fr ? 1 : -1); }
      kick();
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var was = drag.moved, start = drag.start; drag = null;
      root.classList.remove('is-scrub');
      if (!was) return;
      suppress = true; setTimeout(function () { suppress = false; }, 0);
      var n = clamp(Math.round(f), 1, N);
      if (n !== cur) { rollTo(n, n > cur ? 1 : -1); cur = n; mark(); }
      fly = reduce.matches ? null : { a: f, b: n, t0: now(), dur: 240 };
      if (!fly) f = n;
      kick();
      if (n !== start) announce(n, start);
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);

    beadsEl.addEventListener('keydown', function (e) {
      var k = e.key, t = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') t = cur + 1;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') t = cur - 1;
      else if (k === 'Home') t = 1;
      else if (k === 'End') t = N;
      else if (k === 'PageDown') t = cur + 5;
      else if (k === 'PageUp') t = cur - 5;
      if (t == null) return;
      e.preventDefault();
      if (t < 1 || t > N) { bump(t < 1 ? -1 : 1); return; }
      go(t, { focus: true });
    });
    root.addEventListener('focusin', function (e) {
      var fv = false; try { fv = e.target.matches(':focus-visible'); } catch (x) {}
      root.classList.toggle('is-focus', fv && e.target.classList.contains('abacus__bead'));
    });
    root.addEventListener('focusout', function () { root.classList.remove('is-focus'); });

    var ro = window.ResizeObserver ? new ResizeObserver(function () { measure(); render(); }) : null;
    if (ro) ro.observe(rail); else window.addEventListener('resize', function () { measure(); render(); });

    build();
    measure();
    rollTo(cur, 1);
    render();

    var api = {
      root: root,
      go: go,
      next: function () { return onPost(1)(), api; },
      prev: function () { return onPost(-1)(), api; },
      page: function () { return cur; },
      total: function () { return N; },
      setTotal: function (n, opt) {
        N = Math.max(1, parseInt(n, 10) || 1);
        if (opt && opt.totalItems != null) items = +opt.totalItems;
        cur = clamp(cur, 1, N); f = cur; fly = null; lastLabel = 0;
        build(); measure(); render();
        return api;
      },
      destroy: function () { cancelAnimationFrame(raf); if (ro) ro.disconnect(); el.innerHTML = ''; delete el.__abacus; }
    };
    el.__abacus = api;
    return api;
  }

  function auto() {
    var els = document.querySelectorAll('[data-abacus]');
    for (var i = 0; i < els.length; i++) if (!els[i].hasAttribute('data-abacus-manual')) mount(els[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  window.Abacus = { mount: mount };
})();
