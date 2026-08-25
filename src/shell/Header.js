import { registry } from './ModuleRegistry.js';
import { themeManager } from './ThemeManager.js';
import { spreadsheetService } from '../services/SpreadsheetService.js';

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
    <header class="h-16 border-b transition-colors duration-200 px-4 md:px-6 flex items-center justify-between shrink-0 ${
      isDark 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }">
      <!-- Left: Breadcrumb Navigation (Clean & Simple) -->
      <div class="flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}">
        <span class="font-medium">${category}</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}"></i>
        <span class="text-emerald-500 font-bold">${title}</span>
      </div>

      <!-- Right Actions: Export CSV, Theme & User Avatar -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- Export CSV Button -->
        <button 
          id="header-export-btn"
          title="Download Master Dataset CSV"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' 
              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
          }"
        >
          <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-500"></i>
          <span class="hidden sm:inline">Export CSV</span>
        </button>

        <!-- Theme Toggle -->
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
          <span class="hidden lg:inline">${isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>

        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-200 border border-slate-300 text-slate-700'
        }" title="Pengelola Pasar Mukti Makmur">
          MM
        </div>
      </div>
    </header>
  `;

  const exportBtn = container.querySelector('#header-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      spreadsheetService.downloadCSV();
    });
  }

  const themeBtn = container.querySelector('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.toggleTheme();
    });
  }
}
