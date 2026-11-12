# Portfolio Desktop

A personal portfolio styled as a modern OS desktop: draggable glass windows, a dock, and an interactive terminal. Plain HTML/CSS/JS (ES modules), no build step.

## Run locally

```bash
python -m http.server 8765
```

Open http://localhost:8765. Deep links work: `#terminal`, `#projects`, `#about`, `#blog`.

## Edit your content

- Projects: `data/projects.json` (`title`, `description`, `tags`, `url`; only `https://` links are rendered).
- About and contact: `data/about.json`.
- Blog: add `data/blog/<slug>.md` (slug is lowercase letters, digits and dashes) and list it in `data/blog/index.json`.
- Accent color: `--accent` in `css/base.css`. The terminal `theme` command toggles an alternate color.

## Add a terminal command

Register it in `buildRegistry()` in `js/apps/terminal.js`:

```js
r.register('hello', () => ['hi!'], 'say hi');
```

## Tests

```bash
npm install
npm test
```

Vitest is dev-only; the site itself needs no `node_modules`.

## Deploy (GitHub Pages)

Push to GitHub, then Settings → Pages → deploy from branch `main`, folder `/ (root)`.
