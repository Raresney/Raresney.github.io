export function createWindowState() {
  const wins = new Map();
  let z = 0;
  const bump = (w) => { w.z = ++z; };
  return {
    open(id) {
      let w = wins.get(id);
      if (!w) { w = { id, z: 0, minimized: false, maximized: false }; wins.set(id, w); }
      w.minimized = false; bump(w);
    },
    close(id) { wins.delete(id); },
    focus(id) { const w = wins.get(id); if (w && !w.minimized) bump(w); },
    minimize(id) { const w = wins.get(id); if (w) w.minimized = true; },
    restore(id) { const w = wins.get(id); if (w) { w.minimized = false; bump(w); } },
    toggleMaximize(id) { const w = wins.get(id); if (w) w.maximized = !w.maximized; },
    get(id) { const w = wins.get(id); return w ? { ...w } : undefined; },
    topId() {
      let top = null;
      for (const w of wins.values()) if (!w.minimized && (!top || w.z > top.z)) top = w;
      return top ? top.id : null;
    },
    ids() { return [...wins.keys()]; },
  };
}
