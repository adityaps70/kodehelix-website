/* Sonar — live search with a sonar ping · Kodehelix UI · kodehelix.in
   Sonar.mount(el, options) -> { search, clear, type, focus, destroy, input, root }
   Auto-mounts [data-sonar] on DOMContentLoaded unless data-sonar-manual is present. */
(function () {
  'use strict';
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 6 8-6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    chart: '<path d="M4 19.5h16M7 16v-4M12 16V6.5M17 16v-6.5"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    chat: '<path d="M6 17.5l-2.5 3V7A2.5 2.5 0 0 1 6 4.5h12A2.5 2.5 0 0 1 20.5 7v8a2.5 2.5 0 0 1-2.5 2.5z"/><path d="M8 10h8M8 13.5h5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"/>',
    form: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>',
    video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
    receipt: '<path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3"/>',
    bolt: '<path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    dot: '<circle cx="12" cy="12" r="4"/>',
    x: '<path d="M7 7l10 10M17 7L7 17"/>',
    flat: '<path d="M2 12h6l1.5-3 2 6 1.5-3h9"/>'
  };
  var seq = 0;
  function svg(b) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + b + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function now() { return performance.now(); }
  function rgb(c, fb) {
    c = (c || '').trim(); var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (!m) return fb || '34,195,238';
    var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1], n = parseInt(h, 16);
    return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function readItems(root) {
    return [].map.call(root.querySelectorAll('[data-sonar-item]'), function (n) {
      var d = n.dataset;
      return { title: d.title || n.textContent.trim(), meta: d.meta || '', keywords: d.keywords || '', icon: d.icon, tint: d.tint, href: n.getAttribute('href') };
    });
  }
  function mark(s, toks) {
    s = String(s || '');
    if (!toks.length) return esc(s);
    var low = norm(s); if (low.length !== s.length) low = s.toLowerCase();
    var on = [], i, p;
    toks.forEach(function (t) { p = 0; while ((p = low.indexOf(t, p)) >= 0) { for (i = p; i < p + t.length; i++) on[i] = true; p += t.length; } });
    var out = '', open = false;
    for (i = 0; i < s.length; i++) { if (!!on[i] !== open) { open = !open; out += open ? '<mark>' : '</mark>'; } out += esc(s[i]); }
    return out + (open ? '</mark>' : '');
  }

  function mount(root, opts) {
    if (root.__sonar) return root.__sonar;
    opts = opts || {};
    var ds = root.dataset;
    var items = opts.items || readItems(root);
    var noun = opts.noun || ds.noun || 'results';
    var label = opts.label || ds.label || 'Search';
    var placeholder = opts.placeholder || ds.placeholder || label + '…';
    var D = opts.wave != null ? +opts.wave : 900;
    var deb = opts.debounce != null ? +opts.debounce : 140;
    var hide = (opts.misses || ds.misses) === 'hide';
    var hotkey = opts.hotkey !== undefined ? opts.hotkey : (ds.hotkey !== undefined ? ds.hotkey : '/');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var uid = 'sonar' + (++seq);

    root.classList.add('sonar');
    root.innerHTML = '<canvas class="sonar__fx" aria-hidden="true"></canvas>' +
      '<div class="sonar__bar"><span class="sonar__lens">' + svg(ICONS.search) + '</span>' +
      '<input class="sonar__input" type="search" autocomplete="off" spellcheck="false" id="' + uid + '-q" aria-label="' + esc(label) +
      '" aria-controls="' + uid + '-list" placeholder="' + esc(placeholder) + '">' +
      (hotkey ? '<kbd class="sonar__kbd" aria-hidden="true">' + esc(hotkey) + '</kbd>' : '') +
      '<button type="button" class="sonar__clear" aria-label="Clear search">' + svg(ICONS.x) + '</button></div>' +
      '<div class="sonar__meta"><span aria-hidden="true"><b class="sonar__n">' + items.length + '</b> of ' + items.length + ' ' + esc(noun) +
      '</span><span class="sonar__scan" aria-hidden="true">Scanning</span></div>' +
      '<div class="sonar__body"><ul class="sonar__grid" id="' + uid + '-list" role="list" aria-label="' + esc(noun) + '"></ul>' +
      '<div class="sonar__empty" aria-hidden="true">' + svg(ICONS.flat) + '<p>No echo for “<span></span>”</p><small>Try a shorter or different word.</small></div></div>' +
      '<p class="sonar__sr" aria-live="polite"></p>';

    var q = function (s) { return root.querySelector(s); };
    var cv = q('.sonar__fx'), ctx = cv.getContext('2d'), input = q('.sonar__input'), lens = q('.sonar__lens'),
      grid = q('.sonar__grid'), nEl = q('.sonar__n'), sr = q('.sonar__sr'), emptyQ = q('.sonar__empty span'), clearBtn = q('.sonar__clear');

    var cards = items.map(function (it, i) {
      var li = document.createElement('li'), c = document.createElement(it.href ? 'a' : 'button');
      c.className = 'sonar__card';
      if (it.href) c.href = it.href; else c.type = 'button';
      if (it.tint) c.style.setProperty('--sonar-tint', it.tint);
      var ico = ICONS[it.icon] ? svg(ICONS[it.icon]) : (it.icon && /^\s*<svg/.test(it.icon) ? it.icon : svg(ICONS.dot));
      c.innerHTML = '<span class="sonar__ico">' + ico + '</span><span class="sonar__txt"><span class="sonar__t">' + esc(it.title) +
        '</span>' + (it.meta ? '<span class="sonar__m">' + esc(it.meta) + '</span>' : '') + '</span>';
      li.appendChild(c); grid.appendChild(li);
      var o = { i: i, it: it, li: li, el: c, t: c.querySelector('.sonar__t'), m: c.querySelector('.sonar__m'), hay: [norm(it.title), norm(it.meta), norm(it.keywords)],
        x: 0, y: 0, vx: 0, vy: 0, s: 1, vs: 0, ts: 1, o: 1, to: 1, g: 0, next: true, miss: false, score: 1, fired: true, d: 0 };
      li.__c = o;
      return o;
    });

    var wave = null, fx = null, blips = [], raf = 0, last = 0, query = '', tmr = 0, typeTok = 0, nY = 0, W = 0, H = 0, dpr = 1, acc = '';

    function score(c, toks) {
      if (opts.filter) { var r = opts.filter(c.it, toks.join(' ')); return r === true ? 1 : (+r || 0); }
      var s = 0;
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i], h = c.hay, p = h[0].indexOf(t);
        if (p === 0) s += 4; else if (p > 0 && /[\s\-&/]/.test(h[0][p - 1])) s += 3; else if (p > 0) s += 2;
        else if (h[1].indexOf(t) >= 0) s += 1.5; else if (h[2].indexOf(t) >= 0) s += 1; else return 0;
      }
      return s;
    }
    function setCount(n) { if (nEl.textContent !== String(n)) { nEl.textContent = n; nY = 1; kick(); } }
    function rAt(el) { var k = Math.max(0, Math.min(1, el / D)); return fx.R * (1 - Math.pow(1 - k, 3)); }

    function run(v) {
      v = String(v || '').trim();
      if (v === query && !wave) return;
      query = v;
      var toks = norm(v).split(/\s+/).filter(Boolean);
      cards.forEach(function (c) { c.score = toks.length ? score(c, toks) : 1; c.next = c.score > 0; c.fired = false; });
      if (hide) cards.forEach(function (c) { c.li.style.display = ''; });
      var rb = root.getBoundingClientRect(), lb = lens.getBoundingClientRect(), z = rb.width / root.offsetWidth || 1,
        ox = (lb.left + lb.width / 2 - rb.left) / z - root.clientLeft, oy = (lb.top + lb.height / 2 - rb.top) / z - root.clientTop, R = 0;
      cards.forEach(function (c) {
        var b = c.li.getBoundingClientRect();
        c.d = Math.hypot((b.left + b.width / 2 - rb.left) / z - root.clientLeft - ox, (b.top + b.height / 2 - rb.top) / z - root.clientTop - oy);
        R = Math.max(R, c.d);
      });
      fx = { t0: now(), ox: ox, oy: oy, R: R + 90 };
      wave = { q: v, toks: toks, hits: 0, reordered: false };
      root.classList.add('is-scanning'); root.classList.remove('is-empty');
      setCount(0);
      if (reduce) { cards.forEach(fire); reorder(true); finish(); fx = null; return; }
      kick();
    }
    function fire(c) {
      c.fired = true; c.miss = !c.next;
      c.li.classList.toggle('is-miss', c.miss);
      c.li.setAttribute('aria-hidden', c.miss ? 'true' : 'false');
      if (c.miss) c.el.setAttribute('tabindex', '-1'); else c.el.removeAttribute('tabindex');
      c.t.innerHTML = mark(c.it.title, wave.toks);
      if (c.m) c.m.innerHTML = mark(c.it.meta, wave.toks);
      if (c.miss) { c.to = 0.26; c.ts = 0.965; c.vs -= 0.8; }
      else {
        c.to = 1; c.ts = 1; wave.hits++; setCount(wave.hits);
        if (wave.toks.length && !reduce) {
          c.g = 1; c.vs += 2.4;
          var rb = root.getBoundingClientRect(), ib = c.el.querySelector('.sonar__ico').getBoundingClientRect(), z = rb.width / root.offsetWidth || 1;
          if (!c.col) c.col = rgb(getComputedStyle(c.el).getPropertyValue('--sonar-tint'));
          blips.push({ x: (ib.left + ib.width / 2 - rb.left) / z - root.clientLeft, y: (ib.top + ib.height / 2 - rb.top) / z - root.clientTop, t0: now(), col: c.col });
        }
      }
    }
    function reorder(instant) {
      var order = cards.slice().sort(function (a, b) { return (b.next - a.next) || (b.score - a.score) || (a.i - b.i); });
      if (!order.some(function (c, k) { return grid.children[k] !== c.li; })) return;
      var first = order.map(function (c) { return [c.li.offsetLeft + c.x, c.li.offsetTop + c.y]; }), fo = document.activeElement;
      order.forEach(function (c) { grid.appendChild(c.li); });
      if (fo && root.contains(fo) && document.activeElement !== fo) fo.focus({ preventScroll: true });
      order.forEach(function (c, k) {
        if (instant) { c.x = c.y = c.vx = c.vy = 0; apply(c); return; }
        c.x = first[k][0] - c.li.offsetLeft; c.y = first[k][1] - c.li.offsetTop;
      });
      kick();
    }
    function finish() {
      var w = wave; wave = null;
      root.classList.remove('is-scanning');
      root.classList.toggle('is-empty', !!w.q && !w.hits);
      emptyQ.textContent = w.q;
      sr.textContent = w.q ? (w.hits ? w.hits + ' ' + noun + ' for ' + w.q : 'No ' + noun + ' for ' + w.q) : items.length + ' ' + noun;
      if (hide) cards.forEach(function (c) { if (c.miss) c.li.style.display = 'none'; });
      if (opts.onResults) opts.onResults(visible().map(function (c) { return c.it; }), w.q);
    }
    function visible() {
      return [].map.call(grid.children, function (li) { return li.__c; }).filter(function (c) { return !c.miss; });
    }
    function apply(c) {
      var still = !c.x && !c.y && c.s === 1;
      c.li.style.transform = still ? '' : 'translate(' + c.x.toFixed(2) + 'px,' + c.y.toFixed(2) + 'px) scale(' + c.s.toFixed(4) + ')';
      c.li.style.opacity = c.o > 0.998 ? '' : c.o.toFixed(3);
      c.el.style.setProperty('--sonar-g', c.g.toFixed(3));
    }

    function kick() { if (!raf) { last = now(); raf = requestAnimationFrame(tick); } }
    function tick() {
      raf = 0;
      var t = now(), dt = Math.min(0.05, Math.max(0, (t - last) / 1000)), busy = false; last = t;
      if (wave && fx) {
        var el = t - fx.t0, r = rAt(el);
        cards.forEach(function (c) { if (!c.fired && r >= c.d) fire(c); });
        if (el >= D + 110 && !wave.reordered) { wave.reordered = true; cards.forEach(function (c) { if (!c.fired) fire(c); }); reorder(); }
        if (el >= D + 650) finish();
        busy = true;
      }
      cards.forEach(function (c) {
        c.vx += (-170 * c.x - 19 * c.vx) * dt; c.x += c.vx * dt;
        c.vy += (-170 * c.y - 19 * c.vy) * dt; c.y += c.vy * dt;
        c.vs += (-320 * (c.s - c.ts) - 21 * c.vs) * dt; c.s += c.vs * dt;
        c.o += (c.to - c.o) * (1 - Math.exp(-dt * 11));
        c.g *= Math.exp(-dt * 1.8);
        if (Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.vx) + Math.abs(c.vy) > 0.06 || Math.abs(c.s - c.ts) + Math.abs(c.vs) > 0.0006 ||
          Math.abs(c.o - c.to) > 0.003 || c.g > 0.01) busy = true;
        else { c.x = c.y = c.vx = c.vy = c.vs = 0; c.s = c.ts; c.o = c.to; c.g = 0; }
        apply(c);
      });
      if (nY > 0.01) { nY *= Math.exp(-dt * 12); busy = true; } else nY = 0;
      nEl.style.transform = nY ? 'translateY(' + (-nY * 7).toFixed(2) + 'px)' : '';
      nEl.style.opacity = nY ? (1 - nY * 0.6).toFixed(3) : '';
      if (draw(t)) busy = true;
      if (busy) raf = requestAnimationFrame(tick);
    }

    function draw(t) {
      var w = root.clientWidth, h = root.clientHeight, d = Math.min(2, window.devicePixelRatio || 1);
      if (w !== W || h !== H || d !== dpr) { W = w; H = h; dpr = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var live = false;
      if (fx) {
        var el = t - fx.t0;
        if (el > D + 800) fx = null;
        else {
          live = true;
          if (!acc) acc = rgb(getComputedStyle(root).getPropertyValue('--sonar-accent'));
          var k = Math.min(1, el / D), r = rAt(el), fade = el < D ? 1 : Math.max(0, 1 - (el - D) / 800), a = (1 - k * 0.5) * fade;
          ctx.globalCompositeOperation = 'lighter';
          // radar dot field, brightest on the wavefront
          ctx.fillStyle = 'rgb(' + acc + ')';
          for (var y = 12; y < H; y += 20) for (var x = 12; x < W; x += 20) {
            var dd = Math.hypot(x - fx.ox, y - fx.oy), f = (dd - r) / 26,
              al = (0.05 + 0.8 * Math.exp(-f * f) + (dd < r ? 0.2 * (1 - k) : 0)) * fade;
            if (al < 0.03) continue;
            ctx.globalAlpha = Math.min(1, al); ctx.fillRect(x - 1, y - 1, 2, 2);
          }
          ctx.globalAlpha = 1;
          if (r > 2) {
            var g = ctx.createRadialGradient(fx.ox, fx.oy, Math.max(0, r - 110), fx.ox, fx.oy, r);
            g.addColorStop(0, 'rgba(' + acc + ',0)'); g.addColorStop(1, 'rgba(' + acc + ',' + (0.16 * a).toFixed(3) + ')');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx.ox, fx.oy, r, 0, 7); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(' + acc + ',' + (0.9 * a).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(fx.ox, fx.oy, r, 0, 7); ctx.stroke();
            var r2 = rAt(el - 150);
            if (r2 > 2) { ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(' + acc + ',' + (0.35 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(fx.ox, fx.oy, r2, 0, 7); ctx.stroke(); }
          }
          // emitter pulse at the lens
          var pk = Math.min(1, el / 420);
          if (pk < 1) { ctx.fillStyle = 'rgba(' + acc + ',' + (0.5 * (1 - pk)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(fx.ox, fx.oy, 4 + 14 * pk, 0, 7); ctx.fill(); }
        }
      }
      blips = blips.filter(function (b) { return t - b.t0 < 700; });
      if (blips.length) {
        live = true; ctx.globalCompositeOperation = 'lighter';
        blips.forEach(function (b) {
          var e = (t - b.t0) / 700, rr = 8 + 30 * (1 - Math.pow(1 - e, 3));
          ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(' + b.col + ',' + (0.85 * (1 - e)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, 7); ctx.stroke();
          ctx.fillStyle = 'rgba(' + b.col + ',' + (0.35 * (1 - e)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(b.x, b.y, rr * 0.7, 0, 7); ctx.fill();
        });
      }
      ctx.globalCompositeOperation = 'source-over';
      return live;
    }

    function clear() { input.value = ''; root.classList.remove('has-q'); clearTimeout(tmr); run(''); }
    function type(text, ms) {
      var tok = ++typeTok, i = 0; text = String(text || ''); ms = ms || 75;
      input.value = ''; root.classList.remove('has-q'); clearTimeout(tmr);
      if (!text) { run(''); return Promise.resolve(); }
      return new Promise(function (res) {
        (function step() {
          if (tok !== typeTok || i >= text.length) return res();
          input.value += text[i++]; input.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(step, ms);
        })();
      });
    }

    function onInput() {
      root.classList.toggle('has-q', !!input.value);
      clearTimeout(tmr); tmr = setTimeout(function () { run(input.value); }, deb);
    }
    function onInputKey(e) {
      var v = visible();
      if (e.key === 'ArrowDown' && v[0]) { e.preventDefault(); v[0].el.focus(); }
      else if (e.key === 'Enter' && v[0] && input.value.trim()) { e.preventDefault(); clearTimeout(tmr); run(input.value); v[0].el.click(); }
      else if (e.key === 'Escape' && input.value) { e.preventDefault(); clear(); }
    }
    function onGridKey(e) {
      var v = visible(), i = -1, j = -1, k = e.key;
      v.forEach(function (c, n) { if (c.el === document.activeElement) i = n; });
      if (i < 0) return;
      if (k === 'ArrowRight') j = i + 1; else if (k === 'ArrowLeft') j = i - 1;
      else if (k === 'Home') j = 0; else if (k === 'End') j = v.length - 1;
      else if (k === 'Escape') { e.preventDefault(); input.focus(); return; }
      else if (k === 'ArrowDown' || k === 'ArrowUp') {
        var me = v[i].li, dir = k === 'ArrowDown' ? 1 : -1, bd = 1e9;
        v.forEach(function (c, n) {
          var dy = (c.li.offsetTop - me.offsetTop) * dir;
          if (dy > 1) { var sc = dy * 10 + Math.abs(c.li.offsetLeft - me.offsetLeft); if (sc < bd) { bd = sc; j = n; } }
        });
        if (j < 0 && dir < 0) { e.preventDefault(); input.focus(); return; }
      }
      if (j >= 0 && j < v.length) { e.preventDefault(); v[j].el.focus(); }
    }
    function onClick(e) {
      var el = e.target.closest && e.target.closest('.sonar__card');
      if (el && opts.onSelect) opts.onSelect(el.parentNode.__c.it, el, e);
    }
    function onHotkey(e) {
      if (!hotkey || e.key !== hotkey || e.metaKey || e.ctrlKey || e.altKey) return;
      var a = document.activeElement;
      if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
      e.preventDefault(); input.focus();
    }
    function onClear() { clear(); input.focus(); }
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onInputKey);
    grid.addEventListener('keydown', onGridKey);
    grid.addEventListener('click', onClick);
    clearBtn.addEventListener('click', onClear);
    document.addEventListener('keydown', onHotkey);

    var api = {
      root: root, input: input,
      search: function (v) { input.value = v || ''; root.classList.toggle('has-q', !!input.value); clearTimeout(tmr); run(input.value); },
      clear: clear, type: type,
      focus: function () { input.focus(); },
      results: function () { return visible().map(function (c) { return c.it; }); },
      destroy: function () {
        cancelAnimationFrame(raf); clearTimeout(tmr); typeTok++;
        document.removeEventListener('keydown', onHotkey);
        root.innerHTML = ''; root.classList.remove('sonar', 'is-scanning', 'is-empty', 'has-q'); delete root.__sonar;
      }
    };
    root.__sonar = api;
    return api;
  }

  function auto() { [].forEach.call(document.querySelectorAll('[data-sonar]:not([data-sonar-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  window.Sonar = { mount: mount, icons: ICONS };
})();
