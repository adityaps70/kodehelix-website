/* Snip — a code block whose Copy button pulls every line into the clipboard.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <div class="snip" data-snip data-file="app.js" data-lang="js"><pre><code>...your code...</code></pre></div>
     const block = Snip.mount(el, { onCopy: text => console.log('copied') });
   Elements with data-snip mount themselves on DOMContentLoaded unless data-snip-manual is set. */
(function (global) {
  'use strict';
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var ICON = {
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 3v5h5"/><path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/></svg>',
    term: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7.5 10l2.5 2-2.5 2M12.5 14.5h4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect data-body x="5" y="4.5" width="14" height="16.5" rx="2.6"/>' +
      '<rect data-clip x="9" y="2.6" width="6" height="3.6" rx="1.3"/>' +
      '<path data-l d="M8.6 10.5h6.8"/><path data-l d="M8.6 13.8h6.8"/><path data-l d="M8.6 17.1h4.2"/>' +
      '<path data-ok d="M8.4 13.4l2.6 2.6 4.8-5.4"/></svg>'
  };

  // ---- tiny highlighter: one regex per language, tokens split across lines safely ----
  var R = {
    js: [['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//], ['s', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/],
      ['k', /\b(?:const|let|var|function|return|if|else|for|while|do|await|async|new|import|from|export|default|class|extends|try|catch|finally|throw|of|in|typeof|true|false|null|undefined|this)\b/],
      ['n', /\b\d+(?:\.\d+)?\b/], ['f', /[A-Za-z_$][\w$]*(?=\s*\()/]],
    css: [['c', /\/\*[\s\S]*?\*\//], ['s', /'[^'\n]*'|"[^"\n]*"/], ['k', /@[\w-]+|!important/],
      ['a', /--[\w-]+|[a-z-]+(?=\s*:[^:{]*[;}])/], ['n', /#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|s|ms|deg|vh|vw|fr)?\b/],
      ['f', /[\w-]+(?=\()/], ['t', /[.#][\w-]+/]],
    html: [['c', /<!--[\s\S]*?-->/], ['t', /<\/?[\w-]+|\/?>/], ['s', /"[^"]*"|'[^']*'/], ['a', /[\w:-]+(?==)/]],
    sh: [['c', /(?:^|\s)#[^\n]*/], ['s', /'[^'\n]*'|"[^"\n]*"/], ['p', /^\$ ?/m], ['a', /\s--?[\w-]+/], ['f', /(?:^|\$ |&& |\| )[\w.-]+/m]]
  };
  R.ts = R.jsx = R.javascript = R.js; R.bash = R.shell = R.zsh = R.sh; R.xml = R.svg = R.html;
  function highlight(text, lang) {
    var rules = R[lang]; var out = [''];
    var push = function (s, cls) {
      s.split('\n').forEach(function (part, i) {
        if (i) out.push('');
        if (part) out[out.length - 1] += cls ? '<span class="tk-' + cls + '">' + esc(part) + '</span>' : esc(part);
      });
    };
    if (!rules) { push(text); return out; }
    var re = new RegExp(rules.map(function (r) { return '(' + r[1].source + ')'; }).join('|'), 'gm');
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      push(text.slice(last, m.index));
      for (var g = 1; g <= rules.length; g++) if (m[g] !== undefined) { push(m[0], rules[g - 1][0]); break; }
      last = re.lastIndex;
    }
    push(text.slice(last));
    return out;
  }

  function writeClipboard(text) {
    function fallback() {
      try {
        var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      } catch (e) { /* nothing else to try */ }
    }
    try {
      if (navigator.clipboard && global.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    } catch (e) { /* fall through */ }
    fallback(); return Promise.resolve();
  }

  function mount(root, opts) {
    if (root._snip) return root._snip;
    opts = opts || {};
    var ds = root.dataset;
    var lang = (opts.lang || ds.lang || 'js').toLowerCase();
    var file = opts.file || ds.file || '';
    var hold = (opts.hold != null ? opts.hold : parseFloat(ds.hold || '1.8')) * 1000;
    var speed = opts.speed || parseFloat(ds.speed || '1') || 1;
    var term = root.classList.contains('snip--term');
    var src = opts.code != null ? opts.code : (root.querySelector('code') || root).textContent;
    src = src.replace(/^\n/, '').replace(/\s+$/, '');

    root.innerHTML = '';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', (file || lang.toUpperCase()) + ' code');
    var head = el('div', 'snip__head');
    head.innerHTML = (term ? ICON.term : ICON.file) + '<span class="snip__file"></span><span class="snip__lang"></span>' +
      '<span class="snip__count" aria-hidden="true"></span>' +
      '<button type="button" class="snip__copy"><span class="snip__ic">' + ICON.copy + '</span>' +
      '<span class="snip__word"><span>Copy</span><span>Copied</span></span><span class="snip__ring"></span></button>';
    head.querySelector('.snip__file').textContent = file || (term ? 'Terminal' : 'Snippet');
    head.querySelector('.snip__lang').textContent = lang;
    var body = el('div', 'snip__body'); body.tabIndex = 0;
    body.setAttribute('aria-label', 'Code, scroll sideways for long lines');
    var codeEl = el('code', 'snip__code'); body.appendChild(codeEl);
    var fx = el('div', 'snip__fx'); fx.setAttribute('aria-hidden', 'true');
    var sr = el('span', 'snip__sr'); sr.setAttribute('aria-live', 'polite');
    root.append(head, body, fx, sr);

    var btn = head.querySelector('.snip__copy'), ic = head.querySelector('.snip__ic');
    var count = head.querySelector('.snip__count'), ring = head.querySelector('.snip__ring');
    var lines = head.querySelectorAll('[data-l]'), ok = head.querySelector('[data-ok]'), clip = head.querySelector('[data-clip]');
    btn.setAttribute('aria-label', 'Copy code');
    var rows = [], text = '';

    function render(code, lng) {
      text = code; lang = lng || lang;
      head.querySelector('.snip__lang').textContent = lang;
      var html = opts.highlight === false ? highlight(code, '') : typeof opts.highlight === 'function' ? opts.highlight(code, lang).split('\n') : highlight(code, lang);
      codeEl.innerHTML = html.map(function (h, i) {
        return '<span class="snip__row"><button type="button" class="snip__ln" tabindex="-1" aria-label="Copy line ' + (i + 1) + '">' + (i + 1) +
          '</button><span class="snip__lc">' + (h || ' ') + '</span></span>';
      }).join('');
      rows = [].slice.call(codeEl.children);
    }
    render(src, lang);

    // ---- the copy moment ----
    var raf = 0, timer = 0, run = null;
    function setIcon(fill, okP, bump) {
      for (var i = 0; i < lines.length; i++) lines[i].style.strokeDashoffset = 8 * (1 - clamp(fill * 3 - i));
      ok.style.strokeDashoffset = 14 * (1 - okP);
      ic.style.transform = 'scale(' + (1 + bump) + ')';
      clip.style.transform = 'translateY(' + (bump * 6) + 'px)';
    }
    function clear() {
      cancelAnimationFrame(raf); clearTimeout(timer); run = null;
      fx.innerHTML = '';
      rows.forEach(function (r) { r.classList.remove('is-lit', 'is-out'); });
    }
    function reset() {
      clear(); root.classList.remove('is-copied'); setIcon(0, 0, 0);
      ring.style.opacity = 0;
    }

    function copy(only) {
      var pick = only ? [only - 1] : rows.map(function (_, i) { return i; });
      var payload = only ? text.split('\n')[only - 1] : text;
      clear(); root.classList.remove('is-copied');
      var done = writeClipboard(payload);
      if (opts.onCopy) opts.onCopy(payload);
      var n = pick.length;
      count.textContent = only ? 'Line ' + only : n + (n === 1 ? ' line' : ' lines');
      sr.textContent = '';

      var rr = root.getBoundingClientRect(), br = body.getBoundingClientRect(), ir = ic.getBoundingClientRect();
      var z = rr.width / (root.offsetWidth || rr.width) || 1;      // works inside scaled containers too
      var tx = (ir.left + ir.width / 2 - rr.left) / z, ty = (ir.top + ir.height / 2 - rr.top) / z;
      var quick = reduce && reduce.matches;
      var ghosts = [], k = 0;
      pick.forEach(function (i) {
        var row = rows[i], lc = row.querySelector('.snip__lc'), r = lc.getBoundingClientRect();
        var o = { row: row, k: k++ };
        ghosts.push(o);
        var x0 = Math.max(r.left, br.left + 4), x1 = Math.min(r.right, br.right - 8);
        if (quick || !lc.textContent.trim() || x1 - x0 < 4 || r.bottom < br.top || r.top > br.bottom) return;
        var g = el('i', 'snip__ghost'), w = (x1 - x0) / z, h = Math.max(4, r.height / z * .36);
        g.style.width = w + 'px'; g.style.height = h + 'px';
        fx.appendChild(g);
        o.g = g; o.w = w; o.h = h; o.x = (x0 - rr.left) / z + w / 2; o.y = (r.top - rr.top + r.height / 2) / z;
      });
      var flying = ghosts.filter(function (o) { return o.g; }).length;
      var total = ghosts.length;
      var stagger = quick ? 0 : total > 1 ? Math.min(.055, .55 / total) : 0;
      var landT = quick ? .15 : .1 + stagger * (total - 1) + .2 + .6;     // last ghost lands
      run = { t0: performance.now(), hit: 0 };

      function frame(now) {
        var t = (now - run.t0) / 1000 * speed, landed = 0, bump = 0;
        ghosts.forEach(function (o) {
          var s = .1 + o.k * stagger;            // scan reaches this line
          if (!quick && t >= s && !o.lit) { o.lit = 1; o.row.classList.add('is-lit'); }
          if (o.lit === 1 && t >= s + .5) { o.lit = 2; o.row.classList.remove('is-lit'); }
          if (!o.g) return;
          var lift = clamp((t - s - .04) / .16), fly = clamp((t - s - .2) / .6);
          if (t >= s + .1 && !o.out) { o.out = 1; o.row.classList.add('is-out'); }
          if (fly >= 1) {
            landed++;
            if (!o.land) { o.land = now; o.row.classList.remove('is-out'); }
            bump = Math.max(bump, .14 * Math.max(0, 1 - (now - o.land) * speed / 200));
            o.g.style.opacity = 0; return;
          }
          var e = easeIO(fly);
          var cx = o.x + (tx - o.x) * .55, cy = Math.min(o.y, ty) - 60;      // arc up, drop into the clipboard
          var x = (1 - e) * (1 - e) * o.x + 2 * (1 - e) * e * cx + e * e * tx;
          var y = (1 - e) * (1 - e) * o.y + 2 * (1 - e) * e * cy + e * e * ty;
          var sh = easeOut(clamp(fly / .5)), gw = o.w + (Math.min(o.w, 16) - o.w) * sh, gh = o.h * (1 - .3 * sh);
          o.g.style.width = gw + 'px'; o.g.style.height = gh + 'px';
          o.g.style.opacity = .95 * easeOut(lift) * (1 - clamp((fly - .86) / .14));
          o.g.style.transform = 'translate(' + (x - gw / 2) + 'px,' + (y - gh / 2 - 4 * easeOut(lift)) + 'px)';
        });
        var fill = flying ? landed / flying : clamp(t / .15);
        var okP = clamp((t - landT - .05) / .35), lineFade = 1 - clamp((t - landT) / .2);
        if (t >= landT && !run.hit) {
          run.hit = 1; root.classList.add('is-copied');
          sr.textContent = only ? 'Copied line ' + only : 'Copied ' + n + (n === 1 ? ' line' : ' lines');
        }
        var pop = clamp((t - landT) / .55);
        ring.style.opacity = run.hit ? .7 * (1 - pop) : 0;
        ring.style.transform = 'scale(' + (1 + .18 * easeOut(pop)) + ',' + (1 + .5 * easeOut(pop)) + ')';
        setIcon(fill * lineFade, easeOut(okP), bump + (run.hit ? .12 * Math.sin(Math.PI * clamp((t - landT) / .3)) : 0));
        if (t < landT + .6) raf = requestAnimationFrame(frame);
        else { fx.innerHTML = ''; timer = setTimeout(reset, hold); }
      }
      raf = requestAnimationFrame(frame);
      return done;
    }

    btn.addEventListener('click', function () { copy(); });
    codeEl.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.snip__ln');
      if (b) copy(rows.indexOf(b.parentNode) + 1);
    });
    addEventListener('resize', function () { if (run) { clear(); root.classList.add('is-copied'); setIcon(0, 1, 0); timer = setTimeout(reset, hold); } });
    setIcon(0, 0, 0);

    var api = {
      copy: function () { return copy(); },
      copyLine: function (n) { return copy(n); },
      reset: reset,
      setCode: function (code, lng) { reset(); render(String(code), lng); },
      get text() { return text; }
    };
    root._snip = api;
    return api;
  }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function auto() {
    [].forEach.call(document.querySelectorAll('[data-snip]'), function (n) { if (!n.hasAttribute('data-snip-manual')) mount(n); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  global.Snip = { mount: mount, highlight: highlight };
})(window);
