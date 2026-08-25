import { registry } from './ModuleRegistry.js';
import { themeManager } from './ThemeManager.js';

export function renderHeader(container) {
  const route = registry.getCurrentRoute();
  
  let title = 'Halaman';
  let category = 'Modul';
  
  if (route) {
    title = route.submenu ? route.submenu.label : route.menu.label;
    category = route.module.title;
  }

  const isDark = themeManager.isDark();

  container.innerHTML = `
    <header class="h-16 border-b transition-colors duration-200 px-6 flex items-center justify-between shrink-0 ${
      isDark 
        ? 'bg-slate-950/80 border-slate-800 text-slate-100' 
        : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    }">
      <div class="flex items-center gap-3">
        <div class="flex items-center text-xs gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}">
          <span>${category}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}"></i>
          <span class="text-emerald-500 font-medium">${title}</span>
        </div>
      </div>

      <!-- Quick Actions / User Info / Theme Toggle -->
      <div class="flex items-center gap-3">
        <!-- Tombol Dark/Light Mode -->
        <button 
          id="theme-toggle-btn"
          title="Ganti Mode Tema (Gelap / Terang)"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' 
              : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
          }"
        >
          <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
          <span class="hidden sm:inline">${isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>

        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-300' 
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Pasar Modern BSD</span>
        </div>

        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-200 border border-slate-300 text-slate-700'
        }">
          AD
        </div>
      </div>
    </header>
  `;

  // Listener tombol toggle tema
  const themeBtn = container.querySelector('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.toggleTheme();
    });
  }
}
