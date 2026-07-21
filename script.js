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

  const gold = ['#eccf8d', '#cda05a', '#f6ead9'];

  function makeSparkle(spawnAnywhere) {
    return {
      x: Math.random() * w,
      y: spawnAnywhere ? Math.random() * h : h + 10 + Math.random() * h * 0.3,
      r: 0.6 + Math.random() * 1.6,
      speed: 0.08 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.15,
      alpha: 0.15 + Math.random() * 0.5,
      twinkle: Math.random() * Math.PI * 2,
      color: gold[(Math.random() * gold.length) | 0]
    };
  }

  const ambientSparkles = reduceMotion ? [] : Array.from({ length: 46 }, () => makeSparkle(true));

  function drawAmbient() {
    ctx.clearRect(0, 0, w, h);
    for (const s of ambientSparkles) {
      s.y -= s.speed;
      s.x += s.drift;
      s.twinkle += 0.03;
      if (s.y < -10) Object.assign(s, makeSparkle(false));
      const a = s.alpha * (0.5 + 0.5 * Math.sin(s.twinkle));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawAmbient);
  }
  drawAmbient();

  // burst of glitter on open
  let burst = [];
  function fireBurst() {
    if (reduceMotion) return;
    const cx = w / 2;
    const cy = h * 0.35;
    burst = Array.from({ length: 90 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        r: 1.5 + Math.random() * 2.5,
        life: 60 + Math.random() * 30,
        age: 0,
        color: gold[(Math.random() * gold.length) | 0]
      };
    });
    requestAnimationFrame(stepBurst);
  }

  function stepBurst() {
    if (!burst.length) return;
    for (const p of burst) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.age++;
      const a = Math.max(0, 1 - p.age / p.life);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    burst = burst.filter(p => p.age < p.life);
    if (burst.length) requestAnimationFrame(stepBurst);
  }

  const openBtn = document.getElementById('open-btn');
  const card = document.getElementById('card');
  openBtn.addEventListener('click', () => {
    document.body.classList.add('is-open');
    card.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-hidden', 'true');
    fireBurst();
  }, { once: true });
})();
