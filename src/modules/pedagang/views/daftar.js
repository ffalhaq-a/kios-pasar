import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderDaftarPedagangView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-900/80 border-slate-800/60' : 'hover:bg-slate-50 border-slate-200/80';
  const stickyBg = isDark ? 'bg-slate-950' : 'bg-white';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  let currentZoneFilter = 'ALL';
  let currentStatusFilter = 'ALL';
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

      const matchStatus = 
        currentStatusFilter === 'ALL' ||
        (currentStatusFilter === 'kosong' ? (k.status === 'kosong' || k.pedagang === '-') : k.statusBayar === currentStatusFilter);

      return matchSearch && matchZone && matchStatus;
    });

    const tbody = container.querySelector('#pedagang-tbody');
    const countBadge = container.querySelector('#filtered-count-badge');
    if (countBadge) countBadge.innerText = `(${filtered.length} Data)`;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="px-6 py-12 text-center ${textSecondary} text-xs">
            Tidak ada data pedagang yang cocok dengan kriteria pencarian / filter
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((item) => {
      let statusBadge = `
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/30">
          BELUM BAYAR
        </span>
      `;

      if (item.pedagang === '-' || item.status === 'kosong') {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/30">
            KOSONG
          </span>
        `;
      } else if (item.statusBayar === 'lunas') {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            LUNAS
          </span>
        `;
      } else if (item.statusBayar === 'hampir_habis') {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
            HAMPIR HABIS SEWA
          </span>
        `;
      } else if (item.statusBayar === 'jatuh_tempo') {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600/20 text-rose-600 border border-rose-600/40">
            JATUH TEMPO
          </span>
        `;
      }

      return `
        <tr class="border-b ${rowHover} transition-all text-xs group">
          <!-- Sticky Column 1: Blok -->
          <td class="px-3 py-3 font-mono font-bold text-emerald-500 sticky left-0 z-10 ${stickyBg} group-hover:bg-slate-100 dark:group-hover:bg-slate-900 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            ${item.blokKode || item.id}
          </td>

          <!-- Sticky Column 2: Nama Pedagang -->
          <td class="px-3 py-3 ${textPrimary} font-semibold sticky left-[70px] z-10 ${stickyBg} group-hover:bg-slate-100 dark:group-hover:bg-slate-900 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} min-w-[170px]">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full ${item.pedagang === '-' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} flex items-center justify-center font-bold text-[10px] shrink-0">
                ${item.pedagang === '-' ? 'K' : item.pedagang.charAt(0)}
              </span>
              <span class="${item.pedagang === '-' ? 'text-rose-500 italic' : textPrimary} truncate">
                ${item.pedagang === '-' ? 'LAHAN KOSONG' : item.pedagang}
              </span>
            </div>
          </td>

          <!-- Scrollable Columns -->
          <td class="px-3 py-3 ${textSecondary} min-w-[130px]">${item.alamat || '-'}</td>
          <td class="px-3 py-3 min-w-[140px]">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}">
              ${item.kategori || 'Umum'}
            </span>
          </td>
          <td class="px-3 py-3 min-w-[100px]">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              (item.tipeKios || '').includes('KIOS 1') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
              (item.tipeKios || '').includes('KIOS 2') ? 'bg-teal-500/10 text-teal-500 border border-teal-500/30' :
              (item.tipeKios || '').includes('LOS') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
              'bg-purple-500/10 text-purple-500 border border-purple-500/30'
            }">
              ${item.tipeKios || 'LOS'}
            </span>
          </td>
          <td class="px-3 py-3 font-mono ${textSecondary} min-w-[130px]">
            ${item.luasDimensi ? `<span class="font-medium">${item.luasDimensi}</span>` : ''}
            ${item.luasM2 ? `<span class="text-[10px] text-emerald-500 font-bold ml-1">(${item.luasM2} m²)</span>` : ''}
          </td>
          <td class="px-3 py-3 font-mono font-bold text-amber-500 min-w-[140px]">${item.sewaBulanan}</td>
          <td class="px-3 py-3 font-mono ${textSecondary} min-w-[110px]">${item.tglPembayaran || '-'}</td>
          <td class="px-3 py-3 font-mono font-semibold text-amber-500 min-w-[110px]">${item.tglHabisSewa || '-'}</td>
          <td class="px-3 py-3 min-w-[140px]">${statusBadge}</td>
          <td class="px-3 py-3 ${textSecondary} min-w-[120px] font-mono">${item.nomorHp || '-'}</td>
          <td class="px-3 py-3 text-right sticky right-0 z-10 ${stickyBg} group-hover:bg-slate-100 dark:group-hover:bg-slate-900 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <button data-edit-id="${item.id}" class="edit-merchant-btn bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow transition-all flex items-center gap-1 ml-auto">
              <i data-lucide="edit-2" class="w-3 h-3"></i>
              <span>Edit</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-merchant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-edit-id');
        openEditModal(targetId);
      });
    });
  }

  // Count stats for Filter Pills
  const countTotal = kiosks.length;
  const countBelumBayar = kiosks.filter(k => k.pedagang !== '-' && (k.statusBayar === 'belum_bayar' || !k.statusBayar)).length;
  const countLunas = kiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const countHampirHabis = kiosks.filter(k => (k.statusBayar === 'hampir_habis' || k.statusBayar === 'jatuh_tempo') && k.pedagang !== '-').length;
  const countKosong = kiosks.filter(k => k.status === 'kosong' || k.pedagang === '-').length;

  container.innerHTML = `
    <div class="p-6 space-y-4 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Clean Title & Filter Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">
            Daftar Pedagang Pasar
            <span id="filtered-count-badge" class="text-xs font-normal ${textSecondary} ml-1.5"></span>
          </h1>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Zone Filter Pills -->
          <div class="flex items-center p-1 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}">
            <button data-zone="ALL" class="zone-pill-btn px-3 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm font-bold">Semua Kawasan</button>
            <button data-zone="PASAR SANDANG" class="zone-pill-btn px-3 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold">Sandang</button>
            <button data-zone="PASAR SAYUR" class="zone-pill-btn px-3 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold">Sayur</button>
          </div>

          <!-- Search Input -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 ${textSecondary} absolute left-3 top-3"></i>
            <input 
              type="text" 
              id="search-input"
              placeholder="Cari blok, nama, desa, usaha..." 
              class="rounded-xl pl-9 pr-4 py-2.5 text-xs border transition-all ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500 shadow-sm'
              } w-60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Real-World Payment Status Filter Chips -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span class="text-[11px] font-bold ${textSecondary} mr-1 shrink-0">Filter Status:</span>
        <button data-status="ALL" class="status-pill-btn px-3 py-1.5 rounded-xl border font-bold bg-slate-800 text-white border-slate-700 shadow-sm shrink-0">
          Semua Data (${countTotal})
        </button>
        <button data-status="belum_bayar" class="status-pill-btn px-3 py-1.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-rose-400' : 'bg-white border-slate-200 text-rose-600'} hover:border-rose-500 shrink-0">
          🔴 Belum Bayar (${countBelumBayar})
        </button>
        <button data-status="lunas" class="status-pill-btn px-3 py-1.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600'} hover:border-emerald-500 shrink-0">
          🟢 Lunas (${countLunas})
        </button>
        <button data-status="hampir_habis" class="status-pill-btn px-3 py-1.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-white border-slate-200 text-amber-600'} hover:border-amber-500 shrink-0">
          🟡 Hampir Habis / Tenggat (${countHampirHabis})
        </button>
        <button data-status="kosong" class="status-pill-btn px-3 py-1.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'} hover:border-slate-500 shrink-0">
          ⚪ Kosong (${countKosong})
        </button>
      </div>

      <!-- Pro Horizontal Scrollable Table with Sticky Columns -->
      <div class="${cardBg} border rounded-2xl overflow-hidden shadow-lg">
        <div class="overflow-x-auto max-h-[calc(100vh-250px)]">
          <table class="w-full text-left border-collapse min-w-[1200px]">
            <thead class="sticky top-0 z-20">
              <tr class="${headerBg} border-b text-[11px] font-bold ${textSecondary} uppercase tracking-wider">
                <!-- Sticky Headers -->
                <th class="px-3 py-3.5 sticky left-0 z-30 ${headerBg} border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">Blok</th>
                <th class="px-3 py-3.5 sticky left-[70px] z-30 ${headerBg} border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">Nama Pedagang</th>
                
                <!-- Scrollable Headers -->
                <th class="px-3 py-3.5">Alamat Desa</th>
                <th class="px-3 py-3.5">Jenis Usaha</th>
                <th class="px-3 py-3.5">Tipe Unit</th>
                <th class="px-3 py-3.5">Ukuran Kios</th>
                <th class="px-3 py-3.5">Nilai Sewa / Thn</th>
                <th class="px-3 py-3.5">Tgl Bayar</th>
                <th class="px-3 py-3.5">Tgl Habis Sewa</th>
                <th class="px-3 py-3.5">Status Bayar</th>
                <th class="px-3 py-3.5">No. HP / WA</th>
                <th class="px-3 py-3.5 text-right sticky right-0 z-30 ${headerBg} border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}">Aksi</th>
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
                <label class="block font-semibold mb-1 ${textSecondary}">Ukuran Dimensi:</label>
                <input type="text" id="edit-dimensi-input" placeholder="misal: 240 x 180" class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Luas (m²):</label>
                <input type="text" id="edit-luas-input" placeholder="misal: 4.32" class="w-full p-2.5 rounded-xl border ${inputBg}" />
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
                  <option value="belum_bayar">🔴 Belum Bayar</option>
                  <option value="lunas">🟢 Lunas</option>
                  <option value="hampir_habis">🟡 Hampir Habis / Tenggat</option>
                  <option value="jatuh_tempo">⚠️ Jatuh Tempo</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1 ${textSecondary}">Nomor HP / WhatsApp:</label>
                <input type="text" id="edit-hp-input" placeholder="08..." class="w-full p-2.5 rounded-xl border ${inputBg}" />
              </div>
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

  // Zone Filter listeners
  container.querySelectorAll('.zone-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.zone-pill-btn').forEach(b => {
        b.className = `zone-pill-btn px-3 py-1.5 rounded-lg ${textSecondary} hover:text-emerald-500 font-bold`;
      });
      btn.className = 'zone-pill-btn px-3 py-1.5 rounded-lg bg-emerald-600 text-white shadow-sm font-bold';
      currentZoneFilter = btn.getAttribute('data-zone');
      renderTableContent();
    });
  });

  // Status Filter listeners
  container.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.status-pill-btn').forEach(b => {
        b.className = `status-pill-btn px-3 py-1.5 rounded-xl border font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'} shrink-0`;
      });
      btn.className = 'status-pill-btn px-3 py-1.5 rounded-xl border font-bold bg-slate-800 text-white border-slate-700 shadow-sm shrink-0';
      currentStatusFilter = btn.getAttribute('data-status');
      renderTableContent();
    });
  });

  // Modal open
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
    container.querySelector('#edit-dimensi-input').value = item.luasDimensi || '';
    container.querySelector('#edit-luas-input').value = item.luasM2 || '';
    container.querySelector('#edit-tgl-bayar-input').value = item.tglPembayaran === '-' ? '' : item.tglPembayaran;
    container.querySelector('#edit-tgl-habis-input').value = item.tglHabisSewa === '-' ? '' : item.tglHabisSewa;
    container.querySelector('#edit-status-bayar-input').value = item.statusBayar || 'belum_bayar';
    container.querySelector('#edit-hp-input').value = item.nomorHp || '';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  const modal = container.querySelector('#edit-merchant-modal');
  container.querySelector('#close-edit-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
  container.querySelector('#close-edit-modal-btn2').addEventListener('click', () => modal.classList.add('hidden'));

  container.querySelector('#edit-merchant-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = container.querySelector('#edit-id-input').value;
    const statusVal = container.querySelector('#edit-status-bayar-input').value;
    let tglBayarVal = container.querySelector('#edit-tgl-bayar-input').value;

    // Auto set payment date to today if set to lunas and empty
    if (statusVal === 'lunas' && (!tglBayarVal || tglBayarVal === '-')) {
      tglBayarVal = new Date().toISOString().slice(0, 10);
    }

    const updated = {
      pedagang: container.querySelector('#edit-nama-input').value.trim() || '-',
      nik: container.querySelector('#edit-nik-input').value.trim() || '-',
      alamat: container.querySelector('#edit-alamat-input').value.trim() || '-',
      kategori: container.querySelector('#edit-usaha-input').value.trim() || 'Umum',
      luasDimensi: container.querySelector('#edit-dimensi-input').value.trim() || '200 x 200',
      luasM2: container.querySelector('#edit-luas-input').value.trim() || '4.0',
      tglPembayaran: tglBayarVal || '-',
      tglHabisSewa: container.querySelector('#edit-tgl-habis-input').value || '2026-12-31',
      statusBayar: statusVal,
      nomorHp: container.querySelector('#edit-hp-input').value.trim() || '',
      status: container.querySelector('#edit-nama-input').value.trim() ? 'terisi' : 'kosong'
    };

    spreadsheetService.updateKios(id, updated);
    modal.classList.add('hidden');
    renderTableContent();
  });
}
