/* Cadence — social media planner app template · Kodehelix UI · kodehelix.in
   Plain JS, zero dependencies. Cadence.mount(el, options) → controller. See README.md. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var LONGDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /* Post images. The demo photos come from cadence-photos.js (window.CADENCE_PHOTOS); pass your own with
     Cadence.mount(el, { data: { images: ['img/post-1.jpg', ...] } }). Without photos, soft gradients are used. */
  function svgUrl(svg) { return "url('data:image/svg+xml," + encodeURIComponent(svg) + "') center/cover"; }
  var GRADS = ['linear-gradient(135deg,#FFB020,#FF5A6E)', 'linear-gradient(135deg,#19C37D,#0BA5CB)', 'linear-gradient(140deg,#8FA3FF,#3B5BFF)', 'linear-gradient(135deg,#A98BFF,#E9579A)',
    'linear-gradient(150deg,#22C3EE,#3B5BFF)', 'linear-gradient(135deg,#C9F27B,#19C37D)', 'linear-gradient(135deg,#FF9A6E,#A98BFF)', 'linear-gradient(140deg,#3B5BFF,#0B0D12)'];
  function useImages(list) { if (list && list.length) GRADS = list.map(function (u) { return "url('" + u + "') center/cover"; }); }
  useImages(window.CADENCE_PHOTOS);
  // simple illustrated avatars (seeded), and the demo brand's logo
  function avatar(i) {
    var bg = ['#C9D6FF', '#FFE0B8', '#C8F2DE', '#F9D0E3', '#D9D2FF', '#BDEBF5', '#FFD7C7', '#E3F0B8'][i % 8];
    var skin = ['#F2C9A0', '#D9A17A', '#B97A55', '#8D5A3B', '#F5D5B8', '#C68A62'][i % 6];
    var hair = ['#2B1B12', '#5A3420', '#141414', '#7A4A2A', '#C9A15A', '#3B2416', '#1E1E1E'][(i * 3) % 7];
    var shirt = ['#3B5BFF', '#19C37D', '#E9579A', '#FFB020', '#22C3EE', '#A98BFF', '#FF5A6E'][(i * 5) % 7];
    var st = i % 4, top = '<path d="M20 28c0-10 6-15 12-15s12 5 12 15c-3-5-8-7-12-7s-9 2-12 7z" fill="' + hair + '"/>';
    var hairS = st === 1 ? '<path d="M19 30c0-12 6-18 13-18s13 6 13 18v12c-2-4-3-8-3-14-3-3-7-5-10-5s-7 2-10 5c0 6-1 10-3 14z" fill="' + hair + '"/>'
      : st === 2 ? top + '<circle cx="32" cy="13" r="6" fill="' + hair + '"/>'
        : st === 3 ? top + '<path d="M23 31c1 7 5 10 9 10s8-3 9-10c-3 3-6 4-9 4s-6-1-9-4z" fill="' + hair + '"/>' : top;
    return svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="' + bg + '"/><path d="M10 64c2-14 12-20 22-20s20 6 22 20z" fill="' + shirt + '"/><rect x="27" y="36" width="10" height="10" rx="4" fill="' + skin + '"/><circle cx="32" cy="28" r="12" fill="' + skin + '"/>' + hairS +
      '<circle cx="27.5" cy="29" r="1.4" fill="#2B1B12"/><circle cx="36.5" cy="29" r="1.4" fill="#2B1B12"/><path d="M28.5 34c2 2 5 2 7 0" fill="none" stroke="#7A3B2A" stroke-width="1.4" stroke-linecap="round"/></svg>');
  }
  var LOGO = svgUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A4D"/><stop offset="1" stop-color="#2F5FD0"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="36" r="11" fill="#FFE2A8"/><path d="M8 40c5-4 9-4 14 0s9 4 14 0 9-4 14 0 6 3 8 1" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M8 49c5-4 9-4 14 0s9 4 14 0 9-4 14 0 6 3 8 1" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3.5" stroke-linecap="round"/></svg>');

  /* ---------- demo data (replace with your own: same shape, see README) ---------- */
  function seeded(s) { return function () { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function demoData() {
    var r = seeded(7);
    var nets = [
      { id: 'ig', name: 'Instagram', short: 'IG', handle: '@saltwind.co', followers: 48210, posts: 31, eng: 5.8, limit: 2200, last: '2 h ago' },
      { id: 'tt', name: 'TikTok', short: 'TT', handle: '@saltwind.co', followers: 63450, posts: 18, eng: 7.4, limit: 2200, last: 'Yesterday' },
      { id: 'li', name: 'LinkedIn', short: 'in', handle: 'Saltwind Journeys', followers: 12840, posts: 12, eng: 3.1, limit: 3000, last: 'Today, 10:00' },
      { id: 'x', name: 'X', short: 'X', handle: '@saltwindco', followers: 21390, posts: 26, eng: 1.9, limit: 280, last: 'Today, 10:00' },
      { id: 'fb', name: 'Facebook', short: 'f', handle: 'Saltwind Journeys', followers: 30120, posts: 15, eng: 1.4, limit: 63206, last: '3 days ago' },
      { id: 'yt', name: 'YouTube', short: 'YT', handle: 'Saltwind Journeys', followers: 9870, posts: 4, eng: 4.2, limit: 5000, last: 'Wed', warn: 'Sign-in expires in 3 days' }
    ];
    var P = [
      [0, 9, 'ig fb', 'Monday sunrise from the bridge deck. 5:52 am, Arabian Sea.', 0],
      [0, 18.5, 'li', 'How we plan a sunrise route: tides, cloud cover and a backup harbour.', 1],
      [1, 8.5, 'ig tt', 'Golden hour in 15 seconds: the full timelapse from the bow.', 6],
      [1, 13, 'x', 'Hot take: the best sunrises come after a stormy night. Agree?', 3],
      [2, 12, 'ig li fb', 'Meet Ritu, our trip lead, and the notebook with 400 sunrises in it.', 5],
      [2, 19, 'yt', 'Full video: a morning on deck, from first light to breakfast.', 0],
      [3, 10, 'x li', 'We are hiring a part-time trip photographer in Kochi.', 4],
      [3, 12.5, 'ig', 'Behind the scenes: packing 40 tripods for the winter season.', 7],
      [3, 18, 'ig tt', 'Three phone settings for sharper sunrise photos.', 4],
      [4, 9.5, 'li x', 'Our numbers this quarter, and what we learned.', 1, 'review'],
      [4, 13, 'ig fb', 'Winter departures: 20 cabins left on the December sailing.', 3],
      [5, 11, 'tt', 'Trying every lens on one sunrise. Ranked.', 6],
      [5, 17.5, 'ig fb x', 'Weekend contest: share your best sunrise and win a trip.', 2],
      [6, 10, 'ig', 'Slow Sunday: mist on the lake before anyone was awake.', 5],
      [6, 18, 'yt fb', 'Live: Q&A with our trip lead.', 7, 'review']
    ];
    var posts = P.map(function (p, i) { return { id: 'p' + i, w: 0, day: p[0], t: p[1], nets: p[2].split(' '), text: p[3], g: p[4], status: p[5] || '' }; });
    ['Rainy dawn at the harbour.', 'Our new eco cabins are here.', 'Poll: sunrise or sunset?', 'Traveller of the week: the Sharma family.',
      'How to pack a camera bag for sea trips.', 'Office sunrise walk challenge.', 'Five-second horizon fix.', 'From harbour to open sea in 40 minutes.', 'Sunday lake notes.', 'Throwback: our first sailing in 2019.'
    ].forEach(function (t, i) { posts.push({ id: 'q' + i, w: -1, day: i % 7, t: 8 + Math.round(r() * 24) / 2, nets: [['ig'], ['li', 'x'], ['tt'], ['ig', 'fb'], ['x'], ['yt']][i % 6], text: t, g: i % 8, status: '' }); });
    [[0, 9, 'ig fb', 'December hours: early boarding all week.', 3], [1, 18, 'tt', 'Getting the boat ready, sped up.', 6], [3, 12, 'li', 'What a year of slow travel taught us.', 1], [5, 10, 'ig', 'Winter route sneak peek.', 2]]
      .forEach(function (p, i) { posts.push({ id: 'n' + i, w: 1, day: p[0], t: p[1], nets: p[2].split(' '), text: p[3], g: p[4], status: '' }); });

    var reach = [], prev = [], imp = [], eng = [], fol = [];
    for (var d = 0; d < 180; d++) {
      var wk = Math.sin((d % 7) / 7 * Math.PI * 2 + 1.1) * .16, tr = d / 180 * 1.2 - .2;
      var v = 30000 * (1 + tr * .55 + wk + (r() - .5) * .22) + (d % 11 === 3 ? 18000 : 0);
      imp.push(Math.round(v * 1.65)); eng.push(Math.round(v * 1.65 * (.038 + r() * .016)));
      fol.push(Math.max(20, Math.round(180 + tr * 260 + wk * 300 + r() * 160 + (d % 11 === 3 ? 420 : 0))));
      if (d >= 150) { reach.push(Math.round(v)); prev.push(Math.round(v * (.74 + r() * .14))); }
    }
    var heat = [];
    for (var y = 0; y < 7; y++) {
      var row = [];
      for (var x = 0; x < 8; x++) {
        var h = 7 + x * 2, we = y >= 5;
        var val = Math.exp(-Math.pow(h - (we ? 11 : 19), 2) / 9) * .9 + Math.exp(-Math.pow(h - (we ? 17 : 12.5), 2) / 5) * .55 + r() * .14;
        row.push(Math.min(1, val));
      }
      heat.push(row);
    }
    var top = [
      ['Three phone settings for sharper sunrise photos', 'ig tt', 184200, 9.8, 4120, 4, '28 Oct'],
      ['Meet Ritu, our trip lead', 'ig li', 96400, 7.1, 1870, 5, '4 Nov'],
      ['Golden hour from the bow, timelapse', 'tt', 152900, 6.4, 2950, 6, '3 Nov'],
      ['Our first sailing, five years later', 'ig fb', 71300, 6.2, 990, 0, '19 Oct'],
      ['Winter departures: first look', 'ig fb x', 88800, 5.9, 2210, 3, '22 Oct'],
      ['How we plan a sunrise route', 'li', 38400, 4.8, 640, 1, '2 Nov'],
      ['Best sunrises come after storms', 'x', 54100, 3.6, 120, 7, '3 Nov'],
      ['A morning on deck, full video', 'yt', 22800, 4.4, 530, 2, '4 Nov']
    ].map(function (p, i) { return { id: 't' + i, text: p[0], nets: p[1].split(' '), reach: p[2], eng: p[3], saves: p[4], g: p[5], date: p[6] }; });
    var published = [];
    for (var k = 0; k < 28; k++) {
      var ago = Math.floor(k * 3.2 + r() * 2);
      published.push({ id: 'u' + k, ago: ago, net: nets[k % 6].id, text: top[k % 8].text.replace(/^./, function (c) { return c; }) + (k > 7 ? ' (' + ['repost', 'part 2', 'remix', 'cut'][k % 4] + ')' : ''),
        g: top[k % 8].g, reach: Math.round(9000 + r() * 120000), eng: Math.round((1.2 + r() * 8) * 10) / 10, status: k % 7 === 2 ? 'Boosted' : 'Published' });
    }
    var threads = [
      ['Ananya Rao', 'ig', 'dm', '2 min', 1, 'Question', 'var(--cadence-peri)', 3, [['Hi! Is the December sailing OK for first-time travellers? Asking for my parents.', '14:28']]],
      ['Rohan Verma', 'fb', 'dm', '18 min', 1, 'Booking issue', 'var(--cadence-bad)', 0, [['Hello, my booking #4821 shows the wrong cabin.', '14:06'], ['We booked two berths and it shows one. Can you check?', '14:07']]],
      ['Kabir Sethi', 'ig', 'comment', '42 min', 1, 'Praise', 'var(--cadence-good)', 5, [['This timelapse is gold. Watched it five times already.', '13:48']]],
      ['Meera J.', 'x', 'mention', '1 h', 0, 'Praise', 'var(--cadence-good)', 6, [['@saltwindco the sunrise from your bow this week was unreal.', '13:20']]],
      ['Studio Paperplane', 'li', 'dm', '2 h', 0, 'Collab', 'var(--cadence-cyan)', 2, [['We design travel guides and love your photos. Open to a chat about a winter photo book?', '12:31']]],
      ['Arjun Mehta', 'yt', 'comment', '3 h', 0, 'Question', 'var(--cadence-peri)', 7, [['Could you do a full video on shooting sunrise on a phone? The exposure confuses me.', '11:15']], 1],
      ['Tanvi S.', 'tt', 'comment', '5 h', 0, 'Question', 'var(--cadence-peri)', 4, [['what is the song in this one??', '09:52']]],
      ['Neha Kapoor', 'ig', 'mention', 'Yesterday', 0, 'Praise', 'var(--cadence-good)', 1, [['Tagged you in my story: our family sunrise on the lake, thanks to your guide.', 'Wed']]],
      ['Farah Ali', 'x', 'dm', 'Yesterday', 0, 'Question', 'var(--cadence-peri)', 6, [['Do you sail from Dubai?', 'Wed']], 1]
    ].map(function (t, i) {
      var msgs = t[8].map(function (m) { return { me: false, text: m[0], time: m[1] }; });
      if (t[9]) msgs.push({ me: true, text: i === 5 ? 'Great idea, it is on our list for this month!' : 'Not yet, but we are working on it. We will let you know first.', time: 'Wed' });
      return { id: 'm' + i, name: t[0], net: t[1], type: t[2], time: t[3], unread: !!t[4], tag: t[5], tagc: t[6], g: t[7], msgs: msgs };
    });
    return {
      company: 'Saltwind Journeys', today: 3, now: 14.5, weekStart: [2026, 10, 2],
      nets: nets, posts: posts, reach: reach, reachPrev: prev, imp: imp, eng: eng, fol: fol, heat: heat, top: top, published: published, threads: threads,
      beats: [3, 2, 4, 1, 3, 2, 2, 5, 2, 3, 2, 1, 3, 2],
      kpis: { followers: [185880, 2.4], reach: [1240000, 18.2], eng: [4.6, 0.6], posts: [38, 5] },
      types: [['Short video', 7.6], ['Carousel', 5.9], ['Single image', 4.1], ['Text only', 2.3], ['Live', 3.4]],
      tags: ['#sunrise', '#goldenhour', '#travel', '#saltwind'],
      quick: ['Thank you, that means a lot!', 'Sending you a DM now', 'Could you share your booking number?'],
      drafts: [
        { text: 'Fresh from this morning: first light over the harbour, 6:04 am. Shot on a phone, no filters. Swipe for the full set. #sunrise #goldenhour', nets: ['ig', 'li', 'x'], media: [1, 4], day: 4, t: 19 },
        { text: 'You asked, we listened: every winter sailing now has a sunrise photo class on deck. Booking opens tomorrow morning. #travel #saltwind', nets: ['ig', 'fb', 'tt'], media: [0], day: 5, t: 11.5 },
        { text: 'Photo tip: lock focus on the horizon, then slide exposure down. The sun stays round and the sky keeps its colour. #phototips', nets: ['x', 'li'], media: [], day: 6, t: 9 },
        { text: 'Our lake retreat opens this Saturday. Come for the mist, stay for the sunrise and a hot breakfast on us. #retreat #sunrise', nets: ['ig', 'fb', 'li'], media: [2, 5, 7], day: 5, t: 16 }
      ],
      team: [['Aisha Malik', 'aisha@saltwind.co', 'Owner', 3], ['Dev Narang', 'dev@saltwind.co', 'Editor', 2], ['Ritu Sharma', 'ritu@saltwind.co', 'Approver', 0], ['Sam Thomas', 'sam@saltwind.co', 'Contributor', 4]]
    };
  }

  /* ---------- helpers ---------- */
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function S(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function H(tag, cls, html, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function eOut(t) { return 1 - Math.pow(1 - t, 3); }
  function eIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eBack(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function lin(t) { return t; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtK(n) { n = Math.round(n); return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : fmt(n); }
  function fmtT(t) { var h = Math.floor(t), m = Math.round((t - h) * 60); return (h % 12 || 12) + ':' + ('0' + m).slice(-2) + (h < 12 ? ' am' : ' pm'); }
  function now() { return performance.now(); }
  function netBadge(n, cls) { return '<span class="cd-net' + (cls ? ' ' + cls : '') + '" data-n="' + n.id + '" style="--c:var(--cadence-' + n.id + ')" aria-hidden="true">' + esc(n.short) + '</span>'; }
  function smooth(pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      var lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
      c1y = clamp(c1y, lo - 6, hi + 6); c2y = clamp(c2y, lo - 6, hi + 6);
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function resample(a, n) { var out = []; for (var i = 0; i < n; i++) { var p = i / (n - 1) * (a.length - 1), j = Math.floor(p), f = p - j; out.push(lerp(a[j], a[Math.min(a.length - 1, j + 1)], f)); } return out; }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p; return (m <= 1.2 ? 1.2 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10) * p; }

  /* ---------- animation engine (rAF + performance.now: plays nicely with virtual clocks) ---------- */
  function Engine() { this.list = []; this.on = false; }
  Engine.prototype.add = function (dur, fn, o) {
    o = o || {};
    var j = { t0: now() + (o.delay || 0), dur: mq.matches ? 0 : dur, fn: fn, ease: o.ease || eOut, done: o.done, dead: false };
    if (mq.matches) j.t0 = now();
    this.list.push(j); this.kick(); return j;
  };
  Engine.prototype.kick = function () { var self = this; if (this.on) return; this.on = true; requestAnimationFrame(function f() { self.tick(); if (self.list.length) requestAnimationFrame(f); else self.on = false; }); };
  Engine.prototype.tick = function () {
    var t = now(), keep = [];
    for (var i = 0; i < this.list.length; i++) {
      var j = this.list[i]; if (j.dead) continue;
      if (t < j.t0) { keep.push(j); continue; }
      var p = j.dur ? clamp((t - j.t0) / j.dur, 0, 1) : 1;
      j.fn(j.ease(p), p);
      if (p < 1) keep.push(j); else if (j.done) j.done();
    }
    this.list = keep.concat(this.list.slice(this.list.length));
  };
  function kill(j) { if (j) j.dead = true; }

  /* ---------- mount ---------- */
  function mount(root, opts) {
    if (root._cadence) return root._cadence;
    opts = opts || {};
    var D = opts.data || demoData();
    if (D.images) useImages(D.images);
    var E = new Engine(), off = [], page = '', query = '', range = 30, week = 0, draftI = 0, added = 0;
    var NET = {}; D.nets.forEach(function (n) { NET[n.id] = n; });
    var visibleNets = {}; D.nets.forEach(function (n) { visibleNets[n.id] = true; });
    var charts = {};
    function on(el, ev, fn, o) { if (!el) return; el.addEventListener(ev, fn, o); off.push(function () { el.removeEventListener(ev, fn, o); }); }
    function scaleK() { var r = root.getBoundingClientRect(); return root.offsetWidth ? r.width / root.offsetWidth || 1 : 1; }
    function date(w, d) { var s = D.weekStart, x = new Date(s[0], s[1], s[2] + w * 7 + d); return x; }
    function dlabel(w, d, long) { var x = date(w, d); return (long ? LONGDAYS[d] : DAYS[d]) + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
    function roll(el, to, f, dur, delay) {
      var from = el._v || 0; el._v = to; kill(el._tw);
      el._tw = E.add(dur || 900, function (e) { el.textContent = f(lerp(from, to, e)); }, { delay: delay });
    }
    function toast(html) {
      var box = $(root, '[data-cd-toasts]'); if (!box) return;
      if (root.classList.contains('cd-scaled')) {   // scaled preview: keep toasts at the bottom of the visible area
        var rr = root.getBoundingClientRect(), k = scaleK();
        box.style.position = 'absolute'; box.style.bottom = 'auto'; box.style.top = ((innerHeight - rr.top) / k - 18) + 'px'; box.style.transform = 'translateY(-100%)';
      }
      var t = H('div', 'cd-toast', '<svg class="cd-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-4.8"/></svg><span>' + html + '</span>', box);
      E.add(420, function (e) { t.style.opacity = e; t.style.transform = 'translateY(' + (14 * (1 - e)) + 'px) scale(' + (.96 + .04 * e) + ')'; }, { ease: eBack });
      E.add(320, function (e) { t.style.opacity = 1 - e; t.style.transform = 'translateY(' + (8 * e) + 'px)'; }, { delay: 3200, ease: lin, done: function () { t.remove(); } });
    }
    function matches(text) { return !query || text.toLowerCase().indexOf(query) > -1; }

    /* ----- sidebar + shell ----- */
    var beats = $(root, '[data-cd-beats]');
    if (beats) { var mx = Math.max.apply(null, D.beats); beats.innerHTML = D.beats.map(function (b) { return '<i' + (b ? '' : ' class="is-off"') + ' style="height:' + Math.max(14, b / mx * 100) + '%"></i>'; }).join(''); }
    function counts() {
      var c = D.posts.filter(function (p) { return p.w === 0 && !isPast(p); }).length;
      $$(root, '[data-cd-count="week"]').forEach(function (el) { roll(el, c, function (v) { return Math.round(v); }, 600); });
      var u = D.threads.filter(function (t) { return t.unread; }).length;
      $$(root, '[data-cd-count="inbox"]').forEach(function (el) { el.textContent = u; el.style.display = u ? '' : 'none'; });
    }
    function isPast(p) { return p.w < 0 || (p.w === 0 && (p.day < D.today || (p.day === D.today && p.t < D.now))); }
    var TITLES = { overview: ['Overview', 'Thursday, 5 November'], planner: ['Planner', 'Drag posts to reschedule them'], compose: ['Compose', 'Write once, post everywhere'],
      inbox: ['Inbox', 'Messages, comments and mentions in one place'], analytics: ['Analytics', 'How your channels are growing'], channels: ['Channels', 'Connected accounts and your team'] };

    function go(p, fromHash) {
      if (!TITLES[p]) p = 'overview';
      var prev = page; if (p === prev) return;
      page = p;
      $$(root, '[data-cd-go]').forEach(function (a) { if (a.closest('.cd-nav')) { if (a.getAttribute('data-cd-go') === p) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
      var t = $(root, '[data-cd-title]'), s = $(root, '[data-cd-sub]');
      if (t) t.textContent = TITLES[p][0]; if (s) s.textContent = TITLES[p][1];
      $$(root, '[data-cd-page]').forEach(function (sec) {
        var me = sec.getAttribute('data-cd-page') === p;
        if (me) {
          sec.hidden = false; kill(sec._tw); if (!mq.matches) sec.style.opacity = 0;
          sec._tw = E.add(420, function (e) { sec.style.opacity = e; sec.style.transform = 'translateY(' + (12 * (1 - e)) + 'px)'; }, { done: function () { sec.style.transform = ''; sec.style.opacity = ''; } });
        } else sec.hidden = true;
      });
      menu(false);
      if (!fromHash && opts.hash !== false) { try { history.replaceState(null, '', '#' + p); } catch (e) { /* file:// or sandbox */ } }
      enter[p] && enter[p](prev === '');
      if (opts.onPage) opts.onPage(p);
    }
    function menu(open) { root.classList.toggle('is-open', open); var b = $(root, '[data-cd-menu]'); if (b) b.setAttribute('aria-expanded', String(open)); }
    on(root, 'click', function (ev) {
      var a = ev.target.closest('[data-cd-go]');
      if (a && root.contains(a)) { ev.preventDefault(); go(a.getAttribute('data-cd-go')); }
    });
    on($(root, '[data-cd-menu]'), 'click', function () { menu(!root.classList.contains('is-open')); });
    on($(root, '.cd-scrim'), 'click', function () { menu(false); });
    on(root, 'keydown', function (ev) { if (ev.key === 'Escape') menu(false); });
    on(window, 'hashchange', function () { var h = location.hash.slice(1); if (TITLES[h]) go(h, true); });
    function setTheme(th) {
      root.setAttribute('data-theme', th);
      var b = $(root, '[data-cd-theme]'); if (b) { b.setAttribute('aria-pressed', String(th === 'light')); b.setAttribute('aria-label', th === 'light' ? 'Switch to dark theme' : 'Switch to light theme'); }
    }
    on($(root, '[data-cd-theme]'), 'click', function () { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); });
    on($(root, '[data-cd-search]'), 'input', function (e) { query = e.target.value.trim().toLowerCase(); drawTop(); drawCal(); drawPosts(); });

    function placeSeg(seg, animate) {
      if (!seg) return;
      var ind = $(seg, '.cd-seg-ind'), b = $(seg, '[aria-pressed="true"]'); if (!ind || !b) return;
      var x = b.offsetLeft, w = b.offsetWidth, fx = ind._x == null ? x : ind._x, fw = ind._w == null ? w : ind._w;
      ind._x = x; ind._w = w; kill(ind._tw);
      ind._tw = E.add(animate ? 460 : 0, function (e) { ind.style.width = lerp(fw, w, e) + 'px'; ind.style.transform = 'translateX(' + lerp(fx, x, e) + 'px)'; }, { ease: eBack });
    }

    /* ----- KPIs ----- */
    var ICON = {
      followers: '<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5M16 4.5a3.2 3.2 0 0 1 0 6.2M18.5 14.8c1.4.8 2.2 2.4 2.5 5.2"/>',
      reach: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
      eng: '<path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.8C19 14.7 12 19 12 19z"/>',
      posts: '<path d="M4 12l16-7-6 16-3-6z"/>',
      imp: '<path d="M5 19v-7M10 19V6M15 19v-4M20 19V9"/>', newf: '<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5M18 8v6M15 11h6"/>'
    };
    function kpiCards(box, items) {
      if (!box) return;
      if (!box.children.length) box.innerHTML = items.map(function (k) {
        return '<article class="cd-card cd-kpi" style="--k:' + k.c + '" data-k="' + k.id + '"><div class="cd-kpi-top"><svg class="cd-ic" viewBox="0 0 24 24">' + ICON[k.icon] + '</svg>' + esc(k.label) + '</div>' +
          '<div class="cd-kpi-val">0</div><div class="cd-kpi-foot"><div><span class="cd-delta"><svg class="cd-ic" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg><span></span></span><span class="cd-kpi-note">' + esc(k.note) + '</span></div>' +
          '<svg class="cd-spark" viewBox="0 0 84 30" aria-hidden="true"><path class="cd-spark-fill"/><path class="cd-spark-line"/></svg></div></article>';
      }).join('');
      items.forEach(function (k, i) {
        var card = $(box, '[data-k="' + k.id + '"]'); if (!card) return;
        roll($(card, '.cd-kpi-val'), k.v, k.f, 1000, i * 70);
        $(card, '.cd-kpi-note').textContent = k.note;
        var dl = $(card, '.cd-delta'); dl.classList.toggle('is-down', k.d < 0); $(dl, 'span').textContent = (k.d >= 0 ? '+' : '') + k.df(k.d);
        var sp = resample(k.spark, 14), lo = Math.min.apply(null, sp), hi = Math.max.apply(null, sp);
        var to = sp.map(function (v, j) { return [2 + j / 13 * 80, 27 - (v - lo) / ((hi - lo) || 1) * 22]; });
        var line = $(card, '.cd-spark-line'), fill = $(card, '.cd-spark-fill'), from = card._sp || to.map(function (p) { return [p[0], 27]; });
        card._sp = to; kill(card._tw);
        card._tw = E.add(800, function (e) {
          var pts = to.map(function (p, j) { return [p[0], lerp(from[j][1], p[1], e)]; }), d = smooth(pts);
          line.setAttribute('d', d); fill.setAttribute('d', d + 'L82 30L2 30Z');
        }, { delay: i * 70 + 150 });
      });
    }

    /* ----- overview ----- */
    function drawOverviewKpis() {
      var K = D.kpis, r = D.reach;
      kpiCards($(root, '[data-cd-kpis="overview"]'), [
        { id: 'followers', icon: 'followers', label: 'Followers', c: 'var(--cadence-peri)', v: K.followers[0], f: fmtK, d: K.followers[1], df: function (d) { return d.toFixed(1) + '%'; }, note: 'all channels', spark: D.fol.slice(-30).map(function (v, i, a) { return a.slice(0, i + 1).reduce(function (s, x) { return s + x; }, 0); }) },
        { id: 'reach', icon: 'reach', label: 'Reach', c: 'var(--cadence-cyan)', v: K.reach[0], f: fmtK, d: K.reach[1], df: function (d) { return d.toFixed(1) + '%'; }, note: 'vs previous 30 days', spark: r },
        { id: 'eng', icon: 'eng', label: 'Engagement rate', c: 'var(--cadence-ig)', v: K.eng[0], f: function (v) { return v.toFixed(1) + '%'; }, d: K.eng[1], df: function (d) { return d.toFixed(1) + ' pt'; }, note: 'per impression', spark: D.eng.slice(-30) },
        { id: 'posts', icon: 'posts', label: 'Posts published', c: 'var(--cadence-good)', v: K.posts[0], f: function (v) { return Math.round(v); }, d: K.posts[1], df: function (d) { return String(d); }, note: 'last 30 days', spark: D.beats.concat(D.beats) }
      ]);
    }
    function lineChart(box, key, series, o) {
      if (!box) return;
      var W = Math.max(260, box.clientWidth), Hh = o.h || 230, L = 44, R = 10, T = 12, B = 26;
      var n = series[0].vals.length, max = niceMax(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.vals); })));
      function X(i) { return L + i / (n - 1) * (W - L - R); } function Y(v) { return T + (1 - v / max) * (Hh - T - B); }
      var st = charts[key];
      var targets = series.map(function (s) { return s.vals.map(function (v, i) { return [X(i), Y(v)]; }); });
      if (!st || st.W !== W || st.n !== n || o.rebuild) {
        box.innerHTML = '';
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh, width: W, height: Hh, role: 'img', 'aria-label': o.label }, box);
        var defs = S('defs', {}, svg), gid = key + Math.round(Math.random() * 1e6);
        var lg = S('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        S('stop', { offset: 0, 'stop-color': series[0].color, 'stop-opacity': .28 }, lg); S('stop', { offset: 1, 'stop-color': series[0].color, 'stop-opacity': 0 }, lg);
        var clip = S('clipPath', { id: gid + 'c' }, defs), cr = S('rect', { x: 0, y: 0, width: 0, height: Hh }, clip);
        var gGrid = S('g', {}, svg);
        var body = S('g', { 'clip-path': 'url(#' + gid + 'c)' }, svg);
        var area = S('path', { fill: 'url(#' + gid + ')' }, body);
        var lines = series.map(function (s) { return S('path', { class: 'cd-line' + (s.dash ? ' cd-line--prev' : ''), stroke: s.color }, body); });
        var cross = S('line', { class: 'cd-cross', y1: T, y2: Hh - B }, svg);
        var dots = series.map(function (s) { return S('circle', { class: 'cd-dot', r: 4.5, fill: s.color }, svg); });
        var hit = S('rect', { x: L, y: 0, width: W - L - R, height: Hh, fill: 'transparent' }, svg);
        var tip = H('div', 'cd-tip', '', box);
        st = charts[key] = { gGrid: gGrid, W: W, n: n, area: area, lines: lines, cr: cr, cross: cross, dots: dots, tip: tip, pts: null, Hh: Hh, B: B };
        function hover(e) {
          var r = svg.getBoundingClientRect(), k = r.width / W, x = (e.clientX - r.left) / k, i = clamp(Math.round((x - L) / (W - L - R) * (n - 1)), 0, n - 1);
          var pts = st.pts; if (!pts) return;
          st.cross.setAttribute('x1', pts[0][i][0]); st.cross.setAttribute('x2', pts[0][i][0]); st.cross.style.opacity = 1;
          st.dots.forEach(function (d, j) { d.setAttribute('cx', pts[j][i][0]); d.setAttribute('cy', pts[j][i][1]); d.style.opacity = 1; });
          st.tip.innerHTML = o.tip(i); st.tip.classList.add('is-on');
          st.tip.style.left = clamp(pts[0][i][0], 70, W - 70) + 'px'; st.tip.style.top = Math.min.apply(null, pts.map(function (p) { return p[i][1]; })) - 8 + 'px';
        }
        hit.addEventListener('pointermove', hover); hit.addEventListener('pointerdown', hover);
        hit.addEventListener('pointerleave', function () { st.cross.style.opacity = 0; st.dots.forEach(function (d) { d.style.opacity = 0; }); st.tip.classList.remove('is-on'); });
        st.pts = targets.map(function (t) { return t.map(function (p) { return [p[0], Hh - B]; }); });
        o.intro = true;
      }
      st.gGrid.innerHTML = '';
      for (var g = 0; g <= 4; g++) {
        var yy = T + g / 4 * (Hh - T - B);
        S('line', { class: 'cd-gridline', x1: L, x2: W - R, y1: yy, y2: yy }, st.gGrid);
        S('text', { class: 'cd-axis', x: L - 8, y: yy + 3.5, 'text-anchor': 'end' }, st.gGrid).textContent = fmtK(max * (1 - g / 4));
      }
      var step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor((W - L) / 70))));
      for (var i = 0; i < n; i += step) S('text', { class: 'cd-axis', x: X(i), y: Hh - 6, 'text-anchor': 'middle' }, st.gGrid).textContent = o.xlabel(i);
      var from = st.pts, Wd = W;
      kill(st.tw); kill(st.ctw);
      function paint(pts) {
        st.pts = pts;
        pts.forEach(function (p, j) { st.lines[j].setAttribute('d', smooth(p)); });
        st.area.setAttribute('d', smooth(pts[0]) + 'L' + pts[0][n - 1][0] + ' ' + (st.Hh - st.B) + 'L' + pts[0][0][0] + ' ' + (st.Hh - st.B) + 'Z');
      }
      if (o.intro) {
        paint(targets);
        st.ctw = E.add(o.introDur || 1300, function (e) { st.cr.setAttribute('width', e * Wd); }, { ease: eIO, delay: o.delay || 0 });
      } else {
        st.cr.setAttribute('width', Wd);
        st.tw = E.add(800, function (e) { paint(targets.map(function (t, j) { return t.map(function (p, i) { return [p[0], lerp(from[j][i][1], p[1], e)]; }); })); }, { ease: eIO });
      }
    }
    function drawReach(intro) {
      var box = $(root, '[data-cd-reach]'); if (!box) return;
      lineChart(box, 'reach', [{ vals: D.reach, color: 'var(--cadence-cyan)' }, { vals: D.reachPrev, color: 'var(--cadence-muted)', dash: true }], {
        label: 'Reach over the last 30 days', h: 236, rebuild: intro,
        xlabel: function (i) { var x = new Date(2026, 10, 5 - 29 + i); return x.getDate() + ' ' + MONTHS[x.getMonth()]; },
        tip: function (i) { var x = new Date(2026, 10, 5 - 29 + i); return '<span>' + DAYS[(x.getDay() + 6) % 7] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()] + '</span><b>' + fmt(D.reach[i]) + '</b><span>prev. ' + fmt(D.reachPrev[i]) + '</span>'; }
      });
    }
    function drawNetbars(intro) {
      var box = $(root, '[data-cd-netbars]'); if (!box) return;
      var mx = Math.max.apply(null, D.nets.map(function (n) { return n.eng; }));
      if (!box.children.length) box.innerHTML = D.nets.slice().sort(function (a, b) { return b.eng - a.eng; }).map(function (n) {
        return '<div class="cd-netbar" style="--c:var(--cadence-' + n.id + ')" data-n="' + n.id + '"><div class="cd-netbar-name">' + netBadge(n) + '<div class="cd-netbar-meta"><span>' + esc(n.name) + '</span><small>' + fmtK(n.followers) + ' followers</small></div></div>' +
          '<div class="cd-bar"><i></i></div><b>' + n.eng.toFixed(1) + '%</b></div>';
      }).join('');
      $$(box, '.cd-netbar').forEach(function (row, i) {
        var n = NET[row.getAttribute('data-n')], bar = $(row, 'i'), w = n.eng / mx * 100;
        kill(bar._tw); bar._tw = E.add(intro ? 900 : 0, function (e) { bar.style.width = (w * e) + '%'; }, { delay: 200 + i * 80, ease: eBack });
      });
    }
    function drawHeat(intro) {
      var box = $(root, '[data-cd-heat]'); if (!box) return;
      var best = [0, 0, -1];
      D.heat.forEach(function (row, y) { row.forEach(function (v, x) { if (v > best[2]) best = [y, x, v]; }); });
      if (!box.children.length) {
        var h = '<span></span>';
        for (var x = 0; x < 8; x++) { var hr = 7 + x * 2; h += '<span>' + (hr % 12 || 12) + (hr < 12 ? 'a' : 'p') + '</span>'; }
        D.heat.forEach(function (row, y) {
          h += '<span>' + DAYS[y] + '</span>';
          row.forEach(function (v, x) { var hr = 7 + x * 2; h += '<i style="--v:' + (.06 + v * .94).toFixed(2) + '" class="' + (y === best[0] && x === best[1] ? 'is-best' : '') + '" title="' + LONGDAYS[y] + ', ' + fmtT(hr) + ': ' + Math.round(v * 100) + ' activity"></i>'; });
        });
        box.innerHTML = h;
      }
      $$(box, 'i').forEach(function (c, k) {
        var x = k % 8, y = Math.floor(k / 8);
        kill(c._tw); c._tw = E.add(intro ? 500 : 0, function (e) { c.style.opacity = e; c.style.transform = 'scale(' + (.6 + .4 * e) + ')'; }, { delay: 150 + (x + y) * 45, ease: eBack });
      });
    }
    function drawFeed(intro) {
      var box = $(root, '[data-cd-feed]'); if (!box) return;
      var icon = function (p) { return '<svg class="cd-ic" viewBox="0 0 24 24">' + p + '</svg>'; };
      var list = D.published.slice().sort(function (a, b) { return a.ago - b.ago; }).slice(0, 4);
      box.innerHTML = list.map(function (p) {
        var likes = Math.round(p.reach * p.eng / 100 * .8);
        return '<figure class="cd-tile" style="--g:' + GRADS[p.g] + '">' + netBadge(NET[p.net]) + '<figcaption><p>' + esc(p.text) + '</p><div><span>' + icon('<path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.8C19 14.7 12 19 12 19z"/>') + fmtK(likes) + '</span><span>' +
          icon('<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>') + fmtK(p.reach) + '</span></div></figcaption></figure>';
      }).join('');
      $$(box, '.cd-tile').forEach(function (t, i) {
        if (!intro) return; t.style.opacity = 0;
        E.add(560, function (e) { t.style.opacity = Math.min(1, e * 1.6); t.style.transform = 'translateY(' + (16 * (1 - e)) + 'px) scale(' + (.92 + .08 * e) + ')'; }, { delay: 260 + i * 90, ease: eBack, done: function () { t.style.transform = ''; } });
      });
    }
    function upcoming() {
      return D.posts.filter(function (p) { return p.w >= 0 && !isPast(p); }).sort(function (a, b) { return (a.w * 7 + a.day + a.t / 24) - (b.w * 7 + b.day + b.t / 24); });
    }
    function drawNext(intro) {
      var box = $(root, '[data-cd-next]'); if (!box) return;
      box.innerHTML = upcoming().slice(0, 4).map(function (p) {
        var when = p.w === 0 && p.day === D.today ? 'Today' : p.w === 0 && p.day === D.today + 1 ? 'Tomorrow' : dlabel(p.w, p.day);
        return '<li><span class="cd-thumb" style="--g:' + GRADS[p.g] + '"></span><div style="min-width:0"><p>' + esc(p.text) + '</p><small><span class="cd-nets">' + p.nets.map(function (n) { return netBadge(NET[n]); }).join('') + '</span>' + when + ', ' + fmtT(p.t) + '</small></div></li>';
      }).join('');
      $$(box, 'li').forEach(function (li, i) { li.style.opacity = 0; E.add(intro ? 500 : 0, function (e) { li.style.opacity = e; li.style.transform = 'translateX(' + (14 * (1 - e)) + 'px)'; }, { delay: 250 + i * 90 }); });
    }
    var topSort = { key: 'eng', dir: -1 };
    function drawTop() {
      var tb = $(root, '[data-cd-top] tbody'); if (!tb) return;
      var rows = D.top.filter(function (p) { return matches(p.text); }).sort(function (a, b) { return (a[topSort.key] - b[topSort.key]) * topSort.dir; });
      var mx = Math.max.apply(null, D.top.map(function (p) { return p.eng; }));
      tb.innerHTML = rows.length ? rows.map(function (p) {
        return '<tr><td><div class="cd-post"><span class="cd-thumb" style="--g:' + GRADS[p.g] + '"></span><div style="min-width:0"><p>' + esc(p.text) + '</p><small>' + p.date + '</small></div></div></td>' +
          '<td><span class="cd-nets">' + p.nets.map(function (n) { return netBadge(NET[n]); }).join('') + '</span></td><td class="cd-r">' + fmtK(p.reach) + '</td>' +
          '<td class="cd-r"><div class="cd-meter">' + p.eng.toFixed(1) + '%<span><i style="width:' + (p.eng / mx * 100) + '%"></i></span></div></td><td class="cd-r">' + fmt(p.saves) + '</td></tr>';
      }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--cadence-muted);padding:22px">No posts match “' + esc(query) + '”</td></tr>';
      $$(root, '[data-cd-top] th[data-sort]').forEach(function (th) { if (th.getAttribute('data-sort') === topSort.key) th.setAttribute('aria-sort', topSort.dir < 0 ? 'descending' : 'ascending'); else th.removeAttribute('aria-sort'); });
    }
    $$(root, '[data-cd-top] th[data-sort] button').forEach(function (b) {
      on(b, 'click', function () { var k = b.parentNode.getAttribute('data-sort'); topSort = { key: k, dir: topSort.key === k ? -topSort.dir : -1 }; drawTop(); });
    });

    /* ----- planner ----- */
    var ROW0 = 7, ROWS = 16;
    function rowH() { var c = $(root, '[data-cd-cal]'); return c ? parseFloat(getComputedStyle(c).getPropertyValue('--row')) || 46 : 46; }
    function drawFilters() {
      var box = $(root, '[data-cd-filters]'); if (!box) return;
      box.innerHTML = D.nets.map(function (n) { return '<button type="button" class="cd-filter" data-n="' + n.id + '" aria-pressed="' + visibleNets[n.id] + '">' + netBadge(n) + esc(n.name) + '</button>'; }).join('');
    }
    on($(root, '[data-cd-filters]'), 'click', function (e) {
      var b = e.target.closest('[data-n]'); if (!b) return;
      var id = b.getAttribute('data-n'); visibleNets[id] = !visibleNets[id]; b.setAttribute('aria-pressed', String(visibleNets[id])); drawCal();
    });
    $$(root, '[data-cd-week]').forEach(function (b) { on(b, 'click', function () { week = clamp(week + +b.getAttribute('data-cd-week'), -1, 1); drawCal(true); }); });
    function chipHTML(p) {
      var st = isPast(p) ? 'is-done' : p.status === 'review' ? 'is-review' : '';
      return '<div class="cd-chip ' + st + '" tabindex="0" role="button" data-id="' + p.id + '" style="--c:var(--cadence-' + p.nets[0] + ')" aria-label="' + esc(dlabel(p.w, p.day, true) + ', ' + fmtT(p.t) + ', ' + p.nets.map(function (n) { return NET[n].name; }).join(' and ') + ': ' + p.text + '. Arrow keys move it.') + '">' +
        '<b><span>' + fmtT(p.t) + '</span><span class="cd-nets">' + p.nets.map(function (n) { return netBadge(NET[n]); }).join('') + '</span></b><p>' + esc(p.text) + '</p></div>';
    }
    function layoutDay(list) {
      list.sort(function (a, b) { return a.t - b.t; });
      var groups = [], g = null;
      list.forEach(function (p) { if (g && p.t < g.end) { g.items.push(p); g.end = Math.max(g.end, p.t + 1.6); } else { g = { items: [p], end: p.t + 1.6 }; groups.push(g); } });
      groups.forEach(function (gr) { gr.items.forEach(function (p, i) { p._col = i; p._cols = gr.items.length; }); });
    }
    function drawCal(animate) {
      var cal = $(root, '[data-cd-cal]'); if (!cal) return;
      var R = rowH(), lbl = $(root, '[data-cd-weeklabel]');
      if (lbl) { var a = date(week, 0), b = date(week, 6); lbl.textContent = a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MONTHS[a.getMonth()] : '') + ' – ' + b.getDate() + ' ' + MONTHS[b.getMonth()]; }
      var h = '<div class="cd-cal-h"></div>';
      for (var d = 0; d < 7; d++) h += '<div class="cd-cal-h' + (week === 0 && d === D.today ? ' is-today' : '') + '"><small>' + DAYS[d] + '</small><b>' + date(week, d).getDate() + '</b></div>';
      h += '<div class="cd-cal-times">'; for (var r = 0; r < ROWS; r++) h += '<span>' + (r ? fmtT(ROW0 + r).replace(':00', '') : '') + '</span>'; h += '</div>';
      for (d = 0; d < 7; d++) h += '<div class="cd-cal-col' + (week === 0 && d === D.today ? ' is-today' : '') + '" data-day="' + d + '" style="grid-column:' + (d + 2) + ';height:' + (ROWS * R) + 'px"></div>';
      cal.innerHTML = h;
      var cols = $$(cal, '.cd-cal-col');
      for (d = 0; d < 7; d++) {
        var list = D.posts.filter(function (p) { return p.w === week && p.day === d; });
        layoutDay(list);
        list.forEach(function (p) {
          cols[d].insertAdjacentHTML('beforeend', chipHTML(p));
          var el = cols[d].lastChild, w = 100 / p._cols;
          el.style.top = ((p.t - ROW0) * R + 2) + 'px'; el.style.height = (R * 1.6 - 4) + 'px';
          if (p._cols > 1) { el.style.left = 'calc(' + (p._col * w) + '% + 4px)'; el.style.right = 'auto'; el.style.width = 'calc(' + w + '% - 6px)'; }
          var vis = p.nets.some(function (n) { return visibleNets[n]; }) && matches(p.text);
          el.classList.toggle('is-hidden', !vis);
          if (p._new) el.classList.add('is-new');
        });
      }
      if (week === 0) { var nl = H('div', 'cd-now', '', cols[D.today]); nl.style.top = ((D.now - ROW0) * R) + 'px'; }
      if (animate) $$(cal, '.cd-chip').forEach(function (c, i) {
        var col = +c.parentNode.getAttribute('data-day'); c.style.opacity = 0;
        E.add(420, function (e) { c.style.opacity = e; c.style.transform = 'translateY(' + (10 * (1 - e)) + 'px) scale(' + (.94 + .06 * e) + ')'; }, { delay: 80 + col * 55 + i * 12, ease: eBack, done: function () { c.style.transform = ''; } });
      });
      var foot = $(root, '[data-cd-planfoot]');
      if (foot) {
        var wk = D.posts.filter(function (p) { return p.w === week; }), done = wk.filter(isPast).length, rev = wk.filter(function (p) { return p.status === 'review' && !isPast(p); }).length;
        var byNet = {}; wk.forEach(function (p) { p.nets.forEach(function (n) { byNet[n] = (byNet[n] || 0) + 1; }); });
        var topN = Object.keys(byNet).sort(function (a, b) { return byNet[b] - byNet[a]; })[0];
        foot.innerHTML = '<span><b>' + (wk.length - done) + '</b> scheduled</span><span><b>' + done + '</b> published</span><span><b>' + rev + '</b> waiting for approval</span>' + (topN ? '<span>Busiest channel: <b>' + NET[topN].name + '</b></span>' : '');
      }
    }
    function flip(id, from) {
      var el = $(root, '.cd-chip[data-id="' + id + '"]'); if (!el || !from) return;
      var to = el.getBoundingClientRect(), k = scaleK(), dx = (from.left - to.left) / k, dy = (from.top - to.top) / k;
      el.classList.add('is-new');
      E.add(520, function (e) { el.style.transform = 'translate(' + (dx * (1 - e)) + 'px,' + (dy * (1 - e)) + 'px)'; }, { ease: eBack, done: function () { el.style.transform = ''; } });
      E.add(1, function () { }, { delay: 1400, done: function () { el.classList.remove('is-new'); var p = find(id); if (p) p._new = false; } });
    }
    function find(id) { for (var i = 0; i < D.posts.length; i++) if (D.posts[i].id === id) return D.posts[i]; }
    function movePost(p, day, t, fromRect) {
      p.day = clamp(day, 0, 6); p.t = clamp(t, ROW0, ROW0 + ROWS - 1.5);
      drawCal(); flip(p.id, fromRect); counts();
      var c = $(root, '.cd-chip[data-id="' + p.id + '"]'); if (c && c._focus !== false) c.focus({ preventScroll: true });
      if (opts.onMove) opts.onMove(p);
    }
    (function dragging() {
      var cal = $(root, '[data-cd-cal]'); if (!cal) return;
      var drag = null;
      on(cal, 'pointerdown', function (e) {
        var c = e.target.closest('.cd-chip'); if (!c || e.button) return;
        var p = find(c.getAttribute('data-id')); if (!p || isPast(p)) return;
        drag = { c: c, p: p, x: e.clientX, y: e.clientY, k: scaleK(), moved: false, id: e.pointerId };
        c.setPointerCapture(e.pointerId);
      });
      on(cal, 'pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = (e.clientX - drag.x) / drag.k, dy = (e.clientY - drag.y) / drag.k;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
        drag.moved = true; drag.c.classList.add('is-drag');
        drag.c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + clamp(dx / 40, -3, 3) + 'deg)';
        var cols = $$(cal, '.cd-cal-col'), day = drag.p.day;
        cols.forEach(function (col, i) { var r = col.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX < r.right) day = i; });
        var R = rowH(), t = clamp(Math.round((drag.p.t + dy / R) * 2) / 2, ROW0, ROW0 + ROWS - 1.5);
        cols.forEach(function (col, i) { col.classList.toggle('is-target', i === day); });
        drag.day = day; drag.t = t; $(drag.c, 'b span').textContent = DAYS[day] + ' ' + fmtT(t);
      });
      function end(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        $$(cal, '.cd-cal-col').forEach(function (col) { col.classList.remove('is-target'); });
        if (!d.moved) return;
        var from = d.c.getBoundingClientRect();
        if (d.day == null) { d.day = d.p.day; d.t = d.p.t; }
        movePost(d.p, d.day, d.t, from);
        toast('Moved to <b>' + dlabel(week, d.p.day) + ', ' + fmtT(d.p.t) + '</b>');
      }
      on(cal, 'pointerup', end); on(cal, 'pointercancel', end);
      on(cal, 'keydown', function (e) {
        var c = e.target.closest('.cd-chip'); if (!c) return;
        var p = find(c.getAttribute('data-id')); if (!p || isPast(p)) return;
        var map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -.5], ArrowDown: [0, .5] }, m = map[e.key];
        if (!m) return; e.preventDefault();
        movePost(p, p.day + m[0], p.t + m[1], c.getBoundingClientRect());
      });
    })();

    /* ----- compose ----- */
    var C = { nets: [], text: '', media: [], day: D.today + 1, t: 19, tab: null, typing: null, busy: false };
    function loadDraft(d, typeIt) {
      C.nets = d.nets.slice(); C.media = d.media.slice(); C.day = d.day; C.t = d.t; C.tab = C.nets[0];
      drawNetpick(); drawMedia(); drawSchedSelects();
      var ta = $(root, '[data-cd-text]'); kill(C.typing);
      if (typeIt && !mq.matches) {
        var full = d.text; C.text = '';
        C.typing = E.add(full.length * 11, function (e) { var s = full.slice(0, Math.round(full.length * e)); if (s !== C.text) { C.text = s; if (ta) ta.value = s; drawPreview(); drawRings(); } }, { ease: lin, delay: 150 });
      } else { C.text = d.text; if (ta) ta.value = C.text; }
      drawPreview(); drawRings(); drawTags();
    }
    function drawWeekStrip() {
      var box = $(root, '[data-cd-week-strip]'); if (!box) return;
      if (!box.children.length) {
        var h = '';
        for (var d = 0; d < 7; d++) h += '<div class="cd-day' + (d === D.today ? ' is-today' : '') + '" data-day="' + d + '"><div class="cd-day-top"><small>' + DAYS[d] + '</small><b class="cd-num">0</b></div><div class="cd-day-dots"></div><span class="cd-day-ring"></span></div>';
        box.innerHTML = h;
      }
      $$(box, '.cd-day').forEach(function (cell) {
        var d = +cell.getAttribute('data-day'), list = D.posts.filter(function (p) { return p.w === 0 && p.day === d; });
        var b = $(cell, 'b'); b.textContent = list.length; b._v = list.length;
        cell.classList.toggle('is-pick', d === C.day);
        $(cell, '.cd-day-dots').innerHTML = list.slice(0, 12).map(function (p) { return '<i style="--c:var(--cadence-' + p.nets[0] + ')' + (isPast(p) ? ';opacity:.4' : '') + '"></i>'; }).join('');
      });
    }
    function drawNetpick() {
      var box = $(root, '[data-cd-netpick]'); if (!box) return;
      box.innerHTML = D.nets.map(function (n) { return '<button type="button" data-n="' + n.id + '" style="--c:var(--cadence-' + n.id + ')" aria-pressed="' + (C.nets.indexOf(n.id) > -1) + '">' + netBadge(n) + esc(n.name) + '</button>'; }).join('');
    }
    on($(root, '[data-cd-netpick]'), 'click', function (e) {
      var b = e.target.closest('[data-n]'); if (!b) return;
      var id = b.getAttribute('data-n'), i = C.nets.indexOf(id);
      if (i > -1) C.nets.splice(i, 1); else C.nets.push(id);
      b.setAttribute('aria-pressed', String(i < 0));
      var badge = $(b, '.cd-net'); E.add(380, function (e2) { badge.style.transform = 'scale(' + (1 + .25 * Math.sin(e2 * Math.PI)) + ')'; }, { ease: lin });
      if (C.nets.indexOf(C.tab) < 0) C.tab = C.nets[0] || null;
      drawPreview(); drawRings();
    });
    on($(root, '[data-cd-text]'), 'input', function (e) { kill(C.typing); C.text = e.target.value; drawPreview(); drawRings(); });
    function drawMedia() {
      var box = $(root, '[data-cd-media]'); if (!box) return;
      box.innerHTML = C.media.map(function (g, i) { return '<figure style="--g:' + GRADS[g] + '"><button type="button" class="cd-x" data-i="' + i + '" aria-label="Remove image ' + (i + 1) + '"><svg class="cd-ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></figure>'; }).join('') +
        (C.media.length < 4 ? '<button type="button" class="cd-add" aria-label="Add image"><svg class="cd-ic" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></button>' : '');
    }
    on($(root, '[data-cd-media]'), 'click', function (e) {
      var x = e.target.closest('.cd-x'), a = e.target.closest('.cd-add');
      if (x) C.media.splice(+x.getAttribute('data-i'), 1);
      else if (a) C.media.push((C.media.length * 3 + C.text.length) % GRADS.length);
      else return;
      drawMedia(); drawPreview();
    });
    function drawTags() {
      var box = $(root, '[data-cd-tags]'); if (!box) return;
      box.innerHTML = D.tags.map(function (t) { return '<button type="button" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
    }
    on($(root, '[data-cd-tags]'), 'click', function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return;
      var t = b.getAttribute('data-t'), ta = $(root, '[data-cd-text]'); kill(C.typing);
      if (C.text.indexOf(t) < 0) { C.text = C.text.replace(/\s*$/, '') + ' ' + t; if (ta) ta.value = C.text; drawPreview(); drawRings(); }
    });
    function drawRings() {
      var box = $(root, '[data-cd-rings]'); if (!box) return;
      var len = C.text.length;
      box.innerHTML = C.nets.filter(function (n) { return NET[n].limit < 10000; }).map(function (id) {
        var n = NET[id], u = len / n.limit, c = 2 * Math.PI * 12, left = n.limit - len;
        return '<span class="cd-ring' + (u > 1 ? ' is-over' : '') + '" style="--c:var(--cadence-' + id + ')" title="' + esc(n.name) + ': ' + left + ' characters left"><svg viewBox="0 0 30 30"><circle class="cd-ring-bg" cx="15" cy="15" r="12"/><circle class="cd-ring-fg" cx="15" cy="15" r="12" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - Math.min(1, u))).toFixed(1) + '"/></svg><span>' + (u > .8 ? left : n.short) + '</span></span>';
      }).join('');
    }
    function drawSchedSelects() {
      var ds = $(root, '[data-cd-day]'), ts = $(root, '[data-cd-time]'); if (!ds || !ts) return;
      var h = ''; for (var d = D.today; d < 7; d++) h += '<option value="' + d + '"' + (d === C.day ? ' selected' : '') + '>' + (d === D.today ? 'Today' : d === D.today + 1 ? 'Tomorrow' : DAYS[d]) + ', ' + date(0, d).getDate() + ' ' + MONTHS[date(0, d).getMonth()] + '</option>';
      ds.innerHTML = h;
      h = ''; for (var t = 7; t <= 22.5; t += .5) h += '<option value="' + t + '"' + (t === C.t ? ' selected' : '') + '>' + fmtT(t) + '</option>';
      ts.innerHTML = h;
      drawBest(); drawWeekStrip();
    }
    function bestFor(d) { var row = D.heat[d], bx = 0; row.forEach(function (v, x) { if (v > row[bx]) bx = x; }); return 7 + bx * 2; }
    function drawBest() {
      var b = $(root, '[data-cd-best]'); if (!b) return;
      var t = bestFor(C.day);
      b.innerHTML = '<svg class="cd-ic" viewBox="0 0 24 24"><path d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.4l-4.9 2.8 1.1-5.4-4-3.7 5.4-.6z"/></svg>' + (t === C.t ? 'Best time for ' + DAYS[C.day] : '<span>Best: </span><button type="button" data-cd-usebest>' + fmtT(t) + '</button>');
    }
    on($(root, '[data-cd-day]'), 'change', function (e) { C.day = +e.target.value; drawBest(); drawWeekStrip(); });
    on($(root, '[data-cd-time]'), 'change', function (e) { C.t = +e.target.value; drawBest(); });
    on($(root, '[data-cd-best]'), 'click', function (e) { if (!e.target.closest('[data-cd-usebest]')) return; C.t = bestFor(C.day); drawSchedSelects(); });
    function richText(s, cut) {
      var more = '';
      if (cut && s.length > cut) { s = s.slice(0, cut).replace(/\s+\S*$/, ''); more = '<span class="cd-more">… more</span>'; }
      return esc(s).replace(/(#[\w]+)/g, '<span class="cd-hash">$1</span>') + more;
    }
    function drawPreview() {
      var tabs = $(root, '[data-cd-ptabs]'), box = $(root, '[data-cd-preview]'); if (!box) return;
      if (tabs) tabs.innerHTML = C.nets.map(function (id) { var n = NET[id]; return '<button type="button" role="tab" data-n="' + id + '" aria-selected="' + (id === C.tab) + '">' + netBadge(n) + esc(n.name) + '</button>'; }).join('');
      if (!C.tab) { box.innerHTML = '<p style="color:var(--cadence-muted);font-size:13px;padding:20px;text-align:center">Pick at least one channel to see a preview.</p>'; return; }
      var n = NET[C.tab], m = C.media, txt = C.text || 'Your post text shows up here.';
      var shown = n.id === 'ig' || n.id === 'tt' ? 1 : Math.min(m.length, 2);
      var media = m.length ? '<div class="cd-pv-media" style="--n:' + shown + ';--ar:' + ({ ig: 1, tt: .8, yt: 1.78, x: 1.6, li: 1.5, fb: 1.5 }[n.id]) + '">' + m.slice(0, n.id === 'ig' || n.id === 'tt' ? 1 : 2).map(function (g) { return '<i style="--g:' + GRADS[g] + '"></i>'; }).join('') + '</div>' : '';
      var head = '<div class="cd-pv-head"><i style="background:' + LOGO + '"></i><div><b>' + esc(n.id === 'li' || n.id === 'fb' || n.id === 'yt' ? D.company : n.handle) + '</b><small>' + (n.id === 'li' ? '12,840 followers · Scheduled' : n.id === 'x' ? n.handle + ' · ' + fmtT(C.t) : 'Scheduled · ' + DAYS[C.day] + ' ' + fmtT(C.t)) + '</small></div>' + netBadge(n) + '</div>';
      var icon = function (p) { return '<svg class="cd-ic" viewBox="0 0 24 24">' + p + '</svg>'; };
      var heart = icon('<path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 2.8C19 14.7 12 19 12 19z"/>'), comm = icon('<path d="M5 5.5h14v10H9.5L5 19.5z"/>'),
        rep = icon('<path d="M7 7.5h10.5l-2.5-2.5M17 16.5H6.5L9 19M7 7.5v3M17 16.5v-3"/>'), send = icon('<path d="M4 12l16-7-6 16-3-6z"/>');
      var acts = n.id === 'li' ? '<div class="cd-pv-acts"><span>' + heart + 'Like</span><span>' + comm + 'Comment</span><span>' + rep + 'Repost</span><span>' + send + 'Send</span></div>'
        : n.id === 'x' ? '<div class="cd-pv-acts"><span>' + comm + '0</span><span>' + rep + '0</span><span>' + heart + '0</span></div>'
          : '<div class="cd-pv-acts"><span>' + heart + '</span><span>' + comm + '</span><span>' + send + '</span></div>';
      var body;
      if (n.id === 'ig' || n.id === 'tt') body = head + media + acts + '<div class="cd-pv-text"><b>' + esc(n.handle.replace('@', '')) + '</b> ' + richText(txt, 125) + '</div>';
      else if (n.id === 'x') body = '<div class="cd-pv cd-pv--x">' + head + '<div class="cd-pv-text">' + richText(txt.slice(0, 280)) + '</div>' + media + acts + '</div>';
      else body = head + '<div class="cd-pv-text">' + richText(txt, n.id === 'li' ? 210 : 0) + '</div>' + media + acts;
      if (n.id !== 'x') body = '<div class="cd-pv">' + body + '</div>';
      var over = C.text.length - n.limit;
      body += over > 0 ? '<p class="cd-pv-note is-warn"><svg class="cd-ic" viewBox="0 0 24 24"><path d="M12 4l9 16H3zM12 10v4M12 17v.5"/></svg>' + over + ' characters over the ' + n.name + ' limit</p>'
        : '<p class="cd-pv-note"><svg class="cd-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-4.8"/></svg>Looks good on ' + n.name + ' · ' + (n.limit - C.text.length) + ' characters left</p>';
      box.innerHTML = body;
    }
    on($(root, '[data-cd-ptabs]'), 'click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; C.tab = b.getAttribute('data-n'); drawPreview(); });
    on($(root, '[data-cd-draft]'), 'click', function () { toast('Draft saved'); });
    on($(root, '[data-cd-schedule]'), 'click', function () { schedule(); });

    // The hero moment: the post lifts off the preview, flies along an arc into its day and lands with a pulse.
    function schedule() {
      if (C.busy) return false;
      if (!C.text.trim() || !C.nets.length) { toast(C.nets.length ? 'Write something first' : 'Pick at least one channel'); return false; }
      var p = { id: 'a' + (++added), w: 0, day: C.day, t: C.t, nets: C.nets.slice(), text: C.text.trim(), g: C.media.length ? C.media[0] : 4, status: '', _new: true };
      var cell = $(root, '[data-cd-week-strip] .cd-day[data-day="' + p.day + '"]');
      var src = $(root, '[data-cd-preview] .cd-pv'), vh = window.innerHeight || 800;
      if (!src || src.getBoundingClientRect().top > vh - 120 || src.getBoundingClientRect().bottom < 60) src = $(root, '[data-cd-composer] .cd-editor') || $(root, '[data-cd-composer]');
      var label = DAYS[p.day] + ' ' + fmtT(p.t) + ' · ' + p.nets.map(function (n) { return NET[n].name; }).join(', ');
      function commit() {
        D.posts.push(p); counts(); drawWeekStrip(); drawNext(false);
        if (opts.onSchedule) opts.onSchedule(p);
        root.dispatchEvent(new CustomEvent('cadence:schedule', { bubbles: true, detail: p }));
      }
      if (page !== 'compose' || !cell || !src || mq.matches) {
        commit(); toast('Scheduled for <b>' + esc(label) + '</b>'); nextDraft(); return true;
      }
      C.busy = true;
      var k = scaleK(), rr = root.getBoundingClientRect(), sr = src.getBoundingClientRect(), cr = cell.getBoundingClientRect();
      function rel(x, y) { return [(x - rr.left) / k, (y - rr.top) / k]; }
      var fl = H('div', 'cd-flight', '<span class="cd-thumb" style="--g:' + GRADS[p.g] + '"></span><span class="cd-nets">' + p.nets.map(function (n) { return netBadge(NET[n]); }).join('') + '</span><span>' + esc(p.text.slice(0, 30).replace(/\s+\S*$/, '')) + '…</span>', root);
      fl.style.position = 'absolute';
      var fw = fl.offsetWidth, fh = fl.offsetHeight;
      var A = rel(sr.left + sr.width / 2, sr.top + sr.height * .42), B = rel(cr.left + cr.width / 2, cr.top + cr.height * .62);
      var Cc = [lerp(A[0], B[0], .5) + (B[0] < A[0] ? -90 : 90), Math.min(A[1], B[1]) - 170];
      var s0 = clamp(sr.width / k / fw, .95, 1.35), s1 = clamp(cr.width / k / fw, .5, .66);
      src.style.transition = 'none';
      E.add(240, function (e) { src.style.transform = 'scale(' + (1 - .04 * e) + ')'; src.style.opacity = 1 - .55 * e; });
      var trail = [], lastDot = 0;
      fl.style.opacity = 0;
      E.add(1250, function (e, raw) {
        var u = e, x = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * Cc[0] + u * u * B[0], y = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * Cc[1] + u * u * B[1];
        var sc = lerp(s0, s1, eOut(Math.min(1, u * 1.25))), rot = Math.sin(u * Math.PI) * (B[0] < A[0] ? -8 : 8);
        fl.style.opacity = Math.min(1, raw * 6) * (u > .96 ? (1 - u) / .04 : 1);
        fl.style.transform = 'translate(' + (x - fw * sc / 2) + 'px,' + (y - fh * sc / 2) + 'px) scale(' + sc + ') rotate(' + rot + 'deg)';
        var tn = now();
        if (raw > .08 && raw < .97 && tn - lastDot > 26) {
          lastDot = tn;
          var dot = H('i', 'cd-trail', '', root); dot.style.position = 'absolute'; dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
          trail.push(dot);
          E.add(520, function (f) { dot.style.opacity = (1 - f) * .9; dot.style.transform = 'translate(' + x + 'px,' + (y + f * 6) + 'px) scale(' + (1 - f * .8) + ')'; }, { ease: lin, done: function () { dot.remove(); } });
        }
      }, {
        delay: 160, ease: eIO, done: function () {
          fl.remove(); commit(); land(cell, p);
          E.add(360, function (e) { src.style.transform = 'scale(' + (.96 + .04 * e) + ')'; src.style.opacity = .45 + .55 * e; }, { done: function () { src.style.transform = ''; src.style.opacity = ''; src.style.transition = ''; } });
          toast('Scheduled for <b>' + esc(label) + '</b>');
          E.add(1, function () { }, { delay: 380, done: function () { C.busy = false; nextDraft(true); } });
        }
      });
      return true;
    }
    function land(cell, p) {
      var ring = $(cell, '.cd-day-ring'), b = $(cell, 'b');
      E.add(700, function (e) { ring.style.opacity = 1 - e; ring.style.transform = 'scale(' + (1 + .12 * e) + ')'; }, { ease: eOut });
      E.add(520, function (e, raw) { cell.style.transform = 'translateY(' + (-6 * Math.sin(raw * Math.PI) * (1 - raw * .4)) + 'px) scale(' + (1 + .05 * Math.sin(raw * Math.PI)) + ')'; }, { ease: lin, done: function () { cell.style.transform = ''; } });
      var n = +b.textContent; b._v = n - 1; roll(b, n, function (v) { return Math.round(v); }, 450);
      E.add(480, function (e, raw) { b.style.transform = 'scale(' + (1 + .5 * Math.sin(raw * Math.PI) * (1 - raw * .5)) + ')'; b.style.color = raw < 1 ? 'var(--cadence-cyan)' : ''; }, { ease: lin, done: function () { b.style.transform = ''; } });
      var dots = $$(cell, '.cd-day-dots i'), last = dots[dots.length - 1];
      if (last) { last.style.transform = 'scale(0)'; E.add(520, function (e) { last.style.transform = 'scale(' + e + ')'; last.style.boxShadow = '0 0 0 ' + (4 * (1 - e)) + 'px rgba(34,195,238,.5)'; }, { delay: 80, ease: eBack }); }
    }
    function nextDraft(typeIt) { draftI = (draftI + 1) % D.drafts.length; loadDraft(D.drafts[draftI], typeIt); }

    /* ----- inbox ----- */
    var I = { f: 'all', cur: D.threads[0].id };
    function drawMsgs() {
      var ul = $(root, '[data-cd-msgs]'); if (!ul) return;
      var list = D.threads.filter(function (t) { return I.f === 'all' || t.type === I.f; });
      ul.innerHTML = list.map(function (t) {
        var last = t.msgs[t.msgs.length - 1];
        return '<li><button type="button" data-id="' + t.id + '" aria-current="' + (t.id === I.cur) + '"' + (t.unread ? ' class="cd-unread"' : '') + '><span class="cd-who" style="--g:' + avatar(t.g + t.name.length) + '">' + netBadge(NET[t.net]) + '</span>' +
          '<span style="min-width:0"><span class="cd-msg-top"><b>' + esc(t.name) + '</b><small>' + t.time + '</small></span><span class="cd-msg-body">' + (last.me ? 'You: ' : '') + esc(last.text) + '</span>' +
          '<span class="cd-msg-tags"><span class="cd-tag" style="--c:var(--cadence-muted)">' + { dm: 'Message', comment: 'Comment', mention: 'Mention' }[t.type] + '</span><span class="cd-tag" style="--c:' + t.tagc + '">' + t.tag + '</span></span></span></button></li>';
      }).join('') || '<li style="padding:20px;color:var(--cadence-muted);font-size:13px;text-align:center">Nothing here</li>';
    }
    function thread(id, animate) {
      var t = null; D.threads.forEach(function (x) { if (x.id === id) t = x; }); if (!t) return;
      I.cur = id; t.unread = false;
      var head = $(root, '[data-cd-thead]'), bub = $(root, '[data-cd-bubbles]'), q = $(root, '[data-cd-quick]');
      if (head) head.innerHTML = '<button type="button" class="cd-iconbtn cd-back" data-cd-back aria-label="Back to list"><svg class="cd-ic" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><span class="cd-who" style="--g:' + avatar(t.g + t.name.length) + '">' + netBadge(NET[t.net]) + '</span>' +
        '<div style="min-width:0"><b>' + esc(t.name) + '</b><small>' + { dm: 'Direct message', comment: 'Comment', mention: 'Mention' }[t.type] + ' on ' + NET[t.net].name + '</small></div>' +
        '<div class="cd-thread-acts"><button type="button" class="cd-iconbtn" aria-label="Mark as done" data-cd-done><svg class="cd-ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button><button type="button" class="cd-iconbtn" aria-label="Assign to teammate"><svg class="cd-ic" viewBox="0 0 24 24"><circle cx="10" cy="8.5" r="3.5"/><path d="M4 19.5c.6-3.3 2.9-5 6-5 1.6 0 3 .5 4 1.4M18 14v6M15 17h6"/></svg></button></div>';
      if (bub) {
        bub.innerHTML = t.msgs.map(function (m) { return '<div class="cd-bub' + (m.me ? ' is-me' : '') + '">' + esc(m.text) + '<small>' + m.time + '</small></div>'; }).join('');
        if (animate) $$(bub, '.cd-bub').forEach(function (b, i) { pop(b, i * 90); });
        bub.scrollTop = bub.scrollHeight;
      }
      if (q) q.innerHTML = D.quick.map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('');
      drawMsgs(); counts();
    }
    function pop(b, delay) { b.style.opacity = 0; E.add(420, function (e) { b.style.opacity = Math.min(1, e * 2); b.style.transform = 'scale(' + (.7 + .3 * e) + ')'; }, { delay: delay || 0, ease: eBack, done: function () { b.style.transform = ''; } }); }
    on($(root, '[data-cd-msgs]'), 'click', function (e) { var b = e.target.closest('[data-id]'); if (!b) return; thread(b.getAttribute('data-id'), true); var ib = $(root, '[data-cd-inbox]'); if (ib) ib.classList.add('is-thread'); });
    on($(root, '[data-cd-thead]'), 'click', function (e) {
      if (e.target.closest('[data-cd-back]')) { var ib = $(root, '[data-cd-inbox]'); if (ib) ib.classList.remove('is-thread'); }
      if (e.target.closest('[data-cd-done]')) toast('Marked as done');
    });
    on($(root, '[data-cd-quick]'), 'click', function (e) { var b = e.target.closest('button'); if (!b) return; var inp = $(root, '[data-cd-reply] input'); if (inp) { inp.value = b.textContent; inp.focus(); } });
    on($(root, '[data-cd-reply]'), 'submit', function (e) {
      e.preventDefault();
      var inp = $(e.target, 'input'), v = inp.value.trim(); if (!v) return;
      var t = null; D.threads.forEach(function (x) { if (x.id === I.cur) t = x; });
      t.msgs.push({ me: true, text: v, time: 'Now' }); inp.value = '';
      var bub = $(root, '[data-cd-bubbles]'), b = H('div', 'cd-bub is-me', esc(v) + '<small>Now</small>', bub); pop(b); bub.scrollTop = bub.scrollHeight; drawMsgs();
      var cur = I.cur;
      setTimeout(function () {
        if (I.cur !== cur) return;
        t.msgs.push({ me: false, text: 'Thank you so much!', time: 'Now' });
        var r = H('div', 'cd-bub', 'Thank you so much!<small>Now</small>', bub); pop(r); bub.scrollTop = bub.scrollHeight; drawMsgs();
      }, 1600);
    });
    $$(root, '[data-cd-ifilter] button').forEach(function (b) {
      on(b, 'click', function () { $$(root, '[data-cd-ifilter] button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); I.f = b.getAttribute('data-f'); placeSeg($(root, '[data-cd-ifilter]'), true); drawMsgs(); });
    });

    /* ----- analytics ----- */
    function slice(a, n) { return a.slice(a.length - n); }
    function bucket(a, n) { if (n <= 30) return slice(a, n); var s = slice(a, n), out = []; for (var i = 0; i < s.length; i += 7) out.push(s.slice(i, i + 7).reduce(function (x, y) { return x + y; }, 0)); return out; }
    function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
    function drawAnKpis() {
      var n = range, imp = slice(D.imp, n), eng = slice(D.eng, n), fol = slice(D.fol, n);
      var pImp = D.imp.slice(-2 * n, -n), pEng = D.eng.slice(-2 * n, -n), pFol = D.fol.slice(-2 * n, -n);
      var ch = function (a, b) { return b.length ? (sum(a) / sum(b) - 1) * 100 : 8.4; };
      var rate = sum(eng) / sum(imp) * 100, pRate = pImp.length ? sum(pEng) / sum(pImp) * 100 : rate - .3;
      kpiCards($(root, '[data-cd-kpis="analytics"]'), [
        { id: 'imp', icon: 'imp', label: 'Impressions', c: 'var(--cadence-blue)', v: sum(imp), f: fmtK, d: ch(imp, pImp), df: function (d) { return d.toFixed(1) + '%'; }, note: 'vs previous ' + n + ' days', spark: imp },
        { id: 'eng', icon: 'eng', label: 'Engagements', c: 'var(--cadence-cyan)', v: sum(eng), f: fmtK, d: ch(eng, pEng), df: function (d) { return d.toFixed(1) + '%'; }, note: 'likes, comments, shares', spark: eng },
        { id: 'rate', icon: 'reach', label: 'Engagement rate', c: 'var(--cadence-ig)', v: rate, f: function (v) { return v.toFixed(2) + '%'; }, d: rate - pRate, df: function (d) { return d.toFixed(2) + ' pt'; }, note: 'per impression', spark: eng.map(function (v, i) { return v / imp[i]; }) },
        { id: 'newf', icon: 'newf', label: 'New followers', c: 'var(--cadence-good)', v: sum(fol), f: function (v) { return '+' + fmt(v); }, d: ch(fol, pFol), df: function (d) { return d.toFixed(1) + '%'; }, note: 'net, all channels', spark: fol }
      ]);
    }
    function drawImp() {
      var box = $(root, '[data-cd-imp]'); if (!box) return;
      var imp = bucket(D.imp, range), eng = bucket(D.eng, range), n = imp.length;
      var W = Math.max(260, box.clientWidth), Hh = 230, L = 44, R = 36, T = 12, B = 26, max = niceMax(Math.max.apply(null, imp)), emax = niceMax(Math.max.apply(null, eng));
      var st = charts.imp;
      if (!st || st.W !== W) {
        box.innerHTML = '';
        var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + Hh, width: W, height: Hh, role: 'img', 'aria-label': 'Impressions and engagements' }, box);
        var defs = S('defs', {}, svg), lg = S('linearGradient', { id: 'cdbar' + W, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        S('stop', { offset: 0, 'stop-color': 'var(--cadence-blue)' }, lg); S('stop', { offset: 1, 'stop-color': 'var(--cadence-blue)', 'stop-opacity': .35 }, lg);
        st = charts.imp = { W: W, svg: svg, grid: S('g', {}, svg), bars: S('g', { class: 'cd-bars' }, svg), line: S('path', { class: 'cd-line', stroke: 'var(--cadence-cyan)' }, svg), fill: 'url(#cdbar' + W + ')', h: [], pts: null, tip: H('div', 'cd-tip', '', box) };
        var hit = S('rect', { x: L, y: 0, width: W - L - R, height: Hh, fill: 'transparent' }, svg);
        function hover(e) {
          var r = svg.getBoundingClientRect(), k = r.width / W, x = (e.clientX - r.left) / k, nn = st.n, i = clamp(Math.floor((x - L) / ((W - L - R) / nn)), 0, nn - 1);
          $$(st.bars, 'rect').forEach(function (b, j) { b.style.opacity = j === i ? 1 : .55; });
          var lab = range > 30 ? 'Week of ' + st.lbl(i) : st.lbl(i);
          st.tip.innerHTML = '<span>' + lab + '</span><b>' + fmt(st.imp[i]) + '</b><span>' + fmt(st.eng[i]) + ' engagements</span>';
          st.tip.classList.add('is-on'); st.tip.style.left = clamp(L + (i + .5) * (W - L - R) / nn, 80, W - 80) + 'px'; st.tip.style.top = '40px';
        }
        hit.addEventListener('pointermove', hover); hit.addEventListener('pointerdown', hover);
        hit.addEventListener('pointerleave', function () { $$(st.bars, 'rect').forEach(function (b) { b.style.opacity = ''; }); st.tip.classList.remove('is-on'); });
      }
      st.imp = imp; st.eng = eng; st.n = n;
      st.lbl = function (i) { var x = new Date(2026, 10, 5 - range + 1 + (range > 30 ? i * 7 : i)); return x.getDate() + ' ' + MONTHS[x.getMonth()]; };
      st.grid.innerHTML = '';
      for (var g = 0; g <= 4; g++) {
        var yy = T + g / 4 * (Hh - T - B);
        S('line', { class: 'cd-gridline', x1: L, x2: W - R, y1: yy, y2: yy }, st.grid);
        S('text', { class: 'cd-axis', x: L - 8, y: yy + 3.5, 'text-anchor': 'end' }, st.grid).textContent = fmtK(max * (1 - g / 4));
        S('text', { class: 'cd-axis', x: W - R + 6, y: yy + 3.5 }, st.grid).textContent = fmtK(emax * (1 - g / 4));
      }
      var slot = (W - L - R) / n, bw = Math.max(3, Math.min(26, slot * .62)), every = Math.ceil(n / Math.max(3, Math.floor((W - L) / 64)));
      for (var i = 0; i < n; i += every) S('text', { class: 'cd-axis', x: L + (i + .5) * slot, y: Hh - 6, 'text-anchor': 'middle' }, st.grid).textContent = st.lbl(i);
      var oldH = st.h, oldN = oldH.length; st.bars.innerHTML = '';
      var base = Hh - B, newH = imp.map(function (v) { return v / max * (Hh - T - B); });
      newH.forEach(function (h, j) {
        var x = L + (j + .5) * slot - bw / 2, from = oldN ? oldH[Math.min(oldN - 1, Math.floor((j + .5) / n * oldN))] : 0;
        var rc = S('rect', { x: x, width: bw, rx: Math.min(6, bw / 2), fill: st.fill, y: base - from, height: from }, st.bars);
        E.add(oldN ? 700 : 900, function (e) { var hh = lerp(from, h, e); rc.setAttribute('y', base - hh); rc.setAttribute('height', Math.max(0, hh)); }, { delay: j * (480 / n), ease: eBack });
      });
      st.h = newH;
      var to = resample(eng, 60).map(function (v, j) { return [L + slot / 2 + j / 59 * (W - L - R - slot), T + (1 - v / emax) * (Hh - T - B)]; });
      var from = st.pts || to.map(function (p) { return [p[0], base]; }); st.pts = to;
      kill(st.ltw); st.ltw = E.add(800, function (e) { st.line.setAttribute('d', smooth(to.map(function (p, j) { return [p[0], lerp(from[j][1], p[1], e)]; }))); }, { ease: eIO, delay: 120 });
      var sub = $(root, '[data-cd-impsub]'); if (sub) sub.textContent = range > 30 ? 'Per week, all channels' : 'Per day, all channels';
    }
    function drawGrow(intro) {
      var box = $(root, '[data-cd-grow]'); if (!box) return;
      var s = slice(D.fol, range), acc = 0, cum = s.map(function (v) { acc += v; return acc; });
      var vals = resample(cum, 40);
      lineChart(box, 'grow', [{ vals: vals, color: 'var(--cadence-good)' }], {
        label: 'Follower growth', h: 210, rebuild: intro,
        xlabel: function (i) { var x = new Date(2026, 10, 5 - range + 1 + Math.round(i / 39 * (range - 1))); return x.getDate() + ' ' + MONTHS[x.getMonth()]; },
        tip: function (i) { var x = new Date(2026, 10, 5 - range + 1 + Math.round(i / 39 * (range - 1))); return '<span>' + x.getDate() + ' ' + MONTHS[x.getMonth()] + '</span><b>+' + fmt(vals[i]) + '</b><span>new followers so far</span>'; }
      });
    }
    function drawDonut() {
      var box = $(root, '[data-cd-donut]'); if (!box) return;
      var tilt = { 7: [1.04, 1.1, .96, .94, .9, 1.05], 30: [1, 1, 1, 1, 1, 1], 90: [.97, .9, 1.04, 1.07, 1.12, .92] }[range] || [1, 1, 1, 1, 1, 1];
      var vals = D.nets.map(function (n, i) { return n.followers * tilt[i]; }), tot = sum(vals), shares = vals.map(function (v) { return v / tot; });
      if (!box._built) {
        box._built = true;
        box.innerHTML = '<svg viewBox="0 0 150 150" role="img" aria-label="Followers by channel"><g transform="rotate(-90 75 75)"></g><text class="cd-donut-c" x="75" y="76" text-anchor="middle"></text><text class="cd-donut-s" x="75" y="94" text-anchor="middle">followers</text></svg><ul class="cd-share"></ul>';
        var g = $(box, 'g');
        D.nets.forEach(function (n) { S('circle', { cx: 75, cy: 75, r: 56, fill: 'none', stroke: 'var(--cadence-' + n.id + ')', 'stroke-width': 16, 'stroke-dasharray': '0 400' }, g); });
        box._sh = shares.map(function () { return 0; });
      }
      var circ = 2 * Math.PI * 56, from = box._sh, arcs = $$(box, 'circle'), c = $(box, '.cd-donut-c');
      box._sh = shares; kill(box._tw);
      box._tw = E.add(900, function (e) {
        var acc = 0;
        arcs.forEach(function (a, i) { var s = lerp(from[i], shares[i], e), len = Math.max(0, s * circ - 3); a.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + circ); a.setAttribute('stroke-dashoffset', (-acc * circ).toFixed(2)); acc += s; });
      }, { ease: eIO });
      roll(c, tot, fmtK, 900);
      $(box, '.cd-share').innerHTML = D.nets.map(function (n, i) { return '<li>' + netBadge(n) + esc(n.name) + '<b>' + (shares[i] * 100).toFixed(1) + '%</b></li>'; }).join('');
    }
    function drawTypes() {
      var box = $(root, '[data-cd-types]'); if (!box) return;
      var f = { 7: [1.08, .92, 1.1, .9, 1.3], 30: [1, 1, 1, 1, 1], 90: [.95, 1.06, .94, 1.05, .8] }[range];
      var vals = D.types.map(function (t, i) { return t[1] * f[i]; }), mx = Math.max.apply(null, vals);
      if (!box.children.length) box.innerHTML = D.types.map(function (t) { return '<div class="cd-type"><div><span>' + esc(t[0]) + '</span><b>0%</b></div><span><i></i></span></div>'; }).join('');
      $$(box, '.cd-type').forEach(function (row, i) {
        var bar = $(row, 'i'), b = $(row, 'b'), fw = bar._w || 0, w = vals[i] / mx * 100; bar._w = w; kill(bar._tw);
        bar._tw = E.add(800, function (e) { bar.style.width = lerp(fw, w, e) + '%'; }, { delay: i * 70, ease: eBack });
        roll(b, vals[i], function (v) { return v.toFixed(1) + '%'; }, 800, i * 70);
      });
    }
    function drawPosts() {
      var tb = $(root, '[data-cd-posts] tbody'); if (!tb) return;
      var rows = D.published.filter(function (p) { return p.ago < range && matches(p.text); }).slice(0, 8);
      tb.innerHTML = rows.map(function (p) {
        var x = new Date(2026, 10, 5 - p.ago), n = NET[p.net];
        return '<tr><td><div class="cd-post"><span class="cd-thumb" style="--g:' + GRADS[p.g] + '"></span><div style="min-width:0"><p>' + esc(p.text) + '</p></div></div></td><td><span style="display:inline-flex;align-items:center;gap:8px">' + netBadge(n) + esc(n.name) + '</span></td>' +
          '<td>' + x.getDate() + ' ' + MONTHS[x.getMonth()] + '</td><td class="cd-r">' + fmtK(p.reach) + '</td><td class="cd-r">' + p.eng.toFixed(1) + '%</td><td><span class="cd-pill" style="--c:' + (p.status === 'Boosted' ? 'var(--cadence-warn)' : 'var(--cadence-good)') + '">' + p.status + '</span></td></tr>';
      }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--cadence-muted);padding:22px">No posts in this period</td></tr>';
      var sub = $(root, '[data-cd-postsub]'); if (sub) sub.textContent = 'Latest from the last ' + range + ' days';
    }
    function setRange(r, intro) {
      range = r;
      $$(root, '[data-cd-range] button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-r') === r)); });
      placeSeg($(root, '[data-cd-range]'), !intro);
      drawAnKpis(); drawImp(); drawGrow(intro); drawDonut(); drawTypes(); drawPosts();
    }
    $$(root, '[data-cd-range] button').forEach(function (b) { on(b, 'click', function () { setRange(+b.getAttribute('data-r')); }); });

    /* ----- channels ----- */
    function drawChans() {
      var box = $(root, '[data-cd-chans]'); if (!box) return;
      box.innerHTML = D.nets.map(function (n) {
        var onn = n.off ? 'false' : 'true';
        return '<article class="cd-card cd-chan' + (n.off ? ' is-off' : '') + '" data-n="' + n.id + '"><div class="cd-chan-top">' + netBadge(n, 'cd-net--lg') + '<div style="min-width:0"><b>' + esc(n.name) + '</b><small>' + esc(n.handle) + '</small></div>' +
          '<button type="button" class="cd-switch" role="switch" aria-checked="' + onn + '" aria-label="Post to ' + esc(n.name) + '"></button></div>' +
          '<div class="cd-chan-stats"><div><small>Followers</small><b>' + fmtK(n.followers) + '</b></div><div><small>Posts, 30 d</small><b>' + n.posts + '</b></div><div><small>Eng. rate</small><b>' + n.eng.toFixed(1) + '%</b></div></div>' +
          '<div class="cd-chan-foot">' + (n.warn ? '<span class="cd-pill" style="--c:var(--cadence-warn)">' + esc(n.warn) + '</span><button type="button" class="cd-btn cd-btn--ghost" style="height:30px;padding:0 10px;font-size:12px">Reconnect</button>'
          : '<span>Last post: ' + esc(n.last) + '</span><span class="cd-pill" style="--c:var(--cadence-good)">Connected</span>') + '</div></article>';
      }).join('');
      var team = $(root, '[data-cd-team]');
      if (team) team.innerHTML = D.team.map(function (m, i) {
        return '<div class="cd-member"><span class="cd-who" style="--g:' + avatar(m[3] * 3 + 1) + '"></span><div style="min-width:0"><b>' + esc(m[0]) + (i === 0 ? ' <small style="display:inline;color:var(--cadence-muted)">(you)</small>' : '') + '</b><small>' + esc(m[1]) + '</small></div>' +
          '<span class="cd-select"><label class="cd-sr" for="cd-role' + i + '">Role for ' + esc(m[0]) + '</label><select id="cd-role' + i + '"' + (i === 0 ? ' disabled' : '') + '>' + ['Owner', 'Editor', 'Approver', 'Contributor'].map(function (r) { return '<option' + (r === m[2] ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select><svg class="cd-ic" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></span></div>';
      }).join('');
    }
    on($(root, '[data-cd-chans]'), 'click', function (e) {
      var sw = e.target.closest('.cd-switch'); if (!sw) return;
      var card = sw.closest('[data-n]'), n = NET[card.getAttribute('data-n')]; n.off = !n.off;
      sw.setAttribute('aria-checked', String(!n.off)); card.classList.toggle('is-off', !!n.off);
      toast(n.name + (n.off ? ' paused' : ' is back on'));
    });

    /* ----- page enter animations ----- */
    var enter = {
      overview: function () { drawOverviewKpis(); drawReach(true); drawNetbars(true); drawFeed(true); drawHeat(true); drawNext(true); drawTop(); },
      planner: function () {
        drawFilters(); drawCal(true);
        E.add(1, function () { }, { delay: 2600, done: function () { D.posts.forEach(function (p) { p._new = false; }); $$(root, '.cd-chip.is-new').forEach(function (c) { c.classList.remove('is-new'); }); } });
      },
      compose: function () { drawWeekStrip(); drawPreview(); $$(root, '[data-cd-week-strip] .cd-day').forEach(function (c, i) { c.style.opacity = 0; E.add(380, function (e) { c.style.opacity = e; c.style.transform = 'translateY(' + (8 * (1 - e)) + 'px)'; }, { delay: i * 40, done: function () { c.style.transform = ''; } }); }); },
      inbox: function () { placeSeg($(root, '[data-cd-ifilter]'), false); drawMsgs(); thread(I.cur, true); },
      analytics: function () { charts.grow = null; charts.imp = null; var imp = $(root, '[data-cd-imp]'); if (imp) imp.innerHTML = ''; setRange(range, true); },
      channels: function () { drawChans(); $$(root, '.cd-chan').forEach(function (c, i) { c.style.opacity = 0; E.add(420, function (e) { c.style.opacity = e; c.style.transform = 'translateY(' + (10 * (1 - e)) + 'px)'; }, { delay: i * 60, done: function () { c.style.transform = ''; } }); }); }
    };

    // re-render charts on resize (no intro)
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (page === 'overview') drawReach(false);
        if (page === 'analytics') { drawImp(); drawGrow(false); }
      });
      $$(root, '[data-cd-reach],[data-cd-imp],[data-cd-grow]').forEach(function (el) { ro.observe(el); });
      off.push(function () { ro.disconnect(); });
    }

    if (!opts.data) {   // demo brand logo and the signed-in user's avatar
      var ws = $(root, '.cd-ws i'), av = $(root, '.cd-avatar');
      if (ws) { ws.textContent = ''; ws.style.background = LOGO; }
      if (av) { av.textContent = ''; av.style.background = avatar(10); }
    }
    loadDraft(D.drafts[0], false);
    counts();
    if (opts.theme) setTheme(opts.theme);
    var start = opts.page || (TITLES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
    go(start, true);

    var api = {
      go: function (p) { go(p); }, get page() { return page; }, replay: function () { if (enter[page]) enter[page](); },
      schedule: schedule, setRange: function (r) { if (page !== 'analytics') go('analytics'); setRange(r); }, setTheme: setTheme,
      data: D, destroy: function () { off.forEach(function (f) { f(); }); E.list = []; delete root._cadence; }
    };
    root._cadence = api;
    return api;
  }

  function auto() { Array.prototype.forEach.call(document.querySelectorAll('[data-cadence]:not([data-cadence-manual])'), function (el) { mount(el); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
  window.Cadence = { mount: mount };
})();
