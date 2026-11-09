/* Chime — a notification bell where each new alert drops in as a glowing orb, rings the bell
   and lands in the inbox; "Mark all read" flies every unread dot back into the badge.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <div data-chime>
       <li data-from="Maya Chen" data-kind="comment" data-time="2m" data-unread>commented on <b>Launch plan</b></li>
     </div>
     const bell = Chime.mount(el, { onClick: item => location.href = item.href });
     bell.notify({ from: 'Rohan Iyer', kind: 'mention', text: 'mentioned you in #design' });
   Elements with data-chime mount themselves on DOMContentLoaded unless data-chime-manual is set. */
(function (global) {
  'use strict';
  var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var back = function (t) { var c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var now = function () { return global.performance.now(); };
  var S = ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON = {
    comment: '<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/>',
    mention: '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 8.6v4.6a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.4 6.9"/>',
    deploy: '<path d="M12 16V4.5M7 9.5l5-5 5 5"/><path d="M4.5 19.5h15"/>',
    payment: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h3.5"/>',
    task: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><path d="M8.5 12.3l2.5 2.5 4.6-5"/>',
    alert: '<path d="M12 4.2l8.6 15H3.4z"/><path d="M12 10v4M12 16.8v.1"/>'
  };
  var KC = { comment: '#8fa3ff', mention: '#22c3ee', deploy: '#19c37d', payment: '#ffb020', task: '#8fa3ff', alert: '#ff5a6e' };
  var AV = [['#3b5bff', '#22c3ee'], ['#7c5cff', '#3b5bff'], ['#19c37d', '#22c3ee'], ['#ff8a4c', '#ff5a6e'], ['#ffb020', '#ff8a4c'], ['#e255d9', '#7c5cff']];
  var BELL = '<svg class="chime__bell"' + S + '><g class="chime__body"><path d="M12 3.1v1.4"/><path d="M6.2 16.6V11a5.8 5.8 0 0 1 11.6 0v5.6l1.6 2.1H4.6z"/></g>' +
    '<g class="chime__clap"><path d="M10 21a2.1 2.1 0 0 0 4 0"/></g></svg>';
  var WAVES = '<svg class="chime__waves" viewBox="0 0 88 88" fill="none" stroke="#22c3ee" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M25 35q-5 9 0 18"/><path d="M18 30q-8 14 0 28"/><path d="M63 35q5 9 0 18"/><path d="M70 30q8 14 0 28"/></svg>';
  var READ = '<svg' + S + '><path d="M2.5 12.5l3.5 3.5 7-8"/><path d="M11 15.5l1 1 8.5-9"/></svg>';
  var DONE = '<svg' + S + '><circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.2"/></svg>';
  var uid = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function initials(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function hue(n) { var h = 0; for (var i = 0; i < String(n).length; i++) h = (h * 33 + String(n).charCodeAt(i)) >>> 0; return AV[h % AV.length]; }

  function mount(root, opts) {
    if (root._chime) return root._chime;
    opts = opts || {};
    var d = root.dataset, id = 'chime' + (++uid);
    var title = opts.title || d.title || 'Notifications';
    var max = +(opts.max || d.max || 20);
    var src = opts.items || [].map.call(root.querySelectorAll('li'), function (li) {
      return { from: li.dataset.from, kind: li.dataset.kind, time: li.dataset.time, href: li.dataset.href, html: li.innerHTML.trim(), unread: 'unread' in li.dataset };
    });
    var initial = src.map(function (it) { return Object.assign({}, it); });

    root.classList.add('chime');
    if ((opts.align || d.align) === 'start') root.classList.add('chime--start');
    root.innerHTML =
      '<button type="button" class="chime__btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + id + '-p">' + BELL + WAVES +
      '<span class="chime__badge" aria-hidden="true"><span>0</span></span></button>' +
      '<div class="chime__fx" aria-hidden="true"></div>' +
      '<div class="chime__panel" id="' + id + '-p" role="dialog" aria-labelledby="' + id + '-t">' +
      '<div class="chime__head"><p class="chime__title" id="' + id + '-t">' + esc(title) + '</p><span class="chime__new"></span>' +
      '<button type="button" class="chime__all">' + READ + '<span>Mark all read</span></button></div>' +
      '<ul class="chime__list"></ul><div class="chime__empty">' + DONE + 'You’re all caught up</div>' +
      (opts.footer !== false && d.footer !== 'false' ? '<div class="chime__foot"><button type="button" class="chime__more">' + esc(opts.footer || d.footer || 'View all activity') + '</button></div>' : '') +
      '</div><span class="chime__sr" aria-live="polite"></span>';

    var btn = root.querySelector('.chime__btn'), panel = root.querySelector('.chime__panel'), list = root.querySelector('.chime__list');
    var badge = root.querySelector('.chime__badge'), fx = root.querySelector('.chime__fx'), sr = root.querySelector('.chime__sr');
    var body = root.querySelector('.chime__body'), clap = root.querySelector('.chime__clap'), waves = root.querySelectorAll('.chime__waves path');
    var newEl = root.querySelector('.chime__new'), allBtn = root.querySelector('.chime__all'), more = root.querySelector('.chime__more');
    var items = [], shown = 0, isOpen = false, anims = [], raf = 0, ring = null, timers = [], alive = true;

    // --- tiny animation loop (rAF + performance.now, so virtual clocks drive it too)
    function loop() {
      raf = 0; var t = now();
      var run = anims, keep = []; anims = [];
      run.forEach(function (a) { var p = clamp((t - a.t0) / a.dur); a.step(p, t); if (p >= 1) { if (a.done) a.done(); } else keep.push(a); });
      anims = keep.concat(anims); // callbacks may queue new animations
      if (ring) stepRing(t);
      if (anims.length || ring) raf = global.requestAnimationFrame(loop);
    }
    function anim(dur, step, done, delay) { anims.push({ t0: now() + (delay || 0), dur: dur, step: function (p, t) { if (t >= this.t0) step(p); }, done: done }); kick(); }
    function kick() { if (!raf && alive) raf = global.requestAnimationFrame(loop); }
    function later(fn, ms) { var h = setTimeout(function () { timers.splice(timers.indexOf(h), 1); fn(); }, ms); timers.push(h); }

    // --- local coordinates (works inside scaled parents)
    function k() { var r = root.getBoundingClientRect(); return root.offsetWidth ? r.width / root.offsetWidth : 1; }
    function pt(el, fx_, fy) {
      var r = el.getBoundingClientRect(), o = root.getBoundingClientRect(), s = k() || 1;
      return [(r.left - o.left + r.width * (fx_ == null ? .5 : fx_)) / s, (r.top - o.top + r.height * (fy == null ? .5 : fy)) / s];
    }
    function dot(cls, x, y) { var e = document.createElement('i'); e.className = cls; e.style.transform = 'translate(' + x + 'px,' + y + 'px)'; fx.appendChild(e); return e; }
    function place(e, x, y, s, o) { e.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + s.toFixed(3) + ')'; if (o != null) e.style.opacity = o.toFixed(3); }

    // --- bell ring: damped pendulum, clapper lags behind, sound waves pulse out
    function startRing(amp) {
      if (reduce && reduce.matches) return;
      ring = { t0: now(), amp: amp || 17 }; btn.classList.add('is-ring'); kick();
    }
    function stepRing(t) {
      var s = (t - ring.t0) / 1000, A = ring.amp, dur = 1.5;
      var a = A * Math.exp(-s / .42) * Math.sin(s * Math.PI * 2 * 3.1);
      var c = A * 1.25 * Math.exp(-Math.max(0, s - .07) / .45) * Math.sin(Math.max(0, s - .07) * Math.PI * 2 * 3.1);
      body.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 12 3.6)');
      clap.setAttribute('transform', 'rotate(' + c.toFixed(2) + ' 12 3.6)');
      for (var i = 0; i < 4; i++) {
        var side = i < 2 ? -1 : 1, lag = (i % 2) * .09, w = 0;
        for (var n = 0; n < 2; n++) { var q = (s - lag - n * .34) / .5; if (q > 0 && q < 1) w = Math.max(w, Math.sin(q * Math.PI) * (1 - n * .35)); }
        waves[i].style.opacity = (w * (A / 17)).toFixed(3);
        waves[i].setAttribute('transform', 'translate(' + (side * w * 4).toFixed(2) + ' 0)');
      }
      if (s >= dur) { ring = null; body.removeAttribute('transform'); clap.removeAttribute('transform'); btn.classList.remove('is-ring'); }
    }

    // --- badge with rolling digits
    function setBadge(n, down) {
      var txt = n > 99 ? '99+' : String(n);
      badge.classList.toggle('is-down', !!down);
      var old = badge.lastElementChild;
      if (n > 0 && old && old.textContent !== txt && badge.classList.contains('is-on') && !(reduce && reduce.matches)) {
        old.className = 'is-out'; later(function () { old.remove(); }, 340);
        var nw = document.createElement('span'); nw.className = 'is-in'; nw.textContent = txt; badge.appendChild(nw);
        badge.classList.remove('is-pop'); void badge.offsetWidth; badge.classList.add('is-pop');
      } else if (n > 0) { badge.innerHTML = '<span>' + txt + '</span>'; }
      badge.classList.toggle('is-on', n > 0);
      shown = n;
    }
    function unread() { return items.filter(function (it) { return it.unread; }).length; }
    function sync(down, keepBadge) {
      var u = unread();
      if (!keepBadge) setBadge(u, down);
      newEl.textContent = u + ' new'; newEl.classList.toggle('is-zero', !u);
      allBtn.disabled = !u;
      btn.setAttribute('aria-label', title + (u ? ', ' + u + ' unread' : ''));
      root.classList.toggle('is-empty', !items.length);
      items.forEach(function (it, i) { it.btn.style.setProperty('--i', Math.min(i, 8)); });
    }

    // --- items
    function render(it) {
      var li = document.createElement('li'); li.className = 'chime__li';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chime__item' + (it.unread ? ' is-unread' : '');
      var c = hue(it.from || it.kind), kind = ICON[it.kind] ? it.kind : 'comment';
      var msg = it.html != null ? it.html : esc(it.text);
      if (it.from && !/^<b>/.test(msg)) msg = '<b>' + esc(it.from) + '</b> ' + msg;
      b.innerHTML = '<span class="chime__av" style="--av:linear-gradient(140deg,' + c[0] + ',' + c[1] + ')" aria-hidden="true">' + esc(initials(it.from || kind)) +
        '<span class="chime__kind" style="--kc:' + KC[kind] + '"><svg' + S + '>' + ICON[kind] + '</svg></span></span>' +
        '<span class="chime__txt"><span class="chime__msg">' + msg + '</span><span class="chime__time">' + esc(it.time || 'Just now') + '</span></span>' +
        '<span class="chime__dot" aria-hidden="true"></span>';
      b.setAttribute('aria-label', (it.unread ? 'Unread: ' : '') + b.querySelector('.chime__msg').textContent + ', ' + (it.time || 'just now'));
      li.appendChild(b); it.li = li; it.btn = b;
      b.addEventListener('click', function () {
        if (it.unread) { markRead(it); sync(true); }
        if (opts.onClick) opts.onClick(publicItem(it));
        root.dispatchEvent(new CustomEvent('chime:click', { detail: publicItem(it), bubbles: true }));
      });
      return li;
    }
    function publicItem(it) { return { from: it.from, kind: it.kind, text: it.text, html: it.html, time: it.time, href: it.href, unread: !!it.unread, data: it.data }; }
    function markRead(it) {
      it.unread = false; it.btn.classList.remove('is-unread', 'is-launch');
      it.btn.setAttribute('aria-label', it.btn.querySelector('.chime__msg').textContent + ', ' + (it.time || 'just now'));
    }
    function load(arr) {
      list.innerHTML = ''; items = [];
      arr.slice(0, max).forEach(function (src) { var it = Object.assign({}, src); items.push(it); list.appendChild(render(it)); });
      sync();
    }

    // --- the hero moment: an orb drops into the bell, it rings, the alert lands in the list
    function notify(src) {
      var it = Object.assign({ unread: true }, src || {});
      it.unread = it.unread !== false;
      var calm = reduce && reduce.matches;
      var land = function () {
        items.unshift(it);
        var li = render(it); list.insertBefore(li, list.firstChild);
        while (items.length > max) { var gone = items.pop(); gone.li.remove(); }
        sync();
        sr.textContent = 'New notification: ' + it.btn.querySelector('.chime__msg').textContent;
        if (isOpen && !calm) {
          var h = li.scrollHeight; li.style.height = '0px';
          it.btn.style.transition = 'none'; it.btn.style.opacity = '0'; it.btn.style.transform = 'translateY(-14px) scale(.96)';
          anim(520, function (p) { li.style.height = (h * back(p)).toFixed(2) + 'px'; }, function () { li.style.height = ''; });
          anim(420, function (p) { var e = easeOut(p); it.btn.style.opacity = e; it.btn.style.transform = 'translateY(' + (-14 * (1 - e)) + 'px) scale(' + (.96 + .04 * e) + ')'; },
            function () { it.btn.style.transition = it.btn.style.opacity = it.btn.style.transform = ''; it.btn.classList.add('is-fresh'); }, 90);
          list.scrollTop = 0;
        }
        root.dispatchEvent(new CustomEvent('chime:notify', { detail: publicItem(it), bubbles: true }));
        if (opts.onNotify) opts.onNotify(publicItem(it));
      };
      if (calm) { land(); return it; }
      var b = pt(btn, .5, .5), bx = b[0], by = b[1] - 15;
      var p0 = [bx - 78, by - 104], p1 = [bx - 4, by - 132], p2 = [bx, by];
      var orb = dot('chime__orb', p0[0], p0[1]), trail = [];
      for (var i = 0; i < 10; i++) trail.push(dot('chime__trail', p0[0], p0[1]));
      var at = function (u) { var v = 1 - u; return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]; };
      var path = function (p) { return Math.pow(p, 1.55); };
      anim(620, function (p) {
        var q = at(path(p)); place(orb, q[0], q[1], .55 + .45 * Math.min(1, p * 3), Math.min(1, p * 5));
        trail.forEach(function (e, j) { var tq = at(path(Math.max(0, p - (j + 1) * .032))); place(e, tq[0], tq[1], 1 - j * .085, Math.min(1, p * 4) * (.6 - j * .055)); });
      }, function () {
        orb.remove(); trail.forEach(function (e) { e.remove(); });
        var f = dot('chime__flash', bx, by);
        anim(480, function (p) { place(f, bx, by, .3 + 1.4 * easeOut(p), 1 - p); }, function () { f.remove(); });
        startRing(17); land();
      });
      return it;
    }

    // --- mark all read: each unread dot flies back into the badge, the count rolls down
    function markAllRead() {
      var todo = items.filter(function (it) { return it.unread; });
      if (!todo.length) return;
      var calm = reduce && reduce.matches;
      if (!isOpen || calm) { todo.forEach(markRead); sync(true); sr.textContent = 'All notifications marked as read'; done(); return; }
      var target = pt(badge, .5, .5), left = shown, lr = list.getBoundingClientRect(), s = k() || 1, o = root.getBoundingClientRect();
      var top = (lr.top - o.top) / s + 6, bot = (lr.bottom - o.top) / s - 6;
      todo.forEach(function (it, i) {
        later(function () {
          it.btn.classList.remove('is-sweep'); void it.btn.offsetWidth; it.btn.classList.add('is-sweep', 'is-launch');
          var a = pt(it.btn.querySelector('.chime__dot')); a[1] = Math.max(top, Math.min(bot, a[1]));
          var c = [Math.max(a[0], target[0]) + 34, Math.min(a[1], target[1]) - 26];
          var e = dot('chime__fly', a[0], a[1]);
          anim(560, function (p) {
            var u = easeInOut(p), v = 1 - u;
            place(e, v * v * a[0] + 2 * v * u * c[0] + u * u * target[0], v * v * a[1] + 2 * v * u * c[1] + u * u * target[1], 1 - .35 * u, 1);
          }, function () {
            e.remove(); markRead(it); left -= 1;
            setBadge(Math.max(0, left), true); sync(true, true);
            if (i === todo.length - 1) { later(function () { setBadge(0); sync(); startRing(7); }, 180); }
          });
        }, i * 130);
      });
      it_sweep_done(todo.length * 130 + 760);
      function it_sweep_done(ms) { later(function () { items.forEach(function (it) { it.btn.classList.remove('is-sweep'); }); done(); }, ms); }
      function done() {
        sr.textContent = 'All notifications marked as read';
        if (opts.onRead) opts.onRead();
        root.dispatchEvent(new CustomEvent('chime:read', { bubbles: true }));
      }
    }

    // --- open / close
    var viaKey = false;
    // keep the panel inside the viewport (12px gutter) and grow it from the bell
    function fit() {
      var start = root.classList.contains('chime--start'), s = k() || 1;
      panel.style.left = panel.style.right = ''; panel.style.transformOrigin = '';
      var r = root.getBoundingClientRect(), w = panel.offsetWidth * s, vw = document.documentElement.clientWidth, g = 12;
      var left = start ? r.left - 6 * s : r.right + 6 * s - w, shift = 0;
      if (left < g) shift = g - left; else if (left + w > vw - g) shift = vw - g - (left + w);
      if (!shift) return; shift /= s;
      if (start) panel.style.left = (-6 + shift) + 'px'; else panel.style.right = (-6 - shift) + 'px';
      var bx = btn.offsetLeft + btn.offsetWidth / 2 - (start ? -6 + shift : root.offsetWidth + 6 + shift - panel.offsetWidth);
      panel.style.transformOrigin = bx.toFixed(1) + 'px -12px';
    }
    function open() {
      if (isOpen) return; fit(); isOpen = true; root.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      if (viaKey) { var f = list.querySelector('.chime__item') || allBtn; setTimeout(function () { f.focus(); }, 60); }
      if (opts.onOpen) opts.onOpen();
    }
    function close(focusBtn) {
      if (!isOpen) return; isOpen = false; root.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
      if (opts.onClose) opts.onClose();
    }
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') viaKey = true; if (e.key === 'ArrowDown') { e.preventDefault(); open(); } });
    btn.addEventListener('click', function () { isOpen ? close() : open(); viaKey = false; });
    allBtn.addEventListener('click', markAllRead);
    if (more) more.addEventListener('click', function () { if (opts.onMore) opts.onMore(); root.dispatchEvent(new CustomEvent('chime:more', { bubbles: true })); });
    root.addEventListener('keydown', function (e) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && panel.contains(document.activeElement)) {
        var all = [].slice.call(panel.querySelectorAll('.chime__item')), i = all.indexOf(document.activeElement);
        if (!all.length) return; e.preventDefault();
        all[(i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length].focus();
      }
    });
    function onEsc(e) { if (e.key === 'Escape' && isOpen) { e.preventDefault(); close(root.contains(document.activeElement) || document.activeElement === document.body); } }
    document.addEventListener('keydown', onEsc);
    function onResize() { if (isOpen) fit(); }
    global.addEventListener('resize', onResize);
    function outside(e) { if (isOpen && e.isTrusted && !root.contains(e.target) && !(e.target.closest && e.target.closest('[data-chime-keep]'))) close(); }
    document.addEventListener('pointerdown', outside, true);

    load(src);
    var api = {
      notify: notify, open: open, close: function () { close(); }, toggle: function () { isOpen ? close() : open(); },
      markAllRead: markAllRead, ring: function (a) { startRing(a || 12); },
      count: function () { return unread(); }, items: function () { return items.map(publicItem); },
      set: function (arr) { load(arr || []); },
      reset: function () { timers.slice().forEach(clearTimeout); timers = []; anims = []; fx.innerHTML = ''; close(); load(initial); },
      destroy: function () { alive = false; global.cancelAnimationFrame(raf); timers.forEach(clearTimeout); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', onEsc); global.removeEventListener('resize', onResize); delete root._chime; }
    };
    root._chime = api;
    return api;
  }

  global.Chime = { mount: mount };
  function auto() { [].forEach.call(document.querySelectorAll('[data-chime]:not([data-chime-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
