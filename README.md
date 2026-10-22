# Portfolyo

Saf HTML/CSS/JS ile yazılmış kişisel portfolyo sitesi. Hiçbir kurulum gerekmez; `index.html` dosyasını tarayıcıda açman yeterli.

## Dosyalar
- `index.html` – tüm içerik (metinler, projeler, deneyimler)
- `style.css` – tasarım (renkler en üstteki `:root` bölümünde)
- `script.js` – menü, tema, proje filtreleri, iletişim formu
- `assets/` – fotoğrafın (`profil.jpg`) ve CV'n (`cv.pdf`)

## Yeni proje eklemek
1. Görseli `assets/projeler/` klasörüne koy.
2. `index.html` içinde "Diğer Çalışmalar" bölümündeki bir `<article class="project">` bloğunu kopyalayıp düzenle.
3. `data-category` değerine filtrelerden birini (veya birkaçını) yaz: `metin`, `strateji`, `organizasyon`, `tasarim`.
