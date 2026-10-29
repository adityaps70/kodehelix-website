/* Comet — a submit button where a comet circles the border while it sends.
   Kodehelix UI · kodehelix.in
   Usage:
     <button class="comet" data-comet data-label="Submit" data-done="Sent"></button>
     Comet.mount(document.querySelector('[data-comet]'), { send: () => fetch(...) });
   The comet loops until your send() promise settles, then bursts into a check. */
(function (global) {
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = v => Math.max(0, Math.min(1, v));
  const SVGNS = 'http://www.w3.org/2000/svg';

  function mount(btn, opts = {}) {
    const label = btn.dataset.label || btn.textContent.trim() || 'Submit';
    const doneText = btn.dataset.done || 'Sent';
    const loop = opts.loop || 1.35;            // seconds per lap
    btn.textContent = '';
    btn.setAttribute('aria-live', 'polite');

    const fill = el('span', 'comet__fill');
    const lab = el('span', 'comet__label');
    [...label].forEach(ch => { const s = el('span'); s.textContent = ch; lab.appendChild(s); });
    const done = el('span', 'comet__done');
    done.innerHTML = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 14.5l5.2 5.2L22 8.8"/></svg><span></span>';
    done.lastChild.textContent = doneText;
    const ring = document.createElementNS(SVGNS, 'svg'); ring.setAttribute('class', 'comet__ring');
    const gid = 'cg' + Math.random().toString(36).slice(2, 8);
    ring.innerHTML = `<defs><linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="var(--comet-a)"/><stop offset="1" stop-color="var(--comet-b)"/></linearGradient></defs><rect stroke="url(#${gid})"/>`;
    const rect = ring.querySelector('rect');
    const orb = el('span', 'comet__orb');
    const sparks = Array.from({ length: 10 }, () => el('span', 'comet__spark'));
    btn.append(fill, lab, done, ring, orb, ...sparks);

    let len = 0, w = 0, h = 0;
    function layout() {
      w = btn.offsetWidth; h = btn.offsetHeight;
      const r = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 20;
      ring.setAttribute('viewBox', `0 0 ${w + 2} ${h + 2}`);
      Object.entries({ x: 1, y: 1, width: w, height: h, rx: r, ry: r }).forEach(([k, v]) => rect.setAttribute(k, v));
      len = rect.getTotalLength();
      rect.style.strokeDasharray = len;
    }
    layout();
    addEventListener('resize', layout);

    // state: idle -> sending (laps until settled) -> done -> idle
    let state = 'idle', t0 = 0, settledAt = null, raf = 0;
    function render(now) {
      const t = (now - t0) / 1000;
      const letters = lab.children;
      if (state === 'idle') { reset(); return; }
      // 1) letters lift away
      for (let i = 0; i < letters.length; i++) {
        const p = ease(clamp((t - i * 0.025) / 0.35));
        letters[i].style.transform = `translateY(${-26 * p}px) rotate(${(i % 2 ? 1 : -1) * 14 * p}deg)`;
        letters[i].style.opacity = 1 - p;
      }
      // 2) comet laps the border; trail grows each lap
      const lapT = Math.max(0, t - 0.2);
      const finishing = settledAt !== null && lapT >= Math.ceil((settledAt - t0) / 1000 / loop) * loop;
      const prog = finishing ? 1 : (lapT % loop) / loop;
      if (!finishing) {
        const pt = rect.getPointAtLength(easeIO(prog) * len);
        orb.style.opacity = clamp(lapT / 0.15);
        orb.style.transform = `translate(${pt.x - 1}px, ${pt.y - 1}px)`;
        const tail = 0.45 * len;
        rect.style.strokeDashoffset = 0;
        rect.style.strokeDasharray = `${tail} ${len}`;
        rect.style.strokeDashoffset = -(easeIO(prog) * len - tail);
        rect.style.opacity = 1;
        raf = requestAnimationFrame(render);
        return;
      }
      // 3) burst: orb to centre, fill, sparks, check
      if (!render.fin) render.fin = now;
      const f = (now - render.fin) / 1000;
      const c = ease(clamp(f / 0.25));
      const end = rect.getPointAtLength(0);
      orb.style.transform = `translate(${end.x + (w / 2 - end.x) * c}px, ${end.y + (h / 2 - end.y) * c}px) scale(${1 + c})`;
      orb.style.opacity = 1 - clamp((f - 0.22) / 0.1);
      rect.style.strokeDasharray = len; rect.style.strokeDashoffset = 0; rect.style.opacity = 1 - clamp((f - 0.2) / 0.4);
      const g = ease(clamp((f - 0.22) / 0.35));
      fill.style.opacity = g; fill.style.transform = `scale(${0.4 + 0.6 * g})`;
      sparks.forEach((s, i) => {
        const a = (i / sparks.length) * Math.PI * 2, q = ease(clamp((f - 0.25) / 0.55));
        s.style.opacity = q > 0 && q < 1 ? 1 - q : 0;
        s.style.transform = `translate(${Math.cos(a) * 120 * q}px, ${Math.sin(a) * 60 * q}px) scale(${1 - q * 0.6})`;
      });
      const d = ease(clamp((f - 0.4) / 0.35));
      done.style.opacity = d; done.style.transform = `scale(${0.7 + 0.3 * d})`;
      const path = done.querySelector('path'), pl = 26;
      path.style.strokeDasharray = pl; path.style.strokeDashoffset = pl * (1 - ease(clamp((f - 0.45) / 0.3)));
      btn.style.transform = `scale(${1 + 0.06 * Math.sin(Math.PI * clamp((f - 0.22) / 0.3))})`;
      if (f < (opts.hold || 1.8)) raf = requestAnimationFrame(render);
      else { state = 'idle'; reset(); btn.disabled = false; opts.onReset && opts.onReset(); }
    }
    function reset() {
      [...lab.children].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      [orb, fill, done, ...sparks].forEach(x => { x.style.opacity = 0; x.style.transform = ''; });
      rect.style.opacity = 0; btn.style.transform = ''; render.fin = 0;
    }
    reset();

    async function go() {
      if (state !== 'idle') return;
      state = 'sending'; btn.disabled = true; t0 = performance.now(); settledAt = null; render.fin = 0;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(render);
      const minWait = new Promise(r => setTimeout(r, (opts.minDuration || 1.2) * 1000));
      try { await Promise.all([opts.send ? opts.send() : null, minWait]); } catch (e) { /* still finish */ }
      settledAt = performance.now();
    }
    btn.addEventListener('click', go);
    return { trigger: go, relayout: layout };
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  global.Comet = { mount };
})(window);
