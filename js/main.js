import { bus } from './core/bus.js';
import { mountShell } from './core/shell.js';
import { initRouter, parseHash } from './core/router.js';
import { terminalApp } from './apps/terminal.js';
import { projectsApp } from './apps/projects.js';
import { aboutApp } from './apps/about.js';
import { blogApp } from './apps/blog.js';

const apps = [terminalApp, projectsApp, aboutApp, blogApp];
const knownIds = apps.map((a) => a.id);

mountShell({ root: document.getElementById('desktop'), apps, bus, owner: 'Rares', boot: true });
initRouter({ bus, knownIds });

bus.emit('open', parseHash(location.hash, knownIds) ?? 'terminal');
