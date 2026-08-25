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
  const sheets = spreadsheetService.getAvailableSheets();
  const activeSheet = spreadsheetService.getActiveSheetName();

  container.innerHTML = `
    <header class="h-16 border-b transition-colors duration-200 px-4 md:px-6 flex items-center justify-between shrink-0 ${
      isDark 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }">
      <!-- Left: Breadcrumb Navigation -->
      <div class="flex items-center gap-3">
        <div class="flex items-center text-xs gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}">
          <span class="font-medium">${category}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}"></i>
          <span class="text-emerald-500 font-bold">${title}</span>
        </div>
      </div>

      <!-- Center: Enterprise Segmented Market Switcher Pills -->
      <div class="hidden md:flex items-center p-1 rounded-xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
      }">
        <button 
          data-sheet="PASAR SANDANG"
          class="market-pill-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSheet === 'PASAR SANDANG'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
          }"
        >
          <span>👕 PASAR SANDANG</span>
          <span class="px-1.5 py-0.2 text-[10px] rounded-md ${
            activeSheet === 'PASAR SANDANG' ? 'bg-emerald-700 text-emerald-100' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')
          }">320</span>
        </button>

        <button 
          data-sheet="PASAR SAYUR"
          class="market-pill-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSheet === 'PASAR SAYUR'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
          }"
        >
          <span>🥬 PASAR SAYUR</span>
          <span class="px-1.5 py-0.2 text-[10px] rounded-md ${
            activeSheet === 'PASAR SAYUR' ? 'bg-emerald-700 text-emerald-100' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')
          }">292</span>
        </button>
      </div>

      <!-- Right Actions: Theme & User Avatar -->
      <div class="flex items-center gap-3">
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
        }" title="Petugas Karangpucung">
          MM
        </div>
      </div>
    </header>
  `;

  // Market pill button click listeners
  container.querySelectorAll('.market-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sheetName = btn.getAttribute('data-sheet');
      if (sheetName) {
        spreadsheetService.setActiveSheet(sheetName);
      }
    });
  });

  // Theme toggle listener
  const themeBtn = container.querySelector('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.toggleTheme();
    });
  }
}
