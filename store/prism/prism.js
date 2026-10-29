/* Prism — a creator card that tilts in 3D toward the pointer, with a holographic sheen.
   Kodehelix UI · kodehelix.in
   Usage:
     <div class="prism" data-prism> <article class="prism__card"> ... </article> </div>
     const card = Prism.mount(document.querySelector('.prism'), { max: 14, glare: true });
     card.tilt(0.6, -0.4); card.reset();
   Elements with data-prism auto-mount on DOMContentLoaded unless they carry data-prism-manual.
   Layers with data-depth="40" float that many px above their parent for parallax. */
(function (global) {
  const RM = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function mount(root, opts = {}) {
    if (root._prism) return root._prism;
    const ds = root.dataset, reduce = RM && RM.matches;
    let max = +(opts.max != null ? opts.max : ds.prismMax || 14);
    if (reduce) max = Math.min(max, 5);
    const glare = opts.glare != null ? opts.glare : ds.prismGlare !== 'false';
    const K = opts.stiffness || 150, C = reduce ? 2 * Math.sqrt(K) : opts.damping || 15;
    const lift = opts.scale || 1.03;
    const card = root.querySelector('.prism__card') || root;

    let face = card.querySelector('.prism__face');
    if (!face) {
      face = document.createElement('div'); face.className = 'prism__face';
      face.innerHTML = '<i class="prism__foil"></i><i class="prism__holo"></i><i class="prism__fan"></i><i class="prism__glare"></i>';
      card.prepend(face);
    }
    face.setAttribute('aria-hidden', 'true');
    if (!glare) root.classList.add('prism--noglare');
    const shadow = document.createElement('div'); shadow.className = 'prism__shadow';
    root.prepend(shadow);

    // depth layers: translateZ, then scale back so they keep their layout size at rest
    const P = parseFloat(getComputedStyle(root).perspective) || 1000;
    card.querySelectorAll('[data-depth]').forEach(l => {
      const z = +l.dataset.depth || 0;
      l.style.transform = `translateZ(${z}px) scale(${((P - z) / P).toFixed(4)})`;
    });

    // spring state: x, y (-1..1) and a (active 0..1)
    const S = [0, 0, 0].map(v => ({ v, vel: 0, to: v }));
    let raf = 0, last = 0, down = false;
    function frame(t) {
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016) || 0.016; last = t;
      let moving = false;
      S.forEach(s => {
        s.vel += (K * (s.to - s.v) - C * s.vel) * dt; s.v += s.vel * dt;
        if (Math.abs(s.vel) > 1e-3 || Math.abs(s.to - s.v) > 1e-3) moving = true; else { s.v = s.to; s.vel = 0; }
      });
      apply();
      if (moving) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
    }
    function apply() {
      const [x, y, a] = S.map(s => s.v), st = card.style;
      st.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) scale(${(1 + (lift - 1) * a).toFixed(4)})`;
      st.setProperty('--prism-x', (50 + x * 50).toFixed(2) + '%');
      st.setProperty('--prism-y', (50 + y * 50).toFixed(2) + '%');
      st.setProperty('--prism-d', Math.min(1, Math.hypot(x, y)).toFixed(3));
      st.setProperty('--prism-a', clamp(a, 0, 1.2).toFixed(3));
      st.setProperty('--prism-ang', (Math.atan2(y, x) * 57.3 + 90).toFixed(1) + 'deg');
      shadow.style.transform = `translate(${(-x * 22).toFixed(1)}px,${(18 - y * 16).toFixed(1)}px) scale(${(0.92 + 0.05 * a).toFixed(3)})`;
      shadow.style.opacity = (0.75 + 0.25 * a).toFixed(3);
    }
    function aim(x, y, a) {
      S[0].to = clamp(x); S[1].to = clamp(y); S[2].to = a;
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    const tilt = (x, y) => aim(x, y, 1);
    const reset = () => aim(0, 0, 0);
    function point(e) {
      const r = root.getBoundingClientRect();
      tilt(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    }
    root.addEventListener('pointermove', e => { if (e.pointerType !== 'touch' || down) point(e); });
    root.addEventListener('pointerdown', e => { down = true; point(e); });
    ['pointerup', 'pointercancel'].forEach(n => root.addEventListener(n, e => {
      down = false; if (e.pointerType !== 'mouse') reset();
    }));
    root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') reset(); });
    // keyboard: lean towards the focused control
    root.addEventListener('focusin', e => {
      if (!e.target.matches(':focus-visible')) return;
      const r = root.getBoundingClientRect(), b = e.target.getBoundingClientRect();
      tilt(((b.left + b.width / 2 - r.left) / r.width) * 2 - 1, ((b.top + b.height / 2 - r.top) / r.height) * 2 - 1);
    });
    root.addEventListener('focusout', () => { if (!root.matches(':hover')) reset(); });

    // follow toggle
    card.querySelectorAll('[data-prism-follow]').forEach(btn => {
      const lab = btn.querySelector('span') || btn, off = lab.textContent.trim(), on = btn.dataset.on || 'Following';
      if (!btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', p); lab.textContent = p ? on : off;
        root.dispatchEvent(new CustomEvent('prism:follow', { detail: { following: p } }));
      });
    });

    // stat count-up, once, when the card first comes into view
    const nums = [...card.querySelectorAll('[data-count]')];
    const cf = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
    const fmt = (n, end) => (end >= 1e4 ? cf.format(n) : Math.round(n).toLocaleString('en'));
    nums.forEach(n => {
      const sr = document.createElement('span'); sr.className = 'prism__sr';
      sr.textContent = fmt(+n.dataset.count, +n.dataset.count); n.after(sr); n.setAttribute('aria-hidden', 'true');
    });
    let counted = false;
    function count() {
      if (counted || reduce || opts.countUp === false) return; counted = true;
      const t0 = performance.now();
      (function step(t) {
        let busy = false;
        nums.forEach((n, i) => {
          const end = +n.dataset.count, p = clamp((t - t0 - i * 140) / 1700, 0, 1);
          n.textContent = fmt(end * ease(p), end); if (p < 1) busy = true;
        });
        if (busy) requestAnimationFrame(step);
      })(t0);
    }
    if (nums.length) {
      const r = root.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) count();
      else if ('IntersectionObserver' in global) {
        const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); count(); } }, { threshold: 0.35 });
        io.observe(root);
      } else count();
    }

    apply();
    return (root._prism = { tilt, reset });
  }

  global.Prism = { mount };
  const auto = () => document.querySelectorAll('[data-prism]:not([data-prism-manual])').forEach(e => mount(e));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
