import { themeManager } from '../../../shell/ThemeManager.js';

export function renderKategoriPedagangView(container) {
  const isDark = themeManager.isDark();
  const categories = [
    { nama: 'Sembako & Kelontong', kuota: 12, terisi: 10, icon: 'shopping-bag' },
    { nama: 'Daging & Ayam Segar', kuota: 8, terisi: 7, icon: 'beef' },
    { nama: 'Bumbu Dapur & Sayuran', kuota: 15, terisi: 12, icon: 'carrot' },
    { nama: 'Kuliner & Makanan Siap Saji', kuota: 10, terisi: 8, icon: 'utensils' },
    { nama: 'Pakaian & Tekstil', kuota: 10, terisi: 6, icon: 'shirt' },
    { nama: 'Perlengkapan & Plastik', kuota: 6, terisi: 5, icon: 'package' },
  ];

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const progressBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      <div>
        <h2 class="text-xl font-bold ${textPrimary}">Kategori Usaha Pasar</h2>
        <p class="text-xs ${textSecondary}">Distribusi jenis zonasi usaha pedagang untuk menjaga variasi komoditas.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${categories.map(cat => `
          <div class="${cardBg} border rounded-xl p-5 hover:border-emerald-500/50 transition-all">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold ${textPrimary}">${cat.nama}</span>
              <div class="p-2 border rounded-lg ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}">
                <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
              </div>
            </div>

            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-xl font-bold ${textPrimary}">${cat.terisi}</span>
              <span class="text-xs ${textSecondary}">/ ${cat.kuota} Kios Terisi</span>
            </div>

            <div class="w-full ${progressBg} rounded-full h-2 overflow-hidden border">
              <div class="bg-emerald-500 h-full" style="width: ${(cat.terisi / cat.kuota) * 100}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
