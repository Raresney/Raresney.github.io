import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aboutApp, renderAbout } from '../js/apps/about.js';

let el;
beforeEach(() => { el = document.createElement('div'); });
afterEach(() => vi.unstubAllGlobals());
const data = {
  name: 'Rares', tagline: 't', bio: 'hi', skills: ['a', 'b'], email: 'a@b.co',
  links: [{ label: 'GH', url: 'https://github.com/Raresney' }, { label: 'bad', url: 'javascript:alert(1)' }],
};

describe('about', () => {
  it('renders name, skills and safe links', () => {
    renderAbout(el, data);
    expect(el.textContent).toContain('Rares');
    expect(el.querySelectorAll('.chip')).toHaveLength(2);
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://github.com/Raresney');
    expect(hrefs.some((h) => h.startsWith('javascript'))).toBe(false);
  });
  it('fetch rejection shows inline error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    await aboutApp.mount(el, {});
    expect(el.querySelector('.app-error')).not.toBeNull();
  });
});
