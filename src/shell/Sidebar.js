import { registry } from './ModuleRegistry.js';
import { themeManager } from './ThemeManager.js';

export function renderSidebar(container) {
  const modules = registry.getModules();
  const currentPath = registry.currentPath;
  const isDark = themeManager.isDark();

  if (!window._expandedMenus) {
    window._expandedMenus = new Set(['pedagang']);
  }

  let html = `
    <aside class="w-64 border-r flex flex-col justify-between shrink-0 h-full transition-colors duration-200 ${
      isDark 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }">
      <div>
        <!-- App Header / Logo (Clean & Minimalist) -->
        <div class="p-5 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
            <i data-lucide="store" class="w-5 h-5"></i>
          </div>
          <div class="overflow-hidden">
            <h1 class="font-bold text-xs tracking-wider uppercase truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}">PASAR MUKTI MAKMUR</h1>
            <p class="text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate">Karangpucung • 2026</p>
          </div>
        </div>

        <!-- Navigation Section -->
        <div class="px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <p class="text-[10px] font-bold tracking-widest uppercase px-3 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}">NAVIGASI SISTEM</p>
          <nav class="space-y-1">
  `;

  modules.forEach(mod => {
    mod.menus.forEach(menu => {
      const hasSubmenu = menu.submenus && menu.submenus.length > 0;
      const isSubmenuActive = hasSubmenu && menu.submenus.some(s => s.path === currentPath);
      const isActive = menu.path === currentPath || isSubmenuActive;
      const isExpanded = window._expandedMenus.has(mod.id);

      if (!hasSubmenu) {
        html += `
          <button 
            data-path="${menu.path}"
            class="nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isActive 
                ? (isDark ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold')
                : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
            }"
          >
            <div class="flex items-center gap-3">
              <i data-lucide="${menu.icon || mod.icon || 'circle'}" class="w-4 h-4 shrink-0"></i>
              <span>${menu.label}</span>
            </div>
            ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>' : ''}
          </button>
        `;
      } else {
        html += `
          <div class="space-y-1">
            <button 
              data-toggle="${mod.id}"
              class="submenu-toggle-btn w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? (isDark ? 'text-emerald-400 bg-slate-900/60 font-semibold' : 'text-emerald-700 bg-slate-100 font-semibold')
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }"
            >
              <div class="flex items-center gap-3">
                <i data-lucide="${menu.icon || mod.icon || 'folder'}" class="w-4 h-4 shrink-0"></i>
                <span>${menu.label}</span>
              </div>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-500' : 'text-slate-400'}"></i>
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
                  ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-400 font-semibold' : 'bg-emerald-100/70 text-emerald-800 border-l-2 border-emerald-600 font-semibold')
                  : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')
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

      <!-- Footer Info -->
      <div class="p-3 border-t ${isDark ? 'border-slate-800/80 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}">
        <div class="rounded-lg p-2.5 border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}">
          <div class="flex items-center justify-between text-[11px] font-semibold mb-0.5">
            <span class="${isDark ? 'text-slate-300' : 'text-slate-700'}">Karangpucung</span>
            <span class="text-emerald-500 font-mono text-[10px]">2026</span>
          </div>
          <p class="text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-tight">Desa Karangpucung, Cilacap</p>
        </div>
      </div>
    </aside>
  `;

  container.innerHTML = html;

  container.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-path');
      if (path) registry.navigate(path);
    });
  });

  container.querySelectorAll('.submenu-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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
