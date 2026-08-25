import { registry } from './shell/ModuleRegistry.js';
import { renderSidebar } from './shell/Sidebar.js';
import { renderHeader } from './shell/Header.js';
import { themeManager } from './shell/ThemeManager.js';
import { spreadsheetService } from './services/SpreadsheetService.js';
import { authService } from './services/AuthService.js';

import { AuthModule } from './modules/auth/index.js';
import { DashboardModule } from './modules/dashboard/index.js';
import { PedagangModule } from './modules/pedagang/index.js';

window._navigate = (path) => registry.navigate(path);

function initApp() {
  const appContainer = document.getElementById('app');

  themeManager.init();

  // 1. Register Active Modules (Auth, Dashboard, Pedagang)
  registry.registerModule(AuthModule);
  registry.registerModule(DashboardModule);
  registry.registerModule(PedagangModule);

  function updateUI() {
    const isAuth = authService.isAuthenticated();
    const currentPath = registry.currentPath;

    // Navigation Guard: Protect pages if not authenticated
    if (!isAuth && currentPath !== '/login') {
      registry.navigate('/login');
      return;
    }

    if (isAuth && currentPath === '/login') {
      registry.navigate('/dashboard');
      return;
    }

    // Render Full Shell for authenticated pages, or clean Login view for /login
    if (currentPath === '/login') {
      appContainer.innerHTML = `
        <div id="content-container" class="w-full h-full"></div>
      `;
      const contentContainer = document.getElementById('content-container');
      const route = registry.getCurrentRoute();
      if (route && typeof route.render === 'function') {
        route.render(contentContainer);
      }
    } else {
      appContainer.innerHTML = `
        <div id="sidebar-container" class="h-full"></div>
        <div class="flex-1 flex flex-col h-full overflow-hidden">
          <div id="header-container"></div>
          <main id="content-container" class="flex-1 overflow-hidden relative">
            <!-- Module Views render here -->
          </main>
        </div>
      `;

      const sidebarContainer = document.getElementById('sidebar-container');
      const headerContainer = document.getElementById('header-container');
      const contentContainer = document.getElementById('content-container');

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
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Subscribe to state changes
  registry.subscribe(updateUI);
  themeManager.subscribe(() => updateUI());
  spreadsheetService.subscribe(() => updateUI());
  authService.subscribe(() => updateUI());

  updateUI();
}

document.addEventListener('DOMContentLoaded', initApp);
