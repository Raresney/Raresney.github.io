export function safeUrl(url, schemes) {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url.trim());
    return schemes.includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}

export async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

export function showError(el, message) {
  el.textContent = '';
  const d = document.createElement('div');
  d.className = 'app-error';
  d.textContent = message;
  el.append(d);
}

export function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
