import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';
import { pdfService, toTitleCase, generateSequentialNumber, angkaKeTerbilang, formatIndonesianDateClean, getSmartNextNumber } from '../../../services/PdfService.js';
import { rateService } from '../../../services/RateService.js';

export function renderPerjanjianView(container, initialKiosId = null) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();
  const perjanjianLogs = spreadsheetService.getPerjanjianLogs();

  let selectedKiosk = kiosks.find(k => k.id === initialKiosId) || kiosks[0] || null;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  const defaultNoPerjanjian = getSmartNextNumber('perjanjian', perjanjianLogs);
  
  // Real-time Dynamic Date & Day
  const now = new Date();
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentDayStr = indonesianDays[now.getDay()];
  const currentDateNum = now.getDate();
  const currentMonthStr = indonesianMonths[now.getMonth()];
  const currentYearStr = String(now.getFullYear());
  const defaultDateStr = `${currentDateNum} ${currentMonthStr} ${currentYearStr}`;

  // Next year date for lease end
  const nextYearDate = new Date(now);
  nextYearDate.setFullYear(now.getFullYear() + 1);
  const defaultNextYearDateStr = `${nextYearDate.getDate()} ${indonesianMonths[nextYearDate.getMonth()]} ${nextYearDate.getFullYear()}`;

  // Helper konversi tanggal ke kata terbilang (misal: 2 -> "dua", 8 -> "delapan", 31 -> "tiga puluh satu")
  function konversiTanggalTerbilang(angka) {
    const n = parseInt(angka, 10) || 1;
    const kata = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    if (n < 12) return kata[n];
    if (n < 20) return kata[n - 10] + ' belas';
    if (n < 100) return kata[Math.floor(n / 10)] + ' puluh' + (n % 10 !== 0 ? ' ' + kata[n % 10] : '');
    return String(n);
  }

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
          <h1 class="text-xl md:text-2xl font-extrabold ${textPrimary}">Surat Perjanjian Sewa Kios Pasar</h1>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-goto-agenda" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textSecondary} hover:text-amber-500 hover:border-amber-500/40">
            <i data-lucide="book-open" class="w-4 h-4"></i>
            <span>Buku Agenda & Riwayat</span>
          </button>
        </div>
      </div>

      <!-- STATUS ALERT -->
      <div id="status-alert-box" class="hidden p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-500 text-xs font-bold flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>
          <span id="status-alert-text">Surat Perjanjian berhasil diproses!</span>
        </div>
        <button onclick="this.parentElement.classList.add('hidden')" class="text-amber-400 hover:text-amber-300">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- LEFT COLUMN: CONTROLS & FORM (7 COLS) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- CARD 1: FORM PARAMETER PERJANJIAN -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <i data-lucide="file-signature" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Parameter Naskah Perjanjian</h3>
              </div>
              <span class="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Auto-Smart Numbering
              </span>
            </div>

            <!-- FILTER & SEARCH PANEL FOR SELECTING PEDAGANG -->
            <div class="p-3 rounded-xl border space-y-2.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-amber-500 flex items-center gap-1.5">
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
                  <select id="filter-perjanjian-pasar" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:ring-1 focus:ring-amber-500 outline-none ${inputBg}">
                    <option value="ALL">Semua Kawasan (${kiosks.length})</option>
                    <option value="PASAR SANDANG">Pasar Sandang (${sandangKiosks.length})</option>
                    <option value="PASAR SAYUR">Pasar Sayur (${sayurKiosks.length})</option>
                  </select>
                </div>

                <div>
                  <label class="text-[10px] font-bold ${textSecondary} block mb-0.5">Filter Blok Kios:</label>
                  <select id="filter-perjanjian-blok" class="w-full px-2.5 py-1.5 rounded-lg border text-xs font-semibold focus:ring-1 focus:ring-amber-500 outline-none ${inputBg}">
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
                  <input type="text" id="input-search-perjanjian" placeholder="Ketik nama pedagang atau kode blok..." class="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none ${inputBg}" />
                </div>
              </div>
            </div>

            <!-- KIOSK SELECTOR -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Pedagang Hasil Filter:</label>
              <select id="kiosk-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}">
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
                <label class="text-xs font-bold ${textSecondary} block">Nomor Perjanjian Awal:</label>
                <input type="text" id="input-no-perjanjian" value="${defaultNoPerjanjian}" class="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Hari Akad / Penandatanganan:</label>
                <input type="text" id="input-hari" value="${currentDayStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Tanggal Akad:</label>
                <input type="text" id="input-tgl-akad" value="${defaultDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Bulan Akad:</label>
                <input type="text" id="input-bulan" value="${currentMonthStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Mulai Masa Sewa:</label>
                <input type="text" id="input-tgl-mulai" value="${defaultDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Berakhir Masa Sewa:</label>
                <input type="text" id="input-tgl-selesai" value="${defaultNextYearDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Nama Saksi 1:</label>
                <input type="text" id="input-saksi1" placeholder="Nama Saksi 1 (Perangkat Desa)" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Nama Saksi 2:</label>
                <input type="text" id="input-saksi2" placeholder="Nama Saksi 2 (Pengelola Pasar)" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>
            </div>

            <!-- ACTION BUTTONS SATUAN -->
            <div class="pt-2 space-y-3">
              <button id="btn-generate-instant" class="w-full bg-amber-600 hover:bg-amber-500 text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all">
                <i data-lucide="file-check" class="w-4 h-4"></i>
                <span>Terbitkan Naskah Perjanjian Resmi</span>
              </button>

              <!-- INLINE STEP-BY-STEP PROGRESS CARD -->
              <div id="perjanjian-progress-card" class="hidden p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-2.5 transition-all shadow-sm">
                <div class="flex items-center justify-between text-xs font-bold text-amber-500">
                  <span class="flex items-center gap-2">
                    <i id="progress-card-icon" data-lucide="loader" class="w-4 h-4 animate-spin text-amber-500"></i>
                    <span id="progress-card-title">Menerbitkan Surat Perjanjian...</span>
                  </span>
                  <span id="progress-card-percent" class="font-mono text-xs font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">20%</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div id="progress-card-bar" class="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700" style="width: 20%"></div>
                </div>

                <div class="flex items-center justify-between text-[11px] ${textSecondary}">
                  <span id="progress-card-step" class="font-medium text-amber-400">Langkah 1/3: Mengirim data ke server Google Cloud...</span>
                  <span id="progress-card-eta" class="text-[10px] font-semibold text-amber-500/80">Estimasi ~20 detik</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: LIVE SUMMARY PREVIEW (5 COLS) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-500">Ringkasan Objek Perjanjian</span>
              <span id="preview-badge-blok" class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                ${selectedKiosk ? getCleanBlokName(selectedKiosk) : '-'}
              </span>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Pihak Pertama (Pj. Kades):</span>
                <span class="font-bold ${textPrimary}">A. ANJARNINGSIH, S.E.</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Pihak Kedua (Penyewa):</span>
                <span id="preview-pedagang" class="font-bold text-amber-500">
                  ${selectedKiosk ? toTitleCase(selectedKiosk.pedagang) : '-'}
                </span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">No. KTP / NIK:</span>
                <span id="preview-nik" class="font-mono font-medium ${textPrimary}">${selectedKiosk?.nik || '-'}</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Kawasan Pasar:</span>
                <span id="preview-pasar" class="font-bold ${textPrimary}">
                  Pasar ${selectedKiosk ? getCleanJenisPasar(selectedKiosk) : 'Sandang'}
                </span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Tipe Unit & Usaha:</span>
                <span id="preview-tipe" class="font-medium ${textPrimary}">${selectedKiosk?.tipeKios || 'LOS'} (${selectedKiosk?.kategori || 'Umum'})</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Luas / Dimensi:</span>
                <span id="preview-luas" class="font-mono font-bold text-emerald-500">${selectedKiosk?.luasM2 || '4.0'} m²</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Jumlah Unit Usaha:</span>
                <span id="preview-unit" class="font-bold text-amber-500">1 Unit Usaha</span>
              </div>
              <div class="flex justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'}">
                <span class="${textSecondary}">Harga Sewa / Tahun:</span>
                <span id="preview-sewa" class="font-mono font-extrabold text-amber-500 text-sm">
                  ${selectedKiosk ? rateService.calculateRent(selectedKiosk.luasM2, selectedKiosk.tipeKios, selectedKiosk.sewaBulanan).formattedTotal : 'Rp 250.000/thn'}
                </span>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-500 font-medium leading-relaxed">
                <span class="font-bold">Terbilang:</span>
                <span id="preview-terbilang" class="italic block mt-0.5 font-bold">Dua Ratus Lima Puluh Ribu Rupiah</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // SELECTORS & EVENT LISTENERS
  const kioskSelect = container.querySelector('#kiosk-select');
  const inputNo = container.querySelector('#input-no-perjanjian');
  const inputHari = container.querySelector('#input-hari');
  const inputTglAkad = container.querySelector('#input-tgl-akad');
  const inputBulan = container.querySelector('#input-bulan');
  const inputTglMulai = container.querySelector('#input-tgl-mulai');
  const inputTglSelesai = container.querySelector('#input-tgl-selesai');
  const inputSaksi1 = container.querySelector('#input-saksi1');
  const inputSaksi2 = container.querySelector('#input-saksi2');

  const filterPasar = container.querySelector('#filter-perjanjian-pasar');
  const filterBlok = container.querySelector('#filter-perjanjian-blok');
  const inputSearch = container.querySelector('#input-search-perjanjian');
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

    if (!filtered.some(k => selectedKiosk && k.id === selectedKiosk.id)) {
      selectedKiosk = filtered[0];
      updatePreview(selectedKiosk);
    }
  }

  if (filterPasar) filterPasar.addEventListener('change', filterAndPopulateKiosks);
  if (filterBlok) filterBlok.addEventListener('change', filterAndPopulateKiosks);
  if (inputSearch) inputSearch.addEventListener('input', filterAndPopulateKiosks);

  const btnGotoAgenda = container.querySelector('#btn-goto-agenda');
  if (btnGotoAgenda) {
    btnGotoAgenda.addEventListener('click', () => {
      if (window._navigate) window._navigate('/surat/agenda');
    });
  }

  const btnGenerateInstant = container.querySelector('#btn-generate-instant');

  const previewBadgeBlok = container.querySelector('#preview-badge-blok');
  const previewPedagang = container.querySelector('#preview-pedagang');
  const previewNik = container.querySelector('#preview-nik');
  const previewPasar = container.querySelector('#preview-pasar');
  const previewTipe = container.querySelector('#preview-tipe');
  const previewLuas = container.querySelector('#preview-luas');
  const previewUnit = container.querySelector('#preview-unit');
  const previewSewa = container.querySelector('#preview-sewa');
  const previewTerbilang = container.querySelector('#preview-terbilang');
  const statusAlertBox = container.querySelector('#status-alert-box');
  const statusAlertText = container.querySelector('#status-alert-text');

  function updatePreview(k) {
    if (!k) return;
    const cleanBlok = getCleanBlokName(k);
    const cleanPasar = getCleanJenisPasar(k);
    const rentCalc = rateService.calculateRent(k.luasM2, k.tipeKios, k.sewaBulanan);

    previewBadgeBlok.innerText = cleanBlok;
    previewPedagang.innerText = toTitleCase(k.pedagang);
    previewNik.innerText = k.nik && k.nik !== '-' ? k.nik : '-';
    previewPasar.innerText = `Pasar ${cleanPasar}`;
    previewTipe.innerText = `${k.tipeKios || 'LOS'} (${k.kategori || 'Umum'})`;
    previewLuas.innerText = `${rentCalc.unitCount || 1} Unit (${k.luasM2 || '4.0'} m²)`;
    previewUnit.innerText = `${rentCalc.unitCount || 1} Unit Usaha`;
    previewSewa.innerText = rentCalc.formattedTotal;
    previewTerbilang.innerText = angkaKeTerbilang(parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000);
  }

  if (selectedKiosk) updatePreview(selectedKiosk);

  kioskSelect.addEventListener('change', (e) => {
    selectedKiosk = kiosks.find(k => k.id === e.target.value);
    updatePreview(selectedKiosk);
  });

  function buildPerjanjianData(kiosk) {
    const cleanBlok = getCleanBlokName(kiosk);
    const cleanPasar = getCleanJenisPasar(kiosk);
    const rentCalc = rateService.calculateRent(kiosk.luasM2, kiosk.tipeKios, kiosk.sewaBulanan);

    const rawNumericSewa = parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000;
    const formattedSewaRupiah = new Intl.NumberFormat('id-ID').format(rawNumericSewa);
    const inputTglRaw = inputTglAkad.value.trim() || defaultDateStr;
    const matchDateNum = inputTglRaw.match(/^\d+/);
    const dateNum = matchDateNum ? parseInt(matchDateNum[0], 10) : currentDateNum;
    const dateTerbilang = konversiTanggalTerbilang(dateNum);

    return {
      nomor_perjanjian: inputNo.value.trim() || defaultNoPerjanjian,
      hari: inputHari.value.trim() || currentDayStr,
      tanggal: dateTerbilang, // Khusus placeholder {{tanggal}} di template (misal: "dua", "delapan", "tiga puluh satu")
      tanggal_lengkap: inputTglRaw,
      bulan: inputBulan.value.trim() || currentMonthStr,
      tahun: currentYearStr,
      nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang,
      nik: kiosk.nik && kiosk.nik !== '-' ? kiosk.nik : '-',
      alamat: kiosk.alamat && kiosk.alamat !== '-' ? kiosk.alamat : 'Desa Karangpucung',
      jenis_pasar: `Pasar ${cleanPasar}`,
      blok_kios: cleanBlok,
      tipe_kios: kiosk.tipeKios || 'LOS',
      kategori: kiosk.kategori || 'Umum',
      luas_dimensi: kiosk.luasDimensi || '200 x 200',
      luas_m2: kiosk.luasM2 || '4.0',
      jumlah_unit: `${rentCalc.unitCount || 1} Unit Usaha`,
      biaya_sewa: `Rp ${formattedSewaRupiah}`,
      biaya_sewa_angka: formattedSewaRupiah,
      biaya_sewa_terbilang: terbilangSewa,
      tgl_mulai: inputTglMulai.value.trim() || defaultDateStr,
      tgl_selesai: inputTglSelesai.value.trim() || defaultNextYearDateStr,
      saksi1: inputSaksi1.value.trim() || '',
      saksi2: inputSaksi2.value.trim() || ''
    };
  }

  const progressCard = container.querySelector('#perjanjian-progress-card');
  const progressPercent = container.querySelector('#progress-card-percent');
  const progressBar = container.querySelector('#progress-card-bar');
  const progressStep = container.querySelector('#progress-card-step');
  const progressTitle = container.querySelector('#progress-card-title');
  const progressEta = container.querySelector('#progress-card-eta');

  // 1. GENERATE INSTANT PDF
  btnGenerateInstant.addEventListener('click', async () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const itemData = buildPerjanjianData(selectedKiosk);
    const originalBtnContent = btnGenerateInstant.innerHTML;
    btnGenerateInstant.disabled = true;
    btnGenerateInstant.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-white"></i><span>Menerbitkan Naskah Perjanjian...</span>`;
    if (window.lucide) window.lucide.createIcons();

    // Show and Reset Progress Card
    if (progressCard) {
      progressCard.classList.remove('hidden');
      progressTitle.innerText = `Memproses Naskah ${itemData.blok_kios} (${itemData.nama_pedagang})...`;
      progressPercent.innerText = '25%';
      progressBar.style.width = '25%';
      progressBar.className = 'bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-700';
      progressStep.innerText = 'Langkah 1/3: Mengirim data ke server Google Cloud...';
      progressEta.innerText = 'Estimasi ~20 detik';
    }

    const t1 = setTimeout(() => {
      if (progressCard) {
        progressPercent.innerText = '60%';
        progressBar.style.width = '60%';
        progressStep.innerText = 'Langkah 2/3: Menginjeksi naskah Google Docs (8 Pasal & Terbilang)...';
        progressEta.innerText = 'Estimasi ~12 detik';
      }
    }, 4000);

    const t2 = setTimeout(() => {
      if (progressCard) {
        progressPercent.innerText = '85%';
        progressBar.style.width = '85%';
        progressStep.innerText = 'Langkah 3/3: Mengonversi ke PDF & Menyimpan di Google Drive...';
        progressEta.innerText = 'Estimasi ~5 detik';
      }
    }, 12000);

    try {
      const res = await spreadsheetService.generateRemotePerjanjianDoc(itemData);
      clearTimeout(t1);
      clearTimeout(t2);

      // Save local history log
      spreadsheetService.savePerjanjianLog({
        nomorPerjanjian: itemData.nomor_perjanjian,
        tanggal: itemData.tanggal_lengkap || itemData.tanggal,
        namaPedagang: itemData.nama_pedagang,
        blok: itemData.blok_kios,
        pasar: itemData.jenis_pasar,
        nominal: itemData.biaya_sewa,
        driveUrl: res?.pdfUrl || '',
        fileName: res?.fileName || `Perjanjian_${itemData.blok_kios}.pdf`
      });

      if (progressCard) {
        progressPercent.innerText = '100%';
        progressBar.style.width = '100%';
        progressBar.className = 'bg-emerald-500 h-2.5 rounded-full transition-all duration-300';
        progressStep.innerText = '✅ Selesai! Naskah Perjanjian berhasil tersimpan di Google Drive.';
        progressEta.innerText = 'Sukses';
      }

      if (res && res.status === 'success' && res.pdfUrl) {
        statusAlertBox.classList.remove('hidden');
        statusAlertText.innerHTML = `
          <div class="flex flex-col gap-1.5 py-1">
            <div class="font-extrabold text-amber-500 flex items-center gap-1.5">
              <span>✅ Surat Perjanjian ${itemData.blok_kios} (${itemData.nama_pedagang}) Berhasil Diterbitkan!</span>
            </div>
            <span class="text-[11px] font-normal ${textSecondary}">Tersimpan di Google Drive: <b>${res.folderPath || 'Pasar'} / ${res.fileName}</b></span>
            <a href="${res.pdfUrl}" target="_blank" class="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-extrabold w-fit mt-1 shadow-md transition-all">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span>Buka & Cetak Naskah PDF di Google Drive ↗</span>
            </a>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        try { window.open(res.pdfUrl, '_blank'); } catch(e) {}
      } else {
        const doc = pdfService.generateSuratPerjanjian(itemData);
        const fileName = `Surat_Perjanjian_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(fileName);
        statusAlertBox.classList.remove('hidden');
        statusAlertText.innerText = `Surat Perjanjian berhasil diterbitkan & diunduh (${fileName})`;
      }

    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      console.warn('Error generating perjanjian:', err);
      if (progressCard) {
        progressCard.classList.add('hidden');
      }
      const doc = pdfService.generateSuratPerjanjian(itemData);
      const fileName = `Surat_Perjanjian_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(fileName);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      btnGenerateInstant.disabled = false;
      btnGenerateInstant.innerHTML = originalBtnContent;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
