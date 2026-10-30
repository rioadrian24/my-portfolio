# Portfolio 3D Interaktif — Komputer Retro di Dalam Ruangan

Website portfolio bergaya nostalgia 90-an: pengunjung masuk ke ruangan kerja 3D
low-poly, mengklik monitor CRT, lalu kamera zoom masuk ke "OS mini" bergaya
retro yang berisi portfolio lengkap.

**Stack:** Three.js + Vite + vanilla JS, GSAP (animasi kamera), EffectComposer
(bloom + vignette + film grain + chromatic aberration).

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil production di dist/
```

## Cara mengganti konten

Semua teks portfolio ada di **satu file**: `src/data/content.json`

- `profile`: nama, profesi, bio, lokasi, tagline
- `projects`: 4 item (judul, deskripsi, tech, link demo/repo)
- `contact`: email, GitHub, LinkedIn
- `resume.url`: arahkan ke file PDF-mu — taruh PDF di `public/resume.pdf`
  (atau ubah URL-nya di JSON)
- Ganti juga placeholder `[NAMA KAMU]` / `[BIO ...]` di `index.html`
  (title, meta description, og tags, dan teks tersembunyi untuk SEO).

## Cara mengganti model

Monitor, keyboard, mouse, dan semua furnitur saat ini **primitif Three.js**
prosedural (disengaja: tanpa aset eksternal, bebas lisensi). Untuk memakai
model `.glb` sendiri:

1. Taruh file di `public/models/` (mis. `public/models/crt.glb`).
2. Kompres dengan Draco: `gltf-pipeline -i crt.glb -o crt-draco.glb -d`
3. Di `src/scene/monitor.js`, ganti isi `buildComputer()`:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const glb = await loader.loadAsync('models/crt-draco.glb');
// ...pasang screenMesh ke bagian layar model, lalu kembalikan referensinya
```

Yang wajib dipertahankan agar interaksi tetap jalan: objek `screenMesh`
(mesh layar, normal menghadap +Z) karena kamera zoom & raycast hover
mengacu ke sana, plus `screenTexture`/`screenMaterial` untuk glow layar.

## Cara mengganti warna / mood

- Palet ruangan & material: `src/scene/room.js` (dinding, kayu, poster)
- Warna cahaya: `src/scene/lights.js` (`0xffb46b` lampu, `0x4dff88` glow layar)
- Intensitas bloom & grain: `src/scene/postprocessing.js`
- Tema OS (hijau fosfor): `src/os.css` (`#33ff66` dkk.)
- Teks boot & perintah terminal: `src/ui/os.js`, `src/ui/terminal.js`

## Struktur

```
src/
  main.js            # wiring: renderer, loop, hover/klik, fallback
  scene/
    room.js          # ruangan, furnitur, debu partikel
    monitor.js       # CRT + keyboard + mouse + ScreenTexture (canvas 2D)
    lights.js        # point/ambient/hemisphere
    postprocessing.js# bloom + vignette + grain + chromatic aberration
  ui/
    os.js            # shell OS: boot, desktop, ikon, taskbar, jam
    windows.js       # jendela draggable + minimize + taskbar buttons
    terminal.js      # terminal mini (help, about, projects, contact, clear)
  data/content.json  # <-- SEMUA KONTEN PORTFOLIO DI SINI
  utils/
    loader.js        # LoadingManager + progress bar
    camera.js        # parallax idle + zoom GSAP
    sound.js         # beep WebAudio (default OFF)
```

## Catatan performa & aksesibilitas

- Pixel ratio dibatasi (maks 2 desktop, 1.5 mobile); render dijeda saat tab
  tidak aktif; tekstur layar di-redraw ~12fps.
- `prefers-reduced-motion`: menonaktifkan grain animasi, flicker, debu,
  dan mempercepat transisi kamera.
- Tanpa WebGL / perangkat lemah: otomatis tampil portfolio HTML biasa.
- Teks tersembunyi `.sr-only` menjaga SEO & screen reader.
