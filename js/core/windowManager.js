import { createWindowState } from './windowState.js';

const MIN_VISIBLE = 80;
const BAR_H = 40;

export function clampRect(rect, vp) {
  const w = Math.max(240, rect.w), h = Math.max(160, rect.h);
  const x = Math.min(Math.max(rect.x, MIN_VISIBLE - w), vp.w - MIN_VISIBLE);
  const y = Math.min(Math.max(rect.y, 0), vp.h - BAR_H);
  return { x, y, w, h };
}

export function createWindowManager({ root, bus, apps }) {
  const state = createWindowState();
  const byId = new Map(apps.map((a) => [a.id, a]));
  const els = new Map();
  let cascade = 0;

  const vp = () => ({ w: window.innerWidth || 1024, h: window.innerHeight || 768 });
  const render = (id) => {
    const el = els.get(id), w = state.get(id);
    if (!el || !w) return;
    el.style.zIndex = String(w.z);
    el.classList.toggle('minimized', w.minimized);
    el.classList.toggle('maximized', w.maximized);
  };
  const renderAll = () => state.ids().forEach(render);

  function applyRect(el, r) {
    const c = clampRect(r, vp());
    Object.assign(el.style, { left: c.x + 'px', top: c.y + 'px', width: c.w + 'px', height: c.h + 'px' });
  }
  const readRect = (el) => ({
    x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0,
    w: parseFloat(el.style.width) || 560, h: parseFloat(el.style.height) || 400,
  });

  function drag(el, handle, mode) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || el.classList.contains('maximized')) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY, r: readRect(el) };
      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        applyRect(el, mode === 'move'
          ? { ...start.r, x: start.r.x + dx, y: start.r.y + dy }
          : { ...start.r, w: start.r.w + dx, h: start.r.h + dy });
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  function create(app) {
    const el = document.createElement('section');
    el.className = 'window';
    el.dataset.app = app.id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', app.title);
    const bar = document.createElement('div'); bar.className = 'titlebar';
    const title = document.createElement('span'); title.className = 'title'; title.textContent = app.title;
    const btns = document.createElement('div'); btns.className = 'wbtns';
    for (const [cls, label, fn] of [
      ['min', 'Minimize', () => api.minimize(app.id)],
      ['max', 'Maximize', () => { state.toggleMaximize(app.id); render(app.id); }],
      ['close', 'Close', () => bus.emit('close', app.id)],
    ]) {
      const b = document.createElement('button'); b.className = cls; b.type = 'button';
      b.setAttribute('aria-label', label); b.addEventListener('click', fn); btns.append(b);
    }
    bar.append(title, btns);
    const content = document.createElement('div'); content.className = 'content';
    const handle = document.createElement('div'); handle.className = 'resize';
    el.append(bar, content, handle);
    const offset = (cascade++ % 6) * 28;
    // start right of the desktop icon column (icons occupy x < ~120)
    applyRect(el, { x: 140 + offset, y: 60 + offset, w: Math.min(620, vp().w - 180), h: 420 });
    el.addEventListener('pointerdown', () => api.focus(app.id));
    drag(el, bar, 'move'); drag(el, handle, 'resize');
    root.append(el);
    els.set(app.id, el);
    app.mount(content, { bus });
  }

  const api = {
    open(id) {
      const app = byId.get(id);
      if (!app) return;
      if (!els.has(id)) create(app);
      state.open(id); renderAll();
    },
    close(id) { els.get(id)?.remove(); els.delete(id); state.close(id); },
    minimize(id) { state.minimize(id); renderAll(); },
    restore(id) { state.restore(id); renderAll(); },
    focus(id) { state.focus(id); renderAll(); },
    toggle(id) {
      const w = state.get(id);
      if (!w) api.open(id);
      else if (w.minimized) api.restore(id);
      else if (state.topId() === id) api.minimize(id);
      else api.focus(id);
    },
    isOpen: (id) => !!state.get(id),
  };
  bus.on('open', (id) => api.open(id));
  bus.on('close', (id) => api.close(id));
  return api;
}
