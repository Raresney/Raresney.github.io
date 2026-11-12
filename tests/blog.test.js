import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { marked } from 'marked';
import createDOMPurify from 'dompurify';

window.marked = { parse: (s) => marked.parse(s) };
window.DOMPurify = createDOMPurify(window);
const { blogApp, renderMarkdown, isValidSlug } = await import('../js/apps/blog.js');

const index = [{ slug: 'hello-world', title: 'Hi', date: '2026-01-01', summary: 's' }];
const tick = () => new Promise((r) => setTimeout(r, 0));
let el;
beforeEach(() => { el = document.createElement('div'); });
afterEach(() => vi.unstubAllGlobals());

describe('blog', () => {
  it('strips script', () => {
    expect(renderMarkdown('<script>alert(1)</script>hi')).not.toMatch(/<script/i);
  });
  it('strips javascript: hrefs', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toMatch(/javascript:/i);
  });
  it('slug validation', () => {
    expect(isValidSlug('hello-world', index)).toBe(true);
    expect(isValidSlug('../etc', index)).toBe(false);
    expect(isValidSlug('other', index)).toBe(false);
  });
  it('fetch failure shows inline error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    await blogApp.mount(el, {});
    expect(el.querySelector('.app-error')).not.toBeNull();
  });
  it('lists posts and opens one', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u) => (u.endsWith('index.json')
      ? { ok: true, json: async () => index }
      : { ok: true, text: async () => '# Title\n\nbody' })));
    await blogApp.mount(el, {});
    expect(el.querySelectorAll('.post-link')).toHaveLength(1);
    el.querySelector('.post-link').click();
    await tick();
    expect(el.querySelector('h1').textContent).toBe('Title');
  });
  it('post 404 shows inline error', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u) => (u.endsWith('index.json')
      ? { ok: true, json: async () => index }
      : { ok: false, status: 404 })));
    await blogApp.mount(el, {});
    el.querySelector('.post-link').click();
    await tick();
    expect(el.querySelector('.app-error')).not.toBeNull();
  });
  it('empty index shows friendly message, not an error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    await blogApp.mount(el, {});
    expect(el.querySelector('.app-error')).toBeNull();
    expect(el.textContent).toMatch(/no posts yet/i);
  });
});
