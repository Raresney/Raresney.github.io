# Portfolio Desktop: Design

## Goal
Personal portfolio site styled as a modern OS desktop with an interactive terminal as the central app. Inspired by the "OS in the browser" idea (paius.tech), but with its own visual identity (modern glass UI, dark, green accent), its own animations and the owner's own content. No retro/CRT look.

Success: a visitor lands on a desktop, can open Terminal, Projects, About/Contact and Blog either by clicking or by typing commands, and can deep-link to any app via URL hash. Works on desktop and phone. Hosted free on GitHub Pages with no build step.

## Decisions (agreed with owner)
- Metaphor: modern desktop (windows, dock) + terminal app.
- Stack: plain HTML/CSS/JS (ES modules), no framework, no build.
- Apps: Terminal, Projects, About + Contact, Blog/Writeups.
- Architecture: JS window manager + app modules + event bus.

## Visual design
- Theme: near-black with deep-blue tones, glass windows (backdrop blur, thin translucent borders). Accent green `#39ff88`, set in one CSS variable `--accent`. Fonts: JetBrains Mono (code/terminal), Inter (UI).
- Desktop: slow animated gradient + fine grid background (CSS only, no heavy canvas). Desktop icons, bottom dock with magnify-on-hover, top bar with clock, owner name, "online" status.
- Boot: short skippable terminal-style boot sequence, then desktop appears.
- Animations: windows open with scale+fade, minimize flies into dock; terminal types output char by char with blinking cursor; project cards tilt slightly with green glow on hover.
- Accessibility: honor `prefers-reduced-motion` (animations off), keyboard focus visible, dock/icons reachable by keyboard.

## Architecture
```
index.html
css/   base.css desktop.css window.css terminal.css
js/
  main.js              boot, mounts desktop, wires registry
  core/windowManager.js create, drag, resize, minimize, maximize, z-order
  core/bus.js          tiny pub/sub (open, close, focus)
  core/router.js       URL hash <-> open app
  apps/terminal.js projects.js about.js blog.js
data/
  projects.json about.json
  blog/index.json  blog/*.md
```
- App contract: each app exports `{ id, title, icon, mount(el, ctx) }`. The window manager knows nothing about app content; apps know nothing about windows. They talk only through the bus (`bus.emit('open', 'blog')`).
- Content lives in data files; adding a project or post requires no code change.

## Terminal
Commands: `help`, `ls`, `cat <file>`, `open <app>`, `about`, `projects`, `blog`, `contact`, `clear`, `theme`. History with up/down arrows, Tab autocomplete. Commands are a registry (`name -> handler`) so new ones are added in one place. Output is rendered as text nodes (never raw HTML) to avoid XSS.

## Data and rendering
- `projects.json`: title, description, tags, GitHub link.
- Blog: Markdown files rendered with `marked` (pinned version, CDN) and sanitized (DOMPurify, pinned) before insertion.

## Routing and mobile
- `#projects` etc. opens that app directly (shareable links); opening/closing apps updates the hash.
- Below ~700px windows become full-screen with a single stack; dock stays at the bottom.

## Error handling
- Failed fetch of a data file: app shows an inline error message, desktop keeps working.
- Unknown terminal command: `command not found: x. type 'help'`.
- Unknown hash: ignored.

## Testing
- Unit tests (Vitest, dev-only, not required to run the site): window manager z-order/minimize/maximize logic, terminal command parser and registry, router hash parsing.
- Manual browser check: animations, drag/resize, reduced-motion, mobile width.

## Hosting
GitHub Pages from the repo root. No build step.

## Out of scope (YAGNI)
Theming beyond the `--accent` variable and a `theme` command toggle, CMS, comments, analytics, backend, i18n.
