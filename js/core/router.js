export function parseHash(hash, knownIds) {
  let h = String(hash ?? '').replace(/^#/, '');
  try { h = decodeURIComponent(h); } catch { return null; }
  h = h.toLowerCase();
  return knownIds.includes(h) ? h : null;
}
export const formatHash = (id) => (id ? '#' + id : '');

export function initRouter({ bus, knownIds }) {
  window.addEventListener('hashchange', () => {
    const id = parseHash(location.hash, knownIds);
    if (id) bus.emit('open', id);
  });
  bus.on('open', (id) => { if (knownIds.includes(id)) history.replaceState(null, '', formatHash(id)); });
  bus.on('close', () => history.replaceState(null, '', location.pathname + location.search));
}
