import { registry } from './ModuleRegistry.js';

export function renderSidebar(container) {
  const modules = registry.getModules();
  const currentPath = registry.currentPath;

  // Track expanded state for submenus
  if (!window._expandedMenus) {
    window._expandedMenus = new Set(['pedagang']); // default open
  }

  let html = `
    <aside class="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full">
      <!-- App Header / Logo -->
      <div>
        <div class="p-5 border-b border-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <i data-lucide="store" class="w-6 h-6"></i>
          </div>
          <div>
            <h1 class="font-bold text-sm text-slate-100 tracking-wide">PASAR MODULAR</h1>
            <p class="text-xs text-slate-400">Sistem Denah Kios v1.0</p>
          </div>
        </div>

        <!-- Navigation Section -->
        <div class="px-3 py-4">
          <p class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">Navigasi Utama</p>
          <nav class="space-y-1">
  `;

  modules.forEach(mod => {
    mod.menus.forEach(menu => {
      const hasSubmenu = menu.submenus && menu.submenus.length > 0;
      const isSubmenuActive = hasSubmenu && menu.submenus.some(s => s.path === currentPath);
      const isActive = menu.path === currentPath || isSubmenuActive;
      const isExpanded = window._expandedMenus.has(mod.id);

      if (!hasSubmenu) {
        // Direct single menu
        html += `
          <button 
            data-path="${menu.path}"
            class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isActive 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }"
          >
            <i data-lucide="${menu.icon || mod.icon || 'circle'}" class="w-4 h-4 shrink-0"></i>
            <span>${menu.label}</span>
          </button>
        `;
      } else {
        // Menu with sub-menu
        html += `
          <div class="space-y-1">
            <button 
              data-toggle="${mod.id}"
              class="submenu-toggle-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'text-emerald-400 bg-slate-900/60 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }"
            >
              <div class="flex items-center gap-3">
                <i data-lucide="${menu.icon || mod.icon || 'folder'}" class="w-4 h-4 shrink-0"></i>
                <span>${menu.label}</span>
              </div>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-400'}"></i>
            </button>

            <!-- Submenu Items -->
            <div class="${isExpanded ? 'block' : 'hidden'} pl-9 pr-1 space-y-1 transition-all">
        `;

        menu.submenus.forEach(sub => {
          const isSubActive = sub.path === currentPath;
          html += `
            <button 
              data-path="${sub.path}"
              class="nav-btn w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isSubActive 
                  ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-400 font-semibold pl-3' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }"
            >
              <i data-lucide="${sub.icon || 'minus'}" class="w-3 h-3"></i>
              <span>${sub.label}</span>
            </button>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }
    });
  });

  html += `
          </nav>
        </div>
      </div>

      <!-- Footer Info / Architecture status -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div class="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-[11px] font-semibold text-slate-300">Modul Terdeteksi: ${modules.length}</span>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">Setiap fitur merupakan modul terpisah dengan menu dinamis.</p>
        </div>
      </div>
    </aside>
  `;

  container.innerHTML = html;

  // Add click handlers for navigation
  container.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const path = btn.getAttribute('data-path');
      if (path) registry.navigate(path);
    });
  });

  // Add click handlers for submenu toggles
  container.querySelectorAll('.submenu-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modId = btn.getAttribute('data-toggle');
      if (window._expandedMenus.has(modId)) {
        window._expandedMenus.delete(modId);
      } else {
        window._expandedMenus.add(modId);
      }
      renderSidebar(container);
      if (window.lucide) window.lucide.createIcons();
    });
  });
}
