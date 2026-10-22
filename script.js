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
