/* Norman's Pottery: wheel, gallery pots, kiln thermometer */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Shapes are lists of [height 0..1, radius 0..1] points, smoothly joined */
function profileAt(pts, t) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, r0] = pts[i], [t1, r1] = pts[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      const s = (1 - Math.cos(k * Math.PI)) / 2;
      return r0 + (r1 - r0) * s;
    }
  }
  return pts[pts.length - 1][1];
}

/* =========================================================
   1. The pottery wheel
   ========================================================= */
(function wheel() {
  const canvas = document.getElementById('wheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const N = 64;
  const SHAPES = {
    lump:  { h: 0.30, pts: [[0, .78], [.5, .74], [.85, .6], [1, .35]] },
    vase:  { h: 0.95, pts: [[0, .42], [.12, .6], [.38, .82], [.62, .56], [.8, .28], [.92, .3], [1, .4]] },
    bowl:  { h: 0.42, pts: [[0, .42], [.3, .74], [.7, .95], [1, 1]] },
    moon:  { h: 0.82, pts: [[0, .38], [.25, .84], [.5, .95], [.75, .84], [.95, .44], [1, .46]] },
  };

  const r = new Float32Array(N);
  let height = SHAPES.lump.h;
  setShapeNow('lump');

  let goal = null; // shape we're easing towards
  let rot = 0;
  let W = 0, H = 0, cx = 0, baseY = 0, maxR = 0;
  let running = true;

  const speckles = Array.from({ length: 200 }, () => ({
    a: Math.random() * Math.PI * 2,
    t: Math.random(),
    s: Math.random() * 1.5 + .6,
    light: Math.random() < .3,
  }));

  function shapeArray(name) {
    const s = SHAPES[name], out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = profileAt(s.pts, i / (N - 1));
    return { r: out, h: s.h };
  }
  function setShapeNow(name) {
    const s = shapeArray(name);
    r.set(s.r); height = s.h;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    baseY = H * 0.8;
    maxR = Math.min(W * 0.36, H * 0.29);
  }

  function potHeight() { return height * maxR * 2.5; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const hp = potHeight(), dy = hp / (N - 1);

    // Wheel head: a thick metal disc
    const wr = maxR * 1.3, wry = wr * 0.17, wy = baseY + 4;
    ctx.fillStyle = '#2b1d15';
    ctx.beginPath(); ctx.ellipse(cx, wy + 12, wr, wry, 0, 0, Math.PI * 2); ctx.fill();
    const wg = ctx.createLinearGradient(cx - wr, 0, cx + wr, 0);
    wg.addColorStop(0, '#5b524b'); wg.addColorStop(.35, '#8d847b'); wg.addColorStop(1, '#4a423c');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.ellipse(cx, wy, wr, wry, 0, 0, Math.PI * 2); ctx.fill();
    // concentric rings and spinning marks on the wheel head
    ctx.strokeStyle = 'rgba(43,29,21,.25)'; ctx.lineWidth = 1;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath(); ctx.ellipse(cx, wy, wr * (.45 + k * .17), wry * (.45 + k * .17), 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(237,231,220,.55)';
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5 + rot;
      if (Math.sin(a) < 0) continue;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * wr * .92, wy + Math.sin(a) * wry * .92, 3, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // wet slip around the foot
    ctx.fillStyle = 'rgba(120,92,70,.55)';
    ctx.beginPath(); ctx.ellipse(cx, baseY, maxR * r[0] * 1.15, maxR * r[0] * .17, 0, 0, Math.PI * 2); ctx.fill();

    // Clay body, drawn in thin horizontal bands so each is shaded as a cylinder
    for (let i = 0; i < N - 1; i++) {
      const y0 = baseY - i * dy, y1 = baseY - (i + 1) * dy - .6;
      const ra = maxR * r[i], rb = maxR * r[i + 1], rm = (ra + rb) / 2;
      const g = ctx.createLinearGradient(cx - rm, 0, cx + rm, 0);
      g.addColorStop(0, '#4a3628');
      g.addColorStop(.28, '#9c7d63');
      g.addColorStop(.4, '#b8987c');
      g.addColorStop(.72, '#6f5240');
      g.addColorStop(1, '#3a291e');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - ra, y0); ctx.lineTo(cx + ra, y0);
      ctx.lineTo(cx + rb, y1); ctx.lineTo(cx - rb, y1);
      ctx.closePath(); ctx.fill();
    }

    // Throwing rings: the spiral marks left by fingers
    for (let i = 3; i < N - 2; i += 4) {
      const y = baseY - i * dy, rr = maxR * r[i];
      ctx.strokeStyle = 'rgba(40,26,18,.22)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(cx, y, rr, rr * .09, 0, .1, Math.PI - .1); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,205,180,.12)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, y + 2, rr, rr * .09, 0, .1, Math.PI - .1); ctx.stroke();
    }

    // Speckles in the clay, carried around by the spin
    for (const s of speckles) {
      const a = s.a + rot, c = Math.cos(a);
      if (c < .12) continue;
      const fi = s.t * (N - 1), i0 = Math.floor(fi), i1 = Math.min(N - 1, i0 + 1);
      const rr = maxR * (r[i0] + (r[i1] - r[i0]) * (fi - i0));
      const x = cx + rr * Math.sin(a);
      const y = baseY - s.t * hp + rr * .09 * c;
      ctx.fillStyle = s.light ? `rgba(240,220,195,${c * .5})` : `rgba(35,22,15,${c * .65})`;
      ctx.beginPath(); ctx.arc(x, y, s.s * (.6 + c * .4), 0, Math.PI * 2); ctx.fill();
    }

    // Rim and the dark opening of the pot
    const top = baseY - hp, rr = maxR * r[N - 1], ry = Math.max(4, rr * .14);
    ctx.fillStyle = '#7d5f4a';
    ctx.beginPath(); ctx.ellipse(cx, top, rr, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1b13';
    ctx.beginPath(); ctx.ellipse(cx, top + 1, rr * .86, ry * .8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(225,200,175,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, top, rr, ry, 0, Math.PI * .05, Math.PI * .95); ctx.stroke();
  }

  function tick() {
    if (goal) {
      let moving = false;
      for (let i = 0; i < N; i++) {
        const d = goal.r[i] - r[i];
        r[i] += d * .07;
        if (Math.abs(d) > .002) moving = true;
      }
      height += (goal.h - height) * .07;
      if (!moving && Math.abs(goal.h - height) < .002) goal = null;
    }
    if (!reduceMotion) rot += .045;
    draw();
    if (running) requestAnimationFrame(tick);
  }

  // Shaping with mouse or finger
  let dragging = false;
  function shapeAt(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const t = (baseY - y) / potHeight();
    if (t < -.08 || t > 1.08) return;
    goal = null;
    const i = Math.round(clamp(t, 0, 1) * (N - 1));
    const want = clamp(Math.abs(x - cx) / maxR, .12, 1);
    for (let j = 0; j < N; j++) {
      const w = Math.exp(-(((j - i) / 5) ** 2));
      r[j] += (want - r[j]) * w * .45;
    }
    if (reduceMotion) draw();
  }
  canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); shapeAt(e); });
  canvas.addEventListener('pointermove', e => { if (dragging) shapeAt(e); });
  ['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => { dragging = false; }));

  document.querySelectorAll('.wheel-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (reduceMotion) { setShapeNow(btn.dataset.shape); draw(); }
      else goal = shapeArray(btn.dataset.shape);
    });
  });

  // Only spin while the wheel is on screen
  new IntersectionObserver(([entry]) => {
    const was = running;
    running = entry.isIntersecting;
    if (running && !was) requestAnimationFrame(tick);
  }).observe(canvas);

  window.addEventListener('resize', () => { resize(); draw(); });
  resize();

  // Opening moment: the lump rises into a vase
  if (reduceMotion) { setShapeNow('vase'); draw(); running = false; }
  else { requestAnimationFrame(tick); setTimeout(() => { goal = shapeArray('vase'); }, 700); }
})();

