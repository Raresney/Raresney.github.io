import { describe, it, expect } from 'vitest';
import { safeUrl } from '../js/core/util.js';

describe('safeUrl', () => {
  it('allows listed schemes', () => {
    expect(safeUrl('https://github.com/x', ['https:'])).toBe('https://github.com/x');
    expect(safeUrl('mailto:a@b.co', ['https:', 'mailto:'])).toBe('mailto:a@b.co');
  });
  it('rejects javascript, relative, invalid, non-listed', () => {
    for (const u of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', '/x', 'x', '', 'http://a.co', 'data:text/html,hi'])
      expect(safeUrl(u, ['https:'])).toBeNull();
    expect(safeUrl(undefined, ['https:'])).toBeNull();
  });
});
