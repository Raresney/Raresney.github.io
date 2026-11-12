import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { terminalApp, renderLines } from '../js/apps/terminal.js';
import { createBus } from '../js/core/bus.js';

let el, bus;
const tick = () => new Promise((r) => setTimeout(r, 0));
const key = (input, k) => input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
async function type(line) {
  const input = el.querySelector('input');
  input.value = line;
  key(input, 'Enter');
  await tick();
}
beforeEach(() => {
  el = document.createElement('div');
  document.body.append(el);
  bus = createBus();
  terminalApp.mount(el, { bus });
});
afterEach(() => vi.unstubAllGlobals());

describe('terminal', () => {
  it('renderLines never creates html', () => {
    const c = document.createElement('div');
    renderLines(c, ['<img src=x onerror=alert(1)>']);
    expect(c.querySelector('img')).toBeNull();
    expect(c.textContent).toContain('<img');
  });
  it('open blog emits open', async () => {
    const fn = vi.fn(); bus.on('open', fn);
    await type('open blog');
    expect(fn).toHaveBeenCalledWith('blog');
  });
  it('open ../x errors and emits nothing', async () => {
    const fn = vi.fn(); bus.on('open', fn);
    await type('open ../x');
    expect(fn).not.toHaveBeenCalled();
    expect(el.querySelector('.output').textContent).toMatch(/unknown app/);
  });
  it('cat nope.txt', async () => {
    await type('cat nope.txt');
    expect(el.querySelector('.output').textContent).toContain('cat: nope.txt: no such file');
  });
  it('cat ../../x never fetches', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    await type('cat ../../x');
    expect(f).not.toHaveBeenCalled();
  });
  it('clear empties output', async () => {
    await type('help');
    expect(el.querySelector('.output').children.length).toBeGreaterThan(0);
    await type('clear');
    expect(el.querySelector('.output').children.length).toBe(0);
  });
  it('empty enter adds no output', async () => {
    const before = el.querySelector('.output').children.length;
    await type('   ');
    expect(el.querySelector('.output').children.length).toBe(before);
  });
  it('tab completes single match', () => {
    const input = el.querySelector('input');
    input.value = 'cle';
    key(input, 'Tab');
    expect(input.value).toBe('clear');
  });
  it('tab with no match does nothing', () => {
    const input = el.querySelector('input');
    input.value = 'zzz';
    key(input, 'Tab');
    expect(input.value).toBe('zzz');
  });
  it('contact opens about', async () => {
    const fn = vi.fn(); bus.on('open', fn);
    await type('contact');
    expect(fn).toHaveBeenCalledWith('about');
  });
});
