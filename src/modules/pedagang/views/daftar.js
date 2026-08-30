import { spreadsheetService, formatDateDDMMYYYY } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';
import { rateService } from '../../../services/RateService.js';
import { pdfService, toTitleCase, angkaKeTerbilang } from '../../../services/PdfService.js';

export function renderDaftarPedagangView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // Dynamic counts for dropdown labels
  const totalCount = kiosks.length;
  const sandangCount = kiosks.filter(k => k.zona === 'PASAR SANDANG').length;
  const sayurCount = kiosks.filter(k => k.zona === 'PASAR SAYUR').length;

  // Dynamically extract unique block prefixes (Blok A, Blok B, etc.)
  const uniqueBlockPrefixes = Array.from(
    new Set(
      kiosks.map(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        const match = rawCode.match(/^[A-Za-z]+/);
        return match ? match[0].toUpperCase() : null;
      }).filter(Boolean)
    )
  ).sort();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const headerBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-900/80 border-slate-800/60' : 'hover:bg-slate-50 border-slate-200/80';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  // Active Filter States (Default: ALL)
  let currentZoneFilter = 'ALL';
  let currentBlokFilter = 'ALL';
  let currentStatusFilter = 'ALL';
  let currentTipeFilter = 'ALL';
  let currentSearch = '';
  
  // Pagination State
  let currentPage = 1;
  let pageSize = 10;

  function getFilteredKiosks() {
    return kiosks.filter(k => {
      // 1. Search Query Match
      const matchSearch = 
        !currentSearch ||
        k.id.toLowerCase().includes(currentSearch.toLowerCase()) ||
        k.pedagang.toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.alamat || '').toLowerCase().includes(currentSearch.toLowerCase()) ||
        (k.kategori || '').toLowerCase().includes(currentSearch.toLowerCase());

      // 2. Jenis Pasar / Zona Match
      const matchZone = 
        currentZoneFilter === 'ALL' ||
        k.zona === currentZoneFilter;

      // 3. Filter Blok Match
      const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
      const blockPrefix = rawCode.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || '';
      const matchBlok = 
        currentBlokFilter === 'ALL' ||
        blockPrefix === currentBlokFilter.toUpperCase();

      // 4. Status Bayar Match
      const matchStatus = 
        currentStatusFilter === 'ALL' ||
        (currentStatusFilter === 'kosong' ? (k.status === 'kosong' || k.pedagang === '-') : k.statusBayar === currentStatusFilter);

      // 5. Tipe Unit Match
      const matchTipe = 
        currentTipeFilter === 'ALL' ||
        (k.tipeKios || '').toUpperCase().includes(currentTipeFilter.toUpperCase());

      return matchSearch && matchZone && matchBlok && matchStatus && matchTipe;
    });
  }

  function renderTableContent() {
    const filtered = getFilteredKiosks();
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginatedItems = filtered.slice(startIdx, endIdx);

    const tbody = container.querySelector('#pedagang-tbody');

    // Update Pagination Info UI
    const pageInfo = container.querySelector('#pagination-info');
    if (pageInfo) {
      pageInfo.innerText = totalItems > 0 
        ? `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data`
        : 'Menampilkan 0 data';
    }

    renderPaginationControls(totalPages);

    if (!tbody) return;

    if (paginatedItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="12" class="px-6 py-12 text-center ${textSecondary} text-xs">
            Tidak ada data pedagang yang cocok dengan kombinasi filter yang dipilih
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = paginatedItems.map((item) => {
      const isSayur = (item.zona || '').toUpperCase().includes('SAYUR') || String(item.id || '').toUpperCase().startsWith('SYR');
      const zonaBadge = isSayur
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">Sayur</span>`
        : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 whitespace-nowrap">Sandang</span>`;

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
            HAMPIR HABIS
          </span>
        `;
      } else if (item.statusBayar === 'jatuh_tempo') {
        statusBadge = `
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600/20 text-rose-600 border border-rose-600/40">
            JATUH TEMPO
          </span>
        `;
      }

      const formattedTglBayar = formatDateDDMMYYYY(item.tglPembayaran);
      const formattedTglHabis = formatDateDDMMYYYY(item.tglHabisSewa);

      const cleanBlok = item.blokKode ? (item.blokKode.startsWith('Blok') ? item.blokKode : `Blok ${item.blokKode}`) : (item.id || '-');

      return `
        <tr class="border-b ${rowHover} transition-all text-xs">
          <td class="px-3.5 py-3 whitespace-nowrap">
            ${zonaBadge}
          </td>

          <td class="px-3.5 py-3 font-mono font-bold text-emerald-500 whitespace-nowrap">
            ${cleanBlok}
          </td>

          <td class="px-3.5 py-3 ${item.pedagang === '-' ? 'text-rose-500 italic' : textPrimary} font-semibold whitespace-nowrap">
            ${item.pedagang === '-' ? 'LAHAN KOSONG' : item.pedagang}
          </td>

          <td class="px-3 py-3 ${textSecondary} whitespace-nowrap">${item.alamat || '-'}</td>
          <td class="px-3 py-3 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}">
              ${item.kategori || 'Umum'}
            </span>
          </td>
          <td class="px-3 py-3 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              (item.tipeKios || '').includes('KIOS 1') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
              (item.tipeKios || '').includes('KIOS 2') ? 'bg-teal-500/10 text-teal-500 border border-teal-500/30' :
              (item.tipeKios || '').includes('LOS') ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' :
              'bg-purple-500/10 text-purple-500 border border-purple-500/30'
            }">
              ${item.tipeKios || 'LOS'}
            </span>
          </td>
          <td class="px-3 py-3 font-mono ${textSecondary} whitespace-nowrap">
            ${item.luasDimensi ? `<span class="font-medium">${item.luasDimensi}</span>` : ''}
            ${item.luasM2 ? `<span class="text-[10px] text-emerald-500 font-bold ml-1">(${item.luasM2} m²)</span>` : ''}
          </td>
          <td class="px-3 py-3 font-mono font-bold text-amber-500 whitespace-nowrap" title="${rateService.calculateRent(item.luasM2, item.tipeKios, item.sewaBulanan).summary}">
            ${rateService.calculateRent(item.luasM2, item.tipeKios, item.sewaBulanan).formattedTotal}
          </td>
          <td class="px-3 py-3 font-mono ${textSecondary} whitespace-nowrap">${formattedTglBayar}</td>
          <td class="px-3 py-3 font-mono font-bold text-amber-500 whitespace-nowrap">${formattedTglHabis}</td>
          <td class="px-3 py-3 whitespace-nowrap">${statusBadge}</td>
          <td class="px-3 py-3 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1">
              <button data-surat-id="${item.id}" class="create-surat-btn ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'} border px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1" title="Terbitkan Surat Pemberitahuan">
                <i data-lucide="file-text" class="w-3 h-3 text-emerald-500"></i>
                <span>Surat</span>
              </button>
              <button data-perjanjian-id="${item.id}" class="create-perjanjian-btn ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'} border px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1" title="Terbitkan Surat Perjanjian Sewa">
                <i data-lucide="file-signature" class="w-3 h-3 text-amber-500"></i>
                <span>Akad</span>
              </button>
              <button data-kwitansi-id="${item.id}" class="create-kwitansi-btn ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'} border px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1" title="Cetak Kwitansi Pembayaran">
                <i data-lucide="receipt" class="w-3 h-3 text-blue-500"></i>
                <span>Kwitansi</span>
              </button>
              <button data-edit-id="${item.id}" class="edit-merchant-btn bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow transition-all flex items-center gap-1" title="Edit Data Pedagang">
                <i data-lucide="edit-2" class="w-3 h-3"></i>
                <span>Edit</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.create-surat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-surat-id');
        window._selectedKiosIdForSurat = targetId;
        if (window._navigate) window._navigate('/surat/pemberitahuan');
      });
    });

    tbody.querySelectorAll('.create-perjanjian-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-perjanjian-id');
        window._selectedKiosIdForPerjanjian = targetId;
        if (window._navigate) window._navigate('/surat/perjanjian');
      });
    });

    tbody.querySelectorAll('.create-kwitansi-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-kwitansi-id');
        window._selectedKiosIdForKwitansi = targetId;
        if (window._navigate) window._navigate('/surat/kwitansi');
      });
    });

    tbody.querySelectorAll('.edit-merchant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-edit-id');
        openEditModal(targetId);
      });
    });
  }

  function renderPaginationControls(totalPages) {
    const containerEl = container.querySelector('#pagination-buttons');
    if (!containerEl) return;

    let buttonsHtml = `
      <button id="prev-page-btn" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
        currentPage === 1 
          ? (isDark ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
          : (isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm')
      }">
        &larr; Sebelumnya
      </button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      buttonsHtml += `
        <button data-page="${p}" class="page-num-btn px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
          p === currentPage
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
            : (isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm')
        }">
          ${p}
        </button>
      `;
    }

    buttonsHtml += `
      <button id="next-page-btn" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
        currentPage === totalPages 
          ? (isDark ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
          : (isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm')
      }">
        Selanjutnya &rarr;
      </button>
    `;

    containerEl.innerHTML = buttonsHtml;

    const prevBtn = containerEl.querySelector('#prev-page-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTableContent();
        }
      });
    }

    const nextBtn = containerEl.querySelector('#next-page-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTableContent();
        }
      });
    }

    containerEl.querySelectorAll('.page-num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.getAttribute('data-page')) || 1;
        renderTableContent();
      });
    });
  }

  container.innerHTML = `
    <div class="p-6 space-y-4 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Clean Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">
            Daftar Pedagang Pasar
          </h1>
        </div>

        <!-- Global Search Input -->
        <div class="relative w-full md:w-72">
          <i data-lucide="search" class="w-4 h-4 ${textSecondary} absolute left-3 top-3"></i>
          <input 
            type="text" 
            id="search-input"
            placeholder="Cari blok, nama, desa, usaha..." 
            class="w-full rounded-xl pl-9 pr-4 py-2 text-xs border transition-all ${
              isDark 
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500' 
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500 shadow-sm'
            } focus:outline-none"
          />
        </div>
      </div>

      <!-- FILTER PANEL (4-COLUMN DROPDOWN WITH DYNAMIC DATABASE COUNTS) -->
      <div class="${cardBg} border rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold ${textPrimary} flex items-center gap-2">
            <i data-lucide="filter" class="w-4 h-4 text-emerald-500"></i>
            FILTER DATA PEDAGANG
          </span>
          <button id="reset-filter-btn" class="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-all">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>Reset Filter</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Dropdown 1: Jenis Pasar (Dynamic Counts from Database) -->
          <div>
            <label class="block text-[11px] font-bold ${textSecondary} mb-1">Jenis Pasar:</label>
            <select id="filter-jenis-pasar" class="w-full p-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="ALL">Semua Jenis Pasar (${totalCount})</option>
              <option value="PASAR SANDANG">Pasar Sandang (${sandangCount})</option>
              <option value="PASAR SAYUR">Pasar Sayur (${sayurCount})</option>
            </select>
          </div>

          <!-- Dropdown 2: Filter Blok -->
          <div>
            <label class="block text-[11px] font-bold ${textSecondary} mb-1">Filter Blok:</label>
            <select id="filter-blok" class="w-full p-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="ALL">Semua Blok</option>
              ${uniqueBlockPrefixes.map(prefix => `
                <option value="${prefix}">Blok ${prefix}</option>
              `).join('')}
            </select>
          </div>

          <!-- Dropdown 3: Status Bayar -->
          <div>
            <label class="block text-[11px] font-bold ${textSecondary} mb-1">Status Bayar:</label>
            <select id="filter-status-bayar" class="w-full p-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="ALL">Semua Status Bayar</option>
              <option value="belum_bayar">🔴 Belum Bayar</option>
              <option value="lunas">🟢 Lunas</option>
              <option value="hampir_habis">🟡 Hampir Habis / Tenggat</option>
              <option value="kosong">⚪ Kosong (Siap Sewa)</option>
            </select>
          </div>

          <!-- Dropdown 4: Tipe Unit -->
          <div>
            <label class="block text-[11px] font-bold ${textSecondary} mb-1">Tipe Unit:</label>
            <select id="filter-tipe-unit" class="w-full p-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="ALL">Semua Tipe Unit</option>
              <option value="KIOS 1">Kios 1</option>
              <option value="KIOS 2">Kios 2</option>
              <option value="LOS">Los</option>
              <option value="LEMPRAKAN">Lemprakan</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Pro Data Table with Clean Formatting & Smooth Scroll -->
      <div class="${cardBg} border rounded-2xl overflow-hidden shadow-lg flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="${headerBg} border-b text-[11px] font-bold ${textSecondary} uppercase tracking-wider">
                <th class="px-3.5 py-3.5">Pasar</th>
                <th class="px-3.5 py-3.5">Blok</th>
                <th class="px-3.5 py-3.5">Nama Pedagang</th>
                <th class="px-3 py-3.5">Alamat Desa</th>
                <th class="px-3 py-3.5">Jenis Usaha</th>
                <th class="px-3 py-3.5">Tipe Unit</th>
                <th class="px-3 py-3.5">Ukuran Kios</th>
                <th class="px-3 py-3.5">Nilai Sewa / Thn</th>
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

        <!-- PAGINASI FOOTER (PAGINATION BAR) -->
        <div class="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${headerBg}">
          <div class="flex items-center gap-3">
            <span id="pagination-info" class="text-xs font-semibold ${textSecondary}"></span>
            
            <!-- Page Size Selector Dropdown -->
            <select id="page-size-select" class="p-1.5 rounded-lg text-xs font-bold border ${inputBg}">
              <option value="10" ${pageSize === 10 ? 'selected' : ''}>10 Data / Halaman</option>
              <option value="25" ${pageSize === 25 ? 'selected' : ''}>25 Data / Halaman</option>
              <option value="50" ${pageSize === 50 ? 'selected' : ''}>50 Data / Halaman</option>
              <option value="100" ${pageSize === 100 ? 'selected' : ''}>100 Data / Halaman</option>
            </select>
          </div>

          <!-- Pagination Buttons -->
          <div id="pagination-buttons" class="flex items-center gap-1.5">
            <!-- Buttons injected dynamically -->
          </div>
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

            <!-- Dimensi & Luas dengan Auto Calculate Listener -->
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

            <!-- Live Kalkulasi Biaya Sewa Tahunan -->
            <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i data-lucide="calculator" class="w-4 h-4 text-emerald-500"></i>
                <span>Estimasi Tagihan Sewa:</span>
              </span>
              <span id="edit-live-sewa-text" class="font-mono text-emerald-400 font-extrabold">-</span>
            </div>

            <!-- Tanggal Pembayaran & Tanggal Habis Sewa dengan Auto Date (+1 Year) & Auto Status (Lunas) -->
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
      currentPage = 1;
      renderTableContent();
    });
  }

  // Bind Dropdown Filters
  const pasarSelect = container.querySelector('#filter-jenis-pasar');
  if (pasarSelect) {
    pasarSelect.addEventListener('change', (e) => {
      currentZoneFilter = e.target.value;
      currentPage = 1;
      renderTableContent();
    });
  }

  const blokSelect = container.querySelector('#filter-blok');
  if (blokSelect) {
    blokSelect.addEventListener('change', (e) => {
      currentBlokFilter = e.target.value;
      currentPage = 1;
      renderTableContent();
    });
  }

  const statusSelect = container.querySelector('#filter-status-bayar');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      currentPage = 1;
      renderTableContent();
    });
  }

  const tipeSelect = container.querySelector('#filter-tipe-unit');
  if (tipeSelect) {
    tipeSelect.addEventListener('change', (e) => {
      currentTipeFilter = e.target.value;
      currentPage = 1;
      renderTableContent();
    });
  }

  // Reset Filter Button
  const resetBtn = container.querySelector('#reset-filter-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentZoneFilter = 'ALL';
      currentBlokFilter = 'ALL';
      currentStatusFilter = 'ALL';
      currentTipeFilter = 'ALL';
      currentSearch = '';

      if (pasarSelect) pasarSelect.value = 'ALL';
      if (blokSelect) blokSelect.value = 'ALL';
      if (statusSelect) statusSelect.value = 'ALL';
      if (tipeSelect) tipeSelect.value = 'ALL';
      if (searchInput) searchInput.value = '';

      currentPage = 1;
      renderTableContent();
    });
  }

  // Page Size Selector
  const pageSizeSelect = container.querySelector('#page-size-select');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      pageSize = parseInt(e.target.value) || 10;
      currentPage = 1;
      renderTableContent();
    });
  }

  // Bind Modal Input Auto-Calculations
  const dimensiInput = container.querySelector('#edit-dimensi-input');
  const luasInput = container.querySelector('#edit-luas-input');
  const tglBayarInput = container.querySelector('#edit-tgl-bayar-input');
  const tglHabisInput = container.querySelector('#edit-tgl-habis-input');
  const statusBayarInput = container.querySelector('#edit-status-bayar-input');

  // 1. Auto Calculate Luas (m²) when Ukuran Dimensi is entered
  if (dimensiInput && luasInput) {
    dimensiInput.addEventListener('input', (e) => {
      const val = e.target.value;
      const matches = val.match(/(\d+(?:[\.,]\d+)?)\s*[*xX,\s]\s*(\d+(?:[\.,]\d+)?)/);
      if (matches) {
        let num1 = parseFloat(matches[1].replace(',', '.'));
        let num2 = parseFloat(matches[2].replace(',', '.'));
        
        if (num1 > 20) num1 = num1 / 100;
        if (num2 > 20) num2 = num2 / 100;

        const area = num1 * num2;
        if (!isNaN(area) && area > 0) {
          luasInput.value = Number.isInteger(area) ? area.toString() : area.toFixed(2).replace(/\.?0+$/, '');
        }
      }
    });
  }

  // 2. Auto Calculate Tanggal Habis Sewa (+1 Year) & Auto Set Status to LUNAS when Tanggal Pembayaran is set
  if (tglBayarInput && tglHabisInput && statusBayarInput) {
    tglBayarInput.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        const payDate = new Date(val);
        if (!isNaN(payDate.getTime())) {
          payDate.setFullYear(payDate.getFullYear() + 1);
          const nextYearStr = payDate.toISOString().slice(0, 10);
          
          tglHabisInput.value = nextYearStr;
          statusBayarInput.value = 'lunas';
        }
      }
    });
  }

  let activeEditingKiosk = null;

  function updateModalLiveSewa() {
    if (!activeEditingKiosk) return;
    const luasVal = container.querySelector('#edit-luas-input').value;
    const rentCalc = rateService.calculateRent(luasVal, activeEditingKiosk.tipeKios, activeEditingKiosk.sewaBulanan);
    const previewEl = container.querySelector('#edit-live-sewa-text');
    if (previewEl) {
      previewEl.innerText = rentCalc.summary;
    }
    return rentCalc;
  }

  // Dimension Parser -> Auto compute m2
  const editDimensiInput = container.querySelector('#edit-dimensi-input');
  const editLuasInput = container.querySelector('#edit-luas-input');

  if (editDimensiInput && editLuasInput) {
    editDimensiInput.addEventListener('input', (e) => {
      const val = e.target.value;
      const parts = val.split(/x|\*/i);
      if (parts.length === 2) {
        const p = parseFloat(parts[0].replace(/,/g, '.').trim()) || 0;
        const l = parseFloat(parts[1].replace(/,/g, '.').trim()) || 0;
        if (p > 0 && l > 0) {
          const pM = p > 50 ? p / 100 : p;
          const lM = l > 50 ? l / 100 : l;
          const m2 = Math.round((pM * lM) * 100) / 100;
          editLuasInput.value = m2.toFixed(2);
          updateModalLiveSewa();
        }
      }
    });

    editLuasInput.addEventListener('input', () => {
      updateModalLiveSewa();
    });
  }

  function openEditModal(targetId) {
    const item = kiosks.find(k => k.id === targetId);
    if (!item) return;

    activeEditingKiosk = item;
    const modal = container.querySelector('#edit-merchant-modal');
    container.querySelector('#modal-edit-title').innerText = `Edit Pedagang ${item.blokKode || item.id}`;
    container.querySelector('#modal-edit-subtitle').innerText = `ID Unik: ${item.id} • Zona: ${item.zona} • Tipe: ${item.tipeKios || 'LOS'}`;
    container.querySelector('#edit-id-input').value = item.id;
    container.querySelector('#edit-nama-input').value = item.pedagang === '-' ? '' : item.pedagang;
    container.querySelector('#edit-nik-input').value = item.nik || '';
    container.querySelector('#edit-alamat-input').value = item.alamat || '';
    container.querySelector('#edit-usaha-input').value = item.kategori || '';
    container.querySelector('#edit-dimensi-input').value = item.luasDimensi || '';
    container.querySelector('#edit-luas-input').value = item.luasM2 || '';
    container.querySelector('#edit-tgl-bayar-input').value = item.tglPembayaran === '-' ? '' : String(item.tglPembayaran).split('T')[0];
    container.querySelector('#edit-tgl-habis-input').value = item.tglHabisSewa === '-' ? '' : String(item.tglHabisSewa).split('T')[0];
    container.querySelector('#edit-status-bayar-input').value = item.statusBayar || 'belum_bayar';
    container.querySelector('#edit-hp-input').value = item.nomorHp || '';

    updateModalLiveSewa();

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

    if (statusVal === 'lunas' && (!tglBayarVal || tglBayarVal === '-')) {
      tglBayarVal = new Date().toISOString().slice(0, 10);
    }

    const currentLuas = container.querySelector('#edit-luas-input').value.trim() || '4.0';
    const rentCalc = activeEditingKiosk 
      ? rateService.calculateRent(currentLuas, activeEditingKiosk.tipeKios, activeEditingKiosk.sewaBulanan)
      : { formattedTotal: 'Rp 225.000/thn' };

    const updated = {
      pedagang: container.querySelector('#edit-nama-input').value.trim() || '-',
      nik: container.querySelector('#edit-nik-input').value.trim() || '-',
      alamat: container.querySelector('#edit-alamat-input').value.trim() || '-',
      kategori: container.querySelector('#edit-usaha-input').value.trim() || 'Umum',
      luasDimensi: container.querySelector('#edit-dimensi-input').value.trim() || '200 x 200',
      luasM2: currentLuas,
      sewaBulanan: rentCalc.formattedTotal,
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
