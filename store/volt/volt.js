/*! Volt — settings switches that power up their feature · Kodehelix UI · kodehelix.in */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    bell: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2.2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
    cloud: ['M7.5 18.5a4.5 4.5 0 0 1-.9-8.9A6 6 0 0 1 18 10a4.2 4.2 0 0 1-.6 8.5', 'M12 12.5v7', 'M9.5 15 12 12.5l2.5 2.5'],
    pin: ['M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z', 'M14.2 10a2.2 2.2 0 1 1-4.4 0a2.2 2.2 0 1 1 4.4 0'],
    shield: ['M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z', 'M9 12l2.1 2.1L15.2 10'],
    wifi: ['M4.2 9.6a11 11 0 0 1 15.6 0', 'M7.3 12.8a6.6 6.6 0 0 1 9.4 0', 'M10.3 15.9a2.4 2.4 0 0 1 3.4 0', 'M12 19.2h.01'],
    moon: ['M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z'],
    mic: ['M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z', 'M5.5 11a6.5 6.5 0 0 0 13 0', 'M12 17.5V21'],
    lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
    eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M14.6 12a2.6 2.6 0 1 1-5.2 0a2.6 2.6 0 1 1 5.2 0'],
    bolt: ['M13 3 5.5 13.2h5.6L10 21l7.5-10.2h-5.6z']
  };
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var uid = 0;

  function icon(name, cls) {
    var d = Array.isArray(name) ? name : ICONS[name] || ICONS.bolt;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      d.map(function (p) { return '<path pathLength="1" d="' + p + '"/>'; }).join('') + '</svg>';
  }
  function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function s(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  // one shared rAF loop for every tween
  var tweens = [], raf = 0;
  function tween(dur, fn, done, delay) {
    var tw = { t0: performance.now() + (delay || 0), dur: dur, fn: fn, done: done, dead: false };
    if (dur <= 0 && !delay) { fn(1); if (done) done(); return tw; }
    tweens.push(tw);
    if (!raf) raf = requestAnimationFrame(step);
    return tw;
  }
  function step() {
    raf = 0;
    var now = performance.now();
    for (var i = 0; i < tweens.length; i++) {
      var tw = tweens[i];
      if (tw.dead) { tweens.splice(i--, 1); continue; }
      if (now < tw.t0) continue;
      var p = tw.dur > 0 ? Math.min(1, (now - tw.t0) / tw.dur) : 1;
      tw.fn(p);
      if (p >= 1) { tweens.splice(i--, 1); if (tw.done) tw.done(); }
    }
    if (tweens.length) raf = requestAnimationFrame(step);
  }
  function kill(tw) { if (tw) tw.dead = true; }
  function restart(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }

  var DEFAULTS = [
    { id: 'alerts', label: 'Push notifications', desc: 'Mentions and replies', icon: 'bell', tint: '#8FA3FF', on: true },
    { id: 'backup', label: 'Auto backup', desc: 'Every night at 2:00', icon: 'cloud', tint: '#22C3EE' },
    { id: 'location', label: 'Location sharing', desc: 'Only while using the app', icon: 'pin', tint: '#FFB020' },
    { id: 'twofa', label: 'Two-step sign-in', desc: 'Code on new devices', icon: 'shield', tint: '#19C37D', on: true },
    { id: 'wifi', label: 'Sync on Wi-Fi only', desc: 'Saves mobile data', icon: 'wifi', tint: '#3B5BFF' }
  ];

  function mount(root, opts) {
    if (root._volt) return root._volt;
    opts = opts || {};
    var items = opts.items;
    if (!items && root.getAttribute('data-volt-items')) { try { items = JSON.parse(root.getAttribute('data-volt-items')); } catch (e) { items = null; } }
    items = (items || DEFAULTS).map(function (it, i) { var o = {}; for (var k in it) o[k] = it[k]; o.id = o.id || 'item' + i; return o; });
    var useMaster = opts.master !== false;
    var id = 'volt' + (++uid);
    root.classList.add('volt');
    root.setAttribute('role', 'group');
    root.innerHTML = '';

    var title = opts.title || root.getAttribute('data-title') || 'Settings';
    var head = h('div', 'volt__head');
    head.innerHTML = '<span class="volt__badge">' + icon('bolt') + '</span>' +
      '<span class="volt__heading"><b id="' + id + '-t">' + esc(title) + '</b><small><span class="volt__count" aria-hidden="true"></span> of ' + items.length + ' on</small></span>';
    root.setAttribute('aria-labelledby', id + '-t');
    var master = null;
    if (useMaster) {
      head.insertAdjacentHTML('beforeend', '<span class="volt__all" aria-hidden="true">' + esc(opts.allLabel || 'All') + '</span>');
      master = h('button', 'volt__sw volt__sw--master', '<span class="volt__knob">' + icon('bolt') + '</span>');
      master.type = 'button';
      master.setAttribute('role', 'switch');
      master.setAttribute('aria-label', (opts.allLabel || 'All') + ' ' + title.toLowerCase());
      head.appendChild(master);
    }
    root.appendChild(head);
    var countEl = head.querySelector('.volt__count');

    var list = h('ul', 'volt__list');
    root.appendChild(list);
    var wires = s('svg', { class: 'volt__wires', 'aria-hidden': 'true' });
    var defs = s('defs', {}, wires);
    var gBase = s('g', {}, wires), gLit = s('g', {}, wires), gFx = s('g', {}, wires);
    root.appendChild(wires);
    var live = h('span', 'volt__sr'); live.setAttribute('aria-live', 'polite'); root.appendChild(live);

    var rows = items.map(function (it, i) {
      var li = h('li', 'volt__row');
      li.style.setProperty('--volt-tint', it.tint || 'var(--volt-b)');
      li.dataset.id = it.id;
      li.innerHTML = '<span class="volt__icon">' + (it.svg || icon(it.icon)) + '</span>' +
        '<span class="volt__text"><b id="' + id + '-l' + i + '">' + esc(it.label) + '</b>' + (it.desc ? '<small id="' + id + '-d' + i + '">' + esc(it.desc) + '</small>' : '') + '</span>';
      var sw = h('button', 'volt__sw', '<span class="volt__knob">' + icon('bolt') + '</span>');
      sw.type = 'button';
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-labelledby', id + '-l' + i);
      if (it.desc) sw.setAttribute('aria-describedby', id + '-d' + i);
      li.appendChild(sw);
      list.appendChild(li);
      var tint = getComputedStyle(li).getPropertyValue('--volt-tint').trim() || it.tint || '#22C3EE';
      var gid = id + '-g' + i;
      var grad = s('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse' }, defs);
      s('stop', { offset: '0', 'stop-color': 'var(--volt-b)' }, grad).style.stopColor = 'var(--volt-b)';
      s('stop', { offset: '1', 'stop-color': tint }, grad);
      var r = {
        it: it, i: i, li: li, sw: sw, ic: li.querySelector('.volt__icon'), tint: tint, grad: grad, on: false, p: 0, L: 1, tw: null,
        base: s('path', { class: 'volt__base' }, gBase),
        stub: s('path', { class: 'volt__base volt__stub' }, gBase),
        glow: s('path', { class: 'volt__glow', stroke: 'url(#' + gid + ')' }, gLit),
        lit: s('path', { class: 'volt__lit', stroke: 'url(#' + gid + ')' }, gLit),
        flow: s('path', { class: 'volt__flow' }, gLit),
        stubLit: s('path', { class: 'volt__stub-lit' }, gLit),
        trail: s('path', { class: 'volt__trail', stroke: tint }, gFx),
        viaA: s('circle', { class: 'volt__via', r: 2.6 }, gBase),
        viaB: s('circle', { class: 'volt__via', r: 2.6 }, gBase),
        halo: s('circle', { class: 'volt__halo', r: 7, fill: tint }, gFx),
        head: s('circle', { class: 'volt__head-dot', r: 2.3 }, gFx)
      };
      r.viaA.style.setProperty('--volt-tint', tint); r.viaB.style.setProperty('--volt-tint', tint);
      return r;
    });

    var bus = master && { base: s('path', { class: 'volt__base volt__bus' }, gBase), lit: s('path', { class: 'volt__lit volt__bus-lit' }, gLit),
      halo: s('circle', { class: 'volt__halo', r: 8, fill: 'var(--volt-b)' }, gFx), head: s('circle', { class: 'volt__head-dot', r: 2.6 }, gFx), L: 1, p: 0, tw: null, ys: [] };
    if (bus) bus.halo.style.fill = 'var(--volt-b)';
    var allOn = false, cascading = false;

    function box(n) { var x = 0, y = 0, m = n; while (m && m !== root) { x += m.offsetLeft; y += m.offsetTop; m = m.offsetParent; } return { x: x, y: y, w: n.offsetWidth, h: n.offsetHeight }; }

    function layout() {
      var W = root.offsetWidth, H = root.offsetHeight;
      wires.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      wires.setAttribute('width', W); wires.setAttribute('height', H);
      var bx = W - 13;
      rows.forEach(function (r) {
        var li = box(r.li), sb = box(r.sw), ib = box(r.ic);
        var sx = sb.x + sb.w / 2, sy = sb.y + sb.h + 1, cy = li.y + li.h - 9, ix = ib.x + ib.w / 2, iy = ib.y + ib.h + 1;
        var c = Math.min(6, Math.max(1, cy - sy - 1)), c2 = Math.min(6, Math.max(1, cy - iy - 1));
        var d = 'M' + sx + ' ' + sy + 'V' + (cy - c) + 'L' + (sx - c) + ' ' + cy + 'H' + (ix + c2) + 'L' + ix + ' ' + (cy - c2) + 'V' + iy;
        [r.base, r.glow, r.lit, r.flow, r.trail].forEach(function (p) { p.setAttribute('d', d); });
        r.L = r.lit.getTotalLength() || 1;
        r.lit.style.strokeDasharray = r.glow.style.strokeDasharray = r.L + ' ' + (r.L + 20);
        r.trail.style.strokeDasharray = '26 ' + (r.L + 60);
        r.grad.setAttribute('x1', sx); r.grad.setAttribute('x2', ix); r.grad.setAttribute('y1', cy); r.grad.setAttribute('y2', cy);
        r.viaA.setAttribute('cx', sx); r.viaA.setAttribute('cy', sy);
        r.viaB.setAttribute('cx', ix); r.viaB.setAttribute('cy', iy);
        r.scy = sb.y + sb.h / 2; r.sr = sb.x + sb.w;
        var st = 'M' + bx + ' ' + r.scy + 'H' + (r.sr + 1);
        r.stub.setAttribute('d', bus ? st : ''); r.stubLit.setAttribute('d', bus ? st : '');
        paint(r, r.p, true);
      });
      if (bus) {
        var mb = box(master), my = mb.y + mb.h / 2, last = rows[rows.length - 1];
        var bd = 'M' + (mb.x + mb.w + 1) + ' ' + my + 'H' + (bx - 6) + 'L' + bx + ' ' + (my + 6) + 'V' + last.scy;
        bus.base.setAttribute('d', bd); bus.lit.setAttribute('d', bd);
        bus.L = bus.lit.getTotalLength() || 1;
        bus.lit.style.strokeDasharray = bus.L + ' ' + (bus.L + 20);
        var x0 = mb.x + mb.w + 1, run = (bx - 6 - x0) + 6 * Math.SQRT2;
        bus.ys = rows.map(function (r) { return (run + (r.scy - my - 6)) / bus.L; });
        busPaint(bus.p);
      }
    }

    function paint(r, p, still) {
      r.p = p;
      var off = r.L * (1 - p);
      r.lit.style.strokeDashoffset = r.glow.style.strokeDashoffset = off;
      var moving = !still && p > 0 && p < 1;
      r.trail.style.strokeDashoffset = 26 - p * r.L;
      r.trail.style.opacity = r.halo.style.opacity = r.head.style.opacity = moving ? 1 : 0;
      if (moving) { var pt = r.lit.getPointAtLength(p * r.L); r.head.setAttribute('cx', pt.x); r.head.setAttribute('cy', pt.y); r.halo.setAttribute('cx', pt.x); r.halo.setAttribute('cy', pt.y); }
    }
    function busPaint(p, moving) {
      bus.p = p;
      bus.lit.style.strokeDashoffset = bus.L * (1 - p);
      bus.head.style.opacity = bus.halo.style.opacity = moving && p > 0 && p < 1 ? 1 : 0;
      if (moving) { var pt = bus.lit.getPointAtLength(p * bus.L); bus.head.setAttribute('cx', pt.x); bus.head.setAttribute('cy', pt.y); bus.halo.setAttribute('cx', pt.x); bus.halo.setAttribute('cy', pt.y); }
    }

    function fx(r, on) { [r.flow, r.viaA, r.viaB].forEach(function (n) { n.classList.toggle('is-on', on); }); }

    function burst(r) {
      if (reduce.matches) return;
      var b = box(r.ic), cx = b.x + b.w / 2, cy = b.y + b.h + 1;
      for (var k = 0; k < 9; k++) (function (k) {
        var a = -Math.PI / 2 + (k / 8 - .5) * 2.6 + (Math.random() - .5) * .3, v = 26 + Math.random() * 26;
        var dot = s('circle', { r: 1.1 + Math.random() * 1.1, class: 'volt__spark', fill: k % 3 ? r.tint : '#fff' }, gFx);
        tween(480 + Math.random() * 200, function (p) {
          var e = easeOut(p);
          dot.setAttribute('cx', cx + Math.cos(a) * v * e);
          dot.setAttribute('cy', cy + Math.sin(a) * v * e + 22 * p * p);
          dot.style.opacity = 1 - p;
        }, function () { dot.remove(); });
      })(k);
    }

    var rolled = -1;
    function count() {
      var n = rows.filter(function (r) { return r.on; }).length, str = String(n);
      if (countEl.children.length !== str.length) {
        countEl.innerHTML = str.split('').map(function () { return '<span class="volt__digit">' + '0123456789'.split('').map(function (c) { return '<i>' + c + '</i>'; }).join('') + '</span>'; }).join('');
      }
      str.split('').forEach(function (c, i) { countEl.children[i].style.translate = '0 ' + (-1.25 * +c) + 'em'; });
      countEl.setAttribute('data-n', n);
      if (rolled !== n) { rolled = n; head.querySelector('small').setAttribute('aria-label', n + ' of ' + rows.length + ' on'); }
      return n;
    }

    function setRow(r, on, o) {
      o = o || {};
      if (r.on === on) return;
      r.on = on;
      r.sw.setAttribute('aria-checked', String(on));
      if (!o.silent) restart(r.sw, 'is-flip');
      kill(r.tw);
      r.li.classList.remove('is-arrive', 'is-dim');
      r.stubLit.classList.toggle('is-on', on);
      var fast = reduce.matches || o.instant;
      if (on) {
        r.li.classList.remove('is-lit');
        var dur = fast ? 0 : Math.max(380, Math.min(760, r.L * 1.9));
        var arrive = function () {
          paint(r, 1, true);
          r.li.classList.add('is-lit'); fx(r, true);
          if (!o.instant) { r.li.classList.add('is-arrive'); burst(r); }
        };
        if (fast) arrive();
        else r.tw = tween(dur, function (p) { paint(r, easeIO(p)); }, arrive, o.delay == null ? 90 : o.delay);
      } else {
        var p0 = r.p;
        r.li.classList.remove('is-lit'); fx(r, false);
        if (!fast) r.li.classList.add('is-dim');
        if (fast) paint(r, 0, true);
        else r.tw = tween(Math.max(220, 380 * p0), function (p) { paint(r, p0 * (1 - easeOut(p)), true); }, null, o.delay || 0);
      }
      count();
      if (!o.silent) {
        live.textContent = r.it.label + ' ' + (on ? 'on' : 'off');
        if (opts.onChange) opts.onChange(r.it.id, on, states());
      }
      if (!cascading) syncMaster(o.instant);
    }

    function setMaster(on, quiet) {
      allOn = on;
      if (!master) return;
      master.setAttribute('aria-checked', String(on));
      root.classList.toggle('is-all', on);
      if (!quiet) restart(master, 'is-flip');
    }

    function syncMaster(instant) {
      if (!master) return;
      var all = rows.every(function (r) { return r.on; });
      if (all === allOn) return;
      setMaster(all, true);
      kill(bus.tw);
      var p0 = bus.p;
      if (instant || reduce.matches) busPaint(all ? 1 : 0);
      else bus.tw = tween(all ? 420 : 300, function (p) { busPaint(all ? p0 + (1 - p0) * easeOut(p) : p0 * (1 - easeOut(p))); });
    }

    function all(on, o) {
      o = o || {};
      if (!master) { rows.forEach(function (r, i) { setRow(r, on, { delay: i * 120, instant: o.instant }); }); return; }
      kill(bus.tw);
      setMaster(on, o.instant);
      cascading = true;
      var fast = reduce.matches || o.instant;
      if (on) {
        var fired = rows.map(function () { return false; }), p0 = bus.p;
        var fire = function (upTo) { rows.forEach(function (r, i) { if (!fired[i] && bus.ys[i] <= upTo + 1e-3) { fired[i] = true; cascading = true; setRow(r, true, { delay: 0, instant: o.instant }); } }); };
        var finish = function () { busPaint(1); fire(1); cascading = false; if (!o.instant) { restart(root, 'is-surge'); } live.textContent = 'All on'; if (opts.onAll) opts.onAll(true); };
        if (fast) { busPaint(1); fire(1); finish(); }
        else bus.tw = tween(Math.max(520, 150 * rows.length + 260), function (p) {
          var v = p0 + (1 - p0) * (p * .82 + .18 * p * p);
          busPaint(v, true); fire(v); cascading = true;
        }, finish, 60);
      } else {
        rows.slice().reverse().forEach(function (r, k) { setRow(r, false, { delay: k * 50, instant: o.instant }); });
        var q0 = bus.p;
        if (fast) busPaint(0);
        else bus.tw = tween(420, function (p) { busPaint(q0 * (1 - easeOut(p))); }, null, 120);
        cascading = false;
        live.textContent = 'All off';
        if (opts.onAll) opts.onAll(false);
      }
    }

    function find(key) { return typeof key === 'number' ? rows[key] : rows.filter(function (r) { return r.it.id === key; })[0]; }
    function states() { var o = {}; rows.forEach(function (r) { o[r.it.id] = r.on; }); return o; }

    rows.forEach(function (r) {
      r.sw.addEventListener('click', function (e) { e.stopPropagation(); setRow(r, !r.on); });
      r.li.addEventListener('click', function () { setRow(r, !r.on); });
    });
    if (master) master.addEventListener('click', function () { all(!allOn); });

    // initial state, no animation
    rows.forEach(function (r) { r.sw.setAttribute('aria-checked', 'false'); });
    if (master) master.setAttribute('aria-checked', 'false');
    count();
    layout();
    rows.forEach(function (r) { if (r.it.on) setRow(r, true, { instant: true, silent: true }); });
    var ro = window.ResizeObserver ? new ResizeObserver(layout) : null;
    if (ro) ro.observe(root); else addEventListener('resize', layout);

    var api = {
      toggle: function (key, on) { var r = find(key); if (r) setRow(r, on == null ? !r.on : !!on); return api; },
      set: function (key, on) { return api.toggle(key, !!on); },
      all: function (on) { all(on == null ? !allOn : !!on); return api; },
      get: function (key) { var r = find(key); return r ? r.on : undefined; },
      states: states,
      relayout: layout,
      destroy: function () { if (ro) ro.disconnect(); rows.forEach(function (r) { kill(r.tw); }); if (bus) kill(bus.tw); root.innerHTML = ''; root.classList.remove('volt', 'is-all'); delete root._volt; }
    };
    root._volt = api;
    return api;
  }

  window.Volt = { mount: mount, icons: ICONS };
  function auto() { [].forEach.call(document.querySelectorAll('[data-volt]:not([data-volt-manual])'), function (n) { mount(n); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
