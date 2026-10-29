/* Dial — a dual-thumb range slider with a live histogram and swinging value tags.
   Kodehelix UI · kodehelix.in
   Usage:
     <div data-dial data-min="0" data-max="10000" data-step="100" data-from="1200" data-to="8500"></div>
     const d = Dial.mount(el, { min, max, step, from, to, currency: '₹', data: [counts...] });
     d.set(2000, 6000);   el.addEventListener('dial:change', e => e.detail);  // { from, to, count }
   Elements with data-dial mount on DOMContentLoaded unless they also have data-dial-manual. */
(function (global) {
  // fictional price distribution, one count per bar
  const DATA = [2, 3, 5, 4, 7, 10, 13, 17, 15, 12, 13, 9, 12, 8, 8, 7, 7, 12, 9, 13, 11, 7, 5, 4, 5, 3, 6, 4, 3, 3, 2, 4];
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const near = (c, t, dt, k) => Math.abs(t - c) < 1e-4 ? t : c + (t - c) * (1 - Math.exp(-k * dt));
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  // rolling digits: each digit is a 0-9 column that slides to its value
  function roller(host) {
    let slots = [], shape = null;
    return {
      set(str) {
        const sh = str.replace(/\d/g, '0');
        if (sh !== shape) {
          shape = sh; host.textContent = ''; slots = [];
          for (const ch of str) {
            if (/\d/.test(ch)) {
              const s = el('span', 'dial__slot'), c = el('span', 'dial__col');
              c.innerHTML = '<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
              s.append(c); host.append(s); slots.push({ c, p: +ch, t: +ch });
              c.style.transform = `translateY(${-1.2 * ch}em)`;
            } else host.append(ch);
          }
        } else { let i = 0; for (const ch of str) if (/\d/.test(ch)) slots[i++].t = +ch; }
      },
      step(dt, k) {
        let busy = false;
        for (const s of slots) {
          if (s.p === s.t) continue;
          s.p = near(s.p, s.t, dt, k); busy = busy || s.p !== s.t;
          s.c.style.transform = `translateY(${(-1.2 * s.p).toFixed(3)}em)`;
        }
        return busy;
      }
    };
  }

  function mount(root, o = {}) {
    if (root._dial) return root._dial;
    const ds = root.dataset, num = (v, d) => (v === undefined || v === '' || isNaN(+v) ? d : +v);
    const min = num(o.min ?? ds.min, 0), max = num(o.max ?? ds.max, 10000), step = num(o.step ?? ds.step, 100) || 1;
    const cur = o.currency ?? ds.currency ?? '₹', locale = o.locale || 'en-IN';
    const data = o.data || DATA, nb = data.length, top = Math.max(...data);
    const label = o.label || ds.label || 'Price range', unit = o.unit || 'results';
    const noun = label.replace(/\s*range$/i, '').toLowerCase();
    const names = o.labels || ['Minimum ' + noun, 'Maximum ' + noun];
    const fmt = v => cur + Math.round(v).toLocaleString(locale);
    const snap = v => cl(min + Math.round((v - min) / step) * step, min, max);
    const frac = v => (v - min) / (max - min);
    const id = 'dial' + ++uid;
    let vals = [snap(num(o.from ?? ds.from, min)), snap(num(o.to ?? ds.to, max))];
    if (vals[0] > vals[1] - step) vals[0] = Math.max(min, vals[1] - step);

    root.classList.add('dial');
    root.setAttribute('role', 'group'); root.setAttribute('aria-labelledby', id + 't');
    const tag = '<div class="dial__tag" aria-hidden="true"><div class="dial__swing"><span class="dial__notch"></span><span class="dial__bubble"><span class="dial__roll"></span></span></div></div>';
    root.innerHTML = `<div class="dial__head"><div><div class="dial__title" id="${id}t"></div><div class="dial__range"></div></div><div class="dial__count"><span class="dial__roll" aria-hidden="true"></span><span class="dial__unit"></span></div></div><div class="dial__plot"><div class="dial__bars" aria-hidden="true">${data.map(v => `<i class="dial__bar" style="height:${10 + 90 * v / top}%"><b></b></i>`).join('')}</div><div class="dial__rail"><div class="dial__fill"></div></div>${tag + tag}${'<div class="dial__thumb" role="slider" tabindex="0" aria-orientation="horizontal"><span class="dial__knob"></span></div>'.repeat(2)}</div><span class="dial__sr" aria-live="polite"></span>`;
    const q = s => root.querySelector(s), qa = s => [...root.querySelectorAll(s)];
    q('.dial__title').textContent = label; q('.dial__unit').textContent = unit;
    const range = q('.dial__range'), plot = q('.dial__plot'), fill = q('.dial__fill'), sr = q('.dial__sr');
    const bars = qa('.dial__bar'), lights = bars.map(b => b.firstChild), thumbs = qa('.dial__thumb'), knobs = qa('.dial__knob');
    const tags = qa('.dial__tag'), swings = qa('.dial__swing'), bubbles = qa('.dial__bubble');
    const rolls = qa('.dial__roll').map(roller); // [count, tag0, tag1]
    thumbs.forEach((t, i) => t.setAttribute('aria-label', names[i]));

    const T = [0, 1].map(i => ({ p: frac(vals[i]), x: null, vs: 0, a: 0, av: 0, g: 1, gv: 0, glide: null }));
    const lit = data.map(() => 0), grab = [false, false];
    let W = 0, raf = 0, last = 0, sent = '', srT = 0, drag = null, lefts = [], cT = 0, cAt = -1e9;

    function count() {
      const f0 = frac(vals[0]), f1 = frac(vals[1]);
      return Math.round(data.reduce((s, v, j) => s + v * cl((Math.min((j + 1) / nb, f1) - Math.max(j / nb, f0)) * nb), 0));
    }
    function refresh() {
      const [a, b] = vals, c = count();
      range.textContent = fmt(a) + ' – ' + fmt(b);
      rolls[1].set(fmt(a)); rolls[2].set(fmt(b));
      // the count rolls at most every 220ms so it stays readable mid-drag
      clearTimeout(cT);
      const wait = cAt + 220 - performance.now(), setC = () => { cAt = performance.now(); rolls[0].set(String(count())); kick(); };
      wait > 0 ? (cT = setTimeout(setC, wait)) : setC();
      [[min, b - step], [a + step, max]].forEach(([lo, hi], i) => {
        const t = thumbs[i];
        t.setAttribute('aria-valuemin', lo); t.setAttribute('aria-valuemax', hi);
        t.setAttribute('aria-valuenow', vals[i]); t.setAttribute('aria-valuetext', fmt(vals[i]));
      });
      const key = a + ',' + b;
      if (key !== sent) {
        const fire = sent !== ''; sent = key;
        if (fire) {
          const detail = { from: a, to: b, count: c };
          root.dispatchEvent(new CustomEvent('dial:change', { detail, bubbles: true }));
          o.onChange && o.onChange(detail);
          clearTimeout(srT); srT = setTimeout(() => { sr.textContent = c + ' ' + unit; }, 700);
        }
      }
      kick();
    }
    function setVal(i, v) {
      v = snap(v);
      vals[i] = i ? Math.max(v, vals[0] + step) : Math.min(v, vals[1] - step);
      vals[i] = cl(vals[i], min, max);
      refresh();
    }
    function layout() {
      W = plot.clientWidth;
      T.forEach(t => { t.x = null; });
      lefts = bars.map(b => b.offsetLeft);
      kick();
    }

    function frame(now) {
      const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
      const calm = still(), k = calm ? 1e4 : 1;
      let busy = false;
      T.forEach((t, i) => {
        if (t.glide) {
          const g = t.glide, e = cl((now - g.t0) / g.dur), v = g.a + (g.b - g.a) * easeIO(e);
          t.p = frac(v); busy = true;
          if (snap(v) !== vals[i]) setVal(i, v);
          if (e >= 1) { t.glide = null; setVal(i, g.b); if (g.grab) release(i); }
        } else {
          const goal = frac(vals[i]); t.p = near(t.p, goal, dt, 26 * k); busy = busy || t.p !== goal;
        }
        const x = t.p * W;
        if (t.x === null) t.x = x;
        const vs0 = t.vs; t.vs = near(t.vs, (x - t.x) / dt, dt, 18); t.x = x;
        const kick = calm ? 0 : cl((t.vs - vs0) / dt, -4000, 4000) * .2;   // braking flings the tag forward
        const aim = calm ? 0 : cl(t.vs * .065, -34, 34), gaim = grab[i] && !calm ? 1.2 : 1;
        for (let s = 0; s < 4; s++) {          // tag on a damped spring; knob pops on a stiffer one
          const h = dt / 4;
          t.av += ((aim - t.a) * 170 - t.av * 4.2 + kick) * h; t.a += t.av * h;
          t.gv += ((gaim - t.g) * 700 - t.gv * 20) * h; t.g += t.gv * h;
        }
        if (calm) { t.a = t.av = 0; t.g = gaim; t.gv = 0; }
        if (Math.abs(t.a - aim) > .05 || Math.abs(t.av) > .2 || Math.abs(t.vs) > 2 || Math.abs(t.g - gaim) > .002 || Math.abs(t.gv) > .02) busy = true;
        thumbs[i].style.transform = tags[i].style.transform = `translateX(${x.toFixed(2)}px)`;
        knobs[i].style.transform = `scale(${t.g.toFixed(4)})`;
        swings[i].style.transform = `rotate(${t.a.toFixed(2)}deg)`;
      });
      // keep the two tags from overlapping and inside the box
      const x0 = T[0].p * W, x1 = T[1].p * W, h0 = bubbles[0].offsetWidth / 2, h1 = bubbles[1].offsetWidth / 2;
      const lo = -14, hi = W + 14;
      let c0 = x0, c1 = x1;
      if (c1 - h1 - (c0 + h0) < 6) { const m = (x0 + x1) / 2; c0 = m - 3 - h0; c1 = m + 3 + h1; }
      const d = Math.max(0, lo - (c0 - h0)) - Math.max(0, c1 + h1 - hi); c0 += d; c1 += d;
      const s0 = cl(c0, lo + h0, hi - h0) - x0, s1 = cl(c1, lo + h1, hi - h1) - x1;
      [s0, s1].forEach((s, i) => { bubbles[i].style.transform = `translateX(calc(-50% + ${s.toFixed(1)}px)) scale(${(1 + (T[i].g - 1) * .35).toFixed(4)})`; });
      // the gradient always spans the selected range: blue at the low handle, cyan at the high one
      fill.style.left = x0 + 'px'; fill.style.width = Math.max(0, x1 - x0) + 'px';
      const bw = W / nb;
      lefts.forEach((l, j) => { lights[j].style.setProperty('--c', `color-mix(in srgb, var(--dial-to) ${(cl((l + bw / 2 - x0) / (x1 - x0 || 1)) * 100).toFixed(1)}%, var(--dial-from))`); });
      for (let j = 0; j < nb; j++) {
        const goal = cl((Math.min((j + 1) / nb, T[1].p) - Math.max(j / nb, T[0].p)) * nb);
        if (lit[j] === goal) continue;
        lit[j] = near(lit[j], goal, dt, 14 * k); busy = true;
        lights[j].style.opacity = lit[j].toFixed(3);
        bars[j].style.transform = `scaleY(${(.93 + .07 * lit[j]).toFixed(4)})`;
      }
      rolls.forEach((r, i) => { busy = r.step(dt, (i ? 40 : 60) * k) || busy; });
      raf = busy ? requestAnimationFrame(frame) : 0;
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function hold(i) { grab[i] = true; thumbs[i].classList.add('is-active'); bubbles[i].classList.add('is-active'); kick(); }
    function release(i) { grab[i] = false; thumbs[i].classList.remove('is-active'); bubbles[i].classList.remove('is-active'); kick(); }

    // pointer + touch
    const at = e => { const r = plot.getBoundingClientRect(); return cl((e.clientX - r.left) / r.width); };
    plot.addEventListener('pointerdown', e => {
      if (e.button) return;
      const f = at(e), v = min + f * (max - min), th = e.target.closest('.dial__thumb');
      let i = thumbs.indexOf(th);
      const close = Math.abs(T[1].p - T[0].p) * W < 10;
      if (i < 0) i = Math.abs(v - vals[0]) < Math.abs(v - vals[1]) ? 0 : Math.abs(v - vals[0]) > Math.abs(v - vals[1]) ? 1 : v < vals[0] ? 0 : 1;
      drag = { i: close && th ? -1 : i, id: e.pointerId, x: e.clientX, off: th ? frac(vals[i]) - f : 0 };
      try { plot.setPointerCapture(e.pointerId); } catch (_) { }
      thumbs[i].focus({ preventScroll: true });
      if (drag.i >= 0) { T[drag.i].glide = null; hold(drag.i); if (!th) setVal(drag.i, v); }
      e.preventDefault();
    });
    plot.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.i < 0) {                        // thumbs stacked: pick by drag direction
        if (Math.abs(e.clientX - drag.x) < 3) return;
        drag.i = e.clientX < drag.x ? 0 : 1; thumbs[drag.i].focus({ preventScroll: true }); hold(drag.i);
      }
      setVal(drag.i, min + (at(e) + drag.off) * (max - min));
    });
    const end = e => { if (!drag || e.pointerId !== drag.id) return; if (drag.i >= 0) release(drag.i); drag = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => plot.addEventListener(n, end));

    // keyboard
    thumbs.forEach((t, i) => t.addEventListener('keydown', e => {
      const big = Math.max(step, Math.round((max - min) / 10 / step) * step);
      const by = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -big, PageUp: big }[e.key];
      let v;
      if (by) v = vals[i] + by; else if (e.key === 'Home') v = min; else if (e.key === 'End') v = max; else return;
      e.preventDefault(); T[i].glide = null; setVal(i, v);
    }));

    if (global.ResizeObserver) new ResizeObserver(layout).observe(plot); else addEventListener('resize', layout);
    layout(); refresh();

    const api = {
      // set(from, to, { duration = 650, grab = false }) glides the thumbs; pass null to leave one alone
      set(from, to, opt = {}) {
        let b = [from == null ? vals[0] : snap(from), to == null ? vals[1] : snap(to)];
        if (b[0] > b[1] - step) b[0] = Math.max(min, b[1] - step);
        const dur = opt.duration ?? 650;
        b.forEach((v, i) => {
          if (v === vals[i] && !T[i].glide) return;
          if (!dur || still()) { T[i].glide = null; vals[i] = v; return; }
          T[i].glide = { a: min + T[i].p * (max - min), b: v, t0: performance.now(), dur, grab: !!opt.grab };
          if (opt.grab) hold(i);
        });
        refresh();
      },
      get from() { return vals[0]; },
      get to() { return vals[1]; },
      get count() { return count(); },
      el: root
    };
    return (root._dial = api);
  }

  function el(tag, cls) { const e = document.createElement(tag); e.className = cls; return e; }
  global.Dial = { mount };
  const auto = () => document.querySelectorAll('[data-dial]:not([data-dial-manual])').forEach(e => mount(e));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', auto) : auto();
})(window);
