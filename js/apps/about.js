import { safeUrl, loadJson, showError, h } from '../core/util.js';

export function renderAbout(el, d) {
  el.textContent = '';
  el.append(h('h2', null, d.name), h('p', 'tagline', d.tagline), h('p', null, d.bio));
  const chips = h('div', 'chips');
  for (const s of d.skills ?? []) chips.append(h('span', 'chip', s));
  el.append(chips);
  const list = h('ul', 'links');
  for (const l of d.links ?? []) {
    const url = safeUrl(l.url, ['https:', 'mailto:']);
    if (!url) continue;
    const a = h('a', null, l.label);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    const li = h('li'); li.append(a); list.append(li);
  }
  const mail = safeUrl('mailto:' + (d.email ?? ''), ['mailto:']);
  if (d.email && mail) {
    const a = h('a', null, d.email); a.href = mail;
    const li = h('li'); li.append(a); list.append(li);
  }
  el.append(list);
}

export const aboutApp = {
  id: 'about',
  title: 'About',
  icon: '👤',
  async mount(el) {
    try {
      renderAbout(el, await loadJson('data/about.json'));
    } catch (e) {
      showError(el, `Could not load about (${e.message})`);
    }
  },
};
