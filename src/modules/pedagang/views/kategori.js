export function renderKategoriPedagangView(container) {
  const categories = [
    { nama: 'Sembako & Kelontong', kuota: 12, terisi: 10, icon: 'shopping-bag', color: 'emerald' },
    { nama: 'Daging & Ayam Segar', kuota: 8, terisi: 7, icon: 'beef', color: 'rose' },
    { nama: 'Bumbu Dapur & Sayuran', kuota: 15, terisi: 12, icon: 'carrot', color: 'amber' },
    { nama: 'Kuliner & Makanan Siap Saji', kuota: 10, terisi: 8, icon: 'utensils', color: 'orange' },
    { nama: 'Pakaian & Tekstil', kuota: 10, terisi: 6, icon: 'shirt', color: 'indigo' },
    { nama: 'Perlengkapan & Plastik', kuota: 6, terisi: 5, icon: 'package', color: 'cyan' },
  ];

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Kategori Usaha Pasar</h2>
        <p class="text-xs text-slate-400">Distribusi jenis zonasi usaha pedagang untuk menjaga variasi komoditas.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${categories.map(cat => `
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-200">${cat.nama}</span>
              <div class="p-2 bg-slate-900 rounded-lg text-slate-400 border border-slate-800">
                <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
              </div>
            </div>

            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-xl font-bold text-slate-100">${cat.terisi}</span>
              <span class="text-xs text-slate-500">/ ${cat.kuota} Kios Terisi</span>
            </div>

            <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div class="bg-emerald-500 h-full" style="width: ${(cat.terisi / cat.kuota) * 100}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
