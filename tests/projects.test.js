import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { projectsApp, renderProjects } from '../js/apps/projects.js';

let el;
beforeEach(() => { el = document.createElement('div'); document.body.append(el); });
afterEach(() => vi.unstubAllGlobals());

describe('projects', () => {
  it('one card per project', () => {
    renderProjects(el, [
      { title: 'A', description: 'd', tags: ['x'], url: 'https://g.co' },
      { title: 'B', description: 'd', tags: [], url: 'https://g.co' },
    ]);
    expect(el.querySelectorAll('.card')).toHaveLength(2);
  });
  it('titles are text, not html', () => {
    renderProjects(el, [{ title: '<b>x</b>', description: '<img src=x onerror=1>', tags: ['<i>'], url: 'https://g.co' }]);
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('i')).toBeNull();
    expect(el.textContent).toContain('<b>x</b>');
  });
  it('javascript url is not a link', () => {
    renderProjects(el, [{ title: 'A', description: '', tags: [], url: 'javascript:alert(1)' }]);
    expect(el.querySelector('a')).toBeNull();
  });
  it('https link is safe', () => {
    renderProjects(el, [{ title: 'A', description: '', tags: [], url: 'https://g.co' }]);
    const a = el.querySelector('a');
    expect(a.rel).toContain('noopener');
    expect(a.target).toBe('_blank');
  });
  it('fetch failure shows inline error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    await projectsApp.mount(el, {});
    expect(el.querySelector('.app-error')).not.toBeNull();
  });
  it('invalid json shows inline error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error('bad'); } }));
    await projectsApp.mount(el, {});
    expect(el.querySelector('.app-error')).not.toBeNull();
  });
});
