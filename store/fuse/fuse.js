/* Fuse — a to-do checklist where ticking a task lights a fuse that burns through it.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <ul data-fuse data-title="Launch checklist">
       <li data-tag="Today">Run the smoke tests</li>
       <li data-done>Freeze the release branch</li>
     </ul>
     const list = Fuse.mount(el, { onChange: s => console.log(s) });
   Elements with data-fuse mount themselves on DOMContentLoaded unless data-fuse-manual is set. */
(function (global) {
  'use strict';
  var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var fuseEase = function (t) { return t < .15 ? Math.pow(t / .15, 2) * .06 : .06 + (t - .15) / .85 * .94; }; // catches, then runs
  var back = function (t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 12.5l3.6 3.6L17.5 8.6"/></svg>';
  var DONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.6"/></svg>';
  var uid = 0;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function mount(root, opts) {
    if (root._fuse) return root._fuse;
    opts = opts || {};
    var d = root.dataset;
    var speed = +(opts.speed || d.speed || 1) || 1;
    var sink = opts.sink != null ? !!opts.sink : d.sink !== 'false';
    var title = opts.title != null ? opts.title : (d.title || 'Checklist');
    var sub = opts.subtitle != null ? opts.subtitle : d.subtitle;
    var doneText = opts.doneText || d.doneText || 'All clear';
    var id = 'fuse' + (++uid);
    var src = opts.items || [].map.call(root.querySelectorAll('li'), function (li) {
      return { text: li.textContent.trim(), tag: li.dataset.tag, tone: li.dataset.tone, done: 'done' in li.dataset };
    });

    var host = root;
    if (root.tagName === 'UL' || root.tagName === 'OL') {          // swap a plain list for a div wrapper
      host = document.createElement('div');
      host.id = root.id; host.className = root.className;
      if (root.getAttribute('style')) host.setAttribute('style', root.getAttribute('style'));
      for (var k in d) host.dataset[k] = d[k];
      root.parentNode.replaceChild(host, root);
    }
    host.classList.add('fuse');
    host.innerHTML =
      '<div class="fuse__head"><div class="fuse__hd"><p class="fuse__title" id="' + id + '-t">' + esc(title) + '</p>' +
      (sub ? '<p class="fuse__sub">' + esc(sub) + '</p>' : '') + '</div>' +
      '<div class="fuse__count" aria-hidden="true"><span class="fuse__roll"><b></b><b></b></span><span class="fuse__of"></span></div>' +
      '<span class="fuse__clear" aria-hidden="true">' + DONE + '<span>' + esc(doneText) + '</span></span></div>' +
      '<div class="fuse__meter" aria-hidden="true"><i class="fuse__fill"></i></div>' +
      '<ul class="fuse__list" aria-labelledby="' + id + '-t"></ul>' +
      '<canvas class="fuse__embers" aria-hidden="true"></canvas><span class="fuse__sr" aria-live="polite"></span>';

    var list = host.querySelector('.fuse__list'), fill = host.querySelector('.fuse__fill');
    var meter = host.querySelector('.fuse__meter'), rollEl = host.querySelector('.fuse__roll');
    var rollB = rollEl.children, ofEl = host.querySelector('.fuse__of'), sr = host.querySelector('.fuse__sr');
    var canvas = host.querySelector('.fuse__embers'), ctx = canvas.getContext('2d');
    var items = [], tasks = [], parts = [], raf = 0, dpr = 1, cw = 0, ch = 0, fillP = 0, shown = 0, alive = true;

    function makeItem(it, i) {
      var li = document.createElement('li');
      li.className = 'fuse__item';
      li.innerHTML = '<button type="button" class="fuse__row" role="checkbox" aria-checked="false" data-i="' + i + '">' +
        '<span class="fuse__box">' + CHECK + '<i class="fuse__ring"></i></span>' +
        '<span class="fuse__text"><span class="fuse__label">' + esc(it.text) + '</span><i class="fuse__line"></i><i class="fuse__glow"></i><i class="fuse__spark"></i></span>' +
        (it.tag ? '<span class="fuse__tag"' + (it.tone ? ' data-tone="' + esc(it.tone) + '"' : '') + '>' + esc(it.tag) + '</span>' : '') +
        '</button>';
      list.appendChild(li);
      var b = li.firstChild, q = function (s) { return li.querySelector(s); };
      var o = { i: i, text: it.text, done: false, li: li, btn: b, box: q('.fuse__box'), label: q('.fuse__label'),
        line: q('.fuse__line'), glow: q('.fuse__glow'), spark: q('.fuse__spark'), ring: q('.fuse__ring'),
        path: q('.fuse__box path'), task: null, p: 0 };
      b.addEventListener('click', function () { toggle(o.i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, rows = [].slice.call(list.querySelectorAll('.fuse__row')), at = rows.indexOf(b), to = -1;
        if (k === 'ArrowDown') to = Math.min(rows.length - 1, at + 1);
        else if (k === 'ArrowUp') to = Math.max(0, at - 1);
        else if (k === 'Home') to = 0; else if (k === 'End') to = rows.length - 1;
        if (to > -1) { e.preventDefault(); rows[to].focus(); }
      });
      items.push(o);
      paint(o, it.done ? 1 : 0, it.done);
      if (it.done) { o.done = true; b.setAttribute('aria-checked', 'true'); li.classList.add('is-done'); }
      return o;
    }

    function width(o) { return Math.max(8, Math.min(o.label.scrollWidth, o.label.clientWidth || o.label.scrollWidth)); }

    // draw the burn at progress p (0..1); lit = spark visible
    function paint(o, p, check, lit) {
      o.p = p;
      var w = width(o), x = w * p;
      o.line.style.width = x + 'px';
      o.label.style.setProperty('--fuse-x', x + 'px');
      o.glow.style.transform = 'translateX(' + (x - 34) + 'px)';
      o.glow.style.opacity = lit ? 1 : 0;
      o.spark.style.opacity = lit ? 1 : 0;
      o.spark.style.transform = 'translate(' + x + 'px,-50%) scale(' + (lit ? .85 + Math.random() * .35 : .4) + ')';
      if (check != null) o.path.style.strokeDashoffset = check ? 0 : 20;
    }

    function rows() { return items.slice().sort(function (a, b) { return a.li.compareDocumentPosition(b.li) & 4 ? -1 : 1; }); }
    function count() { return items.filter(function (o) { return o.done; }).length; }
    function settled() { return items.filter(function (o) { return o.done && !o.burning; }).length; }

    // ---------- tiny animation engine (rAF + performance.now so it follows any virtual clock) ----------
    function tween(dur, step, done) {
      var t = { s: performance.now(), d: Math.max(1, dur / speed), step: step, done: done, dead: false };
      tasks.push(t); loop(); return t;
    }
    function kill(t) { if (t) t.dead = true; }
    function loop() { if (!raf && alive) raf = requestAnimationFrame(frame); }
    function frame() {
      raf = 0;
      var now = performance.now(), run = tasks, ended = [];
      tasks = [];                                   // tasks started inside callbacks land in the fresh list
      run.forEach(function (t) {
        if (t.dead) return;
        var k = clamp((now - t.s) / t.d);
        t.step(k);
        if (k >= 1) { t.dead = true; ended.push(t); } else tasks.push(t);
      });
      ended.forEach(function (t) { if (t.done) t.done(); });
      drawEmbers();
      if (tasks.length || parts.length) loop();
    }

    // ---------- embers ----------
    function size() {
      dpr = Math.min(2, global.devicePixelRatio || 1);
      cw = host.clientWidth; ch = host.clientHeight;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    }
    function emit(x, y, n, power) {
      for (var j = 0; j < n; j++) {
        var a = -Math.PI / 2 + (Math.random() - .5) * (power > 1 ? 6.2 : 2.6), v = (.4 + Math.random() * 1.6) * power;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v - (power > 1 ? 0 : .5), vy: Math.sin(a) * v, life: 0,
          max: 26 + Math.random() * 30, r: .7 + Math.random() * 1.3 });
      }
    }
    function drawEmbers() {
      if (!cw) size();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'lighter';
      parts = parts.filter(function (p) {
        p.life++; p.vy += .055; p.vx *= .985; p.x += p.vx; p.y += p.vy;
        var k = p.life / p.max;
        if (k >= 1) return false;
        var c = k < .3 ? '255,231,168' : k < .65 ? '255,176,32' : '255,90,110';
        ctx.fillStyle = 'rgba(' + c + ',' + (1 - k) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k * .5), 0, 6.283); ctx.fill();
        return true;
      });
      ctx.globalCompositeOperation = 'source-over';
    }
    function zoom() { var h = host.getBoundingClientRect(); return { h: h, z: (h.width / (host.offsetWidth || 1)) || 1 }; }
    function at(el, fx) {                       // local (unscaled) coords, so a transformed parent is fine
      var r = el.getBoundingClientRect(), m = zoom();
      return { x: (r.left - m.h.left) / m.z + (fx == null ? r.width / m.z / 2 : fx), y: (r.top - m.h.top + r.height / 2) / m.z };
    }

    // ---------- counter + meter ----------
    function roll(n, animate) {
      var total = items.length;
      ofEl.textContent = '/' + total;
      var from = shown; shown = n;
      if (from === n) animate = false;
      rollB[0].textContent = from; rollB[1].textContent = n;
      var dir = n > from ? 1 : -1;
      if (!animate) { rollB[0].textContent = n; rollB[0].style.transform = ''; rollB[1].style.transform = 'translateY(110%)'; }
      else tween(380, function (k) {
        var e = back(k);
        rollB[0].style.transform = 'translateY(' + (-dir * 110 * e) + '%)';
        rollB[1].style.transform = 'translateY(' + (dir * 110 * (1 - e)) + '%)';
      }, function () { rollB[0].textContent = n; rollB[0].style.transform = ''; rollB[1].style.transform = 'translateY(110%)'; });
      var to = total ? n / total : 0, f0 = fillP;
      if (!animate) { fillP = to; fill.style.transform = 'scaleX(' + to + ')'; }
      else tween(620, function (k) { fillP = f0 + (to - f0) * easeOut(k); fill.style.transform = 'scaleX(' + fillP + ')'; });
      var all = total && n === total;
      if (all !== host.classList.contains('is-clear')) {
        host.classList.toggle('is-clear', all);
        if (all && animate) celebrate();
      }
    }
    function celebrate() {
      if (reduce && reduce.matches) return;
      var m = zoom(), x0 = meter.offsetLeft, y = meter.offsetTop + meter.offsetHeight / 2, r = { width: meter.offsetWidth };
      host.classList.remove('is-flash'); void host.offsetWidth; host.classList.add('is-flash');
      tween(700, function (k) { if (Math.random() < .9) emit(x0 + r.width * easeOut(k), y, 2, .7); },
        function () { emit(x0 + r.width, y, 46, 2.4); });
    }

    // ---------- move finished tasks to the bottom (FLIP) ----------
    function reorder(o) {
      if (!sink) return;
      var open = rows().filter(function (x) { return !x.done && x !== o; });
      var later = o.done ? null : open.filter(function (x) { return x.i > o.i; })[0];  // reopened tasks go back to their place
      var target = later ? later.li : open.length ? open[open.length - 1].li.nextSibling : list.firstChild;
      if (target === o.li) return;
      var before = items.map(function (x) { return x.li.getBoundingClientRect().top; });
      var hadFocus = document.activeElement === o.btn;
      list.insertBefore(o.li, target);
      if (hadFocus) o.btn.focus({ preventScroll: true });
      if (reduce && reduce.matches) return;
      items.forEach(function (x, j) {
        var dy = before[j] - x.li.getBoundingClientRect().top;
        if (Math.abs(dy) < 1) return;
        kill(x.flip);
        x.li.style.zIndex = x === o ? 2 : '';
        x.flip = tween(520, function (k) {
          var e = back(k);
          x.li.style.transform = 'translateY(' + dy * (1 - e) + 'px)' + (x === o ? ' scale(' + (1 + .025 * Math.sin(k * Math.PI)) + ')' : '');
        }, function () { x.li.style.transform = ''; x.li.style.zIndex = ''; });
      });
    }

    function announce(o) {
      var n = count();
      sr.textContent = (o.done ? 'Done: ' : 'Reopened: ') + o.text + '. ' + n + ' of ' + items.length + ' done.';
      var detail = { index: o.i, text: o.text, done: o.done, count: n, total: items.length };
      if (opts.onChange) opts.onChange(detail);
      host.dispatchEvent(new CustomEvent('fuse:change', { bubbles: true, detail: detail }));
    }

    function set(i, on) {
      var o = items[i];
      if (!o || o.done === !!on) return;
      o.done = !!on;
      o.burning = o.done;
      o.btn.setAttribute('aria-checked', String(o.done));
      o.li.classList.toggle('is-done', o.done);
      kill(o.task); kill(o.wait);
      var calm = reduce && reduce.matches;
      announce(o);
      if (calm) { o.burning = false; paint(o, o.done ? 1 : 0, o.done); roll(settled(), false); reorder(o); return; }

      if (o.done) {
        var w = width(o), p0 = o.p;
        var dur = Math.min(1300, Math.max(760, w * 4.2)) * (1 - p0);
        o.li.classList.add('is-lit');
        pulse(o, 'is-catch');
        o.task = tween(dur, function (k) {
          var p = p0 + (1 - p0) * fuseEase(k);
          paint(o, p, null, true);
          var s = at(o.label, w * p);
          if (Math.random() < .85) emit(s.x, s.y, 2, 1);
        }, function () {
          paint(o, 1, null, false);
          o.burning = false;
          o.li.classList.remove('is-lit');
          var s = at(o.label, w); emit(s.x, s.y, 10, 1.3);
          pulse(o, 'is-pop');
          o.task = tween(260, function (k) { o.path.style.strokeDashoffset = 20 * (1 - easeOut(k)); });
          roll(settled(), true);
          o.wait = tween(300, function () {}, function () { if (o.done) reorder(o); });
        });
      } else {
        var q0 = o.p;
        o.li.classList.remove('is-lit');
        o.task = tween(320 * Math.max(.3, q0), function (k) {
          paint(o, q0 * (1 - easeOut(k)), null, false);
          o.path.style.strokeDashoffset = 20 * easeOut(k);
        }, function () { paint(o, 0, false); });
        roll(settled(), true);
        o.wait = tween(220, function () {}, function () { if (!o.done) reorder(o); });
      }
    }
    function pulse(o, cls) { o.li.classList.remove(cls); void o.li.offsetWidth; o.li.classList.add(cls); }
    function toggle(i) { var o = items[i]; if (o) set(i, !o.done); }

    src.forEach(makeItem);
    roll(count(), false);
    // finished items start at the bottom
    if (sink) rows().filter(function (o) { return o.done; }).forEach(function (o) { list.appendChild(o.li); });

    var onResize = function () { size(); items.forEach(function (o) { paint(o, o.p, null, false); }); };
    global.addEventListener('resize', onResize);
    if (global.ResizeObserver) { var ro = new ResizeObserver(function () { size(); }); ro.observe(host); }
    requestAnimationFrame(onResize);

    var api = {
      get done() { return count(); },
      get total() { return items.length; },
      items: function () { return items.map(function (o) { return { text: o.text, done: o.done }; }); },
      check: function (i) { set(i, true); },
      uncheck: function (i) { set(i, false); },
      toggle: toggle,
      next: function () { var o = rows().filter(function (x) { return !x.done; })[0]; if (o) set(o.i, true); return o ? o.i : -1; },
      reset: function () { items.forEach(function (o) { set(o.i, false); }); },
      add: function (text, tag, tone) {
        var o = makeItem({ text: text, tag: tag, tone: tone }, items.length);
        var open = rows().filter(function (x) { return !x.done && x !== o; });
        list.insertBefore(o.li, open.length ? open[open.length - 1].li.nextSibling : list.firstChild);
        requestAnimationFrame(function () { paint(o, 0, false); });
        roll(count(), true); return o.i;
      },
      destroy: function () {
        alive = false; cancelAnimationFrame(raf); global.removeEventListener('resize', onResize);
        if (ro) ro.disconnect(); delete host._fuse;
      }
    };
    host._fuse = api;
    if (root !== host) root._fuse = api;
    return api;
  }

  global.Fuse = { mount: mount };
  function auto() {
    [].forEach.call(document.querySelectorAll('[data-fuse]:not([data-fuse-manual])'), function (el) { mount(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
