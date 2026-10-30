// Window manager: jendela draggable dengan title bar,
// tombol tutup/minimize, fokus z-index, dan tombol di taskbar.
export function createWindowManager({ windowsEl, taskbarEl, screenEl, sound }) {
  const wins = new Map();
  let zTop = 10;
  let cascade = 0;

  function bringToFront(win) {
    win.el.style.zIndex = ++zTop;
    wins.forEach((w) => w.taskBtn?.classList.remove('active'));
    win.taskBtn?.classList.add('active');
  }

  function makeDraggable(win) {
    const bar = win.el.querySelector('.os-titlebar');
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.os-btn')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const r = win.el.getBoundingClientRect();
      const pr = screenEl.getBoundingClientRect();
      ox = r.left - pr.left; oy = r.top - pr.top;
      bar.setPointerCapture(e.pointerId);
      bringToFront(win);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pr = screenEl.getBoundingClientRect();
      let nx = ox + e.clientX - sx;
      let ny = oy + e.clientY - sy;
      // batasi di dalam layar
      const r = win.el.getBoundingClientRect();
      nx = Math.max(-r.width + 80, Math.min(pr.width - 80, nx));
      ny = Math.max(0, Math.min(pr.height - 60, ny));
      win.el.style.left = nx + 'px';
      win.el.style.top = ny + 'px';
      win.el.style.right = 'auto'; win.el.style.bottom = 'auto';
    });
    bar.addEventListener('pointerup', () => { dragging = false; });
  }

  function open({ id, title, render, width }) {
    // kalau sudah terbuka: fokuskan (atau restore bila minimize)
    if (wins.has(id)) {
      const w = wins.get(id);
      if (w.minimized) {
        w.el.style.display = 'flex';
        w.minimized = false;
      }
      bringToFront(w);
      return w;
    }
    const el = document.createElement('div');
    el.className = 'os-window';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    if (width) el.style.width = width;

    // posisi cascade agar jendela tidak menumpuk persis
    const off = (cascade % 6) * 34;
    el.style.left = `calc(6vmin + ${off}px)`;
    el.style.top = `calc(8vmin + ${off}px)`;
    cascade++;

    el.innerHTML = `
      <div class="os-titlebar">
        <span class="ttl chroma">${title}</span>
        <button class="os-btn" data-act="min" aria-label="Minimize">_</button>
        <button class="os-btn" data-act="close" aria-label="Tutup">×</button>
      </div>
      <div class="os-body"></div>`;
    const body = el.querySelector('.os-body');
    render(body);

    const taskBtn = document.createElement('button');
    taskBtn.className = 'taskbtn';
    taskBtn.textContent = title;
    taskBtn.addEventListener('click', () => {
      const w = wins.get(id);
      if (!w) return;
      if (w.minimized) { w.el.style.display = 'flex'; w.minimized = false; bringToFront(w); }
      else if (parseInt(w.el.style.zIndex) === zTop) { w.el.style.display = 'none'; w.minimized = true; taskBtn.classList.remove('active'); }
      else bringToFront(w);
    });
    taskbarEl.appendChild(taskBtn);

    const win = { id, el, taskBtn, minimized: false };
    el.querySelector('[data-act="close"]').addEventListener('click', () => close(id));
    el.querySelector('[data-act="min"]').addEventListener('click', () => {
      el.style.display = 'none'; win.minimized = true; taskBtn.classList.remove('active');
      sound?.beep(520, 0.06);
    });
    el.addEventListener('pointerdown', () => bringToFront(win), true);

    windowsEl.appendChild(el);
    wins.set(id, win);
    makeDraggable(win);
    bringToFront(win);
    sound?.beep(760, 0.05);
    return win;
  }

  function close(id) {
    const w = wins.get(id);
    if (!w) return;
    w.el.remove();
    w.taskBtn.remove();
    wins.delete(id);
    sound?.beep(420, 0.06);
  }

  function closeAll() {
    [...wins.keys()].forEach(close);
    cascade = 0;
  }

  return { open, close, closeAll };
}
