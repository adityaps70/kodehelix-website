/*! Bellows · pleated FAQ accordion · Kodehelix UI · kodehelix.in */
(function () {
  'use strict';
  var uid = 0;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h12"/><path class="bellows__v" d="M12 6v12"/></svg>';
  var ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="bellows__zz" d="M5 5h14M7 9.5l10 0M5 14h14M7 18.5h10"/></svg>';
  var SAMPLE = [
    { q: 'Can I change my plan later?', a: '<p>Yes. Upgrade or downgrade at any time and we charge or credit the difference on your next bill.</p>' },
    { q: 'Do you offer refunds?', a: '<p>Every plan has a 14-day money-back guarantee. No forms, just reply to your receipt.</p>' },
    { q: 'Is my data private?', a: '<p>Everything is encrypted in transit and at rest, and you can export or delete it whenever you like.</p>' }
  ];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function txt(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function fromDetails(root) {
    var out = [];
    Array.prototype.forEach.call(root.children, function (d) {
      if (d.tagName !== 'DETAILS') return;
      var s = d.querySelector('summary'), q = s ? s.textContent.trim() : '';
      if (s) s.remove();
      out.push({ q: q, a: d.innerHTML.trim(), open: d.open });
    });
    return out;
  }

  function mount(root, opts) {
    opts = opts || {};
    if (root.__bellows) root.__bellows.destroy();
    var items = opts.items, attr = root.getAttribute('data-bellows-items');
    if (!items && attr) { try { items = JSON.parse(attr); } catch (e) { items = null; } }
    if (!items) { var d = fromDetails(root); if (d.length) items = d; }
    if (!items) items = SAMPLE;
    var multiple = opts.multiple != null ? !!opts.multiple : root.hasAttribute('data-multiple');
    var title = opts.title != null ? opts.title : (root.getAttribute('data-title') || 'Questions, answered');
    var sub = opts.subtitle != null ? opts.subtitle : (root.getAttribute('data-subtitle') || '');
    var id = 'bellows' + (++uid), timers = [];

    root.innerHTML = '';
    root.classList.add('bellows');
    var head = el('div', 'bellows__head');
    var hgroup = el('div', 'bellows__hg');
    if (title) hgroup.appendChild(el('h3', 'bellows__title', txt(title)));
    if (sub) hgroup.appendChild(el('p', 'bellows__sub', txt(sub)));
    head.appendChild(hgroup);
    var allBtn = null;
    if (opts.allButton !== false) {
      allBtn = el('button', 'bellows__all', ALL + '<span>Expand all</span>');
      allBtn.type = 'button';
      allBtn.setAttribute('aria-controls', '');
      head.appendChild(allBtn);
    }
    if (title || sub || allBtn) root.appendChild(head);
    var list = el('div', 'bellows__list');
    root.appendChild(list);

    var rows = items.map(function (it, i) {
      var item = el('div', 'bellows__item');
      var h = el('h4', 'bellows__hd');
      var btn = el('button', 'bellows__q',
        (opts.numbered === false ? '' : '<span class="bellows__num" aria-hidden="true">' + (i < 9 ? '0' : '') + (i + 1) + '</span>') +
        '<span class="bellows__qt">' + txt(it.q) + '</span><span class="bellows__ico">' + ICON + '</span>');
      btn.type = 'button';
      btn.id = id + '-q' + i;
      btn.setAttribute('aria-controls', id + '-a' + i);
      btn.setAttribute('aria-expanded', 'false');
      h.appendChild(btn);
      var panel = el('div', 'bellows__panel');
      panel.id = id + '-a' + i;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', btn.id);
      panel.hidden = true;
      var fold = el('div', 'bellows__fold');
      fold.setAttribute('aria-hidden', 'true');
      fold.setAttribute('inert', '');
      var body = el('div', 'bellows__body', it.a);
      panel.appendChild(fold);
      panel.appendChild(body);
      item.appendChild(h);
      item.appendChild(panel);
      list.appendChild(item);
      var r = { i: i, item: item, btn: btn, panel: panel, fold: fold, body: body, p: 0, target: 0, raf: 0, pleats: [], H: 0, K: 0 };
      btn.addEventListener('click', function () { clearTimers(); toggle(i); });
      btn.addEventListener('keydown', function (e) {
        var k = e.key, n = rows.length, j = -1;
        if (k === 'ArrowDown') j = (i + 1) % n;
        else if (k === 'ArrowUp') j = (i - 1 + n) % n;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = n - 1;
        if (j < 0) return;
        e.preventDefault();
        rows[j].btn.focus();
      });
      return r;
    });
    if (allBtn) {
      allBtn.setAttribute('aria-controls', rows.map(function (r) { return r.panel.id; }).join(' '));
      allBtn.addEventListener('click', function () { allOpen() ? closeAll() : openAll(); });
    }

    // Fold the answer into pleats: each strip is a clipped copy of the answer hinged at alternate edges.
    function build(r) {
      r.H = r.body.offsetHeight;
      r.K = Math.max(3, Math.min(9, Math.round(r.H / 22)));
      var h = r.H / r.K;
      r.fold.innerHTML = '';
      r.pleats = [];
      for (var i = 0; i < r.K; i++) {
        var w = el('div', 'bellows__pleat' + (i % 2 ? ' is-odd' : ''));
        var f = el('div', 'bellows__face');
        f.style.height = h + 'px';
        var g = r.body.cloneNode(true);
        g.className += ' bellows__ghost';
        g.style.top = (-i * h) + 'px';
        f.appendChild(g);
        w.appendChild(f);
        r.fold.appendChild(w);
        r.pleats.push(w);
      }
      r.panel.classList.add('is-moving');
    }

    function paint(r) {
      var th = r.p >= 1 ? -Math.min(18, (r.p - 1) * 200) : Math.acos(Math.max(0, r.p)) * 180 / Math.PI;
      var rad = th * Math.PI / 180, cs = Math.cos(rad), h = r.H / r.K;
      r.panel.style.height = (r.H * cs).toFixed(2) + 'px';
      r.panel.style.setProperty('--bellows-shade', Math.abs(Math.sin(rad)).toFixed(3));
      for (var i = 0; i < r.K; i++) {
        var w = r.pleats[i];
        w.style.height = (h * cs).toFixed(2) + 'px';
        w.firstChild.style.transform = 'perspective(420px) rotateX(' + (i % 2 ? -th : th).toFixed(2) + 'deg)';
      }
      if (r.target && r.p > 0.86 && !r.shone) {
        r.shone = true;
        r.panel.classList.remove('is-sheen');
        void r.panel.offsetWidth;
        r.panel.classList.add('is-sheen');
      }
    }

    function finish(r) {
      if (r.raf) cancelAnimationFrame(r.raf);
      r.raf = 0;
      r.p = r.target;
      r.panel.classList.remove('is-moving');
      r.fold.innerHTML = '';
      r.pleats = [];
      r.panel.style.height = '';
      if (!r.target) r.panel.hidden = true;
    }

    // Opening eases out with a little overshoot (the pleats spring past flat and settle); closing squeezes in.
    function ease(r, x) {
      var e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      return r.target ? e + .09 * Math.sin(Math.PI * Math.max(0, (x - .55) / .45)) : e;
    }
    function step(r) {
      var x = Math.min(1, (performance.now() - r.t) / r.dur);
      r.p = r.from + (r.target - r.from) * ease(r, x);
      if (x >= 1) { finish(r); return; }
      paint(r);
      r.raf = requestAnimationFrame(function () { step(r); });
    }
    function go(r) {
      r.from = r.p;
      r.dur = (r.target ? 900 : 620) * Math.max(.35, Math.min(1, Math.abs(r.target - r.p)));
      r.t = performance.now();
      if (!r.raf) r.raf = requestAnimationFrame(function () { step(r); });
    }

    function set(i, open) {
      var r = rows[i];
      if (!r) return;
      var t = open ? 1 : 0;
      if (r.target === t) return;
      r.target = t;
      r.btn.setAttribute('aria-expanded', String(!!open));
      r.item.classList.toggle('is-open', !!open);
      if (open && !multiple && !opening) rows.forEach(function (o) { if (o !== r && o.target) set(o.i, false); });
      if (RM.matches) { r.panel.hidden = false; finish(r); } else {
        if (!r.raf) {
          if (open) { r.panel.style.height = '0px'; r.panel.hidden = false; r.p = 0; }
          build(r);
          r.shone = false;
          paint(r);
        } else if (open) r.shone = false;
        go(r);
      }
      syncAll();
      if (opts.onToggle) opts.onToggle(i, !!open, items[i]);
    }

    var opening = false;
    function toggle(i) { set(i, !(rows[i] && rows[i].target)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function allOpen() { return rows.every(function (r) { return r.target; }); }
    function syncAll() {
      if (!allBtn) return;
      var on = allOpen();
      allBtn.classList.toggle('is-on', on);
      allBtn.lastChild.textContent = on ? 'Collapse all' : 'Expand all';
    }
    // Expand all ripples down the list like bellows being pulled open; collapse squeezes back up.
    function openAll() {
      clearTimers();
      var n = 0;
      rows.forEach(function (r) {
        if (r.target) return;
        timers.push(setTimeout(function () { opening = true; set(r.i, true); opening = false; }, n++ * 120));
      });
    }
    function closeAll() {
      clearTimers();
      var n = 0;
      rows.slice().reverse().forEach(function (r) {
        if (!r.target) return;
        timers.push(setTimeout(function () { set(r.i, false); }, n++ * 90));
      });
    }

    items.forEach(function (it, i) {
      if (it.open && (multiple || !rows.some(function (r) { return r.target; }))) {
        var r = rows[i];
        r.target = r.p = 1;
        r.panel.hidden = false;
        r.btn.setAttribute('aria-expanded', 'true');
        r.item.classList.add('is-open');
      }
    });
    syncAll();

    var api = {
      open: function (i) { clearTimers(); set(i, true); },
      close: function (i) { clearTimers(); set(i, false); },
      toggle: function (i) { clearTimers(); toggle(i); },
      openAll: openAll,
      closeAll: closeAll,
      isOpen: function (i) { return !!(rows[i] && rows[i].target); },
      destroy: function () {
        clearTimers();
        rows.forEach(function (r) { if (r.raf) cancelAnimationFrame(r.raf); });
        root.innerHTML = '';
        root.classList.remove('bellows');
        delete root.__bellows;
      }
    };
    root.__bellows = api;
    return api;
  }

  window.Bellows = { mount: mount };
  function auto() {
    document.querySelectorAll('[data-bellows]:not([data-bellows-manual])').forEach(function (n) { if (!n.__bellows) mount(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