/* =========================================================
   2. Gallery pots, drawn from shape + glaze
   ========================================================= */
(function gallery() {
  const GLAZES = {
    celadon: { base: '#7FA796', deep: '#4f7a69', edge: '#a9c7b9' },
    tenmoku: { base: '#3A2418', deep: '#1e120b', edge: '#8a4f2a' },
    shino:   { base: '#D08A55', deep: '#a65a2e', edge: '#f1d2b0' },
    ash:     { base: '#A9A47E', deep: '#6f6c48', edge: '#d3cfa8' },
  };
  const SHAPES = {
    bottle: { h: 190, pts: [[0, .5], [.15, .72], [.4, .8], [.62, .45], [.76, .17], [.95, .17], [1, .23]], dip: .45 },
    mug:    { h: 120, pts: [[0, .55], [.06, .6], [.94, .58], [1, .6]], dip: .2, handle: true },
    moon:   { h: 165, pts: [[0, .4], [.25, .9], [.5, 1.02], [.75, .9], [.95, .46], [1, .48]], dip: .3 },
    bowl:   { h: 82,  pts: [[0, .45], [.35, .86], [.75, 1.06], [1, 1.14]], dip: .25, open: true },
    jar:    { h: 135, pts: [[0, .5], [.3, .86], [.7, .84], [.92, .52], [1, .5]], dip: .35, lid: true },
    cup:    { h: 88,  pts: [[0, .42], [.3, .66], [1, .72]], dip: .35, open: true },
  };
  const R = 80, CX = 120, BASE = 228;

  // simple seeded random so each pot's drips stay the same on every visit
  const seeded = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  function potSVG(shapeName, glazeName, idx) {
    const s = SHAPES[shapeName], g = GLAZES[glazeName];
    if (!s || !g) return '';
    const rand = seeded(idx * 97 + 13);
    const id = `p${idx}`;
    const top = BASE - s.h;
    const steps = 40;
    let right = '', left = '';
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, y = BASE - t * s.h, rr = R * profileAt(s.pts, t);
      right += `${k ? 'L' : 'M'}${(CX + rr).toFixed(1)} ${y.toFixed(1)} `;
      left = `L${(CX - rr).toFixed(1)} ${y.toFixed(1)} ` + left;
    }
    const body = right + left + 'Z';
    const rimR = R * profileAt(s.pts, 1), rimY = Math.max(5, rimR * (s.open ? .24 : .14));
    const footR = R * s.pts[0][1];

    // glaze: covers the pot from the rim down to a wavy dip line with drips
    const dipY = BASE - s.h * s.dip;
    let glaze = `M0 0H240V${dipY.toFixed(1)}`;
    for (let x = 240; x > 0; x -= 16) {
      const drip = rand() < .35 ? 8 + rand() * 22 : rand() * 5;
      glaze += ` Q${x - 4} ${(dipY + drip * 1.4).toFixed(1)} ${x - 8} ${(dipY + drip).toFixed(1)} T${x - 16} ${(dipY + rand() * 4).toFixed(1)}`;
    }
    glaze += ' V0Z';

    const handle = s.handle
      ? `<path d="M${CX + R * .58} ${top + 28} C${CX + R * 1.2} ${top + 22} ${CX + R * 1.22} ${BASE - 30} ${CX + R * .6} ${BASE - 26}" fill="none" stroke="${g.base}" stroke-width="13" stroke-linecap="round"/>`
      : '';
    const lid = s.lid
      ? `<ellipse cx="${CX}" cy="${top}" rx="${rimR + 4}" ry="${rimY + 2}" fill="${g.deep}"/>
         <ellipse cx="${CX}" cy="${top - 2}" rx="${rimR + 2}" ry="${rimY}" fill="${g.base}"/>
         <path d="M${CX - 9} ${top - 3} Q${CX - 10} ${top - 20} ${CX} ${top - 20} Q${CX + 10} ${top - 20} ${CX + 9} ${top - 3}Z" fill="${g.base}"/>`
      : `<ellipse cx="${CX}" cy="${top}" rx="${rimR}" ry="${rimY}" fill="${g.edge}"/>
         <ellipse cx="${CX}" cy="${top + 1}" rx="${rimR * .88}" ry="${rimY * .78}" fill="${g.deep}"/>`;

    return `<svg viewBox="0 0 240 250" role="img" aria-label="${glazeName} glazed ${shapeName}">
      <defs>
        <clipPath id="${id}c"><path d="${body}"/></clipPath>
        <linearGradient id="${id}s" x1="0" x2="1">
          <stop offset="0" stop-color="#000" stop-opacity=".35"/>
          <stop offset=".3" stop-color="#fff" stop-opacity=".22"/>
          <stop offset=".42" stop-color="#fff" stop-opacity=".05"/>
          <stop offset=".8" stop-color="#000" stop-opacity=".2"/>
          <stop offset="1" stop-color="#000" stop-opacity=".45"/>
        </linearGradient>
      </defs>
      <ellipse cx="${CX}" cy="${BASE + 2}" rx="${footR * 1.35}" ry="6" fill="rgba(43,29,21,.18)"/>
      ${handle}
      <path d="${body}" fill="#c9b195"/>
      <g clip-path="url(#${id}c)">
        <path d="${glaze}" fill="${g.base}"/>
        <rect x="0" y="0" width="240" height="250" fill="url(#${id}s)" transform="translate(${CX - R * 1.15} 0) scale(${(R * 2.3) / 240} 1)"/>
      </g>
      ${lid}
    </svg>`;
  }

  const pieces = [...document.querySelectorAll('.piece')];
  pieces.forEach((p, i) => {
    const art = p.querySelector('.pot-art');
    if (art && !art.querySelector('img')) art.innerHTML = potSVG(p.dataset.shape, p.dataset.glaze, i);
  });

  // Glaze filter
  const buttons = document.querySelectorAll('.filters button');
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    buttons.forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    pieces.forEach(p => {
      const show = f === 'all' || p.dataset.glaze === f;
      if (show && p.hidden) {
        p.hidden = false;
        p.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove('is-entering')));
      } else if (!show && !p.hidden) {
        if (reduceMotion) { p.hidden = true; return; }
        p.classList.add('is-leaving');
        setTimeout(() => { p.hidden = true; p.classList.remove('is-leaving'); }, 250);
      }
    });
  }));
})();

