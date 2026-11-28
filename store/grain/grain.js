/*! Grain · hourglass countdown timer · Kodehelix UI · kodehelix.in */
(function () {
  'use strict';
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var I_PLAY = SVG + '<path pathLength="1" d="M8.5 5.8v12.4l9.8-6.2z"/></svg>';
  var I_PAUSE = SVG + '<path pathLength="1" d="M9 6.5v11M15 6.5v11"/></svg>';
  var I_FLIP = SVG + '<path pathLength="1" d="M5.2 9.5A7.3 7.3 0 0 1 18 7.2l1.5 1.3M19.5 4v4.5H15M18.8 14.5A7.3 7.3 0 0 1 6 16.8l-1.5-1.3M4.5 20v-4.5H9"/></svg>';
  var I_RESET = SVG + '<path pathLength="1" d="M4.8 12.5a7.4 7.4 0 1 0 2.1-5.6L4.6 9.2M4.6 4.6v4.6h4.6"/></svg>';

  // ---- glass geometry (frame units, neck at 0,0, each bulb H tall) ----
  var FILL = 0.74, H = 100, NECK = 3.4, R = 50, CAPW = 41, BELLY = 0.6, POST = 57, CAPHW = 66, VIEW = 272;
  function hw(t) {
    if (t < 0.03) return NECK;
    if (t <= BELLY) return NECK + (R - NECK) * Math.sin(Math.PI / 2 * (t - 0.03) / (BELLY - 0.03));
    var u = (t - BELLY) / (1 - BELLY); return R - (R - CAPW) * u * u;
  }
  function bulb(sign) {
    var p = [], N = 40, i;
    for (i = 0; i <= N; i++) p.push([hw(i / N), -sign * i / N * H]);
    for (i = N; i >= 0; i--) p.push([-hw(i / N), -sign * i / N * H]);
    return { p: p, A: area(p) };
  }
  function area(p) {
    var s = 0, n = p.length, i, a, b;
    for (i = 0; i < n; i++) { a = p[i]; b = p[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; }
    return Math.abs(s) / 2;
  }
  function clip(p, gx, gy, c) { // keep the part with p·g >= c
    var o = [], n = p.length, i, a, b, da, db, k;
    for (i = 0; i < n; i++) {
      a = p[i]; b = p[(i + 1) % n];
      da = a[0] * gx + a[1] * gy - c; db = b[0] * gx + b[1] * gy - c;
      if (da >= 0) o.push(a);
      if ((da >= 0) !== (db >= 0)) { k = da / (da - db); o.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
    }
    return o;
  }
  function solve(p, gx, gy, target, lo, hi) {
    for (var i = 0; i < 24; i++) { var m = (lo + hi) / 2; if (area(clip(p, gx, gy, m)) > target) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function cone(u, e) { if (u >= 1) return 0; var t = Math.sqrt(1 + e * e); return (t - Math.sqrt(u * u + e * e)) / (t - e); }
  var TOP = bulb(1), BOT = bulb(-1);

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function clock(s) { s = Math.max(0, Math.ceil(s - 1e-6)); return two(Math.floor(s / 60)) + ':' + two(s % 60); }
  function words(s) {
    s = Math.max(0, Math.ceil(s - 1e-6)); var m = Math.floor(s / 60), r = s % 60, out = [];
    if (m) out.push(m + (m === 1 ? ' minute' : ' minutes'));
    if (r || !m) out.push(r + (r === 1 ? ' second' : ' seconds'));
    return out.join(' ');
  }
  function chipLabel(s) { return s < 60 ? s + ' s' : s % 60 ? clock(s) : s / 60 + ' min'; }

  function mount(root, opts) {
    opts = opts || {};
    if (root.__grain) root.__grain.destroy();
    var ds = root.dataset;
    var presets = opts.presets || (ds.presets ? ds.presets.split(',').map(Number) : [60, 300, 900, 1500]);
    var dur = Math.min(5999, Math.max(1, +(opts.duration || ds.duration || presets[1] || 300)));
    var title = opts.title != null ? opts.title : (ds.title || 'Focus timer');
    var sub = opts.subtitle != null ? opts.subtitle : (ds.subtitle || '');
    var loop = opts.loop != null ? !!opts.loop : ds.loop != null;
    var fire = function (n) { var f = opts[n]; if (typeof f === 'function') f.apply(null, [].slice.call(arguments, 1)); };

    root.classList.add('grain');
    root.innerHTML = '';
    var card = el('div', 'grain__card');
    var head = el('div', 'grain__head');
    var hg = el('div', 'grain__hg');
    if (title) hg.appendChild(el('p', 'grain__title')).textContent = title;
    if (sub) hg.appendChild(el('p', 'grain__sub')).textContent = sub;
    var pill = el('span', 'grain__pill', '<i></i><b>Ready</b>');
    head.appendChild(hg); head.appendChild(pill);
    var body = el('div', 'grain__body');
    var glass = el('div', 'grain__glass');
    var cv = el('canvas'); cv.setAttribute('aria-hidden', 'true');
    var ring = el('span', 'grain__ring');
    glass.appendChild(cv); glass.appendChild(ring);
    var side = el('div', 'grain__side');
    var time = el('div', 'grain__time'); time.setAttribute('role', 'timer');
    var wheels = [];
    for (var i = 0; i < 5; i++) {
      if (i === 2) { time.appendChild(el('span', 'grain__colon', ':')); continue; }
      var w = el('span', 'grain__w'), strip = el('span', 'grain__strip');
      for (var d = 0; d < 11; d++) strip.appendChild(el('span', null, String((19 - d) % 10)));
      w.appendChild(strip); time.appendChild(w); wheels.push(strip);
    }
    var of = el('p', 'grain__of');
    var chips = el('div', 'grain__presets'); chips.setAttribute('role', 'radiogroup'); chips.setAttribute('aria-label', 'Duration');
    var chipEls = presets.map(function (s) {
      var b = el('button', 'grain__chip'); b.type = 'button'; b.setAttribute('role', 'radio'); b.textContent = chipLabel(s);
      b.addEventListener('click', function () { api.set(s); b.focus(); });
      chips.appendChild(b); return b;
    });
    chips.addEventListener('keydown', function (e) {
      var k = e.key, i = chipEls.indexOf(document.activeElement); if (i < 0) return;
      var j = k === 'ArrowRight' || k === 'ArrowDown' ? i + 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? i - 1 : k === 'Home' ? 0 : k === 'End' ? chipEls.length - 1 : null;
      if (j == null) return; e.preventDefault(); j = (j + chipEls.length) % chipEls.length; chipEls[j].click();
    });
    var ctrls = el('div', 'grain__ctrls');
    var bFlip = el('button', 'grain__icon', I_FLIP); bFlip.type = 'button'; bFlip.setAttribute('aria-label', 'Flip the glass'); bFlip.title = 'Flip';
    var bGo = el('button', 'grain__go'); bGo.type = 'button';
    var bReset = el('button', 'grain__icon', I_RESET); bReset.type = 'button'; bReset.setAttribute('aria-label', 'Reset'); bReset.title = 'Reset';
    ctrls.appendChild(bFlip); ctrls.appendChild(bGo); ctrls.appendChild(bReset);
    side.appendChild(time); side.appendChild(of); if (presets.length) side.appendChild(chips); side.appendChild(ctrls);
    body.appendChild(glass); body.appendChild(side);
    var live = el('span', 'grain__sr'); live.setAttribute('aria-live', 'polite');
    card.appendChild(head); card.appendChild(body); card.appendChild(live);
    root.appendChild(card);

    // ---- state ----
    var st = 'ready', rem = dur, fU = 0, fL = 1, endAt = 0, after = null;
    var th = 0, om = 0, phi = 0, dipF = 0, heapF = 1, rush = null;
    var parts = [], sparks = [], raf = 0, last = 0, timers = [], shown = -1, goMode = '';
    var ctx = cv.getContext('2d'), col = {}, grainPat = null, size = 0;

    function colors() {
      var cs = getComputedStyle(root), g = function (n, f) { return cs.getPropertyValue(n).trim() || f; };
      col.a = g('--grain-sand', '#22C3EE'); col.b = g('--grain-sand-2', '#3B5BFF'); col.hi = g('--grain-sand-hi', '#C4F3FF');
      col.glass = g('--grain-glass', 'rgba(201,205,216,.42)'); col.cap = g('--grain-cap', '#1F2433'); col.post = g('--grain-post', '#3A4157');
    }
    function pattern() {
      var c = document.createElement('canvas'); c.width = c.height = 48; var x = c.getContext('2d'), s = 7;
      for (var i = 0; i < 260; i++) {
        s = (s * 9301 + 49297) % 233280; var r = s / 233280; s = (s * 9301 + 49297) % 233280; var q = s / 233280;
        x.fillStyle = i % 3 ? 'rgba(255,255,255,.55)' : 'rgba(0,0,20,.55)'; x.fillRect(Math.floor(r * 48), Math.floor(q * 48), 1, 1);
      }
      return ctx.createPattern(c, 'repeat');
    }
    function fit() {
      var w = cv.clientWidth || 280, dpr = Math.min(3, (window.devicePixelRatio || 1) * (+opts.pixelRatio || 1));
      if (Math.abs(w * dpr - size) < 1) return;
      size = Math.round(w * dpr); cv.width = cv.height = size; draw();
    }

    // ---- UI text ----
    function setDigits(s) {
      var c = clock(s).replace(':', '');
      for (var i = 0; i < 4; i++) roll(wheels[i], +c[i]);
    }
    // strip reads 9..0 then 9 again, so counting down from 0 to 9 keeps rolling the same way
    function roll(w, d) {
      var idx = 9 - d, prev = w.__d;
      clearTimeout(w.__t);
      if (prev === 0 && d === 9) {
        idx = 10;
        w.__t = setTimeout(function () { w.style.transition = 'none'; w.style.transform = 'translateY(0%)'; void w.offsetWidth; w.style.transition = ''; }, 600);
      }
      w.__d = d; w.style.transform = 'translateY(' + (-idx * 100 / 11) + '%)';
    }
    function tick(force) {
      var s = Math.max(0, Math.ceil(rem - 1e-6));
      if (s === shown && !force) return; shown = s; setDigits(s);
      time.setAttribute('aria-label', words(s) + ' left');
      if (!force) fire('onTick', s);
    }
    function ui() {
      var map = { ready: 'Ready', running: 'Running', paused: 'Paused', done: 'Time’s up', flipping: after === 'pause' ? 'Paused' : 'Flipping', rushing: 'Resetting' };
      pill.setAttribute('data-s', st === 'flipping' && after === 'pause' ? 'paused' : st);
      pill.querySelector('b').textContent = map[st];
      var mode = st === 'running' || (st === 'flipping' && after === 'run') ? 'pause' : st === 'paused' || (st === 'flipping' && after === 'pause') ? 'resume' : st === 'done' ? 'again' : 'start';
      if (mode !== goMode) {
        goMode = mode;
        bGo.innerHTML = (mode === 'pause' ? I_PAUSE : I_PLAY) + '<span>' + { start: 'Start', pause: 'Pause', resume: 'Resume', again: 'Again' }[mode] + '</span>';
      }
      root.classList.toggle('is-running', st === 'running');
      root.classList.toggle('is-done', st === 'done');
      of.textContent = 'of ' + clock(dur);
      chipEls.forEach(function (b, i) { var on = presets[i] === dur; b.setAttribute('aria-checked', on); b.tabIndex = on || (presets.indexOf(dur) < 0 && !i) ? 0 : -1; });
    }
    function say(t) { live.textContent = ''; timers.push(setTimeout(function () { live.textContent = t; }, 30)); }

    // ---- actions ----
    function flip(next) {
      if (st === 'flipping' || st === 'rushing') return;
      if (st === 'running') rem = Math.max(0, (endAt - performance.now()) / 1000);
      after = next; parts = [];
      if (RM.matches) { swap(); proceed(); return; }
      st = 'flipping'; om = 0; ui(); kick();
      fire('onFlip', dur - rem);
    }
    function swap() {
      var t = fU; fU = fL; fL = t; rem = fU * dur; th = phi = 0; om = 0; dipF = 0; heapF = 0;
    }
    function proceed() {
      if (after === 'run') { st = 'running'; endAt = performance.now() + rem * 1000; }
      else st = 'paused';
      after = null; ui(); tick(); kick();
    }
    function finish() {
      st = 'done'; rem = 0; fU = 0; fL = 1; ui(); tick();
      say('Time’s up');
      ring.classList.remove('is-on'); void ring.offsetWidth; ring.classList.add('is-on');
      if (!RM.matches) burst();
      fire('onDone');
      if (loop) timers.push(setTimeout(function () { if (st === 'done') api.start(); }, 1100));
    }
    function burst() {
      var py = peakY;
      for (var i = 0; i < 38; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 70 + Math.random() * 170;
        sparks.push({ x: (Math.random() - 0.5) * 10, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.6 + Math.random() * 0.5, r: 0.8 + Math.random() * 1.3 });
      }
      kick();
    }

    var api = {
      start: function () {
        if (st === 'running' || st === 'flipping' || st === 'rushing') return;
        if (st === 'paused') { st = 'running'; endAt = performance.now() + rem * 1000; ui(); kick(); say('Resumed'); fire('onStart', rem); return; }
        rem = dur; fU = 0; fL = 1; root.classList.remove('is-done'); tick(true);
        say('Started, ' + words(dur)); fire('onStart', dur);
        flip('run');
      },
      pause: function () {
        if (st === 'flipping') { if (after === 'run') { after = 'pause'; ui(); } return; }
        if (st !== 'running') return;
        rem = Math.max(0, (endAt - performance.now()) / 1000); st = 'paused'; ui(); say('Paused, ' + words(rem) + ' left'); fire('onPause', rem);
      },
      toggle: function () { if (st === 'running' || (st === 'flipping' && after === 'run')) api.pause(); else api.start(); },
      flip: function () {
        if (st === 'ready' || st === 'done') return api.start();
        if (st === 'running' || st === 'paused') { say('Flipped'); flip(st === 'running' ? 'run' : 'pause'); }
      },
      reset: function () {
        if (st === 'flipping') return;
        if (st === 'running' || st === 'paused') {
          if (st === 'running') rem = Math.max(0, (endAt - performance.now()) / 1000);
          if (RM.matches || fU < 0.002) { toReady(); return; }
          rush = { from: fU, t: 0 }; st = 'rushing'; ui(); kick(); return;
        }
        toReady();
      },
      set: function (s) {
        s = Math.min(5999, Math.max(1, Math.round(+s) || dur));
        dur = s; if (st === 'running' || st === 'paused' || st === 'rushing') { if (st !== 'rushing') api.reset(); else ui(); }
        else if (st === 'ready' || st === 'done') toReady(); else ui();
      },
      remaining: function () { return st === 'running' ? Math.max(0, (endAt - performance.now()) / 1000) : rem; },
      state: function () { return st; },
      destroy: function () {
        cancelAnimationFrame(raf); timers.forEach(clearTimeout); if (ro) ro.disconnect();
        root.innerHTML = ''; root.classList.remove('grain', 'is-running', 'is-done'); delete root.__grain;
      }
    };
    function toReady() { st = 'ready'; rem = dur; fU = 0; fL = 1; rush = null; ui(); tick(true); kick(); }

    bGo.addEventListener('click', api.toggle);
    bFlip.addEventListener('click', api.flip);
    bReset.addEventListener('click', api.reset);

    // ---- animation loop ----
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      var busy = false;
      if (st === 'running') {
        rem = Math.max(0, (endAt - now) / 1000); fU = rem / dur; fL = 1 - fU; tick();
        dipF = Math.min(1, dipF + dt / 0.9); heapF = Math.min(1, heapF + dt / 1.1);
        if (rem <= 0) finish();
        busy = true;
      } else if (st === 'rushing') {
        rush.t = Math.min(1, rush.t + dt / 0.75);
        var e = rush.t < 0.5 ? 2 * rush.t * rush.t : 1 - Math.pow(-2 * rush.t + 2, 2) / 2;
        fU = rush.from * (1 - e); fL = 1 - fU; dipF = Math.min(1, dipF + dt / 0.3); heapF = Math.min(1, heapF + dt / 0.3);
        if (rush.t >= 1) toReady(); busy = true;
      } else if (st === 'flipping') {
        om += (120 * (Math.PI - th) - 14.5 * om) * dt; th += om * dt;
        phi += (th - phi) * (1 - Math.exp(-dt / 0.07));
        if (Math.abs(Math.PI - th) < 0.004 && Math.abs(om) < 0.04) { swap(); proceed(); }
        busy = true;
      }
      busy = step(dt) || busy;
      draw();
      if (busy) raf = requestAnimationFrame(frame);
    }
    var peakY = H;
    function step(dt) {
      var flowing = (st === 'running' || st === 'rushing') && fU > 0.0005 && th === 0;
      if (flowing && !RM.matches) {
        var n = (st === 'rushing' ? 520 : 95) * dt + Math.random();
        for (var i = 0; i < Math.floor(n); i++) parts.push({ x: (Math.random() - 0.5) * NECK * 1.1, y: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 5, vy: 25 + Math.random() * 30, b: 0 });
      }
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j]; p.vy += (p.b ? 700 : 1100) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.b) { p.b -= dt; if (p.b <= 0) parts.splice(j, 1); continue; }
        if (p.y >= peakY - 0.5) {
          if (Math.random() < 0.28) { p.b = 0.22; p.y = peakY - 1; p.vy = -(25 + Math.random() * 45); p.vx = (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 40); }
          else parts.splice(j, 1);
        }
      }
      for (var k = sparks.length - 1; k >= 0; k--) {
        var s = sparks[k]; s.life += dt; s.vy += 260 * dt; s.vx *= 1 - 1.2 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.life >= s.max) sparks.splice(k, 1);
      }
      return parts.length > 0 || sparks.length > 0;
    }

    // ---- drawing ----
    function glassPath() {
      var N = 40, i;
      ctx.beginPath();
      for (i = 0; i <= N; i++) ctx.lineTo(hw(i / N), -i / N * H);
      for (i = N; i >= 0; i--) ctx.lineTo(-hw(i / N), -i / N * H);
      for (i = 0; i <= N; i++) ctx.lineTo(-hw(i / N), i / N * H);
      for (i = N; i >= 0; i--) ctx.lineTo(hw(i / N), i / N * H);
      ctx.closePath();
    }
    function polyPath(p) { ctx.beginPath(); for (var i = 0; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }
    function sand(B, f, kind, amt) {
      if (f <= 0.0004) return null;
      var gx = Math.sin(phi), gy = Math.cos(phi), tx = gy, ty = -gx, p = B.p, lo = 1e9, hi = -1e9, i;
      for (i = 0; i < p.length; i++) { var dd = p[i][0] * gx + p[i][1] * gy; if (dd < lo) lo = dd; if (dd > hi) hi = dd; }
      var T = f * FILL * B.A, c = solve(p, gx, gy, T, lo, hi);
      var cp = clip(p, gx, gy, c), smin = 1e9, smax = -1e9;
      for (i = 0; i < cp.length; i++) {
        if (Math.abs(cp[i][0] * gx + cp[i][1] * gy - c) < 0.01) { var s = cp[i][0] * tx + cp[i][1] * ty; if (s < smin) smin = s; if (s > smax) smax = s; }
      }
      if (smin > smax) { smin = -1; smax = 1; }
      var a = (smax - smin) / 2, sc = (smin + smax) / 2, m = 0;
      if (kind === 'heap') m = -amt * Math.min(19, a * 0.5) * Math.min(1, f / 0.06) * (1 - Math.pow(f, 4));
      else m = amt * Math.min(10, a * 0.34);
      var e = kind === 'heap' ? 0.12 : 0.3, w = a * (kind === 'heap' ? 0.94 : 0.72);
      var off = function (s) { return m * cone(Math.abs(s - sc) / w, e); };
      if (m) { var mu = 0; for (i = 0; i < 24; i++) mu += off(smin + (i + 0.5) / 24 * (smax - smin)); mu /= 24; c = solve(p, gx, gy, T + mu * 2 * a, lo, hi); }
      // filled region: everything beyond the surface curve, clipped by the bulb
      ctx.save(); polyPath(p); ctx.clip();
      ctx.beginPath();
      var S0 = smin - 40, S1 = smax + 40, N = 36, pts = [];
      for (i = 0; i <= N; i++) { var s2 = S0 + (S1 - S0) * i / N, o = c + off(s2); pts.push([s2 * tx + o * gx, s2 * ty + o * gy]); ctx.lineTo(pts[i][0], pts[i][1]); }
      ctx.lineTo(S1 * tx + (hi + 60) * gx, S1 * ty + (hi + 60) * gy); ctx.lineTo(S0 * tx + (hi + 60) * gx, S0 * ty + (hi + 60) * gy); ctx.closePath();
      var gr = ctx.createLinearGradient((c - 4) * gx, (c - 4) * gy, hi * gx, hi * gy);
      gr.addColorStop(0, col.hi); gr.addColorStop(0.18, col.a); gr.addColorStop(1, col.b);
      ctx.fillStyle = gr; ctx.fill();
      ctx.globalAlpha = 0.32; ctx.fillStyle = grainPat; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); for (i = 0; i <= N; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = col.hi; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.1; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.restore();
      return c + off(sc);
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function cap(y0, down) {
      var g = ctx.createLinearGradient(0, y0, 0, y0 + 12);
      g.addColorStop(0, down ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
      rr(-CAPHW, y0, CAPHW * 2, 12, 5); ctx.fillStyle = col.cap; ctx.fill(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();
    }
    function draw() {
      if (!size) return;
      if (!grainPat) grainPat = pattern();
      var W = size, D = W / VIEW, lift = st === 'flipping' ? 1 - 0.07 * Math.sin(Math.min(1, th / Math.PI) * Math.PI) : 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, W);
      ctx.setTransform(D * lift, 0, 0, D * lift, W / 2, W / 2); ctx.rotate(th);
      glassPath(); ctx.fillStyle = 'rgba(143,163,255,.055)'; ctx.fill();
      var u = Math.pow(Math.max(0, Math.cos(phi)), 3);
      sand(TOP, fU, 'dip', dipF * u);
      var pk = sand(BOT, fL, 'heap', heapF * u);
      peakY = pk == null ? H : pk;
      var flowing = (st === 'running' || st === 'rushing') && fU > 0.0005 && th === 0;
      if (flowing) {
        var gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 16); gl.addColorStop(0, 'rgba(196,243,255,.55)'); gl.addColorStop(1, 'rgba(34,195,238,0)');
        ctx.fillStyle = gl; ctx.fillRect(-16, -16, 32, 32);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((Math.random() - 0.5) * 0.4, peakY);
        ctx.strokeStyle = col.hi; ctx.globalAlpha = 0.8; ctx.lineWidth = st === 'rushing' ? 3.2 : 1.2; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = col.hi;
      for (var i = 0; i < parts.length; i++) { var p = parts[i]; ctx.globalAlpha = p.b ? Math.max(0, p.b / 0.22) : 0.9; ctx.fillRect(p.x - 0.65, p.y - 0.65, 1.3, 1.3); }
      ctx.globalAlpha = 1;
      // glass
      glassPath(); ctx.strokeStyle = col.glass; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.lineCap = 'round';
      [[-1, -1], [-1, 1]].forEach(function (q) {
        ctx.beginPath(); for (var i = 7; i <= 31; i++) { var t = i / 40; ctx.lineTo(q[0] * (hw(t) - 7), q[1] * t * H); }
        ctx.strokeStyle = 'rgba(255,255,255,.17)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); for (i = 16; i <= 26; i++) { t = i / 40; ctx.lineTo(-q[0] * (hw(t) - 5), q[1] * t * H); }
        ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1.6; ctx.stroke();
      });
      // frame
      [-1, 1].forEach(function (sx) {
        var g = ctx.createLinearGradient(sx * POST - 2, 0, sx * POST + 2, 0);
        g.addColorStop(0, col.post); g.addColorStop(0.5, 'rgba(255,255,255,.28)'); g.addColorStop(1, col.post);
        ctx.fillStyle = g; ctx.fillRect(sx * POST - 2, -H - 1, 4, 2 * H + 2);
      });
      cap(-H - 12, false); cap(H, true);
      // sparks
      for (i = 0; i < sparks.length; i++) {
        var s = sparks[i], k = 1 - s.life / s.max;
        ctx.globalAlpha = Math.max(0, k); ctx.fillStyle = i % 4 ? col.a : col.hi;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.6 + k * 0.6), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    colors();
    var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(cv); else addEventListener('resize', fit);
    ui(); tick(true); fit();
    api.refresh = function () { colors(); grainPat = null; draw(); };
    root.__grain = api;
    return api;
  }

  window.Grain = { mount: mount };
  function auto() {
    document.querySelectorAll('[data-grain]:not([data-grain-manual])').forEach(function (n) { if (!n.__grain) mount(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
