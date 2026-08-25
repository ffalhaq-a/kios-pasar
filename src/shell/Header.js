import { registry } from './ModuleRegistry.js';
import { themeManager } from './ThemeManager.js';
import { spreadsheetService } from '../services/SpreadsheetService.js';
import { authService } from '../services/AuthService.js';

export function renderHeader(container) {
  const route = registry.getCurrentRoute();
  
  let title = 'Halaman';
  let category = 'Modul';
  
  if (route) {
    title = route.submenu ? route.submenu.label : route.menu.label;
    category = route.module.title;
  }

  const isDark = themeManager.isDark();
  const currentUser = authService.getCurrentUser();

  container.innerHTML = `
    <header class="h-16 border-b transition-colors duration-200 px-4 md:px-6 flex items-center justify-between shrink-0 ${
      isDark 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }">
      <!-- Left: Breadcrumb Navigation -->
      <div class="flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}">
        <span class="font-medium">${category}</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}"></i>
        <span class="text-emerald-500 font-bold">${title}</span>
      </div>

      <!-- Right Actions: Export CSV, Theme & User Account Profile -->
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

        <!-- User Profile & Logout -->
        ${currentUser ? `
          <div class="flex items-center gap-2 pl-2 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <div class="hidden sm:block text-right">
              <span class="text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'} block leading-tight">
                ${currentUser.nama || currentUser.username}
              </span>
              <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                ${currentUser.role || 'USER'}
              </span>
            </div>

            <button 
              id="logout-btn" 
              title="Keluar dari Sistem (Logout)"
              class="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1 text-xs font-bold"
            >
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span class="hidden md:inline">Keluar</span>
            </button>
          </div>
        ` : ''}
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

  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        authService.logout();
      }
    });
  }
}
