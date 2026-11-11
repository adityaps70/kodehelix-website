/* Orbit — a file upload dropzone where every file becomes a satellite that spirals in toward a
   glowing core as it uploads, lands with a shockwave and ticks off in the list.
   Kodehelix UI · kodehelix.in · Licence: see LICENSE.txt
   Usage:
     <div data-orbit data-accept="image/*,.pdf,.zip" data-max-size="50MB"></div>
     const up = Orbit.mount(el, { upload: (file, progress, signal) => myUpload(file, progress, signal) });
   Elements with data-orbit mount themselves on DOMContentLoaded unless data-orbit-manual is set. */
(function (global) {
  'use strict';
  var mq = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  var calm = function () { return !!(mq && mq.matches); };
  var now = function () { return global.performance.now(); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var eOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var eIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eIn = function (t) { return t * t * t; };
  var S = ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var PAGE = '<path d="M7 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5V8h5"/>';
  var KIND = {
    image: ['#22c3ee', '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.6"/><path d="M4 17l5-4.5 3.5 3 2.5-2 5 4"/>'],
    doc: ['#8fa3ff', PAGE + '<path d="M8.5 12.5h7M8.5 16h5"/>'],
    archive: ['#ffb020', PAGE + '<path d="M10 4v1.5M10 7v1.5M10 10v1.5"/><rect x="8.5" y="13.5" width="3" height="3.6" rx="1"/>'],
    video: ['#e255d9', '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M10.5 9.6v4.8l4-2.4z"/>'],
    sheet: ['#19c37d', PAGE + '<path d="M8.5 11.5h7V17h-7zM8.5 14.2h7M12 11.5V17"/>'],
    file: ['#c9cdd8', PAGE]
  };
  var OK = '<svg class="orbit__ok"' + S + '><circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.2"/></svg>';
  var X = '<svg' + S + '><path d="M7 7l10 10M17 7L7 17"/></svg>';
  var RETRY = '<svg' + S + '><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19.5 4.5v4h-4"/></svg>';
  var TILT = [-.16, .14, -.04, .26, -.28, .06, .2, -.1];
  var uid = 0;

  function ext(n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; }
  function kindOf(f) {
    var t = (f.type || '').toLowerCase(), e = ext(f.name);
    if (/^image\//.test(t) || /^(png|jpe?g|gif|webp|svg|avif|heic)$/.test(e)) return 'image';
    if (/^(video|audio)\//.test(t) || /^(mp4|mov|webm|mkv|mp3|wav|m4a)$/.test(e)) return 'video';
    if (/zip|rar|7z|tar|gzip/.test(t) || /^(zip|rar|7z|tar|gz|tgz)$/.test(e)) return 'archive';
    if (/sheet|csv|excel/.test(t) || /^(csv|tsv|xlsx?|numbers)$/.test(e)) return 'sheet';
    if (/pdf|word|text|document|presentation/.test(t) || /^(pdf|docx?|txt|md|rtf|pptx?|key|pages)$/.test(e)) return 'doc';
    return 'file';
  }
  function fmt(b) { b = +b || 0; if (b < 1024) return b + ' B'; var u = ['KB', 'MB', 'GB'], i = -1; do { b /= 1024; i++; } while (b >= 1024 && i < 2); return (b < 10 ? b.toFixed(1) : Math.round(b)) + ' ' + u[i]; }
  function size(v) {
    if (!v) return 0; if (typeof v === 'number') return v;
    var m = /^([\d.]+)\s*(b|kb|mb|gb)?$/i.exec(String(v).trim());
    return m ? +m[1] * { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 }[(m[2] || 'b').toLowerCase()] : 0;
  }
  function accepts(acc, f) {
    if (!acc) return true;
    var t = (f.type || '').toLowerCase(), n = (f.name || '').toLowerCase();
    return acc.split(',').some(function (a) {
      a = a.trim().toLowerCase(); if (!a) return false;
      if (a[0] === '.') return n.slice(-a.length) === a;
      if (/\/\*$/.test(a)) return t.indexOf(a.slice(0, -1)) === 0;
      return t === a;
    });
  }
  function label(acc) {
    return acc.split(',').map(function (a) { a = a.trim(); return a === 'image/*' ? 'Images' : a === 'video/*' ? 'Video' : a.replace(/^\./, '').toUpperCase(); }).filter(Boolean).join(', ');
  }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  // A fake upload for demos and testing: Orbit.simulate(ms) returns an upload function.
  function simulate(ms, fail) {
    return function (file, progress, signal) {
      return new Promise(function (res, rej) {
        var d = ms || 1500 + Math.random() * 1500, t0 = now();
        (function step() {
          if (signal && signal.aborted) return rej(new Error('aborted'));
          var k = Math.min(1, (now() - t0) / d);
          if (fail && k > .55) return rej(new Error('Network error'));
          progress(Math.pow(k, .9));
          if (k >= 1) return res({ ok: true });
          setTimeout(step, 80 + Math.random() * 70);
        })();
      });
    };
  }

  function mount(root, opts) {
    if (root._orbit) return root._orbit;
    opts = opts || {};
    var d = root.dataset, id = 'orbit' + (++uid);
    var o = {
      title: opts.title || d.title || 'Upload files',
      accept: opts.accept || d.accept || '',
      maxSize: size(opts.maxSize || d.maxSize),
      maxFiles: +(opts.maxFiles || d.maxFiles || 0),
      multiple: opts.multiple != null ? opts.multiple : d.multiple !== 'false',
      upload: opts.upload || simulate()
    };
    var note = opts.note || d.note || ((o.accept ? label(o.accept) : 'Any file') + (o.maxSize ? ' · up to ' + fmt(o.maxSize) : ''));
    root.classList.add('orbit');
    root.innerHTML =
      '<div class="orbit__card"><div class="orbit__head"><p class="orbit__ttl" id="' + id + '-t">' + esc(o.title) + '</p><span class="orbit__count">No files yet</span></div>' +
      '<div class="orbit__zone"><canvas class="orbit__sky" aria-hidden="true"></canvas><div class="orbit__copy">' +
      '<p class="orbit__lead"><span class="orbit__drop"><b>Drop files</b> to launch them or <button type="button" class="orbit__browse" aria-describedby="' + id + '-n">browse</button></span>' +
      '<span class="orbit__rel"><b>Release</b> to launch</span></p><p class="orbit__note" id="' + id + '-n">' + esc(note) + '</p></div>' +
      '<input class="orbit__input" type="file" tabindex="-1" aria-hidden="true"' + (o.multiple ? ' multiple' : '') + (o.accept ? ' accept="' + esc(o.accept) + '"' : '') + '></div>' +
      '<ul class="orbit__list" aria-labelledby="' + id + '-t"></ul><p class="orbit__sr" aria-live="polite"></p></div>';
    var q = function (s) { return root.querySelector(s); };
    var zone = q('.orbit__zone'), cv = q('canvas'), ctx = cv.getContext('2d'), input = q('input'), list = q('ul'), sr = q('.orbit__sr'), count = q('.orbit__count');
    var items = [], sats = [], fx = [], W = 0, H = 0, dpr = 1, zs = 1, raf = 0, last = now(), over = 0, overOn = false;
    var core = { hit: -1e9, done: -1e9, shown: 0 }, col = {};

    function colors() {
      var cs = getComputedStyle(root), g = function (n, f) { return (cs.getPropertyValue('--orbit-' + n) || '').trim() || f; };
      col = { line: g('line', '#262b3b'), a: g('accent', '#3b5bff'), b: g('accent-2', '#22c3ee'), peri: g('peri', '#8fa3ff'), text: g('text', '#edeff5'), s2: g('surface-2', '#1f2433'), ok: g('success', '#19c37d') };
    }
    function resize() {
      var r = zone.getBoundingClientRect(); W = zone.clientWidth; H = zone.clientHeight; zs = W ? r.width / W : 1;
      dpr = Math.min(3, (global.devicePixelRatio || 1) * zs); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    var geo = function () { var R = Math.min(W / 12, H / 7.8); return { cx: W / 2, cy: H * .4, R: R, rMax: Math.max(R + 40, Math.min(W / 2 - 24, Math.max(172, H * .75))), rMin: R + 21, K: .36 }; };
    function pos(s, g) {
      var x = s.r * Math.cos(s.th), y = s.r * g.K * Math.sin(s.th), c = Math.cos(s.tilt), n = Math.sin(s.tilt);
      return { x: g.cx + x * c - y * n, y: g.cy + x * n + y * c, z: Math.sin(s.th) };
    }
    function say(t) { sr.textContent = ''; setTimeout(function () { sr.textContent = t; }, 30); }
    function counts() {
      var n = items.length, ok = items.filter(function (i) { return i.status === 'done'; }).length;
      count.innerHTML = n ? '<b>' + ok + '</b> of ' + n + ' uploaded' : 'No files yet';
    }
    function emit(n, detail) { root.dispatchEvent(new CustomEvent('orbit:' + n, { detail: detail, bubbles: true })); }

    function row(it) {
      var li = document.createElement('li'), k = KIND[it.kind];
      li.className = 'orbit__item'; li.style.setProperty('--c', it.color);
      li.innerHTML = '<span class="orbit__ico"><svg' + S + '>' + k[1] + '</svg>' + OK + '</span><span class="orbit__info"><span class="orbit__name"></span>' +
        '<span class="orbit__meta"><span>' + fmt(it.size) + '</span><span class="orbit__st">Starting…</span></span>' +
        '<span class="orbit__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></span></span>' +
        '<button type="button" class="orbit__act">' + X + '</button>';
      li.querySelector('.orbit__name').textContent = it.name; li.querySelector('.orbit__name').title = it.name;
      it.li = li; it.bar = li.querySelector('.orbit__bar'); it.fill = it.bar.firstChild; it.st = li.querySelector('.orbit__st'); it.act = li.querySelector('.orbit__act');
      it.act.setAttribute('aria-label', 'Cancel ' + it.name);
      it.act.addEventListener('click', function (e) { e.stopPropagation(); it.status === 'fail' && it.file && !it.bad ? retry(it.id) : remove(it.id); });
      list.appendChild(li);
    }
    function launch(it, from) {
      it.status = 'up'; it.p = 0; it.dp = 0; it.pct = -1; it.ctrl = global.AbortController ? new AbortController() : null;
      var g = geo(), i = sats.length + items.indexOf(it);
      var s = { it: it, th: Math.PI * (.85 + ((i * 0.37) % 1) * 1.4), w: 2.1 + (i % 3) * .28, tilt: TILT[i % TILT.length], k0: .78 + ((i * 0.53) % 1) * .22, born: now(), from: from, trail: [], state: 'fly', a: 1 };
      s.rmax = g.rMax * s.k0; s.r = s.rmax; it.sat = s; sats.push(s);
      var p = o.upload(it.file, function (v) { if (it.status === 'up') it.p = Math.max(it.p, clamp(+v || 0)); }, it.ctrl && it.ctrl.signal);
      Promise.resolve(p).then(function (res) {
        if (it.status !== 'up') return; it.p = 1; it.status = 'landing'; it.res = res;
      }, function (err) {
        if (it.status !== 'up') return; fail(it, (err && err.message) || 'Upload failed');
      });
      go();
    }
    function fail(it, msg) {
      it.status = 'fail'; it.li.classList.add('is-fail'); it.st.textContent = msg; it.bar.setAttribute('aria-valuenow', 0);
      if (it.sat) { it.sat.state = 'fling'; it.sat.t1 = now(); it.sat.r1 = it.sat.r; it.sat.c = '#ff5a6e'; }
      if (it.file && !it.bad) { it.act.innerHTML = RETRY; it.act.setAttribute('aria-label', 'Retry ' + it.name); }
      else it.act.setAttribute('aria-label', 'Remove ' + it.name);
      say(it.name + ': ' + msg); counts(); emit('error', { file: it.file, error: msg }); settle();
    }
    function arrive(s, t) {
      var it = s.it, c = s.c || it.color, g = geo();
      sats.splice(sats.indexOf(s), 1); it.sat = null; it.status = 'done'; core.hit = t;
      if (!calm()) {
        fx.push({ t0: t, c: c, ring: 1 });
        for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2 + Math.random() * .4, v = 70 + Math.random() * 80; fx.push({ t0: t, c: i % 3 ? c : '#ffffff', x: g.cx + Math.cos(a) * g.R, y: g.cy + Math.sin(a) * g.R, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 }); }
      }
      it.li.classList.add('is-done'); it.st.textContent = 'Uploaded'; it.fill.style.transform = 'scaleX(1)'; it.bar.setAttribute('aria-valuenow', 100);
      it.act.setAttribute('aria-label', 'Remove ' + it.name);
      say(it.name + ' uploaded'); counts(); emit('done', { file: it.file, response: it.res }); settle();
    }
    function settle() {
      var busy = items.some(function (i) { return i.status === 'up' || i.status === 'landing'; });
      if (!busy && items.some(function (i) { return i.status === 'done' && i.batch === core.batch; }) && core.done < core.hit) {
        core.done = now(); emit('complete', { files: api.files() }); opts.onComplete && opts.onComplete(api.files());
      }
    }

    function add(files, at) {
      files = [].slice.call(files || []); if (!files.length) return [];
      if (!o.multiple) { files = files.slice(0, 1); clear(true); }
      var from = (at && at.from) || { x: W / 2 + 70, y: -18 }, out = [];
      if (!items.some(function (i) { return i.status === 'up' || i.status === 'landing'; })) core.batch = (core.batch || 0) + 1;
      files.forEach(function (f, n) {
        var it = { id: id + '-' + (++uid), file: f, name: f.name || 'file', size: f.size || 0, kind: kindOf(f), batch: core.batch };
        it.color = KIND[it.kind][0]; items.push(it); row(it); out.push(it.id);
        var err = o.maxFiles && items.length > o.maxFiles ? 'Limit is ' + o.maxFiles + ' files' :
          !accepts(o.accept, f) ? 'File type not allowed' : o.maxSize && it.size > o.maxSize ? 'Too large · max ' + fmt(o.maxSize) : '';
        if (err) { it.bad = true; fail(it, err); return; }
        var fr = from ? { x: from.x + n * 14, y: from.y - n * 6 } : null;
        if (n && !calm()) setTimeout(function () { if (it.status === 'pending') launch(it, fr); }, n * 140), it.status = 'pending';
        else launch(it, fr);
        emit('add', { file: f }); opts.onAdd && opts.onAdd(f);
      });
      counts(); say(files.length + (files.length > 1 ? ' files' : ' file') + ' added');
      return out;
    }
    function find(x) { return items.filter(function (i) { return i.id === x; })[0]; }
    function remove(x, quiet) {
      var it = find(x); if (!it) return;
      if (it.ctrl) try { it.ctrl.abort(); } catch (e) {}
      if (it.sat) { it.sat.state = 'fling'; it.sat.t1 = now(); it.sat.r1 = it.sat.r; }
      it.status = 'removed'; items.splice(items.indexOf(it), 1);
      it.li.classList.add('is-out'); setTimeout(function () { it.li.remove(); }, calm() ? 20 : 320);
      if (!quiet) { say(it.name + ' removed'); emit('remove', { file: it.file }); }
      counts(); settle();
    }
    function retry(x) {
      var it = find(x); if (!it || it.status !== 'fail') return;
      it.li.classList.remove('is-fail'); it.act.innerHTML = X; it.act.setAttribute('aria-label', 'Cancel ' + it.name);
      it.fill.style.transform = 'scaleX(0)'; it.st.textContent = 'Starting…';
      if (!items.some(function (i) { return i.status === 'up' || i.status === 'landing'; })) { core.batch++; it.batch = core.batch; }
      launch(it, null);
    }
    function clear(quiet) { items.slice().forEach(function (i) { remove(i.id, true); }); if (!quiet) say('List cleared'); core.done = -1e9; }
    function highlight(on) { overOn = !!on; root.classList.toggle('is-over', overOn); go(); }

    // ---- drawing -------------------------------------------------------------------------
    function go() { if (!raf) { last = now(); raf = requestAnimationFrame(frame); } }
    function frame() {
      raf = 0; var t = now(), dt = Math.min(.05, (t - last) / 1000); last = t;
      if (!W) resize();
      if (W) { step(dt, t); draw(t); }
      if (sats.length || fx.length || overOn || over > .01 || t - core.hit < 1500 || t - core.done < 3200 || !calm()) raf = requestAnimationFrame(frame);
    }
    function step(dt, t) {
      var g = geo(), c = calm();
      over += ((overOn ? 1 : 0) - over) * Math.min(1, dt * 9);
      for (var i = sats.length - 1; i >= 0; i--) {
        var s = sats[i], it = s.it;
        it.dp += (it.p - it.dp) * Math.min(1, dt * (c ? 20 : 4.5));
        var target = s.rmax - (s.rmax - g.rMin) * eIO(it.dp), spd = s.w * Math.pow(s.rmax / Math.max(s.r, 12), .7) * (c ? .25 : 1);
        if (s.state === 'fly' || s.state === 'orbit') {
          s.r += (target - s.r) * Math.min(1, dt * 6);
          if ((t - s.born) / 1000 > .75 || c) s.state = 'orbit';
          if (it.status === 'landing' && it.dp > .965) { s.state = 'land'; s.t1 = t; s.r1 = s.r; }
        } else if (s.state === 'land') {
          var k = clamp((t - s.t1) / 520); s.r = s.r1 * (1 - eIn(k)); spd *= 1.5;
          if (k >= 1 || c) { arrive(s, t); continue; }
        } else if (s.state === 'fling') {
          var f = clamp((t - s.t1) / 850); s.r = s.r1 + 150 * eOut(f); s.a = 1 - f;
          if (f >= 1) { sats.splice(i, 1); continue; }
        }
        s.th += spd * dt;
        var p = pos(s, g);
        if (s.state === 'fly' && s.from && !c) {
          var m = eIO(clamp((t - s.born) / 750)), ax = (1 - m) * m * 4;
          p = { x: s.from.x + (p.x - s.from.x) * m - ax * 26, y: s.from.y + (p.y - s.from.y) * m - ax * 34, z: p.z * m + (1 - m) };
        }
        s.p = p; if (!c) { s.trail.push(p); if (s.trail.length > 24) s.trail.shift(); }
        if (it.status === 'up' || it.status === 'landing') {
          var pc = Math.round(it.dp * 100);
          it.fill.style.transform = 'scaleX(' + it.dp.toFixed(4) + ')';
          if (pc !== it.pct) { it.pct = pc; it.st.textContent = pc + '%'; it.bar.setAttribute('aria-valuenow', pc); opts.onProgress && opts.onProgress(it.file, pc); }
        }
      }
      var b = items.filter(function (x) { return x.batch === core.batch && x.status !== 'fail'; }), tot = 0, got = 0;
      b.forEach(function (x) { var w = Math.max(1, x.size); tot += w; got += w * (x.status === 'done' ? 1 : x.dp || 0); });
      core.shown = tot ? got / tot : 0;
    }
    function draw(t) {
      var g = geo(), c = calm(), T = t / 1000, busy = sats.some(function (s) { return s.state !== 'fling'; });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // guide rings
      ctx.lineWidth = 1; ctx.setLineDash([2, 7]);
      [1.04, .72].forEach(function (f, i) {
        ctx.lineDashOffset = -(T * (10 + over * 40)) * (i ? -1 : 1);
        ctx.strokeStyle = rgba(col.peri, .2 + over * .35 - i * .05);
        var rr = g.rMax * f * (1 + over * .06);
        ctx.beginPath(); ctx.ellipse(g.cx, g.cy, rr, rr * g.K, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]);
      sats.forEach(function (s) {
        ctx.strokeStyle = rgba(s.c || s.it.color, .2 * s.a); ctx.beginPath();
        ctx.ellipse(g.cx, g.cy, Math.max(1, s.r), Math.max(1, s.r * g.K), s.tilt, 0, Math.PI * 2); ctx.stroke();
      });
      sats.forEach(function (s) { if (s.p && s.p.z < 0) sat(s); });
      // core
      var age = (t - core.hit) / 1000, kick = age < 1.2 ? Math.exp(-age * 6) * Math.cos(age * 17) : 0, flash = age < 1 ? Math.exp(-age * 5) : 0;
      var R = g.R * (1 + .12 * kick + over * .1 + (c ? 0 : Math.sin(T * 2.2) * .015)), glow = .32 + over * .35 + flash * .45 + (busy ? .12 : 0);
      var gr = ctx.createRadialGradient(g.cx, g.cy, R * .4, g.cx, g.cy, R * 3);
      gr.addColorStop(0, rgba(col.a, glow)); gr.addColorStop(.45, rgba(col.b, glow * .28)); gr.addColorStop(1, rgba(col.b, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(g.cx, g.cy, R * 3, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(col.peri, .16); ctx.beginPath(); ctx.arc(g.cx, g.cy, R + 7, 0, Math.PI * 2); ctx.stroke();
      if (core.shown > .001 && t - core.done > 0 && (busy || t - core.done < 2600)) {
        var lg = ctx.createLinearGradient(g.cx - R, g.cy - R, g.cx + R, g.cy + R); lg.addColorStop(0, col.a); lg.addColorStop(1, col.b);
        ctx.strokeStyle = core.done > core.hit - 1 && !busy ? col.ok : lg; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(g.cx, g.cy, R + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * core.shown); ctx.stroke();
      }
      var dg = ctx.createRadialGradient(g.cx - R * .35, g.cy - R * .45, R * .1, g.cx, g.cy, R);
      dg.addColorStop(0, '#34407a'); dg.addColorStop(.6, '#1d2340'); dg.addColorStop(1, '#141829');
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(g.cx, g.cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(col.peri, .35 + flash * .5); ctx.stroke();
      if (flash > .01) { ctx.fillStyle = rgba('#ffffff', flash * .35); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(g.cx, g.cy, R - 2, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke();
      // core icon: arrow (idle) · percent (busy) · check (all done)
      var sc = R / 30; ctx.save(); ctx.translate(g.cx, g.cy); ctx.scale(sc, sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var dk = (t - core.done) / 1000;
      if (busy) {
        ctx.fillStyle = col.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var num = String(Math.round(core.shown * 100)); ctx.font = '700 15px Inter,ui-sans-serif,system-ui,sans-serif';
        var w1 = ctx.measureText(num).width; ctx.font = '600 9.5px Inter,ui-sans-serif,system-ui,sans-serif'; var w2 = ctx.measureText('%').width;
        ctx.font = '700 15px Inter,ui-sans-serif,system-ui,sans-serif'; ctx.fillText(num, -w2 / 2, 1);
        ctx.font = '600 9.5px Inter,ui-sans-serif,system-ui,sans-serif'; ctx.fillStyle = col.peri; ctx.fillText('%', w1 / 2 + 1, 2.5);
      } else if (dk >= 0 && dk < 2.6) {
        var ck = c ? 1 : eOut(clamp(dk / .45)), L = 24;
        ctx.strokeStyle = col.ok; ctx.lineWidth = 3; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - ck);
        ctx.beginPath(); ctx.moveTo(-7, .5); ctx.lineTo(-2, 5.5); ctx.lineTo(7.5, -4.5); ctx.stroke(); ctx.setLineDash([]);
      } else {
        var bob = c ? 0 : Math.sin(T * 2.4) * 1.6 - over * 3; ctx.strokeStyle = col.text; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(0, 6 + bob); ctx.lineTo(0, -6 + bob); ctx.moveTo(-5.5, -.8 + bob); ctx.lineTo(0, -6.3 + bob); ctx.lineTo(5.5, -.8 + bob); ctx.stroke();
      }
      ctx.restore();
      sats.forEach(function (s) { if (s.p && s.p.z >= 0) sat(s); });
      // shockwaves + sparks
      for (var i = fx.length - 1; i >= 0; i--) {
        var e = fx[i], a = (t - e.t0) / 1000;
        if (e.ring) {
          var k = a / .75; if (k >= 1) { fx.splice(i, 1); continue; }
          var rr = g.R + 8 + 110 * eOut(k); ctx.lineWidth = 2.2 * (1 - k) + .5; ctx.strokeStyle = rgba(e.c, .75 * (1 - k) * (1 - k));
          ctx.beginPath(); ctx.ellipse(g.cx, g.cy, rr, rr * .62, 0, 0, Math.PI * 2); ctx.stroke();
        } else {
          var k2 = a / .7; if (k2 >= 1) { fx.splice(i, 1); continue; }
          var x = e.x + e.vx * a * (1 - k2 * .5), y = e.y + e.vy * a * (1 - k2 * .5) + 30 * a * a;
          ctx.fillStyle = rgba(e.c, 1 - k2); ctx.beginPath(); ctx.arc(x, y, 2 * (1 - k2) + .4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    function sat(s) {
      var p = s.p, c = s.c || s.it.color, depth = (p.z + 1) / 2, a = s.a * (.5 + .5 * depth), z = .78 + .32 * depth, tr = s.trail;
      if (s.state === 'land') z *= 1 - .55 * clamp((now() - s.t1) / 520);
      ctx.lineCap = 'round';
      for (var i = 1; i < tr.length; i++) {
        var f = i / tr.length; ctx.strokeStyle = rgba(c, a * f * .7); ctx.lineWidth = 3 * z * f;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
      }
      var gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18 * z);
      gl.addColorStop(0, rgba(c, .6 * a)); gl.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, 18 * z, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(p.x, p.y, 6.2 * z, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', .85 * a); ctx.beginPath(); ctx.arc(p.x - 1.5 * z, p.y - 1.5 * z, 2.2 * z, 0, Math.PI * 2); ctx.fill();
    }

    // ---- input ---------------------------------------------------------------------------
    function rel(e) { var r = zone.getBoundingClientRect(); return { x: (e.clientX - r.left) / zs, y: (e.clientY - r.top) / zs }; }
    function hasFiles(e) { var t = e.dataTransfer && e.dataTransfer.types; return t && [].indexOf.call(t, 'Files') > -1; }
    zone.addEventListener('dragenter', function (e) { if (hasFiles(e)) { e.preventDefault(); highlight(true); } });
    zone.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; if (!overOn) highlight(true); } });
    zone.addEventListener('dragleave', function (e) { if (!zone.contains(e.relatedTarget)) highlight(false); });
    zone.addEventListener('drop', function (e) { e.preventDefault(); highlight(false); add(e.dataTransfer.files, { from: rel(e) }); });
    zone.addEventListener('click', function (e) { if (e.target === input) return; input.click(); });
    input.addEventListener('change', function () {
      var b = q('.orbit__browse').getBoundingClientRect(), r = zone.getBoundingClientRect();
      add(input.files, { from: { x: (b.left - r.left + b.width / 2) / zs, y: (b.top - r.top) / zs } }); input.value = '';
    });
    var ro = global.ResizeObserver ? new ResizeObserver(function () { resize(); go(); }) : null;
    ro ? ro.observe(zone) : global.addEventListener('resize', resize);
    colors(); resize(); go();
    if (mq && mq.addEventListener) mq.addEventListener('change', go);

    var api = {
      add: add, remove: remove, retry: retry, clear: clear, highlight: highlight,
      files: function () { return items.map(function (i) { return { id: i.id, file: i.file, name: i.name, size: i.size, kind: i.kind, status: i.status === 'landing' ? 'up' : i.status, progress: i.status === 'done' ? 100 : Math.round((i.dp || 0) * 100) }; }); },
      zone: zone,
      destroy: function () { clear(true); cancelAnimationFrame(raf); raf = 0; ro && ro.disconnect(); root.innerHTML = ''; root.classList.remove('orbit'); delete root._orbit; }
    };
    root._orbit = api;
    return api;
  }

  global.Orbit = { mount: mount, simulate: simulate };
  function auto() { [].forEach.call(document.querySelectorAll('[data-orbit]'), function (el) { if (!('orbitManual' in el.dataset)) mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})(window);
