# Portfolio Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A modern-OS-style portfolio site (desktop, windows, dock) with an interactive terminal, Projects, About/Contact and Blog apps, deployable on GitHub Pages with no build step.

**Architecture:** Pure-logic modules (bus, window state, router, command registry) are unit-tested with Vitest. DOM modules (window manager, apps, shell) consume them. Apps follow `{ id, title, icon, mount(el, ctx) }` and talk to the rest only through the bus.

**Tech Stack:** HTML/CSS/vanilla JS (ES modules), Vitest (dev only, `jsdom` env), `marked@12.0.2` and `DOMPurify@3.1.6` as pinned globals from cdnjs, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-12-portfolio-desktop-design.md`

## Global Constraints

- Plain HTML/CSS/JS, ES modules, no framework, no build step; Vitest is dev-only and the site must run without `node_modules`.
- Accent color is the single CSS variable `--accent: #39ff88`. Fonts: JetBrains Mono (terminal/code), Inter (UI).
- Terminal and app output is rendered as text nodes, never raw HTML. Blog Markdown goes through `marked` then `DOMPurify.sanitize` before insertion.
- Honor `prefers-reduced-motion` (no animations).
- Mobile: below 700px windows are full-screen, dock stays at the bottom.
- Deep links: `#projects`, `#about`, `#blog`, `#terminal` open that app; unknown hashes are ignored.
- Commits: do NOT add a `Co-Authored-By` line (owner preference).
- App ids are exactly: `terminal`, `projects`, `about`, `blog`.

## Review Focus

- Empty or whitespace-only terminal input: no output, no error, no history entry.
- `<script>`/HTML in terminal arguments, project JSON fields and blog Markdown: shown as inert text or stripped, never executed.
- Unknown or odd hash (`#../x`, `#%00`, `#PROJECTS`): ignored or normalized, never throws.
- Blog slug comes only from `blog/index.json` (whitelist); `cat ../../x` or `open ../x` never fetches outside `data/`.
- Tab on an ambiguous prefix completes only the common prefix; Tab on no match does nothing.
- A window dragged or resized outside the viewport is clamped so its title bar stays reachable.
- A data file that fails to load (404/invalid JSON) shows an inline error; the rest of the desktop works.
- Restoring a minimized window from the dock and double-open of an already open app must focus, not duplicate.

---

### Task 1: Project scaffold and test tooling

**Files:**
- Create: `package.json`, `vitest.config.js`, `.gitignore`, `index.html`, `css/base.css`, `js/main.js`
- Test: `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test` runs Vitest with `jsdom`; `index.html` loads `css/base.css`, the cdnjs scripts (marked 12.0.2, DOMPurify 3.1.6) and `<script type="module" src="js/main.js">`; `body` contains `<div id="desktop">`.

- [ ] **Step 1: Write failing smoke test** `tests/smoke.test.js`: reads `index.html`, asserts it contains `id="desktop"`, `js/main.js`, `marked`, `purify`, and no unpinned CDN URL (every `cdnjs` URL contains a `/<digits>.<digits>.<digits>/` segment).
- [ ] **Step 2: Run** `npx vitest run` → FAIL (no files).
- [ ] **Step 3: Create** `package.json` (`"type":"module"`, script `test: vitest run`, devDeps `vitest`, `jsdom`, `marked@12.0.2`, `dompurify@3.1.6`; the last two are used only by Task 11 tests), `vitest.config.js` (`environment: 'jsdom'`), `.gitignore` (`node_modules`), `index.html` (viewport meta, Inter + JetBrains Mono from Google Fonts, base.css, pinned scripts, `#desktop`, module script), `base.css` (`:root` vars incl. `--accent`, dark background, reduced-motion media query disabling animations/transitions), `main.js` (empty placeholder export). Run `npm install`.
- [ ] **Step 4: Run** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `git add -A && git commit -m "Scaffold project and test tooling"`

### Task 2: Event bus

**Files:** Create `js/core/bus.js`; Test `tests/bus.test.js`

