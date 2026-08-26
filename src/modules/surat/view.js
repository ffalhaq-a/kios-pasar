import { spreadsheetService, formatDateDDMMYYYY } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';
import { authService, GOOGLE_API_URL } from '../../services/AuthService.js';
import { API_SECURITY_TOKEN, escapeHTML } from '../../utils/security.js';

/**
 * Helper to ensure clean "Blok A1", "Blok B2", etc.
 */
function getCleanBlokName(kiosk) {
  if (!kiosk) return 'Blok -';
  let blok = String(kiosk.blokKode || '').trim();
  
  if (!blok || blok.toUpperCase().includes('PASAR')) {
    blok = String(kiosk.id || '').trim();
  }

  blok = blok.replace(/^(SND-|SYR-)/i, '').trim();

  if (/^blok\s+/i.test(blok)) {
    return blok.replace(/^blok\s+/i, 'Blok ');
  }

  return `Blok ${blok}`;
}

/**
 * Helper to extract pure block letter/category (e.g. "Blok A", "Blok B", etc.)
 */
function getBlockCategory(kiosk) {
  const full = getCleanBlokName(kiosk);
  // Match letter or prefix like "Blok A", "Blok B", "Blok R", etc.
  const match = full.match(/^Blok\s+([A-Za-z]+)/i);
  if (match) {
    return `Blok ${match[1].toUpperCase()}`;
  }
  return 'Lainnya';
}

/**
 * Helper to extract clean "Sandang" or "Sayur"
 */
function getCleanJenisPasar(kiosk) {
  if (!kiosk) return 'Sandang';
  const z = (kiosk.zona || '').toUpperCase();
  return z.includes('SAYUR') ? 'Sayur' : 'Sandang';
}

