import { describe, it, expect } from 'vitest';
import { parseLine, createRegistry, createHistory, commonPrefix } from '../js/core/commands.js';

describe('parseLine', () => {
  it('parses name and args', () => expect(parseLine('  open   blog ')).toEqual({ name: 'open', args: ['blog'] }));
  it('empty -> null', () => { expect(parseLine('')).toBeNull(); expect(parseLine('   ')).toBeNull(); });
});
describe('registry', () => {
  it('runs known command', async () => {
    const r = createRegistry(); r.register('echo', (a) => [a.join(' ')], 'echo');
    expect(await r.run('echo hi there', {})).toEqual(['hi there']);
  });
  it('unknown command', async () => {
    expect(await createRegistry().run('nope', {})).toEqual(["command not found: nope. type 'help'"]);
  });
  it('throwing handler', async () => {
    const r = createRegistry(); r.register('bad', () => { throw new Error('x'); }, 'bad');
    expect(await r.run('bad', {})).toEqual(['error: x']);
  });
  it('empty line gives no output', async () => expect(await createRegistry().run('  ', {})).toEqual([]));
  it('script argument returned verbatim', async () => {
    const r = createRegistry(); r.register('echo', (a) => [a.join(' ')], 'echo');
    expect(await r.run('echo <script>', {})).toEqual(['<script>']);
  });
  it('complete', () => {
    const r = createRegistry(); r.register('projects', () => [], ''); r.register('profile', () => [], ''); r.register('blog', () => [], '');
    expect(r.complete('p')).toEqual(['profile', 'projects']); expect(r.complete('z')).toEqual([]);
  });
});
describe('commonPrefix', () => {
  it('works', () => { expect(commonPrefix(['projects', 'profile'])).toBe('pro'); expect(commonPrefix([])).toBe(''); });
});
describe('history', () => {
  it('navigates', () => {
    const h = createHistory(); h.push('a'); h.push('b'); h.push('b'); h.push('  ');
    expect(h.prev()).toBe('b'); expect(h.prev()).toBe('a'); expect(h.prev()).toBe('a');
    expect(h.next()).toBe('b'); expect(h.next()).toBe('');
  });
});
