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
        ? 'bg-slate-950/80 border-slate-800 text-slate-100' 
        : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
    }">
      <div class="flex items-center gap-3">
        <div class="flex items-center text-xs gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}">
          <span>${category}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}"></i>
          <span class="text-emerald-500 font-bold">${title}</span>
        </div>
      </div>

      <!-- Quick Actions / Sheet Selector / Theme Toggle -->
      <div class="flex items-center gap-2 md:gap-3">
        
        <!-- Multi-Sheet Selector (Pasar Mukti Makmur Karangpucung) -->
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-semibold ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-emerald-400' 
            : 'bg-slate-100 border-slate-300 text-emerald-700'
        }">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
          <select id="header-sheet-select" class="bg-transparent text-xs font-bold focus:outline-none cursor-pointer">
            ${sheets.map(s => `
              <option value="${s}" ${s === activeSheet ? 'selected' : ''} class="${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}">
                ${s === 'PASAR SANDANG' ? '👕' : '🥬'} ${s} (MUKTI MAKMUR)
              </option>
            `).join('')}
          </select>
        </div>

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
          <span class="hidden md:inline">${isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>

        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isDark 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-slate-200 border border-slate-300 text-slate-700'
        }">
          MM
        </div>
      </div>
    </header>
  `;

  // Header Sheet Change listener
  const sheetSelect = container.querySelector('#header-sheet-select');
  if (sheetSelect) {
    sheetSelect.addEventListener('change', (e) => {
      spreadsheetService.setActiveSheet(e.target.value);
    });
  }

  // Theme toggle listener
  const themeBtn = container.querySelector('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.toggleTheme();
    });
  }
}
