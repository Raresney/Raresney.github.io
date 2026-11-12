import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountShell } from '../js/core/shell.js';
import { createBus } from '../js/core/bus.js';

let root, bus;
const apps = [
  { id: 'about', title: 'About', icon: 'A', mount: vi.fn() },
  { id: 'blog', title: 'Blog', icon: 'B', mount: vi.fn() },
];
beforeEach(() => { document.body.innerHTML = '<div id="d"></div>'; root = document.getElementById('d'); bus = createBus(); });

describe('shell', () => {
  it('renders one icon and one dock button per app', () => {
    mountShell({ root, apps, bus, owner: 'Rares' });
    expect(root.querySelectorAll('.desk-icon')).toHaveLength(2);
    expect(root.querySelectorAll('.dock button')).toHaveLength(2);
  });
  it('dock buttons have aria-label', () => {
    mountShell({ root, apps, bus, owner: 'Rares' });
    for (const b of root.querySelectorAll('.dock button')) expect(b.getAttribute('aria-label')).toBeTruthy();
  });
  it('Enter on an icon emits open', () => {
    const fn = vi.fn(); bus.on('open', fn);
    mountShell({ root, apps, bus, owner: 'Rares' });
    root.querySelector('.desk-icon[data-app=blog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fn).toHaveBeenCalledWith('blog');
  });
  it('shows owner name in top bar', () => {
    mountShell({ root, apps, bus, owner: 'Rares' });
    expect(root.querySelector('.topbar').textContent).toContain('Rares');
  });
  it('boot overlay is removed after keydown', () => {
    mountShell({ root, apps, bus, owner: 'Rares', boot: true });
    expect(root.querySelector('.boot')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
    expect(root.querySelector('.boot')).toBeNull();
  });
});