/* =========================================================
   3. Kiln thermometer that heats as you scroll
   ========================================================= */
(function kiln() {
  const section = document.querySelector('.kiln');
  const steps = [...document.querySelectorAll('.step')];
  const out = document.getElementById('temp');
  const label = document.getElementById('tempLabel');
  if (!section || !steps.length) return;

  // kiln colours: what the inside of a kiln actually looks like as it heats
  const HEAT = [
    [20, [90, 74, 66]], [500, [90, 60, 50]], [650, [125, 30, 18]],
    [850, [190, 48, 26]], [1050, [235, 120, 45]], [1280, [255, 220, 150]],
  ];
  function heatColour(t) {
    for (let i = 0; i < HEAT.length - 1; i++) {
      const [t0, c0] = HEAT[i], [t1, c1] = HEAT[i + 1];
      if (t <= t1) {
        const k = clamp((t - t0) / (t1 - t0), 0, 1);
        return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`;
      }
    }
    return 'rgb(255,220,150)';
  }
  function describe(t) {
    if (t < 80) return 'Room temperature';
    if (t < 600) return 'Warming up';
    if (t < 900) return 'Dull red glow';
    if (t < 1150) return 'Bright orange';
    return 'White hot';
  }

  let shown = 20, target = 20, animating = false;
  function render() {
    out.textContent = Math.round(shown);
    label.textContent = describe(shown);
    section.style.setProperty('--heat', heatColour(shown));
    section.style.setProperty('--level', `${clamp(shown / 1300 * 100, 2, 100)}%`);
  }
  function animate() {
    shown += (target - shown) * .06;
    if (Math.abs(target - shown) < 1) { shown = target; animating = false; }
    render();
    if (animating) requestAnimationFrame(animate);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      steps.forEach(s => s.classList.toggle('is-active', s === e.target));
      target = +e.target.dataset.temp;
      if (reduceMotion) { shown = target; render(); }
      else if (!animating) { animating = true; requestAnimationFrame(animate); }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => io.observe(s));
  render();
})();

document.getElementById('year').textContent = new Date().getFullYear();
