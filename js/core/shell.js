import { createWindowManager } from './windowManager.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export function mountShell({ root, apps, bus, owner, boot = false }) {
  root.textContent = '';
  const bg = el('div', 'bg');

  const top = el('header', 'topbar');
  const clock = el('span', 'clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);
  top.append(el('span', 'owner', owner), el('span', 'status', '● online'), clock);

  const icons = el('nav', 'icons');
  icons.setAttribute('aria-label', 'Desktop');
  const dock = el('nav', 'dock');
  dock.setAttribute('aria-label', 'Dock');

  const windows = el('div', 'windows');
  const wm = createWindowManager({ root: windows, bus, apps });

  for (const app of apps) {
    const ic = el('div', 'desk-icon');
    ic.dataset.app = app.id; ic.tabIndex = 0; ic.setAttribute('role', 'button');
    ic.append(el('span', 'glyph', app.icon), el('span', 'label', app.title));
    const open = () => bus.emit('open', app.id);
    ic.addEventListener('dblclick', open);
    ic.addEventListener('click', open);
    ic.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    icons.append(ic);

    const b = el('button', null, app.icon);
    b.type = 'button'; b.dataset.app = app.id; b.setAttribute('aria-label', app.title); b.title = app.title;
    b.addEventListener('click', () => wm.toggle(app.id));
    dock.append(b);
  }

  root.append(bg, top, icons, windows, dock);

  if (boot && !reducedMotion()) {
    const ov = el('div', 'boot');
    const pre = el('pre', null, '> init portfolio...\n> loading modules... ok\n> mounting desktop... ok\n\n[ press any key to skip ]');
    ov.append(pre); root.append(ov);
    const done = () => {
      ov.remove();
      document.removeEventListener('keydown', done); ov.removeEventListener('click', done);
    };
    document.addEventListener('keydown', done);
    ov.addEventListener('click', done);
    setTimeout(done, 2500);
  }
  return wm;
}
