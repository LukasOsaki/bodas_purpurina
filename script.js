(() => {
  const canvas = document.getElementById('ambient');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const gold = ['#eccf8d', '#cda05a', '#f6ead9', '#ffe9b3'];

  function drawFleck(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin || 0);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.glow || 0;
    if (p.star) {
      // small four-point glitter fleck
      const s = p.r * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.18, -s * 0.18, s, 0);
      ctx.quadraticCurveTo(s * 0.18, s * 0.18, 0, s);
      ctx.quadraticCurveTo(-s * 0.18, s * 0.18, -s, 0);
      ctx.quadraticCurveTo(-s * 0.18, -s * 0.18, 0, -s);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- ambient sparkle (always on, gentle) ----------

  function makeAmbient(spawnAnywhere) {
    return {
      x: Math.random() * w,
      y: spawnAnywhere ? Math.random() * h : h + 10 + Math.random() * h * 0.3,
      r: 0.6 + Math.random() * 1.6,
      speed: 0.08 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: 0.15 + Math.random() * 0.5,
      twinkle: Math.random() * Math.PI * 2,
      color: gold[(Math.random() * gold.length) | 0],
      star: false
    };
  }

  const ambient = reduceMotion ? [] : Array.from({ length: 46 }, () => makeAmbient(true));

  // ---------- celebration particles (bursts + falling rain after open) ----------

  let confetti = [];

  function addBurst(cx, cy, count, power) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 5) * power;
      confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: 1.6 + Math.random() * 3,
        life: 55 + Math.random() * 40,
        age: 0,
        spin: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI * 2,
        glow: 6 + Math.random() * 6,
        star: Math.random() < 0.55,
        color: gold[(Math.random() * gold.length) | 0],
        kind: 'burst'
      });
    }
  }

  let rainUntil = 0;
  function spawnRainDrop() {
    confetti.push({
      x: Math.random() * w,
      y: -10,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1.2 + Math.random() * 1.8,
      r: 1.4 + Math.random() * 2.4,
      life: 240,
      age: 0,
      spin: (Math.random() - 0.5) * 0.2,
      rot: Math.random() * Math.PI * 2,
      glow: 4 + Math.random() * 5,
      star: Math.random() < 0.5,
      color: gold[(Math.random() * gold.length) | 0],
      kind: 'rain'
    });
  }

  function celebrate() {
    if (reduceMotion) return;
    const cx = w / 2;
    const cy = h * 0.32;
    addBurst(cx, cy, 130, 1);
    setTimeout(() => addBurst(w * 0.28, h * 0.4, 60, 0.75), 200);
    setTimeout(() => addBurst(w * 0.72, h * 0.4, 60, 0.75), 380);
    rainUntil = performance.now() + 3200;
  }

  // ---------- unified render loop ----------

  let lastRain = 0;
  function tick(now) {
    ctx.clearRect(0, 0, w, h);

    for (const s of ambient) {
      s.y -= s.speed;
      s.x += s.drift;
      s.twinkle += 0.03;
      if (s.y < -10) Object.assign(s, makeAmbient(false));
      s.a = s.alpha * (0.5 + 0.5 * Math.sin(s.twinkle));
      drawFleck(s);
    }

    if (now < rainUntil && now - lastRain > 45) {
      spawnRainDrop();
      lastRain = now;
    }

    if (confetti.length) {
      for (const p of confetti) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.kind === 'burst') p.vy += 0.06;
        p.rot += p.spin;
        p.age++;
        p.a = Math.max(0, 1 - p.age / p.life);
        drawFleck({ ...p, spin: p.rot });
      }
      confetti = confetti.filter(p => p.age < p.life && p.y < h + 20);
    }

    ctx.shadowBlur = 0;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- open interaction ----------

  const openBtn = document.getElementById('open-btn');
  const card = document.getElementById('card');
  openBtn.addEventListener('click', () => {
    document.body.classList.add('is-open');
    card.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-hidden', 'true');
    celebrate();
  }, { once: true });
})();
