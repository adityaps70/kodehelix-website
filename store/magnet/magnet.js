/* Magnet — a call-to-action button that is pulled toward the pointer, with a spotlight,
   parallax label and arrow, and a shockwave on click.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <button class="magnet" data-magnet>Start a project</button>
     const m = Magnet.mount(btn, { strength: .35, radius: 110 });
     m.pointer(x, y); m.leave(); m.pulse();   // drive it yourself (client coordinates)
   Elements with data-magnet auto-mount on DOMContentLoaded unless data-magnet-manual is set. */
(function (global) {
  'use strict';
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };
  var backOut = function (t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var mq = global.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/></svg>';

  function el(tag, cls, parent) { var e = document.createElement(tag); e.className = cls; if (parent) parent.appendChild(e); return e; }

  function mount(btn, opts) {
    if (btn._magnet) return btn._magnet;
    opts = opts || {};
    var strength = +(opts.strength != null ? opts.strength : btn.getAttribute('data-strength')) || .35;
    var radius = +(opts.radius != null ? opts.radius : btn.getAttribute('data-radius')) || 110;
    var text = btn.getAttribute('data-label') || btn.textContent.trim() || 'Get started';
    btn.classList.add('magnet');
    btn.textContent = '';
    var glow = el('span', 'magnet__glow', btn);
    var body = el('span', 'magnet__body', btn);
    var surf = el('span', 'magnet__surface', body);
    var spot = el('span', 'magnet__spot', surf);
    var flash = el('span', 'magnet__flash', surf);
    var edge = el('span', 'magnet__edge', body);
    var rings = [el('span', 'magnet__ring', body), el('span', 'magnet__ring magnet__ring--2', body)];
    var label = el('span', 'magnet__label', body); label.textContent = text;
    var icon = el('span', 'magnet__icon', body); icon.innerHTML = ARROW;
    var arrow = icon.firstChild, path = arrow.firstChild;
    [glow, surf, edge, rings[0], rings[1], icon].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); });

    // spring state: offset (x,y) and press scale (s)
    var S = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, s: 1, vs: 0, ts: 1 };
    var spotA = 0, spotT = 0, pull = 0, mx = 0, my = 0;
    var tPulse = -9, fx = 0, fy = 0, raf = 0, last = 0;

    function pointer(px, py) {
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = px - cx, dy = py - cy;
      var ex = Math.max(0, Math.abs(dx) - r.width / 2), ey = Math.max(0, Math.abs(dy) - r.height / 2);
      var f = clamp(1 - Math.hypot(ex, ey) / radius); f = f * f * (3 - 2 * f);
      var k = strength * (mq.matches ? .25 : 1) * f, M = r.height * .55;
      S.tx = M * Math.tanh(dx * k / M); S.ty = M * .8 * Math.tanh(dy * k / (M * .8));
      pull = f;
      mx = px - (r.left + S.x); my = py - (r.top + S.y);
      var inside = ex < 14 && ey < 14;
      spotT = inside ? 1 : f * .35;
      kick();
    }
    function leave() { S.tx = 0; S.ty = 0; spotT = 0; pull = 0; S.ts = 1; kick(); }
    function pulse(px, py) {
      var r = btn.getBoundingClientRect();
      if (px == null) { fx = r.width / 2; fy = r.height / 2; }
      else { fx = px - (r.left + S.x); fy = py - (r.top + S.y); }
      tPulse = performance.now(); S.vs -= mq.matches ? 0 : 2.6; S.ts = 1; kick();
    }

    function step(now) {
      raf = 0;
      var dt = last ? Math.min(.034, (now - last) / 1000) : 1 / 60; last = now;
      var k = 190, c = 15;
      S.vx += (k * (S.tx - S.x) - c * S.vx) * dt; S.x += S.vx * dt;
      S.vy += (k * (S.ty - S.y) - c * S.vy) * dt; S.y += S.vy * dt;
      S.vs += (420 * (S.ts - S.s) - 22 * S.vs) * dt; S.s += S.vs * dt;
      spotA += (spotT - spotA) * Math.min(1, dt * 10);
      var w = btn.offsetWidth || 1, h = btn.offsetHeight || 1, red = mq.matches;
      var rx = red ? 0 : -S.y / h * 9, ry = red ? 0 : S.x / w * 9;
      body.style.transform = 'translate3d(' + S.x.toFixed(2) + 'px,' + S.y.toFixed(2) + 'px,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + S.s.toFixed(4) + ')';
      glow.style.transform = 'translate3d(' + (S.x * .55).toFixed(2) + 'px,' + (S.y * .4 + 4).toFixed(2) + 'px,0) scale(' + (1 + pull * .08).toFixed(3) + ')';
      glow.style.opacity = (.55 + .45 * pull).toFixed(3);
      label.style.transform = 'translate3d(' + (S.x * .1).toFixed(2) + 'px,' + (S.y * .12).toFixed(2) + 'px,0)';
      icon.style.transform = 'translate3d(' + (S.x * .17).toFixed(2) + 'px,' + (S.y * .22).toFixed(2) + 'px,0)';
      body.style.setProperty('--magnet-mx', mx.toFixed(1) + 'px');
      body.style.setProperty('--magnet-my', my.toFixed(1) + 'px');
      spot.style.opacity = edge.style.opacity = spotA.toFixed(3);

      // click: shockwave rings, flash, arrow shoots out right and re-enters from the left
      var p = (now - tPulse) / 1000, active = p < 1.1;
      rings.forEach(function (ring, i) {
        var q = clamp((p - i * .07) / (red ? .5 : .75));
        var on = active && q > 0 && q < 1;
        ring.style.opacity = on ? (Math.pow(1 - q, 1.6) * (i ? .55 : .95)).toFixed(3) : 0;
        var g = easeOut(q) * h * (red ? .25 : i ? .7 : .55);
        ring.style.inset = on ? (-g).toFixed(1) + 'px' : '0px';
      });
      var fq = clamp(p / .5);
      flash.style.opacity = active && fq < 1 ? ((1 - fq) * .9).toFixed(3) : 0;
      flash.style.transform = 'translate(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px) scale(' + (.2 + easeOut(fq) * 3.2).toFixed(3) + ')';
      var ax = 0, sx = 1, op = 1, draw = 0;
      if (active && p < .72) {
        var out = .26;
        if (red) { op = Math.abs(1 - p / .36); if (p > .36) draw = 1 - easeOut(clamp((p - .36) / .36)); }
        else if (p < out) { var a = easeIn(p / out); ax = a * h * .55; sx = 1 + a * .9; op = 1 - a; }
        else { var b = clamp((p - out) / (.72 - out)); ax = -h * .45 * (1 - backOut(b)); draw = 1 - easeOut(clamp(b * 1.4)); op = clamp(b * 4); }
      }
      arrow.style.transform = 'translateX(' + ax.toFixed(2) + 'px) scaleX(' + sx.toFixed(3) + ')';
      arrow.style.opacity = op.toFixed(3);
      path.style.strokeDashoffset = draw.toFixed(3);
      if (opts.onMove) opts.onMove({ x: S.x, y: S.y, pull: pull });

      var moving = Math.abs(S.x - S.tx) + Math.abs(S.y - S.ty) + Math.abs(S.vx) + Math.abs(S.vy) > .02 ||
        Math.abs(S.s - S.ts) + Math.abs(S.vs) > .0005 || Math.abs(spotA - spotT) > .003 || active;
      if (moving) raf = requestAnimationFrame(step); else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }

    // real input → the same controller
    function onMove(e) { if (e.pointerType !== 'touch') pointer(e.clientX, e.clientY); }
    function onOut(e) { if (!e.relatedTarget) leave(); }
    function onDown(e) { if (e.button === 0) { S.ts = .965; kick(); } }
    function onUp() { S.ts = 1; kick(); }
    function onClick(e) { if (e.detail === 0) pulse(); else pulse(e.clientX, e.clientY); }
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut);
    btn.addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    btn.addEventListener('click', onClick);
    btn.addEventListener('blur', function () { if (!btn.matches(':hover')) leave(); });

    var api = {
      el: btn, pointer: pointer, leave: leave, pulse: pulse,
      center: function () { var r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; },
      destroy: function () {
        cancelAnimationFrame(raf);
        document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerout', onOut);
        removeEventListener('pointerup', onUp); btn.removeEventListener('pointerdown', onDown); btn.removeEventListener('click', onClick);
        btn.textContent = text; delete btn._magnet;
      }
    };
    btn._magnet = api;
    kick();
    return api;
  }

  function auto() {
    document.querySelectorAll('[data-magnet]:not([data-magnet-manual])').forEach(function (e) { mount(e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  global.Magnet = { mount: mount };
})(window);
