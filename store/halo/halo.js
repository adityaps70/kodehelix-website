/* Halo — a password field whose lock sits inside a ring that fills as the password gets stronger.
   Kodehelix UI · kodehelix.in
   Usage:
     <div class="halo" data-halo data-label="Create password"></div>
     const h = Halo.mount(document.querySelector('[data-halo]'), { rules: [...] });
     el.addEventListener('halo:change', e => e.detail.score);   // 0..4
   Elements with data-halo mount on DOMContentLoaded unless they also have data-halo-manual. */
(function (global) {
  const RULES = [
    { label: '8+ characters', test: v => v.length >= 8 },
    { label: 'A number', test: v => /\d/.test(v) },
    { label: 'A symbol', test: v => /[^\w\s]|_/.test(v) },
    { label: 'Upper & lower case', test: v => /[a-z]/.test(v) && /[A-Z]/.test(v) }
  ];
  const WORDS = ['Too weak', 'Too weak', 'Okay', 'Good', 'Strong'];
  const TONES = ['danger', 'danger', 'warning', 'good', 'success'];
  const cl = v => Math.max(0, Math.min(1, v));
  const near = (c, t, dt, k) => Math.abs(t - c) < .002 ? t : c + (t - c) * (1 - Math.exp(-k * dt));
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  function mount(root, o = {}) {
    if (root._halo) return root._halo;
    const rules = (o.rules || RULES).map(r => ({ label: r.label, test: r.test instanceof RegExp ? v => r.test.test(v) : r.test }));
    const n = rules.length, id = 'halo' + ++uid;
    const words = o.words || WORDS, empty = o.emptyText || 'Start typing';
    const input = root.querySelector('input') || document.createElement('input');
    input.type = 'password'; input.className = 'halo__input'; input.id = input.id || id + 'i';
    input.autocomplete = 'new-password'; input.spellcheck = false;
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('aria-describedby', id + 's ' + id + 'r');
    root.classList.add('halo');

    // ring: one arc per rule, a lock in the middle
    const R = 20, gap = n > 1 ? 18 : 0, len = [];
    let arcs = '';
    for (let i = 0; i < n; i++) {
      const a0 = (-90 + i * 360 / n + gap / 2) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / n - gap / 2 - (n > 1 ? 0 : .1)) * Math.PI / 180;
      len.push(R * (a1 - a0));
      arcs += `M${24 + R * Math.cos(a0)} ${24 + R * Math.sin(a0)}A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${24 + R * Math.cos(a1)} ${24 + R * Math.sin(a1)}|`;
    }
    const d = arcs.split('|').slice(0, n);
    const field = el('div', 'halo__field');
    field.innerHTML = `<span class="halo__ring" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="halo__glow" cx="24" cy="24" r="20"/>${d.map(p => `<path class="halo__track" d="${p}"/>`).join('')}${d.map((p, i) => `<path class="halo__seg" d="${p}" style="stroke-dasharray:${len[i]} 99;stroke-dashoffset:${len[i]};opacity:0"/>`).join('')}<g class="halo__lock" transform="translate(12 12)"><path class="halo__shackle" d="M8.6 11V8a3.4 3.4 0 0 1 6.8 0v3"/><rect class="halo__body" x="5.5" y="11" width="13" height="9.5" rx="2.6"/><path d="M12 14.6v2.2"/></g></svg></span><div class="halo__box"></div><button type="button" class="halo__eye" aria-label="Show password" aria-pressed="false" aria-controls="${input.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12c2.6 4 5.8 6 9.5 6s6.9-2 9.5-6"/><path class="halo__lid" d="M2.5 12c2.6-4 5.8-6 9.5-6s6.9 2 9.5 6"/><circle class="halo__pupil" cx="12" cy="12" r="3"/><path class="halo__lash" d="M6.3 16.4l-1.4 2M12 18.1v2.4M17.7 16.4l1.4 2"/></svg></button>`;
    const box = field.querySelector('.halo__box');
    const label = el('label', 'halo__label'); label.htmlFor = input.id; label.textContent = o.label || root.dataset.label || 'Password';
    box.append(input, label);
    const meter = el('div', 'halo__meter');
    meter.innerHTML = `<span class="halo__k" aria-hidden="true">Strength</span><span class="halo__word" id="${id}s" aria-live="polite"></span>`;
    const list = el('ul', 'halo__rules'); list.id = id + 'r'; list.setAttribute('aria-label', 'Password must have');
    list.innerHTML = rules.map(r => `<li class="halo__rule"><svg viewBox="0 0 24 24" aria-hidden="true"><circle class="halo__dot" cx="12" cy="12" r="9"/><circle class="halo__ok" cx="12" cy="12" r="9"/><path class="halo__check" d="M8.2 12.4l2.6 2.6 5-5.2"/></svg><span></span><span class="halo__sr"></span></li>`).join('');
    [...list.children].forEach((li, i) => li.children[1].textContent = rules[i].label);
    root.textContent = '';
    root.append(field, meter, list);

    const q = s => root.querySelector(s), qa = s => [...root.querySelectorAll(s)];
    const segs = qa('.halo__seg'), glow = q('.halo__glow'), ring = q('.halo__ring'), shackle = q('.halo__shackle'), body = q('.halo__body');
    const eye = q('.halo__eye'), lid = q('.halo__lid'), pupil = q('.halo__pupil'), lash = q('.halo__lash'), word = q('.halo__word');
    const lis = [...list.children], ticks = qa('.halo__check'), oks = qa('.halo__ok'), ticksvg = lis.map(li => li.firstChild);

    const tone = {};
    ['muted', ...TONES].forEach(t => {
      const s = el('span'); s.style.color = `var(--halo-${t})`; root.appendChild(s);
      tone[t] = getComputedStyle(s).color.match(/[\d.]+/g).slice(0, 3).map(Number); s.remove();
    });

    // animated state (everything eases toward a target each frame)
    const S = { seg: Array(n).fill(0), tick: Array(n).fill(0), col: tone.muted.slice(), lid: -1, fl: 0, w: 1, sh: -3.2, shv: 0, lk: 0, pulse: 1 };
    let met = [], m = 0, score = 0, shown = false, focused = false, raf = 0, last = 0, colT = tone.muted;

    function update(fire = true) {
      const v = input.value, before = score;
      met = rules.map(r => !!r.test(v));
      m = met.filter(Boolean).length;
      score = v ? Math.round(m / n * 4) : 0;
      const w = v ? words[score] : empty;
      if (word.textContent !== w) { word.textContent = w; S.w = 0; }
      colT = tone[v ? TONES[score] : 'muted'];
      if (v && score === 4 && before < 4) S.pulse = 0;
      root.classList.toggle('is-strong', !!v && score === 4);
      lis.forEach((li, i) => { li.classList.toggle('is-met', met[i]); li.lastChild.textContent = met[i] ? ', done' : ', not yet'; });
      if (fire) {
        const detail = { score, label: v ? w : '', met: met.slice() };
        root.dispatchEvent(new CustomEvent('halo:change', { detail, bubbles: true }));
        o.onChange && o.onChange(detail);
      }
      kick();
    }

    function frame(now) {
      const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
      const k = still() ? 1e4 : 1;
      let busy = false;
      const go = (c, t, s) => { const x = near(c, t, dt, s * k); if (x !== t) busy = true; return x; };
      for (let i = 0; i < n; i++) {           // segments fill one after another
        let t = i < m ? 1 : 0;
        if (t > S.seg[i] && i && S.seg[i - 1] < .6) t = S.seg[i];
        if (t < S.seg[i] && i < n - 1 && S.seg[i + 1] > .4) t = S.seg[i];
        if (t !== S.seg[i] || S.seg[i] !== (i < m ? 1 : 0)) busy = true;
        S.seg[i] = near(S.seg[i], t, dt, 15 * k);
        segs[i].style.strokeDashoffset = len[i] * (1 - S.seg[i]);
        segs[i].style.opacity = S.seg[i] > .02 ? 1 : 0;
      }
      S.col = S.col.map((c, j) => go(c, colT[j], 13));
      root.style.setProperty('--halo-c', `rgb(${S.col.map(Math.round)})`);
      for (let i = 0; i < n; i++) {           // rule ticks draw on
        S.tick[i] = go(S.tick[i], met[i] ? 1 : 0, 11);
        ticks[i].style.strokeDashoffset = 11 * (1 - S.tick[i]);
        oks[i].style.opacity = S.tick[i];
        ticksvg[i].style.transform = `scale(${1 + .22 * Math.sin(Math.PI * S.tick[i]) * (met[i] ? 1 : 0)})`;
      }
      // lock shackle snaps shut on Strong (spring), body tints
      const strong = root.classList.contains('is-strong'), shT = strong ? 0 : -3.2;
      if (still()) { S.sh = shT; S.shv = 0; } else for (let s = 0; s < 4; s++) {
        S.shv += ((shT - S.sh) * 520 - S.shv * 17) * dt / 4; S.sh += S.shv * dt / 4;
      }
      if (Math.abs(S.sh - shT) > .01 || Math.abs(S.shv) > .05) busy = true; else S.sh = shT;
      shackle.setAttribute('transform', `translate(0 ${S.sh.toFixed(2)})`);
      S.lk = go(S.lk, strong ? 1 : 0, 8); body.style.fillOpacity = .22 * S.lk;
      // the satisfied pulse
      if (S.pulse < 1 && !still()) {
        S.pulse = Math.min(1, S.pulse + dt / .9); busy = true;
        const p = S.pulse, e = 1 - Math.pow(1 - p, 3);
        const b = Math.sin(Math.PI * cl(p / .42));
        ring.style.transform = `scale(${1 + .09 * b - .03 * Math.sin(Math.PI * cl((p - .42) / .3))})`;
        ring.style.boxShadow = `0 0 ${22 * (1 - p)}px ${3 * (1 - p)}px rgba(${tone.success},${.5 * Math.pow(1 - p, 1.2)})`;
        glow.setAttribute('r', 20 + 13 * e); glow.style.opacity = Math.pow(1 - p, 1.4); glow.style.strokeWidth = 5 * (1 - e) + .5;
      } else { ring.style.transform = ring.style.boxShadow = ''; glow.style.opacity = 0; }
      // eye: upper lid flips down to close, pupil shrinks, lashes appear
      S.lid = go(S.lid, shown ? 1 : -1, 13);
      lid.setAttribute('transform', `translate(0 12) scale(1 ${S.lid.toFixed(3)}) translate(0 -12)`);
      pupil.setAttribute('r', (3 * cl(S.lid)).toFixed(2)); lash.style.opacity = cl(-S.lid * 1.4 - .3);
      // floating label + strength word
      S.fl = go(S.fl, focused || input.value ? 1 : 0, 15);
      label.style.transform = `translateY(calc(-50% - ${12 * S.fl}px)) scale(${1 - .24 * S.fl})`;
      S.w = go(S.w, 1, 12);
      word.style.transform = `translateY(${(1 - S.w) * 7}px)`; word.style.opacity = S.w;
      raf = busy ? requestAnimationFrame(frame) : 0;
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function reveal(on) {
      shown = on === undefined ? !shown : !!on;
      input.type = shown ? 'text' : 'password';
      eye.setAttribute('aria-pressed', shown); eye.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
      kick();
    }
    eye.addEventListener('click', () => reveal());
    input.addEventListener('input', () => update());
    input.addEventListener('focus', () => { focused = true; root.classList.add('is-focus'); kick(); });
    input.addEventListener('blur', () => { focused = false; root.classList.remove('is-focus'); kick(); });
    update(false);

    const api = {
      get value() { return input.value; },
      get score() { return score; },
      set(v) { input.value = v; update(); },
      reveal, input, el: root
    };
    return (root._halo = api);
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  global.Halo = { mount };
  const auto = () => document.querySelectorAll('[data-halo]:not([data-halo-manual])').forEach(e => mount(e));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', auto) : auto();
})(window);
