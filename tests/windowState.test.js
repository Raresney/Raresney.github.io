import { describe, it, expect } from 'vitest';
import { createWindowState } from '../js/core/windowState.js';

describe('windowState', () => {
  it('open assigns increasing z and top', () => {
    const s = createWindowState(); s.open('a'); s.open('b');
    expect(s.get('b').z).toBeGreaterThan(s.get('a').z); expect(s.topId()).toBe('b');
  });
  it('re-opening focuses, un-minimizes and does not duplicate', () => {
    const s = createWindowState(); s.open('a'); s.open('b'); s.minimize('a'); s.open('a');
    expect(s.ids().filter((i) => i === 'a')).toHaveLength(1);
    expect(s.get('a').minimized).toBe(false); expect(s.topId()).toBe('a');
  });
  it('focus raises z', () => {
    const s = createWindowState(); s.open('a'); s.open('b'); s.focus('a');
    expect(s.topId()).toBe('a');
  });
  it('minimize hides from top; next becomes top; restore returns on top', () => {
    const s = createWindowState(); s.open('a'); s.open('b'); s.minimize('b');
    expect(s.topId()).toBe('a'); s.restore('b'); expect(s.topId()).toBe('b');
  });
  it('toggleMaximize flips twice back', () => {
    const s = createWindowState(); s.open('a'); s.toggleMaximize('a');
    expect(s.get('a').maximized).toBe(true); s.toggleMaximize('a'); expect(s.get('a').maximized).toBe(false);
  });
  it('close removes window', () => {
    const s = createWindowState(); s.open('a'); s.close('a');
    expect(s.ids()).toEqual([]); expect(s.get('a')).toBeUndefined(); expect(s.topId()).toBeNull();
  });
  it('unknown ids are ignored', () => {
    const s = createWindowState();
    expect(() => { s.focus('x'); s.minimize('x'); s.restore('x'); s.toggleMaximize('x'); s.close('x'); }).not.toThrow();
  });
});
