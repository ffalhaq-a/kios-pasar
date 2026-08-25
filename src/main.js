import { registry } from './shell/ModuleRegistry.js';
import { renderSidebar } from './shell/Sidebar.js';
import { renderHeader } from './shell/Header.js';

import { DashboardModule } from './modules/dashboard/index.js';
import { PedagangModule } from './modules/pedagang/index.js';
import { DenahModule } from './modules/denah/index.js';

// Global helper for navigation
window._navigate = (path) => registry.navigate(path);

function initApp() {
  const appContainer = document.getElementById('app');

  // 1. Register Modules
  registry.registerModule(DashboardModule);
  registry.registerModule(PedagangModule);
  registry.registerModule(DenahModule);

  // 2. Render Base Shell Layout
  appContainer.innerHTML = `
    <div id="sidebar-container" class="h-full"></div>
    <div class="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      <div id="header-container"></div>
      <main id="content-container" class="flex-1 overflow-hidden relative bg-slate-900">
        <!-- Module Views render here -->
      </main>
    </div>
  `;

  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer = document.getElementById('header-container');
  const contentContainer = document.getElementById('content-container');

  // 3. Render function when route changes
  function updateUI() {
    renderSidebar(sidebarContainer);
    renderHeader(headerContainer);

    const route = registry.getCurrentRoute();

    if (route && typeof route.render === 'function') {
      contentContainer.innerHTML = '';
      route.render(contentContainer);
    } else {
      contentContainer.innerHTML = `
        <div class="p-8 text-center text-slate-500">
          <p class="text-sm">Halaman tidak ditemukan (${registry.currentPath})</p>
        </div>
      `;
    }

    // Refresh Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Subscribe to registry state changes
  registry.subscribe(updateUI);

  // Initial render
  updateUI();
}

document.addEventListener('DOMContentLoaded', initApp);
