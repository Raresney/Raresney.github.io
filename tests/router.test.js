import { describe, it, expect, vi } from 'vitest';
import { parseHash, formatHash, initRouter } from '../js/core/router.js';
import { createBus } from '../js/core/bus.js';

const ids = ['terminal', 'projects', 'about', 'blog'];
describe('router', () => {
  it('parses known ids case-insensitively', () => {
    expect(parseHash('#projects', ids)).toBe('projects');
    expect(parseHash('#PROJECTS', ids)).toBe('projects');
  });
  it('rejects odd or unknown hashes', () => {
    for (const h of ['#../x', '#%00', '', '#unknown', '#%E0%A4%A']) expect(parseHash(h, ids)).toBeNull();
  });
  it('formatHash', () => {
    expect(formatHash(null)).toBe(''); expect(formatHash('blog')).toBe('#blog');
  });
  it('hashchange emits open', () => {
    const bus = createBus(); const fn = vi.fn(); bus.on('open', fn);
    initRouter({ bus, knownIds: ids });
    location.hash = '#blog'; window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(fn).toHaveBeenCalledWith('blog');
  });
});
