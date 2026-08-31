import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';
import { pdfService, toTitleCase, generateSequentialNumber, angkaKeTerbilang, formatIndonesianDateClean, getSmartNextNumber } from '../../../services/PdfService.js';
import { rateService } from '../../../services/RateService.js';
import { showProgressModal, updateProgressModal, closeProgressModal } from '../../../components/ProgressModal.js';

export function renderKwitansiView(container, initialKiosId = null) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();
  const kwitansiLogs = spreadsheetService.getKwitansiLogs();

  let selectedKiosk = kiosks.find(k => k.id === initialKiosId) || kiosks[0] || null;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  const defaultNoKwitansi = getSmartNextNumber('kwitansi', kwitansiLogs);
  const defaultDateStr = formatIndonesianDateClean(new Date());

  const sandangKiosks = kiosks.filter(k => k.zona === 'PASAR SANDANG');
  const sayurKiosks = kiosks.filter(k => k.zona === 'PASAR SAYUR');

  const getCleanBlokName = (item) => {
    if (!item) return '-';
    return item.blokKode ? (item.blokKode.startsWith('Blok') ? item.blokKode : `Blok ${item.blokKode}`) : (item.id || '-');
  };

  const getCleanJenisPasar = (item) => {
    if (!item) return 'Sandang';
    return (item.zona || '').toUpperCase().includes('SAYUR') || String(item.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
  };

  // Extract unique blocks for filter
  const uniqueBlockPrefixes = Array.from(
    new Set(
      kiosks.map(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        const match = rawCode.match(/^[A-Za-z]+/);
        return match ? match[0].toUpperCase() : null;
      }).filter(Boolean)
    )
  ).sort();

  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER (CLEAN & NON-REDUNDANT) -->
      <div class="flex items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <h1 class="text-xl md:text-2xl font-extrabold ${textPrimary}">Kwitansi Pembayaran Sewa Kios</h1>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-goto-agenda" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textSecondary} hover:text-sky-500 hover:border-sky-500/40">
            <i data-lucide="book-open" class="w-4 h-4"></i>
            <span>Riwayat Kwitansi</span>
          </button>
        </div>
      </div>

      <!-- STATUS ALERT -->
      <div id="status-alert-box" class="hidden p-4 rounded-xl border bg-sky-500/10 border-sky-500/30 text-sky-500 text-xs font-bold flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>
          <span id="status-alert-text">Kwitansi berhasil diproses!</span>
        </div>
        <button onclick="this.parentElement.classList.add('hidden')" class="text-sky-400 hover:text-sky-300">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- LEFT COLUMN: CONTROLS & FORM (7 COLS) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- CARD 1: FORM PARAMETER KWITANSI -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-sky-500/10 text-sky-500 rounded-lg">
                  <i data-lucide="receipt" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Parameter Kwitansi Kas Desa</h3>
              </div>
              <span class="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                Auto-Smart Numbering
              </span>
            </div>

            <!-- FILTER & SEARCH PANEL FOR SELECTING PEDAGANG -->
            <div class="p-3 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                  <i data-lucide="filter" class="w-3.5 h-3.5"></i>
                  Cari & Filter Pedagang
                </span>
                <span id="kiosk-filter-count-badge" class="text-[10px] font-semibold ${textSecondary}">
                  Menampilkan ${kiosks.length} unit
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] font-bold ${textSecondary} block mb-0.5">Filter Kawasan Pasar:</label>
                  <select id="filter-kwitansi-pasar" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${inputBg}">
                    <option value="ALL">Semua Kawasan (${kiosks.length})</option>
                    <option value="PASAR SANDANG">Pasar Sandang (${sandangKiosks.length})</option>
                    <option value="PASAR SAYUR">Pasar Sayur (${sayurKiosks.length})</option>
                  </select>
                </div>

                <div>
                  <label class="text-[10px] font-bold ${textSecondary} block mb-0.5">Filter Blok Kios:</label>
                  <select id="filter-kwitansi-blok" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${inputBg}">
                    <option value="ALL">Semua Blok</option>
                    ${uniqueBlockPrefixes.map(prefix => `
                      <option value="${prefix}">Blok ${prefix}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="text-[10px] font-bold ${textSecondary} block mb-0.5">Pencarian Cepat (Nama / Blok / NIK):</label>
                <div class="relative">
                  <i data-lucide="search" class="w-3.5 h-3.5 ${textSecondary} absolute left-2.5 top-2.5"></i>
                  <input type="text" id="input-search-kwitansi" placeholder="Ketik nama pedagang atau kode blok..." class="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-medium focus:ring-1 focus:ring-sky-500 outline-none ${inputBg}" />
                </div>
              </div>
            </div>

            <!-- KIOSK SELECTOR -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Pedagang Hasil Filter:</label>
              <select id="kiosk-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none ${inputBg}">
                ${kiosks.map(k => `
                  <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                    [${getCleanJenisPasar(k)}] ${getCleanBlokName(k)} • ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} • ${k.sewaBulanan || 'Rp 250.000/thn'}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- METADATA FORM GRID -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Nomor Kwitansi:</label>
                <input type="text" id="input-no-kwitansi" value="${defaultNoKwitansi}" class="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-sky-500 focus:ring-2 focus:ring-sky-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Tanggal Pembayaran (Tanpa Jam):</label>
                <input type="text" id="input-tgl-bayar" value="${defaultDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none ${inputBg}" />
              </div>

              <div class="sm:col-span-2 space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Keterangan / Untuk Pembayaran:</label>
                <input type="text" id="input-keterangan" value="Sewa Tahunan ${selectedKiosk ? getCleanBlokName(selectedKiosk) : 'Blok A1'} Pasar ${selectedKiosk ? getCleanJenisPasar(selectedKiosk) : 'Sandang'} Periode 2026/2027" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none ${inputBg}" />
              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button id="btn-generate-instant" class="flex-1 bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-all">
                <i data-lucide="cloud-download" class="w-4 h-4"></i>
                <span>Generate PDF (Google Doc) & Simpan di Drive</span>
              </button>

              <button id="btn-preview-instant" class="border px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${cardBg} ${textPrimary} hover:border-sky-500 shadow-sm">
                <i data-lucide="eye" class="w-4 h-4 text-sky-500"></i>
                <span>Preview Layar</span>
              </button>
            </div>
          </div>

          <!-- CARD 2: BATCH PRINTING KWITANSI -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <i data-lucide="layers" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Cetak Massal Kwitansi (Per Blok / Kawasan)</h3>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary}">Lingkup Cetak:</label>
                <select id="batch-scope-select" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">
                  <option value="SANDANG_BLOCK" selected>Pasar Sandang - Per Blok</option>
                  <option value="SAYUR_BLOCK">Pasar Sayur - Per Blok</option>
                  <option value="SANDANG_ALL">Seluruh Pasar Sandang (${sandangKiosks.length} Unit)</option>
                  <option value="SAYUR_ALL">Seluruh Pasar Sayur (${sayurKiosks.length} Unit)</option>
                </select>
              </div>

              <div id="batch-block-wrapper" class="space-y-1">
                <label id="batch-block-label" class="text-xs font-bold ${textSecondary}">Pilih Blok Pasar Sandang:</label>
                <select id="batch-block-select" class="w-full px-3 py-2 rounded-xl border text-xs font-bold text-sky-500 focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}"></select>
              </div>
            </div>

            <button id="btn-batch-generate" class="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all">
              <i data-lucide="receipt" class="w-4 h-4"></i>
              <span id="batch-btn-label">Cetak Massal Kwitansi Blok A</span>
            </button>
          </div>
        </div>

        <!-- RIGHT COLUMN: LIVE SUMMARY PREVIEW (5 COLS) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <span class="text-xs font-bold uppercase tracking-wider text-sky-500">Ringkasan Bukti Pembayaran</span>
              <span id="preview-badge-blok" class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">
                ${selectedKiosk ? getCleanBlokName(selectedKiosk) : '-'}
              </span>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Nomor Kwitansi:</span>
                <span id="preview-no-kwitansi" class="font-mono font-bold text-sky-500">${defaultNoKwitansi}</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Telah Diterima Dari:</span>
                <span id="preview-pedagang" class="font-bold ${textPrimary}">
                  ${selectedKiosk ? toTitleCase(selectedKiosk.pedagang) : '-'}
                </span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">NIK / Identitas:</span>
                <span id="preview-nik" class="font-mono font-medium ${textPrimary}">${selectedKiosk?.nik || '-'}</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Objek Kios:</span>
                <span id="preview-pasar" class="font-bold ${textPrimary}">
                  ${selectedKiosk ? getCleanBlokName(selectedKiosk) : '-'} (Pasar ${selectedKiosk ? getCleanJenisPasar(selectedKiosk) : 'Sandang'})
                </span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Jumlah Unit & Luas:</span>
                <span id="preview-luas" class="font-bold text-emerald-500">1 Unit (${selectedKiosk?.luasM2 || '4.0'} m²)</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Jumlah Uang:</span>
                <span id="preview-sewa" class="font-mono font-extrabold text-sky-400 text-base">
                  ${selectedKiosk ? rateService.calculateRent(selectedKiosk.luasM2, selectedKiosk.tipeKios, selectedKiosk.sewaBulanan).formattedTotal : 'Rp 250.000'}
                </span>
              </div>
              <div class="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-400 font-medium leading-relaxed">
                <span class="font-bold block text-slate-200">Terbilang:</span>
                <span id="preview-terbilang" class="italic block mt-0.5 font-bold">Dua Ratus Lima Puluh Ribu Rupiah</span>
              </div>
            </div>

            <!-- PENGELOLA INFO BOX -->
            <div class="p-3 rounded-xl border text-[11px] space-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'}">
              <span class="font-bold text-sky-500 block">Arsip & Pengesahan Kas Desa:</span>
              <p class="${textSecondary} leading-relaxed">
                Pemerintah Desa Karangpucung • Bendahara/Pengelola Pasar • Arsip Otomatis Google Drive Folder <span class="font-mono text-slate-200">10G016Kqv...</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // SELECTORS & EVENT LISTENERS
  const kioskSelect = container.querySelector('#kiosk-select');
  const inputNo = container.querySelector('#input-no-kwitansi');
  const inputTglBayar = container.querySelector('#input-tgl-bayar');
  const inputKeterangan = container.querySelector('#input-keterangan');

  const btnGotoAgenda = container.querySelector('#btn-goto-agenda');
  if (btnGotoAgenda) {
    btnGotoAgenda.addEventListener('click', () => {
      if (window._navigate) window._navigate('/surat/agenda');
    });
  }

  const btnGenerateInstant = container.querySelector('#btn-generate-instant');
  const btnPreviewInstant = container.querySelector('#btn-preview-instant');

  const batchScopeSelect = container.querySelector('#batch-scope-select');
  const batchBlockWrapper = container.querySelector('#batch-block-wrapper');
  const batchBlockLabel = container.querySelector('#batch-block-label');
  const batchBlockSelect = container.querySelector('#batch-block-select');
  const btnBatchGenerate = container.querySelector('#btn-batch-generate');
  const batchBtnLabel = container.querySelector('#batch-btn-label');

  const previewBadgeBlok = container.querySelector('#preview-badge-blok');
  const previewNoKwitansi = container.querySelector('#preview-no-kwitansi');
  const previewPedagang = container.querySelector('#preview-pedagang');
  const previewNik = container.querySelector('#preview-nik');
  const previewPasar = container.querySelector('#preview-pasar');
  const previewLuas = container.querySelector('#preview-luas');
  const previewSewa = container.querySelector('#preview-sewa');
  const previewTerbilang = container.querySelector('#preview-terbilang');
  const statusAlertBox = container.querySelector('#status-alert-box');
  const statusAlertText = container.querySelector('#status-alert-text');

  function updatePreview(k) {
    if (!k) return;
    const cleanBlok = getCleanBlokName(k);
    const cleanPasar = getCleanJenisPasar(k);
    const rentCalc = rateService.calculateRent(k.luasM2, k.tipeKios, k.sewaBulanan);

    const rawNumericSewa = parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000;
    const formattedSewaRupiah = new Intl.NumberFormat('id-ID').format(rawNumericSewa);

    previewBadgeBlok.innerText = cleanBlok;
    previewNoKwitansi.innerText = inputNo.value.trim() || defaultNoKwitansi;
    previewPedagang.innerText = toTitleCase(k.pedagang);
    previewNik.innerText = k.nik && k.nik !== '-' ? k.nik : '-';
    previewPasar.innerText = `${cleanBlok} (Pasar ${cleanPasar})`;
    previewLuas.innerText = `${rentCalc.unitCount || 1} Unit (${k.luasM2 || '4.0'} m²)`;
    previewSewa.innerText = `Rp ${formattedSewaRupiah}`;
    previewTerbilang.innerText = angkaKeTerbilang(rawNumericSewa);

    inputKeterangan.value = `Sewa Tahunan ${cleanBlok} Pasar ${cleanPasar} Periode 2026/2027`;
  }

  const filterPasar = container.querySelector('#filter-kwitansi-pasar');
  const filterBlok = container.querySelector('#filter-kwitansi-blok');
  const inputSearch = container.querySelector('#input-search-kwitansi');
  const countBadge = container.querySelector('#kiosk-filter-count-badge');

  function filterAndPopulateKiosks() {
    const selectedPasar = filterPasar ? filterPasar.value : 'ALL';
    const selectedBlok = filterBlok ? filterBlok.value : 'ALL';
    const query = (inputSearch ? inputSearch.value : '').toLowerCase().trim();

    const filtered = kiosks.filter(k => {
      // Filter Pasar
      if (selectedPasar !== 'ALL' && k.zona !== selectedPasar) return false;

      // Filter Blok
      if (selectedBlok !== 'ALL') {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        if (!rawCode.toUpperCase().startsWith(selectedBlok)) return false;
      }

      // Search Query
      if (query) {
        const str = `${k.pedagang || ''} ${k.blokKode || ''} ${k.id || ''} ${k.nik || ''} ${k.alamat || ''}`.toLowerCase();
        if (!str.includes(query)) return false;
      }

      return true;
    });

    if (countBadge) {
      countBadge.innerText = `Menampilkan ${filtered.length} dari ${kiosks.length} unit`;
    }

    if (filtered.length === 0) {
      kioskSelect.innerHTML = `<option value="">-- Tidak ada pedagang yang cocok dengan filter --</option>`;
      return;
    }

    kioskSelect.innerHTML = filtered.map(k => `
      <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
        [${getCleanJenisPasar(k)}] ${getCleanBlokName(k)} • ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} • ${k.sewaBulanan || 'Rp 250.000/thn'}
      </option>
    `).join('');

    // If current selectedKiosk is not in the filtered list, select the first filtered item
    if (!filtered.some(k => selectedKiosk && k.id === selectedKiosk.id)) {
      selectedKiosk = filtered[0];
      updatePreview(selectedKiosk);
    }
  }

  if (filterPasar) filterPasar.addEventListener('change', filterAndPopulateKiosks);
  if (filterBlok) filterBlok.addEventListener('change', filterAndPopulateKiosks);
  if (inputSearch) inputSearch.addEventListener('input', filterAndPopulateKiosks);

  if (selectedKiosk) updatePreview(selectedKiosk);

  kioskSelect.addEventListener('change', (e) => {
    selectedKiosk = kiosks.find(k => k.id === e.target.value);
    updatePreview(selectedKiosk);
  });

  inputNo.addEventListener('input', () => {
    previewNoKwitansi.innerText = inputNo.value.trim() || defaultNoKwitansi;
  });

  // Batch Scope UI Sync
  function populateBlockDropdown(targetKiosks) {
    const prefixes = Array.from(
      new Set(
        targetKiosks.map(k => {
          const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
          const match = rawCode.match(/^[A-Za-z]+/);
          return match ? match[0].toUpperCase() : null;
        }).filter(Boolean)
      )
    ).sort();

    batchBlockSelect.innerHTML = prefixes.map(p => {
      const count = targetKiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(p);
      }).length;
      return `<option value="${p}">Blok ${p} (${count} Unit)</option>`;
    }).join('');
  }

  function updateBatchScopeUI() {
    const scope = batchScopeSelect.value;
    if (scope === 'SANDANG_BLOCK') {
      batchBlockWrapper.classList.remove('hidden');
      batchBlockLabel.innerText = 'Pilih Blok Pasar Sandang:';
      populateBlockDropdown(sandangKiosks);
      const selBlock = batchBlockSelect.value || 'A';
      batchBtnLabel.innerText = `Cetak Massal Kwitansi Pasar Sandang - Blok ${selBlock}`;
    } else if (scope === 'SAYUR_BLOCK') {
      batchBlockWrapper.classList.remove('hidden');
      batchBlockLabel.innerText = 'Pilih Blok Pasar Sayur:';
      populateBlockDropdown(sayurKiosks);
      const selBlock = batchBlockSelect.value || 'A';
      batchBtnLabel.innerText = `Cetak Massal Kwitansi Pasar Sayur - Blok ${selBlock}`;
    } else if (scope === 'SANDANG_ALL') {
      batchBlockWrapper.classList.add('hidden');
      batchBtnLabel.innerText = `Cetak Massal Seluruh Kwitansi Pasar Sandang (${sandangKiosks.length} Unit)`;
    } else if (scope === 'SAYUR_ALL') {
      batchBlockWrapper.classList.add('hidden');
      batchBtnLabel.innerText = `Cetak Massal Seluruh Kwitansi Pasar Sayur (${sayurKiosks.length} Unit)`;
    }
  }

  batchScopeSelect.addEventListener('change', updateBatchScopeUI);
  batchBlockSelect.addEventListener('change', () => {
    const scope = batchScopeSelect.value;
    const selBlock = batchBlockSelect.value || 'A';
    if (scope === 'SANDANG_BLOCK') {
      batchBtnLabel.innerText = `Cetak Massal Kwitansi Pasar Sandang - Blok ${selBlock}`;
    } else if (scope === 'SAYUR_BLOCK') {
      batchBtnLabel.innerText = `Cetak Massal Kwitansi Pasar Sayur - Blok ${selBlock}`;
    }
  });

  updateBatchScopeUI();

  function buildKwitansiData(kiosk) {
    const cleanBlok = getCleanBlokName(kiosk);
    const cleanPasar = getCleanJenisPasar(kiosk);
    const rentCalc = rateService.calculateRent(kiosk.luasM2, kiosk.tipeKios, kiosk.sewaBulanan);

    const rawNumericSewa = parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000;
    const formattedSewaRupiah = new Intl.NumberFormat('id-ID').format(rawNumericSewa);
    const terbilangSewa = angkaKeTerbilang(rawNumericSewa);
    const cleanDateOnly = formatIndonesianDateClean(inputTglBayar.value.trim() || defaultDateStr);

    return {
      nomor_kwitansi: inputNo.value.trim() || defaultNoKwitansi,
      nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang,
      nik: kiosk.nik && kiosk.nik !== '-' ? kiosk.nik : '-',
      jenis_pasar: cleanPasar,
      blok_kios: cleanBlok,
      tipe_kios: kiosk.tipeKios || 'LOS',
      kategori: kiosk.kategori || 'Umum',
      luas_dimensi: kiosk.luasDimensi || '200 x 200',
      luas_m2: kiosk.luasM2 || '4.0',
      jumlah_unit: `${rentCalc.unitCount || 1} Unit Usaha`,
      biaya_sewa: `Rp ${formattedSewaRupiah}`,
      biaya_sewa_angka: formattedSewaRupiah,
      biaya_sewa_terbilang: terbilangSewa,
      keterangan_pembayaran: inputKeterangan.value.trim() || `Sewa Tahunan ${cleanBlok} Pasar ${cleanPasar} Periode 2026/2027`,
      tanggal_bayar: cleanDateOnly
    };
  }

  // 1. GENERATE SATUAN GOOGLE DOCS & DRIVE
  btnGenerateInstant.addEventListener('click', async () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const itemData = buildKwitansiData(selectedKiosk);

    showProgressModal({
      title: 'Memproses Kwitansi Kas Desa',
      steps: [
        '1. Menyiapkan parameter kwitansi & data pedagang...',
        '2. Mengisi template Google Docs Kwitansi...',
        '3. Membuat subfolder & menyimpan ke Google Drive...',
        '4. Mencatat riwayat ke database Spreadsheet...'
      ],
      currentStep: 0,
      message: 'Menyiapkan data...'
    });

    try {
      setTimeout(() => updateProgressModal({ currentStep: 1, message: 'Mengisi template Google Docs...' }), 400);
      setTimeout(() => updateProgressModal({ currentStep: 2, message: 'Menyimpan PDF ke Google Drive...' }), 900);

      const res = await spreadsheetService.generateRemoteKwitansiDoc(itemData);

      updateProgressModal({ currentStep: 3, message: 'Mencatat riwayat ke database Spreadsheet...' });

      // Save local history log
      spreadsheetService.saveKwitansiLog({
        nomorKwitansi: itemData.nomor_kwitansi,
        tanggal: itemData.tanggal_bayar,
        namaPedagang: itemData.nama_pedagang,
        blok: itemData.blok_kios,
        pasar: itemData.jenis_pasar,
        nominal: itemData.biaya_sewa,
        driveUrl: res?.pdfUrl || '',
        fileName: res?.fileName || `Kwitansi_${itemData.blok_kios}.pdf`
      });

      setTimeout(() => {
        closeProgressModal();
        if (res && res.status === 'success' && res.pdfUrl) {
          statusAlertBox.classList.remove('hidden');
          statusAlertText.innerText = `✅ Kwitansi ${itemData.blok_kios} tersimpan di Google Drive: ${res.folderPath || 'Pasar'} / ${res.fileName}`;
          window.open(res.pdfUrl, '_blank');
        } else {
          const doc = pdfService.generateKwitansi(itemData);
          const fileName = `KWITANSI_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          doc.save(fileName);
          statusAlertBox.classList.remove('hidden');
          statusAlertText.innerText = `Kwitansi berhasil diunduh (${fileName})`;
        }
        setTimeout(() => statusAlertBox.classList.add('hidden'), 8000);
      }, 500);

    } catch (err) {
      console.warn('Error generating kwitansi:', err);
      closeProgressModal();
      const doc = pdfService.generateKwitansi(itemData);
      const fileName = `KWITANSI_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(fileName);
    }
  });

  // 2. PREVIEW LAYAR
  btnPreviewInstant.addEventListener('click', async () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const itemData = buildKwitansiData(selectedKiosk);
    btnPreviewInstant.disabled = true;
    const originalPreviewHtml = btnPreviewInstant.innerHTML;
    btnPreviewInstant.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-sky-500"></i><span>Memuat...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await spreadsheetService.generateRemoteKwitansiDoc(itemData);
      if (res && res.status === 'success' && res.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        const doc = pdfService.generateKwitansi(itemData);
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (err) {
      const doc = pdfService.generateKwitansi(itemData);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } finally {
      btnPreviewInstant.disabled = false;
      btnPreviewInstant.innerHTML = originalPreviewHtml;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // 3. BATCH GENERATOR KWITANSI
  btnBatchGenerate.addEventListener('click', () => {
    const scope = batchScopeSelect.value;
    let targetList = [];
    let batchFileName = '';

    if (scope === 'SANDANG_ALL') {
      targetList = sandangKiosks;
      batchFileName = `Bundle_Kwitansi_Pasar_Sandang_Semua_${targetList.length}_Pedagang.pdf`;
    } else if (scope === 'SAYUR_ALL') {
      targetList = sayurKiosks;
      batchFileName = `Bundle_Kwitansi_Pasar_Sayur_Semua_${targetList.length}_Pedagang.pdf`;
    } else if (scope === 'SANDANG_BLOCK') {
      const selectedBlock = batchBlockSelect.value || 'A';
      targetList = sandangKiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(selectedBlock);
      });
      batchFileName = `Bundle_Kwitansi_Pasar_Sandang_Blok_${selectedBlock}_${targetList.length}_Pedagang.pdf`;
    } else if (scope === 'SAYUR_BLOCK') {
      const selectedBlock = batchBlockSelect.value || 'A';
      targetList = sayurKiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(selectedBlock);
      });
      batchFileName = `Bundle_Kwitansi_Pasar_Sayur_Blok_${selectedBlock}_${targetList.length}_Pedagang.pdf`;
    }

    if (targetList.length === 0) {
      alert('Tidak ada data pada lingkup cetak yang dipilih!');
      return;
    }

    btnBatchGenerate.disabled = true;
    btnBatchGenerate.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Memproses ${targetList.length} Kwitansi...</span>`;

    setTimeout(() => {
      const commonParams = {
        nomor_kwitansi: inputNo.value.trim() || defaultNoKwitansi,
        tanggal_bayar: formatIndonesianDateClean(inputTglBayar.value.trim() || defaultDateStr),
        keterangan_pembayaran: inputKeterangan.value.trim()
      };

      const doc = pdfService.generateBatchKwitansi(targetList, commonParams);
      doc.save(batchFileName);

      btnBatchGenerate.disabled = false;
      updateBatchScopeUI();

      statusAlertBox.classList.remove('hidden');
      statusAlertText.innerText = `Bundle Kwitansi (${targetList.length} naskah) berhasil diunduh!`;
      setTimeout(() => statusAlertBox.classList.add('hidden'), 6000);
    }, 100);
  });
}
