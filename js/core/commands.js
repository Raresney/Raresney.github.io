export function parseLine(line) {
  const parts = String(line ?? '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? { name: parts[0], args: parts.slice(1) } : null;
}
export function commonPrefix(names) {
  if (!names.length) return '';
  let p = names[0];
  for (const n of names) while (!n.startsWith(p)) p = p.slice(0, -1);
  return p;
}
export function createRegistry() {
  const cmds = new Map();
  return {
    register(name, handler, desc) { cmds.set(name, { handler, desc }); },
    async run(line, ctx) {
      const p = parseLine(line);
      if (!p) return [];
      const c = cmds.get(p.name);
      if (!c) return [`command not found: ${p.name}. type 'help'`];
      try { return await c.handler(p.args, ctx); } catch (e) { return [`error: ${e.message}`]; }
    },
    complete(prefix) { return [...cmds.keys()].filter((n) => n.startsWith(prefix)).sort(); },
    list() { return [...cmds].map(([name, c]) => ({ name, desc: c.desc })); },
  };
}
export function createHistory() {
  const items = []; let i = 0;
  return {
    push(line) {
      const l = String(line ?? '').trim();
      if (l && items[items.length - 1] !== l) items.push(l);
      i = items.length;
    },
    prev() { if (!items.length) return ''; i = Math.max(0, i - 1); return items[i]; },
    next() { if (i >= items.length - 1) { i = items.length; return ''; } i++; return items[i]; },
  };
}
