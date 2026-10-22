// İletişim formundan gelen mesajların gideceği e-posta adresi
const EMAIL = "ay.ozcn03@gmail.com";

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

// İletişim formu: kullanıcının e-posta uygulamasını hazır mesajla açar
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const subject = `Portfolyo üzerinden mesaj — ${f.name.value}`;
  const body = `${f.message.value}\n\n${f.name.value}\n${f.email.value}`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// Takım yıldızlı şerit: renkleri temadan alır, yıldızlar hafifçe parıldar
const band = document.querySelector(".stars-band canvas");
if (band) {
  const ctx = band.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dust, groups, sparkles, colors, visible = true;

  // Her açılışta aynı gökyüzü çizilsin diye sabit tohumlu rastgele sayı
  const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function readColors() {
    const css = getComputedStyle(root);
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

  // Gökyüzü sağdan sola yavaşça akar; sahne iki kez yan yana çizilerek kesintisiz döner
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
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
