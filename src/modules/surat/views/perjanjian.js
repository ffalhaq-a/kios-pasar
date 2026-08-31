import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';
import { pdfService, toTitleCase, generateSequentialNumber, angkaKeTerbilang, formatIndonesianDateClean, getSmartNextNumber } from '../../../services/PdfService.js';
import { rateService } from '../../../services/RateService.js';
import { showProgressModal, updateProgressModal, closeProgressModal } from '../../../components/ProgressModal.js';

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
  const defaultDateStr = formatIndonesianDateClean(new Date());
  const defaultDayStr = 'Senin';

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
                <input type="text" id="input-hari" value="${defaultDayStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Tanggal Akad:</label>
                <input type="text" id="input-tgl-akad" value="${defaultDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Bulan Akad:</label>
                <input type="text" id="input-bulan" value="Agustus" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Mulai Masa Sewa:</label>
                <input type="text" id="input-tgl-mulai" value="31 Agustus 2026" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Berakhir Masa Sewa:</label>
                <input type="text" id="input-tgl-selesai" value="31 Agustus 2027" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Nama Saksi 1:</label>
                <input type="text" id="input-saksi1" placeholder="Nama Saksi 1 (Perangkat Desa)" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Nama Saksi 2:</label>
                <input type="text" id="input-saksi2" placeholder="Nama Saksi 2 (Pengelola Pasar)" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Ukuran Huruf (Font Size):</label>
                <select id="input-font-size" class="w-full px-3 py-2 rounded-xl border text-xs font-bold text-amber-500 focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}">
                  <option value="11">11 pt (Kompak)</option>
                  <option value="11.5">11.5 pt (Sedang)</option>
                  <option value="12" selected>12 pt (Standar Resmi - Sangat Jelas)</option>
                  <option value="12.5">12.5 pt (Besar & Tegas)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary} block">Jenis Huruf:</label>
                <select id="input-font-family" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}">
                  <option value="times" selected>Times New Roman (Resmi)</option>
                  <option value="helvetica">Arial / Sans-Serif</option>
                </select>
              </div>
            </div>

            <!-- ACTION BUTTONS SATUAN -->
            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button id="btn-generate-instant" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all">
                <i data-lucide="cloud-download" class="w-4 h-4"></i>
                <span>Generate PDF (Google Doc) & Simpan di Drive</span>
              </button>

              <button id="btn-preview-instant" class="border px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${cardBg} ${textPrimary} hover:border-amber-500 shadow-sm">
                <i data-lucide="eye" class="w-4 h-4 text-amber-500"></i>
                <span>Preview Layar</span>
              </button>
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
  const inputFontSize = container.querySelector('#input-font-size');
  const inputFontFamily = container.querySelector('#input-font-family');

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
  const btnPreviewInstant = container.querySelector('#btn-preview-instant');

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
    const terbilangSewa = angkaKeTerbilang(rawNumericSewa);

    return {
      nomor_perjanjian: inputNo.value.trim() || defaultNoPerjanjian,
      hari: inputHari.value.trim() || defaultDayStr,
      tanggal: inputTglAkad.value.trim() || defaultDateStr,
      bulan: inputBulan.value.trim() || 'Agustus',
      tahun: '2026',
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
      tgl_mulai: inputTglMulai.value.trim() || '31 Agustus 2026',
      tgl_selesai: inputTglSelesai.value.trim() || '31 Agustus 2027',
      saksi1: inputSaksi1.value.trim() || '..............................',
      saksi2: inputSaksi2.value.trim() || '..............................',
      fontSize: Number(inputFontSize?.value || 12),
      fontFamily: inputFontFamily?.value || 'times'
    };
  }

  // 1. GENERATE INSTANT PDF
  btnGenerateInstant.addEventListener('click', async () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const itemData = buildPerjanjianData(selectedKiosk);
    showProgressModal({
      title: 'Menerbitkan Surat Perjanjian Sewa',
      subtitle: `Memproses kontrak 8 pasal untuk ${itemData.nama_pedagang} (${itemData.blok_kios})`,
      currentStep: 0,
      totalSteps: 4,
      steps: [
        'Mengirim data ke server Google Apps Script',
        'Mengisi template naskah Google Docs (8 Pasal)',
        'Mengonversi naskah ke PDF & menyimpan di Drive',
        'Mencatat riwayat ke database Spreadsheet (HISTORI)'
      ]
    });

    try {
      setTimeout(() => updateProgressModal({ currentStep: 1, message: 'Mengisi template kontrak Google Docs...' }), 400);
      setTimeout(() => updateProgressModal({ currentStep: 2, message: 'Menyimpan PDF ke Google Drive...' }), 900);

      const res = await spreadsheetService.generateRemotePerjanjianDoc(itemData);

      updateProgressModal({ currentStep: 3, message: 'Mencatat riwayat ke database Spreadsheet...' });

      // Save local history log
      spreadsheetService.savePerjanjianLog({
        nomorPerjanjian: itemData.nomor_perjanjian,
        tanggal: itemData.tanggal,
        namaPedagang: itemData.nama_pedagang,
        blok: itemData.blok_kios,
        pasar: itemData.jenis_pasar,
        nominal: itemData.biaya_sewa,
        driveUrl: res?.pdfUrl || '',
        fileName: res?.fileName || `Perjanjian_${itemData.blok_kios}.pdf`
      });

      setTimeout(() => {
        closeProgressModal();
        if (res && res.status === 'success' && res.pdfUrl) {
          statusAlertBox.classList.remove('hidden');
          statusAlertText.innerText = `✅ Surat Perjanjian ${itemData.blok_kios} tersimpan di Google Drive: ${res.folderPath || 'Pasar'} / ${res.fileName}`;
          window.open(res.pdfUrl, '_blank');
        } else {
          const doc = pdfService.generateSuratPerjanjian(itemData);
          const fileName = `Surat_Perjanjian_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          doc.save(fileName);
          statusAlertBox.classList.remove('hidden');
          statusAlertText.innerText = `Surat Perjanjian berhasil diunduh (${fileName})`;
        }
        setTimeout(() => statusAlertBox.classList.add('hidden'), 8000);
      }, 500);

    } catch (err) {
      console.warn('Error generating perjanjian:', err);
      closeProgressModal();
      const doc = pdfService.generateSuratPerjanjian(itemData);
      const fileName = `Surat_Perjanjian_${itemData.blok_kios.replace(/\s+/g, '_')}_${itemData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(fileName);
    }
  });

  // 2. PREVIEW LAYAR
  btnPreviewInstant.addEventListener('click', async () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const itemData = buildPerjanjianData(selectedKiosk);
    btnPreviewInstant.disabled = true;
    const originalPreviewHtml = btnPreviewInstant.innerHTML;
    btnPreviewInstant.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-amber-500"></i><span>Memuat...</span>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await spreadsheetService.generateRemotePerjanjianDoc(itemData);
      if (res && res.status === 'success' && res.pdfUrl) {
        window.open(res.pdfUrl, '_blank');
      } else {
        const doc = pdfService.generateSuratPerjanjian(itemData);
        const pdfBlob = doc.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (err) {
      const doc = pdfService.generateSuratPerjanjian(itemData);
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } finally {
      btnPreviewInstant.disabled = false;
      btnPreviewInstant.innerHTML = originalPreviewHtml;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
