import { registry } from './ModuleRegistry.js';

export function renderHeader(container) {
  const route = registry.getCurrentRoute();
  
  let title = 'Halaman';
  let category = 'Modul';
  
  if (route) {
    title = route.submenu ? route.submenu.label : route.menu.label;
    category = route.module.title;
  }

  container.innerHTML = `
    <header class="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex items-center text-xs text-slate-400 gap-2">
          <span>${category}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-600"></i>
          <span class="text-emerald-400 font-medium">${title}</span>
        </div>
      </div>

      <!-- Quick Actions / User Info -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Pasar Modern BSD - Blok A</span>
        </div>

        <div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
          AD
        </div>
      </div>
    </header>
  `;
}