**Interfaces:**
- Produces: `createBus(): { on(evt: string, fn: (payload?: any) => void): () => void, emit(evt: string, payload?: any): void }` and default export `bus = createBus()`. Events used project-wide: `open` (payload: app id), `close` (app id), `focus` (app id).

- [ ] **Step 1: Write failing tests:** `emit` calls all subscribers with payload; `on` returns an unsubscribe that stops delivery; emitting an event with no subscribers does not throw; a throwing subscriber does not stop other subscribers.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `createBus` with a `Map<string, Set<fn>>`; wrap each handler call in try/catch (log with `console.error`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -am "Add event bus"` (after `git add`).

### Task 3: Window state (pure logic)

**Files:** Create `js/core/windowState.js`; Test `tests/windowState.test.js`

**Interfaces:**
- Produces: `createWindowState()` returning `{ open(id), close(id), focus(id), minimize(id), restore(id), toggleMaximize(id), get(id): {id:string, z:number, minimized:boolean, maximized:boolean}|undefined, topId(): string|null, ids(): string[] }`. `topId()` is the non-minimized window with highest `z`.

- [ ] **Step 1: Write failing tests:** open assigns increasing `z` and makes it top; opening an already-open id focuses it (no duplicate in `ids()`) and un-minimizes it; `focus` raises `z` above others; `minimize` removes it from `topId()` and the next window becomes top; `restore` brings it back on top; `toggleMaximize` flips twice back to original; `close` removes it from `ids()` and `get` returns `undefined`; operations on unknown ids do nothing and do not throw.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** with a `Map` and a monotonically increasing z counter.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 4: Router (hash parsing)

**Files:** Create `js/core/router.js`; Test `tests/router.test.js`

**Interfaces:**
- Produces: `parseHash(hash: string, knownIds: string[]): string|null` (strips leading `#`, lowercases, returns id only if in `knownIds`, else `null`); `formatHash(id: string|null): string` (`'#'+id` or `''`); `initRouter({ bus, knownIds })` wires `hashchange` → `bus.emit('open', id)` and bus `open`/`close` events → `history.replaceState` hash update.

- [ ] **Step 1: Write failing tests:** `parseHash('#projects', ids)` → `'projects'`; `'#PROJECTS'` → `'projects'`; `'#../x'`, `'#%00'`, `''`, `'#unknown'` → `null`; `formatHash(null)` → `''`; `initRouter` with jsdom: setting `location.hash='#blog'` and dispatching `hashchange` emits `open` with `'blog'`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (wrap `decodeURIComponent` in try/catch → `null`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 5: Terminal command engine (pure logic)

**Files:** Create `js/core/commands.js`; Test `tests/commands.test.js`

**Interfaces:**
- Produces:
  - `parseLine(line: string): { name: string, args: string[] } | null` (trims, splits on whitespace, `null` for empty).
  - `createRegistry(): { register(name: string, handler: (args: string[], ctx: object) => string[]|Promise<string[]>, desc: string): void, run(line: string, ctx: object): Promise<string[]>, complete(prefix: string): string[], list(): {name:string, desc:string}[] }`. Unknown command → `['command not found: <name>. type \'help\'']`. A throwing handler → `['error: <message>']`.
  - `createHistory(): { push(line: string): void, prev(): string, next(): string }` (ignores empty/whitespace lines; consecutive duplicates collapsed; `prev` at oldest stays on oldest; `next` past newest returns `''`).
  - `commonPrefix(names: string[]): string`.

- [ ] **Step 1: Write failing tests:** parse (`'  open   blog '` → `{name:'open',args:['blog']}`, `''`/`'   '` → `null`); run known/unknown/throwing handler; `complete('p')` returns sorted matches; `commonPrefix(['projects','profile'])` → `'pro'`; no match → `[]`; history navigation as described; a `<script>` argument is returned verbatim in output strings (escaping is the renderer's job, covered in Task 9).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 6: Window manager (DOM) and window CSS

**Files:** Create `js/core/windowManager.js`, `css/window.css`; Test `tests/windowManager.test.js`

**Interfaces:**
- Consumes: `createWindowState` (Task 3), `bus` (Task 2).
- Produces: `createWindowManager({ root: HTMLElement, bus, apps: App[] }): { open(id), close(id), minimize(id), restore(id) }` where `App = { id, title, icon, mount(el: HTMLElement, ctx: { bus }) }`. Each window is `<section class="window" data-app="<id>">` with title bar (title, minimize/maximize/close buttons) and a content div passed to `app.mount` once. Reacts to bus `open`/`close`. Drag by title bar and resize via bottom-right handle using pointer events; position/size clamped so at least 80px of the title bar stays inside the viewport. Minimize adds class `minimized` (CSS animates toward the dock; `display:none` after) and restore removes it.

- [ ] **Step 1: Write failing tests (jsdom):** `bus.emit('open','about')` creates exactly one `.window[data-app=about]`; opening twice does not duplicate and `mount` is called once; close removes the element; minimize adds `.minimized`, restore removes it and the window is on top (highest z-index style); clamp helper keeps title bar reachable for a position of `(-5000, -5000)` and `(99999, 99999)`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the manager and export a pure `clampRect(rect, viewport): rect` used by drag/resize. CSS: glass look (`backdrop-filter: blur`, translucent border), open animation scale+fade, minimize animation, mobile (`max-width:700px`) windows `inset:0` full-screen.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 7: Desktop shell (top bar, icons, dock, boot, background)

**Files:** Create `js/core/shell.js`, `css/desktop.css`; Modify `js/main.js`, `index.html`; Test `tests/shell.test.js`

**Interfaces:**
- Consumes: `createWindowManager`, `bus`, `initRouter`, app modules from Tasks 8-11 (until then `main.js` uses a stub app list).
- Produces: `mountShell({ root, apps, bus, owner: string }): void` rendering top bar (clock updated each minute, owner name, "online" status), desktop icons (one per app, click or Enter opens), dock (one button per app, `aria-label` = app title, click toggles open/minimize/restore, magnify-on-hover via CSS), animated gradient + grid background (CSS only), and a skippable boot overlay (click or any key removes it; skipped entirely under reduced motion). `main.js` builds the apps array, calls `mountShell`, then `initRouter`, then opens the app from the initial hash.

- [ ] **Step 1: Write failing tests:** `mountShell` renders one icon and one dock button per app; Enter on an icon emits `open` with its app id; dock buttons have `aria-label`; boot overlay is removed after a keydown.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** shell, CSS and `main.js` wiring.
- [ ] **Step 4: Run** → PASS; open `index.html` through a local static server (`npx serve .`) and confirm the desktop appears.
- [ ] **Step 5: Commit.**

### Task 8: Terminal app

**Files:** Create `js/apps/terminal.js`, `css/terminal.css`; Test `tests/terminal.test.js`

**Interfaces:**
- Consumes: `createRegistry`, `createHistory`, `commonPrefix` (Task 5), `bus`.
- Produces: `terminalApp: App` (`id:'terminal'`). Registers commands `help`, `ls`, `cat <file>`, `open <app>`, `about`, `projects`, `blog`, `contact`, `clear`, `theme` (toggles `data-theme` between default and an alternate accent on `<html>`). `ls` lists the virtual files `about.txt`, `projects.json`, `contact.txt`, `blog/`; `cat` only serves that fixed list. `open <id>` emits `open` only for the four known app ids. `about`, `projects`, `blog`, `contact` are aliases for opening the matching window (`contact` opens `about`). Input: Enter runs, Up/Down history, Tab autocompletes (single match completes, multiple matches complete the common prefix and print the options). Output is appended with `textContent` and typed char-by-char (instant under reduced motion). Exports `renderLines(container, lines)` used by tests.

- [ ] **Step 1: Write failing tests (jsdom):** `renderLines` with `['<img src=x onerror=alert(1)>']` creates no `img` element and the text is visible as text; `open blog` emits bus `open` with `'blog'`; `open ../x` prints an error and emits nothing; `cat nope.txt` prints `cat: nope.txt: no such file`; `clear` empties the output; empty Enter adds no output.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the app and its CSS (green accent prompt `visitor@portfolio:~$`, blinking cursor).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 9: Projects app

**Files:** Create `js/apps/projects.js`, `js/core/util.js`, `data/projects.json`; Modify `css/desktop.css` (card styles); Test `tests/projects.test.js`, `tests/util.test.js`

**Interfaces:**
- Produces: `safeUrl(url: string, schemes: string[]): string|null` in `js/core/util.js` (returns the URL only if its scheme is in `schemes`, e.g. `['https:']` or `['https:','mailto:']`; `javascript:`, relative paths and invalid URLs → `null`; tested in `tests/util.test.js`); `projectsApp: App`; `renderProjects(el, projects)` builds cards (title, description, tag chips, "GitHub" link with `rel="noopener noreferrer" target="_blank"`) using `textContent` only. `data/projects.json` is `[{ "title", "description", "tags": string[], "url" }]`, seeded with VulnScanner and DeepfakeDetector from github.com/Raresney (owner edits later). Hover: card tilts slightly with green glow (CSS, disabled under reduced motion). Fetch failure or invalid JSON shows an inline `.app-error` message.

- [ ] **Step 1: Write failing tests:** `renderProjects` makes one card per project; a title of `<b>x</b>` appears as text with no `b` element; a `url` starting with `javascript:` is not rendered as a link href (only `https://` allowed); with `fetch` mocked to reject, mounting shows `.app-error`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 10: About and Contact app

**Files:** Create `js/apps/about.js`, `data/about.json`; Test `tests/about.test.js`

**Interfaces:**
- Produces: `aboutApp: App`; `data/about.json` is `{ "name", "tagline", "bio": string, "skills": string[], "links": [{ "label", "url" }], "email": string }` (placeholders the owner edits). Renders text with `textContent`; links only `https://` or `mailto:`; same inline-error behavior as Task 9 on load failure.

- [ ] **Step 1: Write failing tests:** renders name, skills as chips, links; `javascript:` link omitted; fetch rejection shows `.app-error`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** using `safeUrl` from `js/core/util.js` (created in Task 9).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 11: Blog app

**Files:** Create `js/apps/blog.js`, `data/blog/index.json`, `data/blog/hello-world.md`; Test `tests/blog.test.js`

**Interfaces:**
- Produces: `blogApp: App`; `data/blog/index.json` is `[{ "slug", "title", "date", "summary" }]` (slug matches `^[a-z0-9-]+$`). The app lists posts, loads `data/blog/<slug>.md` only for slugs present in the index, renders with `window.marked.parse` then `window.DOMPurify.sanitize` into the content div. Exports `renderMarkdown(md: string): string` (parse + sanitize) and `isValidSlug(slug, index): boolean`.

- [ ] **Step 1: Write failing tests:** with `window.marked`/`window.DOMPurify` provided in the test setup (import the real packages `marked` and `dompurify` as devDependencies for tests only), `renderMarkdown('<script>alert(1)</script>hi')` contains no `script`; `[x](javascript:alert(1))` yields no `javascript:` href; `isValidSlug('../etc', index)` is `false`; slug not in index is `false`; fetch failure shows `.app-error`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** list/detail views with a "back" button; 404 on a post shows inline error.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit.**

### Task 12: Polish, responsiveness, deploy

**Files:** Modify `css/*.css`, `index.html`; Create `README.md`

- [ ] **Step 1:** Run `npx vitest run` → all PASS.
- [ ] **Step 2:** Manual browser check at desktop and 375px width: boot skip, open every app from icon, dock and terminal; drag/resize/minimize/restore; deep links `#projects` and `#blog`; reduced-motion emulation shows no animation; keyboard Tab reaches icons and dock; console has no errors.
- [ ] **Step 3:** Write `README.md` (what it is, how to add a project / blog post / terminal command, `npx serve .` for local preview, GitHub Pages: Settings → Pages → deploy from branch `main`, root).
- [ ] **Step 4: Commit** `git commit -m "Polish and document portfolio"`.
