/* Bloom — a dialog that grows out of the exact button that opened it, and folds back into it.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <button data-bloom="#invite">Invite</button>
     <div class="bloom" id="invite" hidden> <h2 class="bloom__title">…</h2> … </div>
     <script src="bloom.js"></script>
   Every [data-bloom] is mounted on DOMContentLoaded (add data-bloom-manual to opt out), or:
     const b = Bloom.mount(button, { dialog: '#invite' });  b.open();  b.close();
   Events on the trigger: bloom:open (opening starts), bloom:close (fully closed, focus returned). */
(function (g) {
  'use strict';
  const D = document;
  const clamp = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = t => 1 - Math.pow(1 - t, 3);
  function spring(z, w) { // damped spring 0 -> 1, z = damping ratio, w = natural frequency
    const T = 6.9 / (z * w);
    if (z >= 1) return { T, f: t => 1 - Math.exp(-w * t) * (1 + w * t) };
    const wd = w * Math.sqrt(1 - z * z);
    return { T, f: t => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)) };
  }
  const OPEN = spring(.7, 15), CLOSE = spring(1, 19), ITEM = spring(.66, 18);
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const reduced = () => g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0, locks = 0, saved = null, kb = false;
  D.addEventListener('keydown', () => { kb = true; }, true);
  D.addEventListener('pointerdown', () => { kb = false; }, true);

  function el(tag, cls) { const e = D.createElement(tag); e.className = cls; return e; }
  function rectOf(n) {
    const r = n.getBoundingClientRect(), cs = getComputedStyle(n);
    return { x: r.left, y: r.top, w: r.width, h: r.height, r: Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2) };
  }
  function scrollLock(on) {
    const h = D.documentElement, b = D.body;
    if (on && locks++ === 0) {
      const sw = innerWidth - h.clientWidth;
      saved = [h.style.overflow, b.style.paddingRight];
      h.style.overflow = 'hidden';
      if (sw > 0) b.style.paddingRight = sw + 'px';
    } else if (!on && --locks === 0) { h.style.overflow = saved[0]; b.style.paddingRight = saved[1]; }
  }

  function mount(trigger, opts = {}) {
    if (trigger._bloom) return trigger._bloom;
    let dlg = opts.dialog || trigger.getAttribute('data-bloom') || '#' + trigger.getAttribute('aria-controls');
    if (typeof dlg === 'string') dlg = D.querySelector(dlg);
    if (!dlg) throw new Error('Bloom: dialog not found');
    const id = dlg.id || (dlg.id = 'bloom-' + ++uid);
    dlg.classList.add('bloom');
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.tabIndex = -1;
    if (!dlg.hasAttribute('aria-label') && !dlg.hasAttribute('aria-labelledby')) {
      const h = dlg.querySelector('h1,h2,h3,h4,h5,h6');
      if (h) dlg.setAttribute('aria-labelledby', h.id || (h.id = id + '-title'));
    }
    if (!dlg.hasAttribute('aria-describedby')) {
      const p = dlg.querySelector('p');
      if (p) dlg.setAttribute('aria-describedby', p.id || (p.id = id + '-desc'));
    }
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', id);

    const layer = el('div', 'bloom-layer'), back = el('div', 'bloom-backdrop'), skin = el('div', 'bloom-skin'),
      clip = el('div', 'bloom-skin__clip'), from = el('div', 'bloom-skin__from');
    let ghost = el('span', '');
    clip.append(from, ghost); skin.append(clip);
    skin.setAttribute('aria-hidden', 'true'); back.setAttribute('aria-hidden', 'true');
    layer.hidden = skin.hidden = true;
    if (opts.closeButton !== false && !dlg.querySelector('.bloom__x')) {
      const x = el('button', 'bloom__x');
      x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.setAttribute('data-bloom-close', '');
      x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
      dlg.prepend(x);
    }
    dlg.hidden = false;
    layer.append(back, skin, dlg);
    D.body.appendChild(layer);
    const strokes = [...dlg.querySelectorAll('.bloom__icon svg :is(path,circle,line,polyline,rect,ellipse)')];
    strokes.forEach(s => s.setAttribute('pathLength', '1'));
    const items = () => [...dlg.children].flatMap(c => c.classList.contains('bloom__x') ? [] : c.tagName === 'FORM' ? [...c.children] : [c]);
    const focusables = () => [...dlg.querySelectorAll(FOCUSABLE)].filter(n => n.getClientRects().length);

    let state = 'closed', raf = 0, cur = null, shadow = '', inerted = [], tOpacity = '', downOut = false;

    function paint(R, P, fo, go, glow) {
      cur = { x: R.x, y: R.y, w: R.w, h: R.h, r: R.r, fo, go };
      const s = skin.style;
      s.width = R.w + 'px'; s.height = R.h + 'px'; s.borderRadius = R.r + 'px';
      s.transform = `translate(${R.x}px,${R.y}px)`;
      s.setProperty('--bloom-g', glow.toFixed(3));
      from.style.opacity = fo; ghost.style.opacity = go;
      dlg.style.clipPath = `inset(${R.y - P.y}px ${P.x + P.w - R.x - R.w}px ${P.y + P.h - R.y - R.h}px ${R.x - P.x}px round ${R.r}px)`;
    }
    const mix = (A, B, p, q) => ({ x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), w: lerp(A.w, B.w, p), h: lerp(A.h, B.h, p), r: lerp(A.r, B.r, q) });
    function run(step) {
      const t0 = performance.now();
      const loop = now => { if (step((now - t0) / 1000) !== false) raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    function clean(its) {
      its.forEach(n => { n.style.opacity = ''; n.style.transform = ''; });
      strokes.forEach(s => { s.style.strokeDasharray = ''; s.style.strokeDashoffset = ''; });
      dlg.classList.remove('bloom--morph'); dlg.style.clipPath = ''; dlg.style.opacity = ''; skin.hidden = true;
    }
    function emit(name) {
      trigger.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { dialog: dlg, trigger } }));
      const cb = opts[name === 'bloom:open' ? 'onOpen' : 'onClose']; cb && cb(api);
    }
    function focusFirst() {
      const f = (opts.initialFocus && dlg.querySelector(opts.initialFocus)) || dlg.querySelector('[autofocus]') ||
        dlg.querySelector('input:not([type="hidden"]),select,textarea') || focusables()[0] || dlg;
      f.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === 'Escape' && opts.closeOnEsc !== false) { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(), a = f[0], z = f[f.length - 1], at = D.activeElement;
      if (!f.length) { e.preventDefault(); return; }
      if (e.shiftKey && (at === a || at === dlg)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && at === z) { e.preventDefault(); a.focus(); }
    }
    function onFocusIn(e) { if (!layer.contains(e.target)) focusFirst(); }

    function open() {
      if (state === 'open' || state === 'opening') return;
      const resume = state === 'closing';
      cancelAnimationFrame(raf);
      if (!resume) {
        layer.hidden = false;
        scrollLock(true);
        inerted = [...D.body.children].filter(n => n !== layer && !n.inert && n.tagName !== 'SCRIPT');
        inerted.forEach(n => { n.inert = true; });
        D.addEventListener('keydown', onKey, true); D.addEventListener('focusin', onFocusIn);
      }
      state = 'opening';
      trigger.setAttribute('aria-expanded', 'true');
      dlg.classList.remove('bloom--morph'); dlg.style.clipPath = '';
      const P = rectOf(dlg), T = rectOf(trigger), its = items();
      if (!resume) its.forEach(n => { n.style.opacity = 0; });
      focusFirst();
      emit('bloom:open');
      if (reduced()) {
        clean([]); const o0 = resume ? +dlg.style.opacity || 0 : 0; its.forEach(n => { n.style.opacity = ''; });
        return run(t => { const p = clamp(t / .2); dlg.style.opacity = back.style.opacity = lerp(o0, 1, p); if (p === 1) { dlg.style.opacity = ''; state = 'open'; return false; } });
      }
      if (!resume) {
        const cs = getComputedStyle(dlg), ts = getComputedStyle(trigger);
        shadow = cs.boxShadow;
        skin.style.backgroundColor = cs.backgroundColor; skin.style.backgroundImage = cs.backgroundImage; skin.style.boxShadow = shadow;
        from.style.backgroundColor = ts.backgroundColor; from.style.backgroundImage = ts.backgroundImage;
        const gh = trigger.cloneNode(true);
        gh.removeAttribute('id'); gh.removeAttribute('data-bloom'); gh.setAttribute('tabindex', '-1');
        gh.style.cssText = `position:absolute;left:50%;top:50%;margin:0;width:${T.w}px;height:${T.h}px;transform:translate(-50%,-50%);background:none;box-shadow:none;border-color:transparent;transition:none;animation:none;pointer-events:none`;
        clip.replaceChild(gh, ghost); ghost = gh;
        tOpacity = trigger.style.opacity; trigger.style.opacity = '0';
        cur = Object.assign(T, { fo: 1, go: 1 });
      }
      dlg.classList.add('bloom--morph'); skin.hidden = false;
      const A = cur, b0 = +back.style.opacity || 0, i0 = its.map(n => +n.style.opacity || 0);
      const end = Math.max(OPEN.T, .14 + its.length * .055 + .5, .22 + strokes.length * .09 + .55);
      run(t => {
        const p = OPEN.f(t);
        paint(mix(A, P, p, clamp(p)), P, A.fo * (1 - ease(clamp(t / .26))), A.go * (1 - clamp(t / .12)), Math.sin(Math.PI * clamp(t / .6)));
        back.style.opacity = lerp(b0, 1, ease(clamp(t / .34)));
        its.forEach((n, i) => {
          const u = t - .14 - i * .055;
          n.style.opacity = lerp(i0[i], 1, ease(clamp(u / .3)));
          n.style.transform = `translateY(${((1 - ITEM.f(Math.max(0, u))) * 14).toFixed(2)}px)`;
        });
        strokes.forEach((s, i) => { s.style.strokeDasharray = 1; s.style.strokeDashoffset = 1 - ease(clamp((t - .22 - i * .09) / .55)); });
        if (t >= end) { clean(its); state = 'open'; return false; }
      });
    }

    function close() {
      if (state === 'closed' || state === 'closing') return;
      cancelAnimationFrame(raf);
      const wasOpening = state === 'opening';
      state = 'closing';
      const its = items(), b0 = +getComputedStyle(back).opacity;
      if (reduced() || skin.style.width === '') {
        const o0 = +getComputedStyle(dlg).opacity;
        return run(t => { const p = clamp(t / .16); dlg.style.opacity = back.style.opacity = o0 * (1 - p); if (p === 1) { finish(its); return false; } });
      }
      dlg.classList.remove('bloom--morph'); dlg.style.clipPath = '';
      const P = rectOf(dlg), T = rectOf(trigger);
      const A = wasOpening ? cur : Object.assign({}, P, { fo: 0, go: 0 });
      const o0 = its.map(n => n.style.opacity === '' ? 1 : +n.style.opacity);
      dlg.classList.add('bloom--morph'); skin.hidden = false;
      const d = .07;
      run(t => {
        const p = CLOSE.f(Math.max(0, t - d));
        its.forEach((n, i) => { n.style.opacity = o0[i] * (1 - clamp(t / .12)); });
        paint(mix(A, T, p, clamp(p)), P, lerp(A.fo, 1, ease(clamp((t - d - .05) / .2))), lerp(A.go, 1, clamp((t - d - .13) / .14)), .7 * Math.sin(Math.PI * clamp((t - d) / .4)));
        back.style.opacity = b0 * (1 - ease(clamp(t / (d + .28))));
        if (t >= d + CLOSE.T) { finish(its); return false; }
      });
    }

    function finish(its) {
      clean(its);
      state = 'closed'; layer.hidden = true; back.style.opacity = 0;
      if (trigger.style.opacity === '0') trigger.style.opacity = tOpacity;
      inerted.forEach(n => { n.inert = false; }); inerted = [];
      D.removeEventListener('keydown', onKey, true); D.removeEventListener('focusin', onFocusIn);
      scrollLock(false);
      trigger.setAttribute('aria-expanded', 'false');
      if (opts.returnFocus !== false) trigger.focus({ preventScroll: true, focusVisible: kb });
      emit('bloom:close');
    }

    trigger.addEventListener('click', open);
    dlg.addEventListener('click', e => { if (e.target.closest('[data-bloom-close]')) close(); });
    layer.addEventListener('pointerdown', e => { downOut = !dlg.contains(e.target); });
    layer.addEventListener('click', e => { if (downOut && !dlg.contains(e.target) && opts.closeOnBackdrop !== false) close(); downOut = false; });

    const api = trigger._bloom = {
      open, close, trigger, dialog: dlg,
      toggle: () => (state === 'open' || state === 'opening' ? close() : open()),
      get isOpen() { return state === 'open' || state === 'opening'; }
    };
    return api;
  }

  function auto() { D.querySelectorAll('[data-bloom]').forEach(n => { if (!n.hasAttribute('data-bloom-manual')) mount(n); }); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', auto); else auto();
  g.Bloom = { mount };
})(window);
