import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderDaftarPedagangView(container) {
  const isDark = themeManager.isDark();
  const activeSheet = spreadsheetService.getActiveSheetName();
  const kiosks = spreadsheetService.loadKiosks();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-900/60 border-slate-800/60' : 'hover:bg-slate-50 border-slate-200/80';

  let currentCategoryFilter = 'ALL';
  let currentSearch = '';

  function renderTableContent() {
    let filtered = kiosks.filter(k => {
      const matchSearch = 
        k.id.toLowerCase().includes(currentSearch.toLowerCase()) ||
        k.pedagang.toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.alamat || '').toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.kategori || '').toLowerCase().includes(currentSearch.toLowerCase());

      const matchCategory = 
        currentCategoryFilter === 'ALL' ||
        (k.tipeKios || '').toUpperCase().includes(currentCategoryFilter);

      return matchSearch && matchCategory;
    });

    const tbody = container.querySelector('#pedagang-tbody');
    const countBadge = container.querySelector('#filtered-count-badge');
    if (countBadge) countBadge.innerText = `${filtered.length} Data`;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center ${textSecondary} text-xs">
            Tidak ada pedagang yang cocok dengan kriteria pencarian
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((item, idx) => `
      <tr class="border-b ${rowHover} transition-all text-xs">
        <td class="px-4 py-3 font-mono font-bold text-emerald-500">${item.id}</td>
        <td class="px-4 py-3 ${textPrimary} font-semibold">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full ${item.pedagang === '-' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} flex items-center justify-center font-bold text-[10px] shrink-0">
              ${item.pedagang === '-' ? 'K' : item.pedagang.charAt(0)}
            </span>
            <span class="${item.pedagang === '-' ? 'text-rose-500 italic' : textPrimary}">
              ${item.pedagang === '-' ? 'LAHAN KOSONG' : item.pedagang}
            </span>
          </div>
        </td>
        <td class="px-4 py-3 font-mono ${textSecondary}">${item.nik && item.nik.length > 5 ? item.nik.substring(0, 6) + '******' : '-'}</td>
        <td class="px-4 py-3 ${textSecondary}">${item.alamat || '-'}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-medium border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}">
            ${item.kategori || 'Sembako'}
          </span>
        </td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            (item.tipeKios || '').includes('KIOS 1') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
            (item.tipeKios || '').includes('KIOS 2') ? 'bg-teal-500/10 text-teal-500 border border-teal-500/30' :
            (item.tipeKios || '').includes('LOS') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
            'bg-purple-500/10 text-purple-500 border border-purple-500/30'
          }">
            ${item.tipeKios || 'LOS'}
          </span>
        </td>
        <td class="px-4 py-3 font-mono ${textSecondary}">${item.luasM2 ? item.luasM2 + ' m²' : item.luasDimensi}</td>
        <td class="px-4 py-3 font-mono font-bold text-amber-500 text-right">${item.sewaBulanan}</td>
      </tr>
    `).join('');
  }

  container.innerHTML = `
    <div class="p-6 space-y-5 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              ${activeSheet}
            </span>
            <span id="filtered-count-badge" class="text-xs font-bold ${textSecondary}"></span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Direktori Pendataan Pedagang</h2>
          <p class="text-xs ${textSecondary}">Pasar Mukti Makmur, Desa Karangpucung, Kec. Karangpucung 2026.</p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Category Filter Pills -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <button data-cat="ALL" class="cat-pill-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm">Semua</button>
            <button data-cat="KIOS 1" class="cat-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Kios 1</button>
            <button data-cat="KIOS 2" class="cat-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Kios 2</button>
            <button data-cat="LOS" class="cat-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Los</button>
            <button data-cat="LEMPRAKAN" class="cat-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">Lemprakan</button>
          </div>

          <!-- Search Input -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 ${textSecondary} absolute left-3 top-2.5"></i>
            <input 
              type="text" 
              id="search-input"
              placeholder="Cari blok, nama, desa, usaha..." 
              class="rounded-xl pl-9 pr-4 py-2 text-xs border transition-all ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500 shadow-sm'
              } w-60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Pro Data Table -->
      <div class="${cardBg} border rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto max-h-[calc(100vh-220px)]">
          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 z-10">
              <tr class="${headerBg} border-b text-[11px] font-bold ${textSecondary} uppercase tracking-wider">
                <th class="px-4 py-3.5">Blok</th>
                <th class="px-4 py-3.5">Nama Pedagang</th>
                <th class="px-4 py-3.5">NIK</th>
                <th class="px-4 py-3.5">Alamat Desa</th>
                <th class="px-4 py-3.5">Jenis Usaha</th>
                <th class="px-4 py-3.5">Tipe Unit</th>
                <th class="px-4 py-3.5">Luas (m²)</th>
                <th class="px-4 py-3.5 text-right">Sewa / Tahun</th>
              </tr>
            </thead>
            <tbody id="pedagang-tbody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderTableContent();

  const searchInput = container.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderTableContent();
    });
  }

  container.querySelectorAll('.cat-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-pill-btn').forEach(b => {
        b.className = `cat-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500`;
      });
      btn.className = 'cat-pill-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm';
      currentCategoryFilter = btn.getAttribute('data-cat');
      renderTableContent();
    });
  });
}
