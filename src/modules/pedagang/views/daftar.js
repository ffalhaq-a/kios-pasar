import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderDaftarPedagangView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-900/60 border-slate-800/60' : 'hover:bg-slate-50 border-slate-200/80';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  let currentZoneFilter = 'ALL';
  let currentCategoryFilter = 'ALL';
  let currentSearch = '';

  function renderTableContent() {
    let filtered = kiosks.filter(k => {
      const matchSearch = 
        k.id.toLowerCase().includes(currentSearch.toLowerCase()) ||
        k.pedagang.toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.alamat || '').toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.kategori || '').toLowerCase().includes(currentSearch.toLowerCase());

      const matchZone = 
        currentZoneFilter === 'ALL' ||
        k.zona === currentZoneFilter;

      const matchCategory = 
        currentCategoryFilter === 'ALL' ||
        (k.tipeKios || '').toUpperCase().includes(currentCategoryFilter);

      return matchSearch && matchZone && matchCategory;
    });

    const tbody = container.querySelector('#pedagang-tbody');
    const countBadge = container.querySelector('#filtered-count-badge');
    if (countBadge) countBadge.innerText = `${filtered.length} Data Terbaca`;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="px-6 py-12 text-center ${textSecondary} text-xs">
            Tidak ada data pedagang yang cocok dengan kriteria pencarian
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((item) => `
      <tr class="border-b ${rowHover} transition-all text-xs">
        <td class="px-3 py-3 font-mono font-bold text-emerald-500">${item.blokKode || item.id}</td>
        <td class="px-3 py-3 ${textPrimary} font-semibold">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full ${item.pedagang === '-' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} flex items-center justify-center font-bold text-[10px] shrink-0">
              ${item.pedagang === '-' ? 'K' : item.pedagang.charAt(0)}
            </span>
            <span class="${item.pedagang === '-' ? 'text-rose-500 italic' : textPrimary}">
              ${item.pedagang === '-' ? 'LAHAN KOSONG' : item.pedagang}
            </span>
          </div>
        </td>
        <td class="px-3 py-3 ${textSecondary}">${item.alamat || '-'}</td>
        <td class="px-3 py-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-medium border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}">
            ${item.kategori || 'Umum'}
          </span>
        </td>
        <td class="px-3 py-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            (item.tipeKios || '').includes('KIOS 1') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
            (item.tipeKios || '').includes('KIOS 2') ? 'bg-teal-500/10 text-teal-500 border border-teal-500/30' :
            (item.tipeKios || '').includes('LOS') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
            'bg-purple-500/10 text-purple-500 border border-purple-500/30'
          }">
            ${item.tipeKios || 'LOS'}
          </span>
        </td>
        <td class="px-3 py-3 font-mono ${textSecondary}">${item.tglPembayaran || '-'}</td>
        <td class="px-3 py-3 font-mono font-semibold text-amber-500">${item.tglHabisSewa || '-'}</td>
        <td class="px-3 py-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            item.statusBayar === 'lunas' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
            item.statusBayar === 'menunggu' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
            'bg-rose-500/10 text-rose-500 border border-rose-500/30'
          }">
            ${item.statusBayar || 'KOSONG'}
          </span>
        </td>
        <td class="px-3 py-3 text-right">
          <button data-edit-id="${item.id}" class="edit-merchant-btn bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow transition-all flex items-center gap-1 ml-auto">
            <i data-lucide="edit-2" class="w-3 h-3"></i>
            <span>Edit</span>
          </button>
        </td>
      </tr>
    `).join('');

    // Bind edit buttons
    tbody.querySelectorAll('.edit-merchant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-edit-id');
        openEditModal(targetId);
      });
    });
  }

  container.innerHTML = `
    <div class="p-6 space-y-5 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Header Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              PASAR MUKTI MAKMUR 2026
            </span>
            <span id="filtered-count-badge" class="text-xs font-bold ${textSecondary}"></span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Direktori Master & Pembayaran Pedagang</h2>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Zone Filter Pills -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <button data-zone="ALL" class="zone-pill-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm">Semua Kawasan (612)</button>
            <button data-zone="PASAR SANDANG" class="zone-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">👕 Sandang (320)</button>
            <button data-zone="PASAR SAYUR" class="zone-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500">🥬 Sayur (292)</button>
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
                <th class="px-3 py-3.5">Blok</th>
                <th class="px-3 py-3.5">Nama Pedagang</th>
                <th class="px-3 py-3.5">Alamat Desa</th>
                <th class="px-3 py-3.5">Jenis Usaha</th>
                <th class="px-3 py-3.5">Tipe Unit</th>
                <th class="px-3 py-3.5">Tgl Bayar</th>
                <th class="px-3 py-3.5">Tgl Habis Sewa</th>
                <th class="px-3 py-3.5">Status Bayar</th>
                <th class="px-3 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody id="pedagang-tbody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Edit Merchant Modal Popup -->
      <div id="edit-merchant-modal" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm hidden flex items-center justify-center z-50 p-4">
        <div class="border rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}">
          <button id="close-edit-modal-btn" class="absolute right-4 top-4 ${textSecondary} hover:text-emerald-500">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <i data-lucide="user-check" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 id="modal-edit-title" class="text-base font-bold">Edit Data Pedagang</h3>
              <p id="modal-edit-subtitle" class="text-xs ${textSecondary} font-mono">Kode Blok: -</p>
            </div>
          </div>

          <form id="edit-merchant-form" class="space-y-3 text-xs">
            <input type="hidden" id="edit-id-input" />

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Nama Pedagang:</label>
                <input type="text" id="edit-nama-input" required class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">NIK:</label>
                <input type="text" id="edit-nik-input" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Alamat Desa:</label>
                <input type="text" id="edit-alamat-input" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Jenis Usaha:</label>
                <input type="text" id="edit-usaha-input" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Tanggal Pembayaran:</label>
                <input type="date" id="edit-tgl-bayar-input" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Tanggal Habis Sewa:</label>
                <input type="date" id="edit-tgl-habis-input" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Status Pembayaran:</label>
                <select id="edit-status-bayar-input" class="w-full p-2.5 rounded-xl border ${inputBg}">
                  <option value="lunas">🟢 Lunas</option>
                  <option value="menunggu">🟡 Mendekati Tenggat</option>
                  <option value="menunggak">🔴 Menunggak</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Nomor HP / WhatsApp:</label>
                <input type="text" id="edit-hp-input" placeholder="08..." class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
            </div>

            <div>
              <label class="block font-semibold mb-1 ${textSecondary}">Catatan Kios:</label>
              <textarea id="edit-catatan-input" rows="2" placeholder="Catatan perbaikan / sewa..." class="w-full p-2.5 rounded-xl border ${inputBg}"></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <button type="button" id="close-edit-modal-btn2" class="px-4 py-2.5 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">
                Batal
              </button>
              <button type="submit" class="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                Simpan Perubahan
              </button>
            </div>
          </form>
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

  // Zone Filter listener
  container.querySelectorAll('.zone-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.zone-pill-btn').forEach(b => {
        b.className = `zone-pill-btn px-2.5 py-1 rounded-lg ${textSecondary} hover:text-emerald-500`;
      });
      btn.className = 'zone-pill-btn px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-sm';
      currentZoneFilter = btn.getAttribute('data-zone');
      renderTableContent();
    });
  });

  // Modal open function
  function openEditModal(targetId) {
    const item = kiosks.find(k => k.id === targetId);
    if (!item) return;

    const modal = container.querySelector('#edit-merchant-modal');
    container.querySelector('#modal-edit-title').innerText = `Edit Pedagang ${item.blokKode || item.id}`;
    container.querySelector('#modal-edit-subtitle').innerText = `ID Unik: ${item.id} • Zona: ${item.zona}`;
    container.querySelector('#edit-id-input').value = item.id;
    container.querySelector('#edit-nama-input').value = item.pedagang === '-' ? '' : item.pedagang;
    container.querySelector('#edit-nik-input').value = item.nik || '';
    container.querySelector('#edit-alamat-input').value = item.alamat || '';
    container.querySelector('#edit-usaha-input').value = item.kategori || '';
    container.querySelector('#edit-tgl-bayar-input').value = item.tglPembayaran === '-' ? '' : item.tglPembayaran;
    container.querySelector('#edit-tgl-habis-input').value = item.tglHabisSewa === '-' ? '' : item.tglHabisSewa;
    container.querySelector('#edit-status-bayar-input').value = item.statusBayar || 'lunas';
    container.querySelector('#edit-hp-input').value = item.nomorHp || '';
    container.querySelector('#edit-catatan-input').value = item.catatan || '';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // Modal close handlers
  const modal = container.querySelector('#edit-merchant-modal');
  container.querySelector('#close-edit-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
  container.querySelector('#close-edit-modal-btn2').addEventListener('click', () => modal.classList.add('hidden'));

  // Save Edit form submit
  container.querySelector('#edit-merchant-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = container.querySelector('#edit-id-input').value;
    const updated = {
      pedagang: container.querySelector('#edit-nama-input').value.trim() || '-',
      nik: container.querySelector('#edit-nik-input').value.trim() || '-',
      alamat: container.querySelector('#edit-alamat-input').value.trim() || '-',
      kategori: container.querySelector('#edit-usaha-input').value.trim() || 'Umum',
      tglPembayaran: container.querySelector('#edit-tgl-bayar-input').value || '-',
      tglHabisSewa: container.querySelector('#edit-tgl-habis-input').value || '2026-12-31',
      statusBayar: container.querySelector('#edit-status-bayar-input').value,
      nomorHp: container.querySelector('#edit-hp-input').value.trim() || '',
      catatan: container.querySelector('#edit-catatan-input').value.trim() || '',
      status: container.querySelector('#edit-nama-input').value.trim() ? 'terisi' : 'kosong'
    };

    spreadsheetService.updateKios(id, updated);
    modal.classList.add('hidden');
    renderTableContent();
  });
}
