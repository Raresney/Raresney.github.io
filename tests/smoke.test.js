import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('index.html', () => {
  it('has desktop root and module entry', () => {
    expect(html).toContain('id="desktop"');
    expect(html).toContain('js/main.js');
  });
  it('loads marked and purify', () => {
    expect(html).toMatch(/marked/);
    expect(html).toMatch(/purify/i);
  });
  it('pins every cdnjs url to a version', () => {
    const urls = html.match(/https:\/\/cdnjs[^"']+/g) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u).toMatch(/\/\d+\.\d+\.\d+\//);
  });
});
