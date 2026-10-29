/* Stack — toast notifications that pile up like a deck and fan out when you hover.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <script src="stack.js"></script>
     const id = Stack.toast({ type: 'success', title: 'Saved', body: 'All changes are live.', duration: 5000 });
     Stack.dismiss(id);
   A toaster region is created on first use. To place or configure it yourself, add
   <section data-stack data-stack-max="4"></section> (auto-mounted on DOMContentLoaded unless it has
   data-stack-manual) or call Stack.mount(element, { max, duration }). */
(function (g) {
  'use strict';
  const D = document;
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const ICONS = {
    success: '<circle cx="12" cy="12" r="9"/><path d="M8.4 12.3l2.5 2.5 4.8-5.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2"/><path d="M12 7.9v.01"/>',
    warning: '<path d="M10.3 4.9a2 2 0 0 1 3.4 0l7.3 12.6a2 2 0 0 1-1.7 3H4.7a2 2 0 0 1-1.7-3z"/><path d="M12 9.6v4.1"/><path d="M12 17v.01"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4l5.2 5.2"/><path d="M14.6 9.4l-5.2 5.2"/>'
  };
  const PEEK = 12, SHRINK = .055, GAP = 10;
  const reduced = () => g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seq = 0, def = null;

  function el(tag, cls) { const e = D.createElement(tag); if (cls) e.className = cls; return e; }
  const sp = v => ({ v, t: v, vel: 0 });
  function step(S, dt, k, c) { // damped spring, fixed sub-steps for stability
    if (Math.abs(S.v - S.t) < 1e-3 && Math.abs(S.vel) < 1e-2) { S.v = S.t; S.vel = 0; return false; }
    const n = Math.ceil(dt * 240) || 1, h = dt / n;
    for (let i = 0; i < n; i++) { S.vel += (-k * (S.v - S.t) - c * S.vel) * h; S.v += S.vel * h; }
    return true;
  }

  function mount(root, opts = {}) {
    if (root._stack) return root._stack;
    const o = { max: 4, duration: 5000 };
    for (const k in opts) if (opts[k] != null && !isNaN(opts[k])) o[k] = +opts[k];
    root.classList.add('stack');
    root.setAttribute('role', 'region');
    if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label', 'Notifications');
    const list = el('ol', 'stack__list'), live = {};
    root.append(list);
    ['polite', 'assertive'].forEach(p => {
      const r = live[p] = el('div', 'stack__sr');
      r.setAttribute('aria-live', p); r.setAttribute('aria-atomic', 'false');
      if (p === 'assertive') r.setAttribute('role', 'alert');
      root.append(r);
    });
    let toasts = [], leaving = [], hover = false, focus = false, touch = false, wasEx = false,
      drag = null, pendingLeave = false, raf = 0, last = 0, leaveT = 0;
    const expanded = () => (hover || focus || touch) && toasts.length > 0;

    function toast(input) {
      const t = typeof input === 'string' ? { title: input } : input || {};
      const type = ICONS[t.type] ? t.type : 'info';
      const id = t.id || 'stack-' + ++seq;
      const li = el('li', 'stack__toast stack__toast--' + type);
      li.dataset.id = id;
      li.innerHTML = `<div class="stack__inner"><span class="stack__icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[type]}</svg></span>` +
        '<div class="stack__copy"><p class="stack__title"></p><p class="stack__body"></p></div>' +
        '<button type="button" class="stack__close"><svg class="stack__ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16.5"/><circle class="stack__time" cx="18" cy="18" r="16.5" pathLength="1"/></svg>' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg></button></div><div class="stack__shade"></div>';
      const q = s => li.querySelector(s);
      q('.stack__title').textContent = t.title || '';
      if (t.body) q('.stack__body').textContent = t.body; else q('.stack__body').remove();
      q('.stack__close').setAttribute('aria-label', 'Dismiss' + (t.title ? ': ' + t.title : ' notification'));
      const strokes = [...li.querySelectorAll('.stack__icon svg > *')];
      strokes.forEach(s => { s.setAttribute('pathLength', '1'); if (!reduced()) { s.style.strokeDasharray = 1; s.style.strokeDashoffset = 1; } });
      const dur = t.duration != null ? +t.duration : o.duration * (type === 'error' ? 1.4 : 1);
      const T = { id, el: li, type, strokes, dur, left: dur, born: performance.now(), inner: q('.stack__inner'), shade: q('.stack__shade'), ring: q('.stack__time'),
        sp: { y: sp(46), s: sp(.92), o: sp(0), c: sp(0), d: sp(0), x: sp(0) } };
      if (!(dur > 0)) T.ring.parentNode.style.display = 'none';
      list.appendChild(li);
      T.h = li.offsetHeight;
      toasts.unshift(T);
      while (toasts.length > o.max) remove(toasts[toasts.length - 1]);
      const p = el('p'); p.textContent = [t.title, t.body].filter(Boolean).join('. ');
      setTimeout(() => { live[type === 'error' ? 'assertive' : 'polite'].appendChild(p); setTimeout(() => p.remove(), 7000); }, 80);
      layout(); render(T); kick();
      root.dispatchEvent(new CustomEvent('stack:show', { detail: { id, type } }));
      return id;
    }

    function layout() {
      const ex = expanded(), now = performance.now(), h0 = toasts[0] ? toasts[0].h : 0, fan = ex !== wasEx;
      let acc = 0;
      toasts.forEach((T, i) => {
        if (ex) { T.target = { y: -acc, s: 1, c: 0, d: 0, o: 1 }; acc += T.h + GAP; }
        else {
          const s = 1 - i * SHRINK, vis = Math.min(T.h, h0);
          T.target = { y: vis * s - h0 - i * PEEK, s, c: T.h - vis, d: i, o: 1 };
        }
        T.at = now + (fan ? i * 34 : 0);
        T.el.style.zIndex = 100 - i;
      });
      wasEx = ex;
      root.style.height = (ex ? Math.max(0, acc - GAP) : h0 + Math.max(0, toasts.length - 1) * PEEK) + 'px';
      root.classList.toggle('is-expanded', ex);
    }

    function render(T) {
      const S = T.sp, x = S.x.v, s = T.el.style, w = T.el.offsetWidth || 360;
      s.transform = `translate3d(${x.toFixed(2)}px,${S.y.v.toFixed(2)}px,0) scale(${S.s.v.toFixed(4)})`;
      s.opacity = (clamp(S.o.v) * (x > 0 ? 1 - clamp(x / w) * .85 : 1)).toFixed(3);
      s.clipPath = S.c.v > .5 ? `inset(${S.c.v.toFixed(1)}px 0 0 0 round var(--stack-radius))` : '';
      T.inner.style.opacity = clamp(1 - S.d.v).toFixed(3);
      T.shade.style.opacity = Math.min(.5, S.d.v * .15).toFixed(3);
    }

    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    function tick(now) {
      raf = 0;
      const dt = Math.min(.05, (now - (last || now)) / 1000) || 1 / 60, calm = reduced();
      last = now;
      const paused = expanded() || D.hidden || !!drag;
      let busy = false;
      toasts.concat(leaving).forEach(T => {
        if (T.target && now >= T.at) for (const k in T.target) T.sp[k].t = T.target[k];
        for (const k in T.sp) {
          const S = T.sp[k];
          if (calm && k !== 'o' && k !== 'd' && !(drag && drag.T === T)) { S.v = S.t; S.vel = 0; }
          busy = (k === 'x' ? step(S, dt, 260, 21) : step(S, dt, 380, 30)) || busy;
        }
        if (!T.gone && T.dur > 0) {
          if (!paused) T.left -= dt * 1000;
          T.ring.style.strokeDashoffset = (1 - clamp(T.left / T.dur)).toFixed(4);
          if (T.left <= 0) remove(T);
          busy = true;
        }
        if (!T.drawn) {
          const a = (now - T.born) / 1000;
          T.strokes.forEach((s, i) => { s.style.strokeDashoffset = 1 - ease(clamp((a - .14 - i * .16) / .42)); });
          if (calm || a > 1.2) { T.strokes.forEach(s => { s.style.strokeDasharray = s.style.strokeDashoffset = ''; }); T.drawn = true; }
          busy = true;
        }
        render(T);
      });
      leaving = leaving.filter(T => {
        const S = T.sp, w = T.el.offsetWidth || 360;
        if ((S.o.t === 0 && S.o.v < .02) || S.x.v > w * .98 || calm && S.o.v < .05) { T.el.remove(); return false; }
        return true;
      });
      if (busy || leaving.length) kick(); else last = 0;
    }

    function remove(T, how) {
      if (!T || T.gone) return;
      T.gone = true;
      const i = toasts.indexOf(T), hadFocus = T.el.contains(D.activeElement);
      toasts.splice(i, 1); leaving.push(T);
      T.el.style.pointerEvents = 'none';
      T.el.setAttribute('aria-hidden', 'true');
      const S = T.sp;
      T.target = how === 'swipe' ? { x: (T.el.offsetWidth || 360) * 1.25 } : { o: 0, s: S.s.t * .92, y: S.y.t + 16, x: S.x.t, c: S.c.t, d: S.d.t };
      T.at = performance.now() + (how > 0 ? how : 0);
      if (hadFocus) {
        const n = toasts[i] || toasts[i - 1];
        if (!D.activeElement.matches(':focus-visible')) D.activeElement.blur();
        else if (n) n.el.querySelector('.stack__close').focus(); else root.focus();
      }
      layout(); kick();
      root.dispatchEvent(new CustomEvent('stack:dismiss', { detail: { id: T.id, type: T.type } }));
    }
    const find = id => toasts.find(T => T.id === id);
    const dismiss = id => remove(find(id));
    const clear = () => toasts.slice().forEach((T, i) => remove(T, i * 45));
    function setHover(v) { hover = v; layout(); kick(); }

    root.tabIndex = -1;
    root.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; clearTimeout(leaveT); pendingLeave = false; if (!hover) setHover(true); });
    root.addEventListener('pointerleave', e => {
      if (e.pointerType === 'touch') return;
      if (drag) { pendingLeave = true; return; }
      clearTimeout(leaveT); leaveT = setTimeout(() => setHover(false), 140);
    });
    root.addEventListener('focusin', e => { if (!focus && e.target !== root && e.target.matches(':focus-visible')) { focus = true; layout(); kick(); } });
    root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) { focus = false; layout(); kick(); } });
    root.addEventListener('keydown', e => {
      if (e.key !== 'Escape' && e.key !== 'Delete') return;
      const li = e.target.closest && e.target.closest('.stack__toast');
      if (li) { e.preventDefault(); dismiss(li.dataset.id); }
    });
    root.addEventListener('click', e => { const b = e.target.closest('.stack__close'); if (b) dismiss(b.closest('.stack__toast').dataset.id); });
    D.addEventListener('pointerdown', e => {
      const inside = root.contains(e.target);
      if (e.pointerType === 'touch' && inside !== touch) { touch = inside; layout(); kick(); }
    });
    D.addEventListener('visibilitychange', kick);
    addEventListener('resize', () => { toasts.forEach(T => { T.h = T.el.offsetHeight; }); layout(); kick(); });

    // swipe right to dismiss
    list.addEventListener('pointerdown', e => {
      const li = e.target.closest('.stack__toast');
      if (!li || e.button !== 0 || e.target.closest('.stack__close')) return;
      const T = toasts.find(x => x.el === li);
      if (!T) return;
      drag = { T, x0: e.clientX, y0: e.clientY, dx: 0, on: false, pts: [[performance.now(), e.clientX]] };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    function move(e) {
      const d = drag, dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.on) {
        if (Math.abs(dx) < 5) return;
        if (Math.abs(dy) > Math.abs(dx)) return up(e);
        d.on = true; d.T.el.classList.add('is-dragging');
      }
      e.preventDefault();
      const now = performance.now();
      d.pts.push([now, e.clientX]);
      while (d.pts.length > 2 && now - d.pts[0][0] > 90) d.pts.shift();
      d.dx = dx;
      const x = dx > 0 ? dx : -28 * Math.log(1 - dx / 28), S = d.T.sp.x;
      S.v = S.t = x; S.vel = 0;
      kick();
    }
    function up(e) {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      const d = drag; drag = null;
      if (!d) return;
      d.T.el.classList.remove('is-dragging');
      if (d.on) {
        const [t0, x0] = d.pts[0], v = (e.clientX - x0) / Math.max(16, performance.now() - t0) * 1000, S = d.T.sp.x;
        S.t = 0; S.vel = v;
        if (d.dx > d.T.el.offsetWidth * .38 || (v > 650 && d.dx > 14)) { S.vel = Math.max(v, 1100); remove(d.T, 'swipe'); }
      }
      if (pendingLeave) { pendingLeave = false; setHover(false); }
      kick();
    }

    const api = root._stack = { toast, dismiss, clear, el: root, get count() { return toasts.length; } };
    def = def || api;
    return api;
  }

  function inst() { return def || mount(D.body.appendChild(el('section'))); }
  function auto() {
    D.querySelectorAll('[data-stack]').forEach(n => {
      if (!n.hasAttribute('data-stack-manual')) mount(n, { max: n.dataset.stackMax, duration: n.dataset.stackDuration });
    });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', auto); else auto();
  g.Stack = { mount, toast: t => inst().toast(t), dismiss: id => inst().dismiss(id), clear: () => inst().clear() };
})(window);
