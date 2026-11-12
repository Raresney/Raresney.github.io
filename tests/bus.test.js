import { describe, it, expect, vi } from 'vitest';
import { createBus } from '../js/core/bus.js';

describe('bus', () => {
  it('delivers payload to all subscribers', () => {
    const b = createBus(); const a = vi.fn(), c = vi.fn();
    b.on('open', a); b.on('open', c); b.emit('open', 'blog');
    expect(a).toHaveBeenCalledWith('blog'); expect(c).toHaveBeenCalledWith('blog');
  });
  it('unsubscribe stops delivery', () => {
    const b = createBus(); const a = vi.fn(); const off = b.on('x', a);
    off(); b.emit('x', 1); expect(a).not.toHaveBeenCalled();
  });
  it('emit without subscribers does not throw', () => {
    expect(() => createBus().emit('nothing')).not.toThrow();
  });
  it('a throwing subscriber does not block others', () => {
    const b = createBus(); const ok = vi.fn(); const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    b.on('x', () => { throw new Error('boom'); }); b.on('x', ok); b.emit('x');
    expect(ok).toHaveBeenCalled(); err.mockRestore();
  });
});
