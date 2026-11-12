import { createRegistry, createHistory, commonPrefix } from '../core/commands.js';
import { loadJson } from '../core/util.js';

const APPS = ['terminal', 'projects', 'about', 'blog'];
const FILES = ['about.txt', 'projects.json', 'contact.txt', 'blog/'];
const PROMPT = 'visitor@portfolio:~$';

const canType = () =>
  !!(window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Append lines as text nodes only (never HTML). Types char-by-char when `typed`. */
export function renderLines(container, lines, { typed = false } = {}) {
  for (const line of lines) {
    const row = document.createElement('div');
    row.className = 'line';
    container.append(row);
    if (!typed) { row.textContent = line; continue; }
    let i = 0;
    const step = () => {
      i = Math.min(line.length, i + 3);
      row.textContent = line.slice(0, i);
      if (i < line.length) requestAnimationFrame(step);
    };
    step();
  }
}

function buildRegistry() {
  const r = createRegistry();
  const open = (id) => (ctx) => { ctx.bus.emit('open', id); return [`opening ${id}...`]; };

  r.register('help', () => r.list().map((c) => `${c.name.padEnd(10)} ${c.desc}`), 'show this help');
  r.register('ls', () => FILES, 'list files');
  r.register('cat', async ([file]) => {
    if (!FILES.includes(file) || file === 'blog/') return [`cat: ${file ?? ''}: no such file`];
    try {
      if (file === 'projects.json') {
        return (await loadJson('data/projects.json')).map((p) => `${p.title} - ${p.description}`);
      }
      const a = await loadJson('data/about.json');
      return file === 'about.txt'
        ? [a.name, a.tagline, '', a.bio]
        : [`email: ${a.email}`, ...(a.links ?? []).map((l) => `${l.label}: ${l.url}`)];
    } catch (e) {
      return [`cat: ${file}: ${e.message}`];
    }
  }, 'print a file');
  r.register('open', ([id], ctx) => {
    if (!APPS.includes(id)) return [`open: unknown app '${id ?? ''}'. try: ${APPS.join(', ')}`];
    return open(id)(ctx);
  }, 'open an app window');
  r.register('about', (_a, ctx) => open('about')(ctx), 'open About');
  r.register('projects', (_a, ctx) => open('projects')(ctx), 'open Projects');
  r.register('blog', (_a, ctx) => open('blog')(ctx), 'open Blog');
  r.register('contact', (_a, ctx) => open('about')(ctx), 'open contact info');
  r.register('clear', (_a, ctx) => { ctx.clear(); return []; }, 'clear the screen');
  r.register('theme', () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'violet' ? '' : 'violet';
    if (next) root.dataset.theme = next; else delete root.dataset.theme;
    return [`theme: ${next || 'green'}`];
  }, 'toggle accent color');
  return r;
}

export const terminalApp = {
  id: 'terminal',
  title: 'Terminal',
  icon: '>_',
  mount(el, { bus }) {
    el.classList.add('terminal');
    el.textContent = '';
    const output = document.createElement('div'); output.className = 'output';
    const row = document.createElement('div'); row.className = 'inputrow';
    const prompt = document.createElement('span'); prompt.className = 'prompt'; prompt.textContent = PROMPT;
    const input = document.createElement('input');
    input.type = 'text'; input.spellcheck = false; input.autocomplete = 'off';
    input.setAttribute('aria-label', 'terminal input');
    row.append(prompt, input);
    el.append(output, row);

    const registry = buildRegistry();
    const history = createHistory();
    const ctx = { bus, clear: () => { output.textContent = ''; } };
    const typed = canType();
    const print = (lines) => renderLines(output, lines, { typed });

    print([
      'Bighiu Rares (Raresney) - Cyber Security Analyst (CSIRT) | Security Researcher',
      "type 'help' for commands, or try: projects, about, blog.",
    ]);
    el.addEventListener('click', () => input.focus());
    const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!touch) input.focus();

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const line = input.value;
        input.value = '';
        if (!line.trim()) return;
        history.push(line);
        renderLines(output, [`${PROMPT} ${line}`]);
        print(await registry.run(line, ctx));
        el.scrollTop = el.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); input.value = history.prev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault(); input.value = history.next();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const prefix = input.value.trim();
        if (!prefix || /\s/.test(prefix)) return;
        const matches = registry.complete(prefix);
        if (!matches.length) return;
        input.value = matches.length === 1 ? matches[0] : commonPrefix(matches);
        if (matches.length > 1) print([matches.join('  ')]);
      }
    });
  },
};
