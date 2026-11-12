import { safeUrl, loadJson, showError, h } from '../core/util.js';

export function renderProjects(el, projects) {
  el.textContent = '';
  const grid = h('div', 'card-grid');
  for (const p of projects) {
    const card = h('article', 'card');
    card.append(h('h3', null, p.title), h('p', null, p.description));
    const chips = h('div', 'chips');
    for (const t of p.tags ?? []) chips.append(h('span', 'chip', t));
    card.append(chips);
    const url = safeUrl(p.url, ['https:']);
    if (url) {
      const a = h('a', null, 'GitHub');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      card.append(a);
    }
    grid.append(card);
  }
  el.append(grid);
}

export const projectsApp = {
  id: 'projects',
  title: 'Projects',
  icon: '📁',
  async mount(el) {
    try {
      renderProjects(el, await loadJson('data/projects.json'));
    } catch (e) {
      showError(el, `Could not load projects (${e.message})`);
    }
  },
};
