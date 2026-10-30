import { createWindowManager } from './windows.js';
import { mountTerminal } from './terminal.js';

// OS mini: boot sequence, desktop + ikon, taskbar + jam, jendela konten.
// Seluruh konten dibaca dari content.json — ganti di satu file itu saja.
export function initOS({ content, sound, onExit, reducedMotion = false }) {
  const overlay = document.getElementById('os-overlay');
  const screen = document.getElementById('os-screen');
  const bootEl = document.getElementById('os-boot');
  const desktopEl = document.getElementById('os-desktop');
  const iconsEl = document.getElementById('os-icons');
  const windowsEl = document.getElementById('os-windows');
  const taskbarWins = document.getElementById('os-taskbar-windows');
  const clockEl = document.getElementById('os-clock');

  const wm = createWindowManager({ windowsEl, taskbarEl: taskbarWins, screenEl: screen, sound });
  let booted = false;
  let clockTimer = null;

  const { profile, projects, contact, resume } = content;

  /* ---------- isi jendela ---------- */
  function renderAbout(body) {
    body.innerHTML = `
      <h3 class="chroma">${profile.avatarEmoji} ${profile.name}</h3>
      <p class="meta">${profile.role} · ${profile.location}</p>
      <p style="margin-top:.6rem">${profile.tagline}</p>
      <p style="margin-top:.6rem">${profile.bio}</p>`;
  }
  function renderProjects(body) {
    body.innerHTML = `<h3 class="chroma">💼 Projects</h3>` + projects.map((p) => `
      <div class="proj">
        <h4>${p.title}</h4>
        <p>${p.description}</p>
        <p class="tech">[ ${p.tech.join(' · ')} ]</p>
        <p class="links">
          ${p.demo && !p.demo.includes('example.com') ? `<a href="${p.demo}" target="_blank" rel="noopener">↗ demo</a>` : ''}
          ${p.repo && !p.repo.includes('[username]') ? `<a href="${p.repo}" target="_blank" rel="noopener">⌨ repo</a>` : ''}
        </p>
      </div>`).join('');
  }
  function renderResume(body) {
    body.innerHTML = `
      <h3 class="chroma">📄 Resume</h3>
      <p>${profile.name} — ${profile.role}</p>
      <p class="meta">Versi PDF terbaru, siap diunduh.</p>
      <a class="big-btn" href="${resume.url}" download>⬇ ${resume.label}</a>
      <p class="meta" style="margin-top:.8rem">Taruh file PDF-mu di <b>public/resume.pdf</b>
      (atau ubah <b>resume.url</b> di content.json).</p>`;
  }
  function renderContact(body) {
    body.innerHTML = `
      <h3 class="chroma">✉️ Contact</h3>
      <p>${contact.note || ''}</p>
      <p style="margin-top:.6rem">📧 <a href="mailto:${contact.email}">${contact.email}</a></p>
      <p>🐙 <a href="${contact.github}" target="_blank" rel="noopener">GitHub</a></p>
      <p>💼 <a href="${contact.linkedin}" target="_blank" rel="noopener">LinkedIn</a></p>`;
  }
  function renderTerminal(body) {
    mountTerminal(body, content, sound);
  }

  const APPS = [
    { id: 'about', title: 'About Me', glyph: '📁', render: renderAbout },
    { id: 'projects', title: 'Projects', glyph: '💼', render: renderProjects },
    { id: 'resume', title: 'Resume', glyph: '📄', render: renderResume },
    { id: 'contact', title: 'Contact', glyph: '✉️', render: renderContact },
    { id: 'terminal', title: 'Terminal', glyph: '⌨️', render: renderTerminal },
  ];

  function openApp(id) {
    const app = APPS.find((a) => a.id === id);
    if (app) wm.open({ id: app.id, title: app.title, render: app.render, width: '58vmin' });
  }

  // ikon desktop
  APPS.forEach((app) => {
    const b = document.createElement('button');
    b.className = 'os-icon';
    b.innerHTML = `<span class="glyph">${app.glyph}</span><span>${app.title}</span>`;
    b.addEventListener('click', () => openApp(app.id));
    b.addEventListener('dblclick', () => openApp(app.id));
    iconsEl.appendChild(b);
  });

  document.getElementById('os-start').addEventListener('click', () => openApp('about'));

  // jam real-time di taskbar
  function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // tombol suara (default OFF)
  const soundBtn = document.getElementById('os-sound');
  soundBtn.addEventListener('click', () => {
    sound.setEnabled(!sound.enabled);
    soundBtn.textContent = sound.enabled ? '🔊' : '🔇';
    if (sound.enabled) sound.beep(880, 0.08);
  });

  document.getElementById('os-exit').addEventListener('click', () => onExit());

  /* ---------- boot sequence ---------- */
  const BOOT_LINES = [
    'RETRO BIOS v2.11 — memeriksa memori...',
    '  640K RAM OK',
    'Mendeteksi drive ............ OK',
    'Memuat RETRO-OS dari DISK 0 ...',
    '<span class="ok">[ OK ] subsistem grafis</span>',
    '<span class="ok">[ OK ] pengandar keyboard</span>',
    '<span class="warn">[ -- ] modem: tidak ditemukan (tidak apa-apa)</span>',
    'Menyiapkan desktop ...',
  ];

  function runBoot(done) {
    bootEl.classList.remove('hidden');
    bootEl.innerHTML = '';
    if (reducedMotion) {
      bootEl.innerHTML = BOOT_LINES.join('\n');
      sound.beep(660, 0.09);
      setTimeout(done, 500);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      bootEl.innerHTML += BOOT_LINES[i] + '\n';
      sound.beep(500 + i * 40, 0.04, 'square', 0.03);
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(done, 450);
      }
    }, 260);
  }

  function showDesktop() {
    bootEl.classList.add('hidden');
    desktopEl.classList.remove('hidden');
    screen.classList.add('flicker');
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
    // buka jendela sambutan sekali saja
    setTimeout(() => openApp('about'), 350);
  }

  /* ---------- API publik ---------- */
  function show() {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('show'));
    if (!booted) {
      booted = true;
      runBoot(showDesktop);
    } else if (desktopEl.classList.contains('hidden')) {
      showDesktop();
    } else {
      tickClock();
      clockTimer = setInterval(tickClock, 1000);
    }
  }

  function hide() {
    overlay.classList.remove('show');
    clearInterval(clockTimer);
    setTimeout(() => {
      overlay.classList.add('hidden');
      wm.closeAll();
      desktopEl.classList.add('hidden');
      screen.classList.remove('flicker');
    }, 420);
  }

  return { show, hide, openApp };
}
