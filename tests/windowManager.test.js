import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWindowManager, clampRect } from '../js/core/windowManager.js';
import { createBus } from '../js/core/bus.js';

let root, bus, mount;
const apps = () => [
  { id: 'about', title: 'About', icon: 'i', mount },
  { id: 'blog', title: 'Blog', icon: 'b', mount: vi.fn() },
];
beforeEach(() => { document.body.innerHTML = '<div id="r"></div>'; root = document.getElementById('r'); bus = createBus(); mount = vi.fn(); });

describe('windowManager', () => {
  it('open creates exactly one window and mounts once', () => {
    createWindowManager({ root, bus, apps: apps() });
    bus.emit('open', 'about'); bus.emit('open', 'about');
    expect(root.querySelectorAll('.window[data-app=about]')).toHaveLength(1);
    expect(mount).toHaveBeenCalledTimes(1);
  });
  it('close removes the element', () => {
    createWindowManager({ root, bus, apps: apps() });
    bus.emit('open', 'about'); bus.emit('close', 'about');
    expect(root.querySelector('.window')).toBeNull();
  });
  it('unknown app id is ignored', () => {
    createWindowManager({ root, bus, apps: apps() });
    expect(() => bus.emit('open', 'zzz')).not.toThrow();
    expect(root.querySelector('.window')).toBeNull();
  });
  it('minimize adds class and restore removes it and raises window', () => {
    const wm = createWindowManager({ root, bus, apps: apps() });
    bus.emit('open', 'about'); bus.emit('open', 'blog'); wm.minimize('about');
    const a = root.querySelector('[data-app=about]'), b = root.querySelector('[data-app=blog]');
    expect(a.classList.contains('minimized')).toBe(true);
    wm.restore('about');
    expect(a.classList.contains('minimized')).toBe(false);
    expect(+a.style.zIndex).toBeGreaterThan(+b.style.zIndex);
  });
  it('toggle opens, minimizes then restores', () => {
    const wm = createWindowManager({ root, bus, apps: apps() });
    wm.toggle('about'); const a = root.querySelector('[data-app=about]');
    expect(a).not.toBeNull(); wm.toggle('about'); expect(a.classList.contains('minimized')).toBe(true);
    wm.toggle('about'); expect(a.classList.contains('minimized')).toBe(false);
  });
});
describe('clampRect', () => {
  const vp = { w: 1000, h: 800 };
  it('keeps title bar reachable at extreme negatives', () => {
    const r = clampRect({ x: -5000, y: -5000, w: 400, h: 300 }, vp);
    expect(r.x + r.w).toBeGreaterThanOrEqual(80); expect(r.y).toBeGreaterThanOrEqual(0);
  });
  it('keeps title bar reachable at extreme positives', () => {
    const r = clampRect({ x: 99999, y: 99999, w: 400, h: 300 }, vp);
    expect(r.x).toBeLessThanOrEqual(vp.w - 80); expect(r.y).toBeLessThanOrEqual(vp.h - 40);
  });
});
