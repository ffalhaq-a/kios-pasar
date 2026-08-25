import { initialKiosData } from '../../denah/data/sampleData.js';

export function renderDaftarPedagangView(container) {
  const kiosks = window._kioskData || initialKiosData;
  const occupiedKiosks = kiosks.filter(k => k.pedagang !== '-');

  let filterText = '';

  function renderTableContent(searchTerm = '') {
    const filtered = occupiedKiosks.filter(k => 
      k.pedagang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.kategori.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tbody = container.querySelector('#pedagang-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-slate-500 text-xs">
            Tidak ada pedagang yang cocok dengan pencarian "${searchTerm}"
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-900/50 transition-all text-xs">
        <td class="px-6 py-3.5 font-bold text-slate-200">${item.nama}</td>
        <td class="px-6 py-3.5 text-slate-300 flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            ${item.pedagang.charAt(0)}
          </div>
          <span>${item.pedagang}</span>
        </td>
        <td class="px-6 py-3.5">
          <span class="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[11px]">
            ${item.kategori}
          </span>
        </td>
        <td class="px-6 py-3.5 font-mono text-slate-300">${item.sewaBulanan}</td>
        <td class="px-6 py-3.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${
            item.status === 'terisi' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }">
            ${item.status === 'terisi' ? 'Aktif (Terisi)' : 'Jatuh Tempo'}
          </span>
        </td>
        <td class="px-6 py-3.5 text-right font-mono text-slate-400">${item.sewaBerakhir}</td>
      </tr>
    `).join('');
  }

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full">
      <!-- Title & Search Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-100">Daftar Pedagang Aktif</h2>
          <p class="text-xs text-slate-400">Direktori penyewa kios dan status sewa di Pasar Modern BSD.</p>
        </div>

        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
          <input 
            type="text" 
            id="search-input"
            placeholder="Cari pedagang, kios, atau kategori..." 
            class="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64 transition-all"
          />
        </div>
      </div>

      <!-- Merchants Table -->
      <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th class="px-6 py-3.5">No Kios</th>
                <th class="px-6 py-3.5">Nama Pedagang</th>
                <th class="px-6 py-3.5">Kategori Usaha</th>
                <th class="px-6 py-3.5">Biaya Sewa / Bln</th>
                <th class="px-6 py-3.5">Status Sewa</th>
                <th class="px-6 py-3.5 text-right">Masa Berlaku</th>
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

  renderTableContent('');

  const searchInput = container.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderTableContent(e.target.value);
    });
  }
}
