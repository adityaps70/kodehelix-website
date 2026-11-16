/* Stub — promo code ticket that tears off its stub · Kodehelix UI · kodehelix.in
   Stub.mount(el, options) -> { apply, remove, type, total, applied, destroy, input, root }
   Auto-mounts [data-stub] on DOMContentLoaded unless data-stub-manual is present. */
(function () {
  'use strict';
  var ICONS = {
    tag: '<path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-5.9 5.9a2 2 0 0 1-2.8 0z"/><circle cx="8.3" cy="8.3" r="1.4"/>',
    arrow: '<path d="M5 12h13M13 7l5 5-5 5"/>',
    spin: '<path d="M12 4a8 8 0 1 1-8 8"/>',
    check: '<path d="M5.5 12.5l4.2 4.2L18.5 8"/>',
    x: '<path d="M7 7l10 10M17 7L7 17"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    lamp: '<path d="M8 3.5h8l3 7H5z"/><path d="M12 10.5v7M8 20.5h8"/>',
    book: '<path d="M5.5 4.5h10a2 2 0 0 1 2 2v13h-10a2 2 0 0 1-2-2z"/><path d="M5.5 17.5a2 2 0 0 1 2-2h10M9 8.5h5"/>',
    mug: '<path d="M5 7.5h10v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M15 9.5h1.5a2.5 2.5 0 0 1 0 5H15M8 3.5v1.5M11.5 3.5v1.5"/>',
    box: '<path d="M4 8l8-4.5L20 8v8l-8 4.5L4 16z"/><path d="M4 8l8 4.5L20 8M12 12.5v8"/>',
    shirt: '<path d="M8.5 3.5L4 6.5l2 4 2-1v11h8v-11l2 1 2-4-4.5-3a3.5 3.5 0 0 1-7 0z"/>',
    plant: '<path d="M7 14.5h10l-1.5 6h-7z"/><path d="M12 14.5V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5zM12 11c0-2.5-1.7-4-4.5-4 0 2.5 1.7 4 4.5 4z"/>'
  };
  var DEFAULT_CODES = { SAVE20: { percent: 20 }, WELCOME10: { amount: 10 } };
  var seq = 0;
  function svg(b, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function now() { return performance.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rgb(c) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((c || '').trim());
    if (!m) return '143,163,255';
    var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1], n = parseInt(h, 16);
    return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  var E = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    back: function (t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    spring: function (t) { return t >= 1 ? 1 : 1 - Math.exp(-6.5 * t) * Math.cos(10.5 * t); }
  };
  // tiny rAF tween: tween(ms, fn(t), done, delay) -> stop()
  function tween(ms, fn, done, delay) {
    var t0 = now() + (delay || 0), id = 0, dead = false;
    function f() {
      if (dead) return;
      var t = (now() - t0) / ms;
      if (t < 0) { id = requestAnimationFrame(f); return; }
      t = Math.min(1, t); fn(t);
      if (t < 1) id = requestAnimationFrame(f); else if (done) done();
    }
    if (!delay) fn(0);
    id = requestAnimationFrame(f);
    return function () { dead = true; cancelAnimationFrame(id); };
  }
  // deterministic jagged edge for the torn paper
  function jag(seed, n) {
    var a = [], s = seed;
    for (var i = 0; i <= n; i++) { s = (s * 9301 + 49297) % 233280; a.push(1 + (s / 233280) * 4.5); }
    return a;
  }

  // Odometer: rolls each digit column to its new value
  function Odo(el) { this.el = el; this.str = ''; this.cols = []; this.stop = null; }
  Odo.prototype.set = function (str, animate, down) {
    var prev = this.str.replace(/\D/g, ''), next = str.replace(/\D/g, ''), off = prev.length - next.length, el = this.el, cols = [], di = 0;
    if (this.stop) this.stop();
    this.str = str; el.innerHTML = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (/\d/.test(ch)) {
        var col = document.createElement('span'), strip = document.createElement('span'), h = '';
        col.className = 'stub__col'; strip.className = 'stub__strip';
        for (var k = 0; k < 20; k++) h += '<span>' + (k % 10) + '</span>';
        strip.innerHTML = h; col.appendChild(strip); el.appendChild(col);
        var p = prev[di + off], to = +ch, from = p == null ? to : +p;
        if (from !== to) { if (down) from += 10; else to += 10; }
        cols.push({ strip: strip, from: from, to: to, end: +ch, i: di });
        di++;
      } else {
        var s = document.createElement('span'); s.className = 'stub__sym'; s.textContent = ch; el.appendChild(s);
      }
    }
    function pos(c, p) { c.strip.style.transform = 'translateY(' + (-p * 1.2) + 'em)'; }
    this.cols = cols;
    if (!animate) { cols.forEach(function (c) { pos(c, c.end); }); return; }
    var n = cols.length, self = this;
    cols.forEach(function (c) { pos(c, c.from); });
    this.stop = tween(760 + n * 55, function (t) {
      cols.forEach(function (c) {
        var lt = clamp((t * (760 + n * 55) - (n - 1 - c.i) * 55) / 760, 0, 1);
        pos(c, c.from + (c.to - c.from) * E.back(lt));
      });
    }, function () { cols.forEach(function (c) { pos(c, c.end); }); self.stop = null; });
  };

  function mount(root, opts) {
    if (!root || root.__stub) return root && root.__stub;
    var d = root.dataset, o = {}, k;
    var defaults = {
      title: d.title || 'Your order', items: null, subtotal: d.subtotal != null ? +d.subtotal : null, shipping: d.shipping != null ? +d.shipping : 0,
      currency: d.currency || 'USD', locale: d.locale || undefined, codes: DEFAULT_CODES, validate: null,
      placeholder: d.placeholder || 'Promo code', applyLabel: d.applyLabel || 'Apply', checkout: d.checkout || 'Checkout',
      minCheck: 450, onApply: null, onRemove: null, onCheckout: null, onInvalid: null
    };
    for (k in defaults) o[k] = defaults[k];
    for (k in (opts || {})) o[k] = opts[k];

    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fmt;
    try { fmt = new Intl.NumberFormat(o.locale, { style: 'currency', currency: o.currency }); } catch (e) { fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); }
    function money(v) { return fmt.format(Math.round(v * 100) / 100); }
    var items = o.items || [];
    var subtotal = o.subtotal != null ? o.subtotal : items.reduce(function (s, it) { return s + (+it.price || 0) * (it.qty || 1); }, 0);
    var id = 'stub' + (++seq), nDots = 7, cut = jag(7 + seq * 13, 14), cut2 = jag(31 + seq * 7, 14);

    root.classList.add('stub');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', o.title);
    var h = '';
    if (items.length) {
      var count = items.reduce(function (s, it) { return s + (it.qty || 1); }, 0);
      h += '<div class="stub__head"><h3 class="stub__title">' + esc(o.title) + '</h3><span class="stub__count">' + count + ' item' + (count === 1 ? '' : 's') + '</span></div><ul class="stub__items">';
      items.forEach(function (it) {
        var c = it.tint || '#8FA3FF';
        h += '<li class="stub__item"><span class="stub__thumb" style="--t:' + esc(c) + ';--tr:' + rgb(c) + '">' + svg(ICONS[it.icon] || ICONS.box) + '</span>' +
          '<span style="min-width:0"><span class="stub__name">' + esc(it.name) + (it.qty > 1 ? ' × ' + it.qty : '') + '</span><span class="stub__meta">' + esc(it.meta || '') + '</span></span>' +
          '<span class="stub__price">' + money((+it.price || 0) * (it.qty || 1)) + '</span></li>';
      });
      h += '</ul>';
    }
    var dots = '';
    for (var i = 0; i < nDots; i++) dots += '<span class="stub__dot"></span>';
    h += '<form class="stub__ticket" novalidate>' +
      '<div class="stub__main"><div class="stub__field">' + svg(ICONS.tag) +
      '<label class="stub__sr" for="' + id + '-in">Promo code</label><input class="stub__input" id="' + id + '-in" name="promo" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="' + esc(o.placeholder) + '" aria-describedby="' + id + '-msg"></div>' +
      '<div class="stub__applied"><span class="stub__ok">' + svg('<path class="stub__tick" d="M5.5 12.5l4.2 4.2L18.5 8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>') + '</span>' +
      '<span class="stub__code"><b></b><small></small></span><button type="button" class="stub__remove" aria-label="Remove code">' + svg(ICONS.x) + '</button></div>' +
      '<span class="stub__stamp" aria-hidden="true"><span><b></b><i>SAVED</i></span><span class="stub__ring"></span></span></div>' +
      '<span class="stub__slot"></span>' +
      '<span class="stub__perf" aria-hidden="true">' + dots + '<span class="stub__spark"></span></span>' +
      '<button type="submit" class="stub__tab"><span class="stub__tabl">' + esc(o.applyLabel) + '</span>' + svg(ICONS.arrow, 'stub__arrow') + svg(ICONS.spin, 'stub__spin') + '</button>' +
      '</form>' +
      '<p class="stub__msg" id="' + id + '-msg" role="status" aria-live="polite"></p>' +
      '<dl class="stub__totals">' +
      '<div class="stub__row"><dt>Subtotal</dt><dd>' + money(subtotal) + '</dd></div>' +
      '<div class="stub__row stub__row--disc"><dt>Discount<span></span></dt><dd></dd></div>' +
      '<div class="stub__row"><dt>Shipping</dt><dd>' + (o.shipping ? money(o.shipping) : 'Free') + '</dd></div>' +
      '<div class="stub__row stub__row--total"><dt>Total</dt><dd class="stub__totalv"><span class="stub__was"></span><span class="stub__odo" aria-hidden="true"></span><span class="stub__sr stub__totalsr"></span></dd></div>' +
      '</dl>' +
      (o.checkout ? '<button type="button" class="stub__pay">' + svg(ICONS.lock) + esc(o.checkout) + '</button>' : '');
    root.innerHTML = h;

    function $(s) { return root.querySelector(s); }
    var form = $('.stub__ticket'), main = $('.stub__main'), field = $('.stub__field'), input = $('.stub__input'), appliedEl = $('.stub__applied'),
      codeB = $('.stub__code b'), codeS = $('.stub__code small'), removeBtn = $('.stub__remove'), stamp = $('.stub__stamp'), stampB = $('.stub__stamp b'),
      ring = $('.stub__ring'), slot = $('.stub__slot'), perf = $('.stub__perf'), spark = $('.stub__spark'), tab = $('.stub__tab'), msg = $('.stub__msg'),
      disc = $('.stub__row--disc'), discT = $('.stub__row--disc dt span'), discV = $('.stub__row--disc dd'), was = $('.stub__was'), tick = $('.stub__tick'),
      totalSr = $('.stub__totalsr'), pay = $('.stub__pay');
    var dotEls = [].slice.call(root.querySelectorAll('.stub__dot'));
    var odo = new Odo($('.stub__odo'));
    var state = 'idle', current = null, timers = [], stops = [], tabW = 0;
    var base = subtotal + (o.shipping || 0);

    function layoutDots() {
      var H = form.offsetHeight || 58, top = 12, bot = H - 12;
      dotEls.forEach(function (el, i) { el.style.top = (top + (bot - top) * i / (nDots - 1) - 1.5) + 'px'; });
    }
    layoutDots();
    function setTotal(v, animate, down) {
      odo.set(money(v), animate && !reduce, down);
      totalSr.textContent = money(v);
    }
    setTotal(base, false);

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function run(ms, fn, done, delay) { var s = tween(ms, fn, done, delay); stops.push(s); return s; }
    function say(text, cls) { msg.textContent = text || ''; msg.className = 'stub__msg' + (cls ? ' ' + cls : ''); }
    function edge(side) {
      var a = side === 'main' ? cut : cut2, pts = [], n = a.length - 1, j;
      if (side === 'main') {
        pts.push('0 0');
        for (j = 0; j <= n; j++) pts.push('calc(100% - ' + a[j].toFixed(1) + 'px) ' + (j / n * 100).toFixed(1) + '%');
        pts.push('0 100%');
      } else {
        for (j = 0; j <= n; j++) pts.push((6 - a[j]).toFixed(1) + 'px ' + (j / n * 100).toFixed(1) + '%');
        pts.push('100% 100%', '100% 0');
      }
      return 'polygon(' + pts.join(',') + ')';
    }
    function glow(y, k) { // light dots near y (0..H), k = strength
      dotEls.forEach(function (el) {
        var dy = Math.abs(parseFloat(el.style.top) - y);
        var g = Math.max(+el.style.getPropertyValue('--g') * 0.86, Math.max(0, 1 - dy / 11) * k);
        el.style.setProperty('--g', g.toFixed(3));
      });
    }
    function clearGlow() { dotEls.forEach(function (el) { el.style.setProperty('--g', '0'); }); }

    // scanning spark while the code is checked
    var scanStop = null;
    function scan() {
      var H = form.offsetHeight, t0 = now(), id2 = 0, alive = true;
      spark.style.opacity = '1';
      function f() {
        if (!alive) return;
        var p = ((now() - t0) % 520) / 520, y = 8 + (H - 16) * E.inOut(p);
        spark.style.transform = 'translateY(' + (y - 4) + 'px)';
        glow(y, 1);
        id2 = requestAnimationFrame(f);
      }
      f();
      scanStop = function () { alive = false; cancelAnimationFrame(id2); spark.style.opacity = '0'; scanStop = null; };
    }

    function busy(on) {
      tab.setAttribute('aria-busy', on ? 'true' : 'false');
      input.readOnly = !!on;
      if (on && !reduce) scan(); else if (scanStop) scanStop();
      if (on) {
        var sp = tab.querySelector('.stub__spin'), t0 = now();
        (function rot() { if (tab.getAttribute('aria-busy') !== 'true') return; sp.style.transform = 'rotate(' + ((now() - t0) * 0.6 % 360) + 'deg)'; requestAnimationFrame(rot); })();
      }
    }

    function shake(text) {
      root.classList.add('is-error');
      say(text, 'is-bad');
      dotEls.forEach(function (el) { el.style.setProperty('--g', '0'); });
      if (!reduce) run(480, function (t) { form.style.transform = 'translateX(' + (Math.sin(t * Math.PI * 6) * 7 * (1 - t)).toFixed(2) + 'px)'; }, function () { form.style.transform = ''; });
      later(function () { root.classList.remove('is-error'); }, 1300);
      if (o.onInvalid) o.onInvalid(input.value.trim().toUpperCase());
    }

    function resolve(code) {
      if (o.validate) return Promise.resolve().then(function () { return o.validate(code, { subtotal: subtotal, shipping: o.shipping }); });
      var c = o.codes && (o.codes[code] || o.codes[code.toUpperCase()]);
      return Promise.resolve(c ? Object.assign({ code: code }, c) : null);
    }
    function discountOf(r) {
      var v = r.amount != null ? +r.amount : r.percent != null ? subtotal * r.percent / 100 : 0;
      return clamp(Math.round(v * 100) / 100, 0, subtotal);
    }

    function apply(raw) {
      if (state !== 'idle') return Promise.resolve(false);
      var code = String(raw != null ? raw : input.value).trim().toUpperCase();
      if (raw != null) input.value = code;
      if (!code) { shake('Enter a promo code first.'); input.focus(); return Promise.resolve(false); }
      state = 'busy'; busy(true); say('Checking ' + code + '…');
      var t0 = now();
      return resolve(code).then(function (r) { return r; }, function (e) { return { error: (e && e.message) || 'Could not check that code.' }; }).then(function (r) {
        return new Promise(function (res) {
          later(function () {
            busy(false);
            if (!r || r.error || r === false) { state = 'idle'; shake(r && r.error ? r.error : code + ' isn’t a valid code.'); res(false); return; }
            var off = discountOf(r);
            current = { code: r.code || code, discount: off, percent: r.percent, amount: r.amount, label: r.label, total: Math.max(0, base - off) };
            tear(current); res(current);
          }, Math.max(0, o.minCheck - (now() - t0)));
        });
      });
    }

    function flecks() {
      var W = form.offsetWidth, x = W - (tabW || tab.offsetWidth);
      for (var i = 0; i < 9; i++) (function (i) {
        var f = document.createElement('span'); f.className = 'stub__fleck'; form.appendChild(f);
        var y0 = 6 + i * 5.5, vx = 30 + ((i * 37) % 50), vy = -40 - ((i * 53) % 70), rot = (i * 71) % 180;
        run(620, function (t) {
          var s = t * 0.62;
          f.style.transform = 'translate(' + (x + vx * s) + 'px,' + (y0 + vy * s + 260 * s * s) + 'px) rotate(' + (rot + t * 300) + 'deg)';
          f.style.opacity = (1 - t).toFixed(2);
        }, function () { f.remove(); });
      })(i);
    }

    function tear(c) {
      state = 'anim';
      var hadFocus = root.contains(document.activeElement);
      tabW = tab.offsetWidth;
      codeB.textContent = c.code;
      codeS.textContent = c.label || ((c.percent != null ? c.percent + '% off' : money(c.discount) + ' off') + ' · you save ' + money(c.discount));
      stampB.textContent = c.percent != null ? '−' + c.percent + '%' : '−' + money(c.discount).replace(/\.00$/, '');
      removeBtn.setAttribute('aria-label', 'Remove code ' + c.code);
      if (o.onApply) o.onApply(c);
      say(c.code + ' applied. You save ' + money(c.discount) + '. New total ' + money(c.total) + '.', 'is-good');
      if (reduce) {
        tab.style.visibility = 'hidden'; slot.style.width = '0px'; perf.style.opacity = '0';
        main.style.clipPath = edge('main'); field.style.visibility = 'hidden'; appliedEl.style.opacity = '1'; tick.style.strokeDashoffset = '0';
        root.classList.add('is-applied'); stamp.style.visibility = 'visible'; stamp.style.opacity = '.95'; stamp.style.transform = 'rotate(-12deg)';
        showTotals(c, false); state = 'applied';
        if (hadFocus) removeBtn.focus({ preventScroll: true }); return;
      }
      var H = form.offsetHeight;
      // 1 — a spark punches down the perforation
      spark.style.opacity = '1';
      run(240, function (t) {
        var y = 8 + (H - 16) * E.out(t);
        spark.style.transform = 'translateY(' + (y - 4) + 'px)'; glow(y, 1);
        tab.style.transform = 'rotate(' + (Math.sin(t * Math.PI * 3) * 0.8).toFixed(2) + 'deg)';
      }, function () {
        spark.style.opacity = '0';
        // 2 — tear: top rips first, the stub swings on its bottom corner
        main.style.clipPath = edge('main'); tab.style.clipPath = edge('tab');
        flecks();
        run(230, function (t) { tab.style.transform = 'rotate(' + (16 * E.out(t)).toFixed(2) + 'deg)'; perf.style.opacity = (1 - t).toFixed(2); }, function () {
          // 3 — it falls away; the ticket closes the gap
          var vx = 70, vy = -120, g = 2400, w0 = 16;
          run(900, function (t) {
            var s = t * 0.9;
            tab.style.transform = 'translate(' + (vx * s).toFixed(1) + 'px,' + (vy * s + 0.5 * g * s * s).toFixed(1) + 'px) rotate(' + (w0 + 150 * s).toFixed(1) + 'deg)';
            tab.style.opacity = (1 - clamp((t - 0.35) / 0.65, 0, 1)).toFixed(2);
          }, function () { tab.style.visibility = 'hidden'; });
          run(440, function (t) { slot.style.width = (tabW * (1 - E.inOut(t))).toFixed(1) + 'px'; });
          root.classList.add('is-applied');
          run(200, function (t) { field.style.opacity = (1 - t).toFixed(2); field.style.transform = 'translateY(' + (-6 * t) + 'px)'; }, function () { field.style.visibility = 'hidden'; }, 120);
          run(300, function (t) { appliedEl.style.opacity = E.out(t).toFixed(2); appliedEl.style.transform = 'translateY(' + (6 * (1 - E.out(t))).toFixed(1) + 'px)'; }, null, 240);
          run(380, function (t) { tick.style.strokeDashoffset = (1 - E.out(t)).toFixed(3); }, null, 360);
          // 4 — the stamp slams down
          stamp.style.visibility = 'visible';
          run(420, function (t) {
            var e = E.back(t), sc = 2.3 - 1.3 * e;
            stamp.style.opacity = clamp(t * 3, 0, 0.95).toFixed(2);
            stamp.style.transform = 'scale(' + sc.toFixed(3) + ') rotate(' + (-30 + 18 * e).toFixed(1) + 'deg)';
          }, function () {
            run(520, function (t) { ring.style.opacity = (0.7 * (1 - t)).toFixed(2); ring.style.transform = 'scale(' + (1 + 0.8 * E.out(t)).toFixed(3) + ')'; });
            run(260, function (t) { main.style.transform = 'translateY(' + (Math.sin(t * Math.PI) * 1.8).toFixed(2) + 'px)'; }, function () { main.style.transform = ''; });
            showTotals(c, true);
            state = 'applied';
            if (hadFocus) removeBtn.focus({ preventScroll: true });
          }, 380);
        });
      });
    }

    function showTotals(c, animate) {
      discT.textContent = c.code; discV.textContent = '−' + money(c.discount);
      was.textContent = money(base);
      var hh = 31;
      if (animate) {
        run(340, function (t) { var e = E.out(t); disc.style.height = (hh * e) + 'px'; disc.style.padding = (5 * e) + 'px 0'; disc.style.opacity = e.toFixed(2); });
        run(300, function (t) { was.style.opacity = E.out(t).toFixed(2); });
        run(380, function (t) { was.style.setProperty('--s', E.inOut(t).toFixed(3)); }, null, 260);
      } else { disc.style.height = hh + 'px'; disc.style.padding = '5px 0'; disc.style.opacity = '1'; was.style.opacity = '1'; was.style.setProperty('--s', '1'); }
      setTotal(c.total, animate, true);
    }
    function hideTotals(animate) {
      if (animate) {
        var h0 = disc.offsetHeight;
        run(300, function (t) { var e = 1 - E.out(t); disc.style.height = (h0 * e) + 'px'; disc.style.padding = (5 * e) + 'px 0'; disc.style.opacity = e.toFixed(2); });
        run(260, function (t) { was.style.setProperty('--s', (1 - E.out(t)).toFixed(3)); was.style.opacity = (1 - t).toFixed(2); });
      } else { disc.style.height = '0px'; disc.style.padding = '0'; disc.style.opacity = '0'; was.style.opacity = '0'; was.style.setProperty('--s', '0'); }
      setTotal(base, animate, false);
    }

    function remove() {
      if (state !== 'applied') return false;
      var c = current; current = null; state = 'anim';
      if (o.onRemove) o.onRemove(c);
      say(c.code + ' removed.');
      var refocus = document.activeElement === removeBtn;
      function done() {
        state = 'idle'; main.style.clipPath = ''; tab.style.clipPath = ''; perf.style.opacity = '';
        tab.style.transform = ''; tab.style.opacity = ''; tab.style.visibility = ''; slot.style.width = '';
        field.style.visibility = ''; field.style.opacity = ''; field.style.transform = ''; appliedEl.style.opacity = ''; appliedEl.style.transform = '';
        stamp.style.visibility = ''; stamp.style.opacity = ''; stamp.style.transform = ''; tick.style.strokeDashoffset = '1';
        root.classList.remove('is-applied'); clearGlow();
        input.value = ''; if (refocus) input.focus({ preventScroll: true });
      }
      if (reduce) { hideTotals(false); done(); return true; }
      run(220, function (t) { stamp.style.opacity = (0.95 * (1 - t)).toFixed(2); stamp.style.transform = 'scale(' + (1 - 0.35 * t).toFixed(3) + ') rotate(-12deg)'; appliedEl.style.opacity = (1 - t).toFixed(2); });
      field.style.visibility = ''; input.value = '';
      run(260, function (t) { field.style.opacity = E.out(t).toFixed(2); field.style.transform = 'translateY(' + (6 * (1 - E.out(t))).toFixed(1) + 'px)'; }, null, 160);
      // a fresh stub slides back in and the torn edge heals
      tab.style.visibility = ''; tab.style.clipPath = edge('tab');
      var W = tabW || 104;
      run(420, function (t) { slot.style.width = (W * E.inOut(t)).toFixed(1) + 'px'; });
      run(640, function (t) {
        var e = E.spring(t);
        tab.style.transform = 'translateX(' + (56 * (1 - e)).toFixed(1) + 'px)';
        tab.style.opacity = clamp(t * 3, 0, 1).toFixed(2);
      }, null, 60);
      var H = form.offsetHeight;
      later(function () {
        main.style.clipPath = ''; tab.style.clipPath = '';
        run(320, function (t) { perf.style.opacity = t.toFixed(2); glow(H - 8 - (H - 16) * t, 1 - t * 0.4); }, function () {
          run(300, function (t) { dotEls.forEach(function (el) { el.style.setProperty('--g', (+el.style.getPropertyValue('--g') * (1 - t)).toFixed(3)); }); });
        });
      }, 380);
      hideTotals(true);
      later(done, 820);
      return true;
    }

    function type(code, speed) {
      if (state !== 'idle') return;
      code = String(code); input.value = '';
      var i = 0, sp = speed || 70;
      (function step() {
        if (i < code.length) { input.value += code[i++]; input.dispatchEvent(new Event('input', { bubbles: true })); later(step, sp); }
        else later(function () { apply(); }, 160);
      })();
    }

    function onSubmit(e) { e.preventDefault(); apply(); }
    function onInput() { if (msg.classList.contains('is-bad')) say(''); }
    function onRemove() { remove(); }
    function onPay() { if (o.onCheckout) o.onCheckout({ total: current ? current.total : base, code: current && current.code, discount: current ? current.discount : 0 }); }
    form.addEventListener('submit', onSubmit);
    input.addEventListener('input', onInput);
    removeBtn.addEventListener('click', onRemove);
    if (pay) pay.addEventListener('click', onPay);
    var ro = window.ResizeObserver ? new ResizeObserver(layoutDots) : null;
    if (ro) ro.observe(form);

    var api = {
      root: root, input: input,
      apply: apply, remove: remove, type: type,
      total: function () { return current ? current.total : base; },
      applied: function () { return current; },
      destroy: function () {
        timers.forEach(clearTimeout); stops.forEach(function (s) { s(); }); if (scanStop) scanStop(); if (ro) ro.disconnect();
        form.removeEventListener('submit', onSubmit); root.innerHTML = ''; root.classList.remove('stub', 'is-applied', 'is-error'); delete root.__stub;
      }
    };
    root.__stub = api;
    return api;
  }

  window.Stub = { mount: mount, codes: DEFAULT_CODES };
  function auto() { [].forEach.call(document.querySelectorAll('[data-stub]:not([data-stub-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
