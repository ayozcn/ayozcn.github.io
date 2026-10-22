// Yıl
document.getElementById("year").textContent = new Date().getFullYear();

// Tema (açık / koyu) — tercih tarayıcıda hatırlanır
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  // Varsayılan: lila aydınlık mod. Koyu mor mod üstteki düğmeyle seçilir.
  if (saved) root.dataset.theme = saved;
} catch (e) {}

const themeBtn = document.querySelector(".theme-toggle");
function updateThemeBtn() {
  const dark = root.dataset.theme === "dark";
  themeBtn.textContent = dark ? "☀ Açık" : "☾ Koyu";
  themeBtn.setAttribute("aria-label", dark ? "Açık moda geç" : "Koyu moda geç");
}
updateThemeBtn();

themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  updateThemeBtn();
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// Mobil menü
const header = document.querySelector(".site-header");
const menuBtn = document.querySelector(".menu-toggle");
menuBtn.addEventListener("click", () => {
  const open = header.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav a").forEach((a) =>
  a.addEventListener("click", () => {
    header.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", false);
  })
);

// Kaydırınca menü altına çizgi
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });

// Görünür oldukça içerikleri yumuşakça göster
const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Gökyüzü şeridi: aydınlık modda güneşli sabah, koyu modda takım yıldızlı gece
const band = document.querySelector(".stars-band canvas");
if (band) {
  const ctx = band.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dust, groups, sparkles, clouds, wisps, birds, colors, night, visible = true;

  // Her açılışta aynı gökyüzü çizilsin diye sabit tohumlu rastgele sayı
  const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function readColors() {
    const css = getComputedStyle(root);
    night = root.dataset.theme === "dark";
    colors = {
      star: css.getPropertyValue("--accent").trim(),
      line: css.getPropertyValue("--accent").trim(),
      dust: css.getPropertyValue("--muted").trim(),
      sparkle: css.getPropertyValue("--yellow").trim(),
    };
  }

  function build() {
    const dpr = devicePixelRatio || 1;
    w = band.clientWidth; h = band.clientHeight;
    band.width = w * dpr; band.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = seeded(11);
    const pad = 16;
    const clampY = (y) => Math.min(h - pad, Math.max(pad, y));

    dust = Array.from({ length: Math.round(w / 7) }, () => ({
      x: r() * w, y: r() * h, s: 0.4 + r() * 1.1, p: r() * 6.28,
    }));

    groups = [];
    const n = Math.max(2, Math.round(w / 240));
    for (let g = 0; g < n; g++) {
      const start = (g / n) * w + 30 + r() * 40;
      const count = 4 + Math.floor(r() * 3);
      const pts = [];
      let x = start, y = h * (0.3 + r() * 0.4);
      for (let i = 0; i < count; i++) {
        x += 22 + r() * 32;
        y = clampY(y + (r() - 0.5) * h * 0.55);
        pts.push({ x, y, s: 1.6 + r() * 1.8, p: r() * 6.28 });
      }
      groups.push(pts);
    }

    sparkles = groups.map((pts) => {
      const last = pts[pts.length - 1];
      return { x: last.x + 40 + r() * 50, y: clampY(h * (0.2 + r() * 0.6)), s: 7 + r() * 4, p: r() * 6.28 };
    });

    // Bulutlar: uzaktakiler küçük, soluk ve yavaş; yakındakiler büyük ve biraz daha hızlı
    const cn = Math.max(4, Math.round(w / 220));
    clouds = Array.from({ length: cn }, (_, i) => {
      const depth = r();
      return {
        x: (i / cn) * (w + 400) + r() * 100,
        y: h * (0.2 + r() * 0.25),
        v: 0.003 + depth * 0.006,
        alpha: 0.85 + depth * 0.15,
        img: makeCloud(r, 0.4 + depth * 0.35),
      };
    });
    wisps = Array.from({ length: Math.max(2, Math.round(w / 500)) }, () => ({
      x: r() * w, y: h * (0.12 + r() * 0.25), len: 120 + r() * 180, v: 0.002,
    }));
    const sunX = w * 0.7;
    for (const c of clouds) if (Math.abs(c.x - 200 + c.img.cw / 2 - sunX) < 120) c.x += 240;
    birds = Array.from({ length: 4 }, (_, i) => ({
      x: w * 0.42 + i * 26 + r() * 14, y: h * (0.22 + r() * 0.14), s: 4 + r() * 2.5, p: r() * 6.28,
    }));
  }

  function sparkle(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 ? size * 0.28 : size;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fill();
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    if (night) drawNight(t); else drawDay(t);
  }

  // Bir bulutu bir kez ekran dışı tuvale çizer: üst üste binen yumuşak kenarlı
  // kabarcıklar, altta lila gölge, üstte güneş alan beyazlık
  function makeCloud(r, scale) {
    const dpr = devicePixelRatio || 1;
    const cw = 190 * scale, ch = 90 * scale;
    const off = document.createElement("canvas");
    off.width = cw * dpr; off.height = ch * dpr;
    const c = off.getContext("2d");
    c.scale(dpr, dpr);
    // ortası kabarık, kenarları alçak, tabanı düz bir küme
    const puffs = Array.from({ length: 16 + Math.floor(r() * 8) }, () => {
      const t = r();
      const mid = 1 - Math.abs(t - 0.5) * 2;
      const rad = (10 + r() * 12 + mid * 10) * scale;
      return { x: cw * (0.16 + t * 0.68), y: ch * 0.66 - mid * ch * 0.18 - r() * rad * 0.5, rad };
    });
    const puff = (x, y, rad, rgb, a) => {
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(${rgb}, ${a})`);
      g.addColorStop(0.8, `rgba(${rgb}, ${a})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, rad, 0, 6.28); c.fill();
    };
    for (const p of puffs) puff(p.x, p.y + p.rad * 0.22, p.rad, "205, 190, 230", 0.9);
    for (const p of puffs) puff(p.x, p.y - p.rad * 0.12, p.rad * 0.96, "255, 255, 255", 1);
    off.cw = cw; off.ch = ch;
    return off;
  }

  // Yumuşak dalgalı bir tepe sırası çizer (birkaç sinüs dalgasının toplamı)
  function hills(base, amp, waves, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      let y = base;
      for (const [len, ph, k] of waves) y -= Math.sin(x / len + ph) * amp * k;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  // Sabah manzarası: ufuktan doğan güneş, sisli lila tepeler, süzülen bulutlar ve kuşlar
  function drawDay(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#bfd3f1");
    sky.addColorStop(0.45, "#e6dbf5");
    sky.addColorStop(0.75, "#ffe1c2");
    sky.addColorStop(1, "#ffd6b0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const sx = w * 0.7, sy = h * 0.58, sr = Math.min(42, h * 0.24);
    const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 6);
    glow.addColorStop(0, "rgba(255, 214, 120, 0.85)");
    glow.addColorStop(0.3, "rgba(255, 200, 140, 0.35)");
    glow.addColorStop(1, "rgba(255, 200, 140, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - sr * 6, sy - sr * 6, sr * 12, sr * 12);
    const disc = ctx.createRadialGradient(sx, sy - sr * 0.3, 0, sx, sy, sr);
    disc.addColorStop(0, "#fff6c9");
    disc.addColorStop(0.65, "#ffd55a");
    disc.addColorStop(1, "#ffb33a");
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.28); ctx.fill();

    const span = w + 400;
    for (const c of clouds) {
      const x = still ? c.x - 200 : (((c.x - t * c.v) % span) + span) % span - 200;
      ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.img, x, c.y - c.img.ch * 0.6, c.img.cw, c.img.ch);
    }
    ctx.globalAlpha = 1;

    // kuşlar: kanat çırpan küçük "v"ler
    ctx.strokeStyle = "rgba(70, 50, 100, 0.6)";
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    for (const b of birds) {
      const x = still ? b.x : ((b.x + t * 0.01) % (w + 60)) - 30;
      const flap = still ? 0.5 : 0.5 + 0.5 * Math.sin(t / 180 + b.p);
      ctx.beginPath();
      ctx.moveTo(x - b.s, b.y - b.s * (0.2 + flap * 0.5));
      ctx.quadraticCurveTo(x - b.s * 0.4, b.y - b.s * 0.1, x, b.y + b.s * 0.15);
      ctx.quadraticCurveTo(x + b.s * 0.4, b.y - b.s * 0.1, x + b.s, b.y - b.s * (0.2 + flap * 0.5));
      ctx.stroke();
    }

    // uzaktan yakına üç tepe sırası; uzaktakiler sisli ve açık
    hills(h * 0.68, h * 0.1, [[110, 0.5, 1], [47, 2, 0.35]], "#dccbf1");
    hills(h * 0.8, h * 0.11, [[140, 2.2, 1], [58, 0.7, 0.35]], "#bb9de4");
    hills(h * 0.93, h * 0.09, [[170, 4, 1], [66, 1.3, 0.4]], "#9172cb");
  }

  // Gece: gökyüzü sağdan sola yavaşça akar; sahne iki kez yan yana çizilerek kesintisiz döner
  function drawNight(t) {
    const offset = still ? 0 : (t * 0.012) % w;
    ctx.save();
    ctx.translate(-offset, 0);
    scene(t);
    ctx.translate(w, 0);
    scene(t);
    ctx.restore();
  }

  function scene(t) {
    const tw = (p, speed) => (still ? 0.8 : 0.55 + 0.45 * Math.sin(t / speed + p));

    ctx.fillStyle = colors.dust;
    for (const d of dust) {
      ctx.globalAlpha = 0.35 * tw(d.p, 900);
      ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, 6.28); ctx.fill();
    }

    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    for (const pts of groups) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.fillStyle = colors.star;
      for (const p of pts) {
        ctx.globalAlpha = 0.18 * tw(p.p, 700);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
      }
    }

    ctx.fillStyle = colors.sparkle;
    for (const s of sparkles) {
      ctx.globalAlpha = 0.95;
      sparkle(s.x, s.y, s.s * (still ? 1 : 0.85 + 0.15 * Math.sin(t / 600 + s.p)));
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    if (visible) draw(t);
    if (!still) requestAnimationFrame(loop);
  }

  readColors(); build();
  if (still) draw(0); else requestAnimationFrame(loop);

  addEventListener("resize", () => { build(); if (still) draw(0); });
  new MutationObserver(() => { readColors(); if (still) draw(0); })
    .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(band);
}