export function renderSuratView(container, initialKiosId = null) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // Mode: 'SATUAN' | 'BLOK'
  let currentMode = 'SATUAN';

  // Group kiosks by block
  const blockGroups = {};
  kiosks.forEach(k => {
    const bCat = getBlockCategory(k);
    if (!blockGroups[bCat]) blockGroups[bCat] = [];
    blockGroups[bCat].push(k);
  });

  const availableBlocks = Object.keys(blockGroups).sort();
  let selectedBlock = availableBlocks[0] || 'Blok A';

  // Current Date formatted in Indonesian standard
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  const defaultDateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const defaultNoNaskah = `511.2/014/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;

  // Find initial kiosk if provided
  let selectedKiosk = kiosks.find(k => k.id === initialKiosId) || kiosks[0] || null;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  container.innerHTML = `
    <div class="p-6 space-y-6 max-w-7xl mx-auto h-full overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono">
              LAYANAN SURAT RESMI PASAR 2026
            </span>
          </div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat & Dokumen Resmi Pasar</h1>
          <p class="text-xs ${textSecondary} mt-0.5">
            Buat Surat Pemberitahuan Satuan atau Bundel Massal Per Blok (1 File PDF Multi-Halaman di Google Drive)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button id="refresh-data-btn" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- MODE TOGGLE SWITCHER -->
      <div class="flex items-center p-1.5 rounded-2xl border max-w-md ${cardBg}">
        <button id="mode-satuan-btn" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow">
          <i data-lucide="user" class="w-4 h-4"></i>
          <span>Mode Satuan (1 Pedagang)</span>
        </button>
        <button id="mode-blok-btn" class="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500">
          <i data-lucide="layers" class="w-4 h-4"></i>
          <span>Cetak Massal Per Blok (1 PDF)</span>
        </button>
      </div>

      <!-- MAIN 2-COLUMN GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- FORM PANEL (LEFT) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="border rounded-2xl p-5 space-y-4 ${cardBg}">
            <h2 class="text-sm font-bold ${textPrimary} flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <i data-lucide="file-edit" class="w-4 h-4 text-emerald-500"></i>
              <span id="form-panel-title">Parameter Surat Satuan</span>
            </h2>

            <!-- PILIHAN 1: SELECTOR SATUAN -->
            <div id="wrapper-select-satuan" class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Kios / Nama Pedagang:</label>
              <select id="kiosk-select" class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
                ${kiosks.map(k => `
                  <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                    [${getCleanBlokName(k)}] ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} - Pasar ${getCleanJenisPasar(k)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- PILIHAN 2: SELECTOR BATCH PER BLOK -->
            <div id="wrapper-select-blok" class="hidden space-y-2">
              <label class="text-xs font-bold ${textSecondary}">Pilih Blok yang Ingin Dicetak Massal:</label>
              <select id="block-select" class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
                ${availableBlocks.map(b => `
                  <option value="${b}" ${b === selectedBlock ? 'selected' : ''}>
                    ${b} (${blockGroups[b].length} Pedagang / Halaman)
                  </option>
                `).join('')}
              </select>
              <div class="p-3 rounded-xl border text-[11px] space-y-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                <p class="font-bold flex items-center gap-1.5">
                  <i data-lucide="info" class="w-3.5 h-3.5"></i>
                  <span id="batch-info-text">Seluruh surat di blok ini akan disatukan menjadi 1 File PDF.</span>
                </p>
                <p class="text-[10px] text-slate-400">Cocok untuk cetak fisik sekali jalan (*Ctrl + P* di printer kantor desa).</p>
              </div>
            </div>

            <!-- NOMOR NASKAH -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Nomor Naskah / Surat:</label>
              <input 
                type="text" 
                id="input-nomor-naskah" 
                value="${defaultNoNaskah}"
                class="w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:border-emerald-500 ${inputBg}"
                placeholder="misal: 511.2/014/VIII/2026"
              />
            </div>

            <!-- TANGGAL NASKAH -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Tanggal Naskah Surat:</label>
              <input 
                type="text" 
                id="input-tanggal-naskah" 
                value="${defaultDateStr}"
                class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}"
                placeholder="misal: 26 Agustus 2026"
              />
            </div>

            <!-- SIFAT SURAT -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Sifat Surat:</label>
              <select id="input-sifat" class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
                <option value="Biasa" selected>Biasa</option>
                <option value="Penting">Penting / Segera</option>
                <option value="Peringatan">Peringatan / Jatuh Tempo</option>
              </select>
            </div>

            <!-- GENERATE ACTION BUTTON -->
            <div class="pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <button 
                id="generate-pdf-btn" 
                class="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <i data-lucide="file-check" class="w-4 h-4"></i>
                <span id="btn-generate-text">Terbitkan Surat PDF & Simpan ke Drive</span>
              </button>
            </div>

          </div>

          <!-- STATUS / RESULT BANNER -->
          <div id="result-status-card" class="hidden border rounded-2xl p-5 space-y-3 ${cardBg} border-emerald-500/50 bg-emerald-500/5">
            <div class="flex items-center gap-2 text-emerald-500 font-extrabold text-xs">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span id="result-status-title">Surat PDF Berhasil Diterbitkan!</span>
            </div>
            <p id="result-file-name" class="text-xs font-mono ${textSecondary}">Surat_Pemberitahuan.pdf</p>
            
            <div class="flex flex-wrap gap-2 pt-2">
              <a 
                id="btn-view-pdf" 
                href="#" 
                target="_blank" 
                class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all"
              >
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>Buka PDF di Drive</span>
              </a>
            </div>
          </div>

        </div>

        <!-- LIVE PREVIEW PANEL (RIGHT) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="border rounded-2xl p-6 space-y-4 ${cardBg} relative overflow-hidden">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <h3 class="text-xs font-extrabold ${textPrimary} uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-500"></i>
                <span id="preview-panel-title">Pratinjau Format Surat (A4)</span>
              </h3>
              <span id="badge-page-count" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-500/10 text-slate-400">
                1 LEMBAR
              </span>
            </div>

            <!-- A4 PAPER MOCKUP PREVIEW -->
            <div id="paper-preview" class="p-6 rounded-xl border text-xs font-sans space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-inner'}">
              
              <!-- KOP SURAT DESA -->
              <div class="text-center space-y-0.5 border-b-2 border-slate-700 pb-3">
                <h4 class="font-extrabold text-xs uppercase tracking-wider ${textPrimary}">PEMERINTAH KABUPATEN CILACAP</h4>
                <h4 class="font-extrabold text-xs uppercase tracking-wider ${textPrimary}">KECAMATAN KARANGPUCUNG</h4>
                <h3 class="font-black text-sm uppercase tracking-wider text-emerald-600">PEMERINTAH DESA KARANGPUCUNG</h3>
                <p class="text-[10px] ${textSecondary}">Jalan Pramuka No. 09 Tlp. 02806261727 CILACAP Kode Pos 53255</p>
              </div>

              <!-- TANGGAL & NOMOR -->
              <div class="flex justify-between text-xs pt-1">
                <div class="space-y-0.5">
                  <div class="flex gap-2"><span class="w-16 ${textSecondary}">Nomor</span><span>: <strong id="preview-no-naskah" class="font-mono text-emerald-500">${defaultNoNaskah}</strong></span></div>
                  <div class="flex gap-2"><span class="w-16 ${textSecondary}">Sifat</span><span>: <span id="preview-sifat">Biasa</span></span></div>
                  <div class="flex gap-2"><span class="w-16 ${textSecondary}">Lampiran</span><span>: -</span></div>
                  <div class="flex gap-2"><span class="w-16 ${textSecondary}">Hal</span><span>: <strong>Pemberitahuan Pembayaran Sewa Tahunan</strong></span></div>
                </div>
                <div class="text-right">
                  <span>Cilacap, <span id="preview-tgl-naskah" class="font-bold text-emerald-500">${defaultDateStr}</span></span>
                </div>
              </div>

              <!-- TUJUAN -->
              <div class="pt-2">
                <p class="${textSecondary}">Yth. Bapak/Ibu: <strong id="preview-nama-pedagang" class="${textPrimary}">${selectedKiosk ? selectedKiosk.pedagang : '-'}</strong></p>
                <p class="${textSecondary}">Penyewa Kios/Los/Lemprakan Pasar Mukti Makmur Desa Karangpucung</p>
                <p class="${textSecondary}">di Tempat</p>
              </div>

              <!-- ISI PERDES -->
              <p class="text-justify leading-relaxed ${textSecondary}">
                Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.
              </p>

              <!-- TABEL RINCIAN TAGIHAN 2-KOLOM SESUAI TEMPLATE BARU -->
              <div class="border rounded-xl p-3.5 space-y-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
                <div class="grid grid-cols-2 gap-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2">
                  <div>
                    <span class="${textSecondary}">Pasar:</span>
                    <strong id="detail-pasar" class="ml-1.5 text-emerald-500 font-bold">${getCleanJenisPasar(selectedKiosk)}</strong>
                  </div>
                  <div>
                    <span class="${textSecondary}">Tipe Unit:</span>
                    <strong id="detail-tipe" class="ml-1.5 ${textPrimary} font-bold">${selectedKiosk ? selectedKiosk.tipeKios || 'LOS' : 'LOS'}</strong>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-2">
                  <div>
                    <span class="${textSecondary}">Ukuran:</span>
                    <span id="detail-ukuran" class="ml-1.5 font-mono ${textPrimary}">${selectedKiosk ? selectedKiosk.luasDimensi || '200 x 200' : '-'}</span>
                  </div>
                  <div>
                    <span class="${textSecondary}">Luas:</span>
                    <span id="detail-luas" class="ml-1.5 font-mono ${textPrimary}">${selectedKiosk ? selectedKiosk.luasM2 || '4.0' : '-'} m²</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="${textSecondary}">Kios/Los/Lemprakan:</span>
                    <strong id="detail-blok" class="ml-1.5 text-emerald-500 font-bold font-mono">${getCleanBlokName(selectedKiosk)}</strong>
                  </div>
                  <div>
                    <span class="${textSecondary}">Biaya Sewa:</span>
                    <strong id="detail-sewa" class="ml-1.5 text-emerald-500 font-mono font-bold">${selectedKiosk ? selectedKiosk.sewaBulanan || 'Rp 225.000/thn' : '-'}</strong>
                  </div>
                </div>
              </div>

              <!-- PEMBAYARAN & PENUTUP -->
              <div class="space-y-1.5 text-[11px] ${textSecondary}">
                <p>Pembayaran sewa tahunan dapat dilakukan pada batas waktu pembayaran mulai tanggal <strong>31 Agustus 2026</strong> s.d. selambat-lambatnya <strong>7 September 2026</strong> melalui:</p>
                <div class="pl-3 space-y-0.5">
                  <p>1. <strong>Transfer Bank:</strong> Bank Jateng (No. Rek: 12345xxxx a.n Pemerintah Desa Karangpucung)</p>
                  <p>2. <strong>Tunai:</strong> Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.</p>
                </div>
              </div>

              <!-- TANDA TANGAN -->
              <div class="flex justify-end pt-4">
                <div class="text-center space-y-8">
                  <p class="font-bold ${textPrimary}">PJ. Kepala Desa Karangpucung</p>
                  <div class="space-y-0.5">
                    <p class="font-extrabold underline ${textPrimary}">A. ANJARNINGSIH, S.E.</p>
                    <p class="text-[10px] ${textSecondary}">NIP. 19790507 2003 12 2 006</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  `;

  // Attach interactive listeners
  initSuratListeners();

  function initSuratListeners() {
    const btnModeSatuan = container.querySelector('#mode-satuan-btn');
    const btnModeBlok = container.querySelector('#mode-blok-btn');
    const wrapperSatuan = container.querySelector('#wrapper-select-satuan');
    const wrapperBlok = container.querySelector('#wrapper-select-blok');
    const formPanelTitle = container.querySelector('#form-panel-title');
    const badgePageCount = container.querySelector('#badge-page-count');
    const batchInfoText = container.querySelector('#batch-info-text');

    const kioskSelect = container.querySelector('#kiosk-select');
    const blockSelect = container.querySelector('#block-select');
    const inputNo = container.querySelector('#input-nomor-naskah');
    const inputTgl = container.querySelector('#input-tanggal-naskah');
    const inputSifat = container.querySelector('#input-sifat');
    const generateBtn = container.querySelector('#generate-pdf-btn');
    const btnText = container.querySelector('#btn-generate-text');
    const refreshBtn = container.querySelector('#refresh-data-btn');

    const resultCard = container.querySelector('#result-status-card');
    const resultFileName = container.querySelector('#result-file-name');
    const btnViewPdf = container.querySelector('#btn-view-pdf');

    // Switch to SATUAN Mode
    btnModeSatuan.addEventListener('click', () => {
      currentMode = 'SATUAN';
      btnModeSatuan.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow';
      btnModeBlok.className = `flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.remove('hidden');
      wrapperBlok.classList.add('hidden');
      formPanelTitle.innerText = 'Parameter Surat Satuan';
      btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
      badgePageCount.innerText = '1 LEMBAR';
      updatePreviewKioskDetails(selectedKiosk);
    });

    // Switch to BLOK Mode
    btnModeBlok.addEventListener('click', () => {
      currentMode = 'BLOK';
      btnModeBlok.className = 'flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow';
      btnModeSatuan.className = `flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.add('hidden');
      wrapperBlok.classList.remove('hidden');
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      badgePageCount.innerText = `${count} HALAMAN (1 FILE PDF)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
      if (blockGroups[selectedBlock] && blockGroups[selectedBlock][0]) {
        updatePreviewKioskDetails(blockGroups[selectedBlock][0]);
      }
    });

    // Block Selector Change
    blockSelect.addEventListener('change', (e) => {
      selectedBlock = e.target.value;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      badgePageCount.innerText = `${count} HALAMAN (1 FILE PDF)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
      if (blockGroups[selectedBlock] && blockGroups[selectedBlock][0]) {
        updatePreviewKioskDetails(blockGroups[selectedBlock][0]);
      }
    });

    // Live update preview when typing
    inputNo.addEventListener('input', (e) => {
      container.querySelector('#preview-no-naskah').innerText = e.target.value || '-';
    });

    inputTgl.addEventListener('input', (e) => {
      container.querySelector('#preview-tgl-naskah').innerText = e.target.value || '-';
    });

    inputSifat.addEventListener('change', (e) => {
      container.querySelector('#preview-sifat').innerText = e.target.value;
    });

    kioskSelect.addEventListener('change', (e) => {
      selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
      updatePreviewKioskDetails(selectedKiosk);
    });

    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('animate-spin');
      await spreadsheetService.fetchRemoteKiosks();
      refreshBtn.classList.remove('animate-spin');
      renderSuratView(container, selectedKiosk ? selectedKiosk.id : null);
    });

    // GENERATE PDF TRIGGER (SATUAN & MASSAL PER BLOK)
    generateBtn.addEventListener('click', async () => {
      const currentUser = authService.getCurrentUser();
      const petugasName = currentUser ? `${currentUser.nama} (${currentUser.username})` : 'Petugas Pasar';

      generateBtn.disabled = true;
      generateBtn.className = 'w-full bg-slate-700 text-slate-300 p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow opacity-80 cursor-wait';

      try {
        let payload = {};

        if (currentMode === 'SATUAN') {
          if (!selectedKiosk) {
            alert('Silakan pilih Kios/Pedagang terlebih dahulu!');
            generateBtn.disabled = false;
            return;
          }

          btnText.innerText = 'Memproses PDF di Google Drive...';
          const cleanBlok = getCleanBlokName(selectedKiosk);
          const cleanPasar = getCleanJenisPasar(selectedKiosk);

          payload = {
            action: 'generateSuratPemberitahuan',
            apiToken: API_SECURITY_TOKEN,
            nomor_naskah: inputNo.value.trim(),
            tanggal_naskah: inputTgl.value.trim(),
            sifat: inputSifat.value,
            nama_pedagang: selectedKiosk.pedagang === '-' ? 'Penyewa Kios' : selectedKiosk.pedagang,
            jenis_pasar: cleanPasar,
            blok_kios: cleanBlok,
            tipe_kios: selectedKiosk.tipeKios || 'LOS',
            luas_dimensi: selectedKiosk.luasDimensi || '200 x 200',
            luas_m2: selectedKiosk.luasM2 || '4.0',
            biaya_sewa: selectedKiosk.sewaBulanan || 'Rp 225.000/thn',
            user: petugasName
          };
        } else {
          // BATCH PER BLOK MODE
          const targetKiosks = blockGroups[selectedBlock] || [];
          if (targetKiosks.length === 0) {
            alert(`Tidak ada data kios di ${selectedBlock}!`);
            generateBtn.disabled = false;
            return;
          }

          btnText.innerText = `Menyusun 1 PDF Bundel ${selectedBlock} (${targetKiosks.length} Halaman)...`;

          const kioskPayloads = targetKiosks.map(k => ({
            id: k.id,
            nama_pedagang: k.pedagang === '-' ? 'Penyewa Kios' : k.pedagang,
            jenis_pasar: getCleanJenisPasar(k),
            blok_kios: getCleanBlokName(k),
            tipe_kios: k.tipeKios || 'LOS',
            luas_dimensi: k.luasDimensi || '200 x 200',
            luas_m2: k.luasM2 || '4.0',
            biaya_sewa: k.sewaBulanan || 'Rp 225.000/thn'
          }));

          payload = {
            action: 'generateSuratBatchBlok',
            apiToken: API_SECURITY_TOKEN,
            blok_name: selectedBlock,
            nomor_naskah: inputNo.value.trim(),
            tanggal_naskah: inputTgl.value.trim(),
            sifat: inputSifat.value,
            kiosks: kioskPayloads,
            user: petugasName
          };
        }

        const res = await fetch(GOOGLE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });

        const json = await res.json();

        if (json.status === 'success' && (json.pdfUrl || json.pdfViewUrl)) {
          resultFileName.innerText = json.fileName || 'Surat_Pemberitahuan.pdf';
          btnViewPdf.href = json.pdfViewUrl || json.pdfUrl;
          resultCard.classList.remove('hidden');

          resultCard.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert('Gagal membuat PDF: ' + (json.message || 'Respons server tidak valid'));
        }
      } catch (err) {
        console.error('Error generating document:', err);
        alert('Terjadi kendala jaringan saat menghubungi server Google Drive: ' + err.toString());
      } finally {
        generateBtn.disabled = false;
        if (currentMode === 'SATUAN') {
          btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
        } else {
          const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
          btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
        }
        generateBtn.className = 'w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function updatePreviewKioskDetails(kiosk) {
    if (!kiosk) return;
    container.querySelector('#preview-nama-pedagang').innerText = kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang;
    container.querySelector('#detail-pasar').innerText = getCleanJenisPasar(kiosk);
    container.querySelector('#detail-tipe').innerText = kiosk.tipeKios || 'LOS';
    container.querySelector('#detail-ukuran').innerText = kiosk.luasDimensi || '200 x 200';
    container.querySelector('#detail-luas').innerText = `${kiosk.luasM2 || '4.0'} m²`;
    container.querySelector('#detail-blok').innerText = getCleanBlokName(kiosk);
    container.querySelector('#detail-sewa').innerText = kiosk.sewaBulanan || 'Rp 225.000/thn';
  }
}
