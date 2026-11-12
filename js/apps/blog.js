import { loadJson, showError, h } from '../core/util.js';

export function renderMarkdown(md) {
  return window.DOMPurify.sanitize(window.marked.parse(md));
}

export function isValidSlug(slug, index) {
  return typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug) && index.some((p) => p.slug === slug);
}

export const blogApp = {
  id: 'blog',
  title: 'Blog',
  icon: '📝',
  async mount(el) {
    let index;
    try {
      index = await loadJson('data/blog/index.json');
    } catch (e) {
      showError(el, `Could not load blog (${e.message})`);
      return;
    }

    const showList = () => {
      el.textContent = '';
      if (!index.length) {
        el.append(h('p', 'empty', 'No posts yet. Check back soon.'));
        return;
      }
      for (const p of index) {
        const b = h('button', 'post-link'); b.type = 'button';
        b.append(h('strong', null, p.title), h('span', 'date', ' ' + p.date), h('p', null, p.summary));
        b.addEventListener('click', () => showPost(p.slug));
        el.append(b);
      }
    };

    const showPost = async (slug) => {
      if (!isValidSlug(slug, index)) return showError(el, 'Unknown post');
      try {
        const res = await fetch(`data/blog/${slug}.md`);
        if (!res.ok) throw new Error(String(res.status));
        const md = await res.text();
        el.textContent = '';
        const back = h('button', 'back', '← back'); back.type = 'button';
        back.addEventListener('click', showList);
        const body = h('article', 'post');
        body.innerHTML = renderMarkdown(md);
        el.append(back, body);
      } catch (e) {
        showError(el, `Could not load post (${e.message})`);
      }
    };

    showList();
  },
};
