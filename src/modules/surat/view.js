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
    <div class="p-6 space-y-6 max-w-3xl mx-auto h-full overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono">
              LAYANAN SURAT RESMI PASAR 2026
            </span>
          </div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan</h1>
          <p class="text-xs ${textSecondary} mt-0.5">
            Terbitkan Surat Pemberitahuan Satuan atau Bundel Massal Per Blok langsung ke Google Drive
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
      <div class="flex items-center p-1.5 rounded-2xl border ${cardBg}">
        <button id="mode-satuan-btn" class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow">
          <i data-lucide="user" class="w-4 h-4"></i>
          <span>Mode Satuan (1 Pedagang)</span>
        </button>
        <button id="mode-blok-btn" class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500">
          <i data-lucide="layers" class="w-4 h-4"></i>
          <span>Cetak Massal Per Blok (1 PDF)</span>
        </button>
      </div>

      <!-- MAIN FORM CARD -->
      <div class="space-y-4">
        <div class="border rounded-2xl p-6 space-y-5 ${cardBg}">
          <h2 class="text-sm font-bold ${textPrimary} flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <i data-lucide="file-edit" class="w-4 h-4 text-emerald-500"></i>
            <span id="form-panel-title">Parameter Surat Satuan</span>
          </h2>

          <!-- PILIHAN 1: SELECTOR SATUAN -->
          <div id="wrapper-select-satuan" class="space-y-1.5">
            <label class="text-xs font-bold ${textSecondary}">Pilih Kios / Nama Pedagang:</label>
            <select id="kiosk-select" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              ${kiosks.map(k => `
                <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                  [${getCleanBlokName(k)}] ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} - Pasar ${getCleanJenisPasar(k)} (${k.sewaBulanan || 'Rp 225.000/thn'})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- PILIHAN 2: SELECTOR BATCH PER BLOK -->
          <div id="wrapper-select-blok" class="hidden space-y-2">
            <label class="text-xs font-bold ${textSecondary}">Pilih Blok yang Ingin Dicetak Massal:</label>
            <select id="block-select" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              ${availableBlocks.map(b => `
                <option value="${b}" ${b === selectedBlock ? 'selected' : ''}>
                  ${b} (${blockGroups[b].length} Pedagang / Halaman)
                </option>
              `).join('')}
            </select>
            <div class="p-3 rounded-xl border text-xs space-y-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
              <p class="font-bold flex items-center gap-1.5">
                <i data-lucide="info" class="w-4 h-4"></i>
                <span id="batch-info-text">Seluruh surat di blok ini akan disatukan menjadi 1 File PDF.</span>
              </p>
              <p class="text-[11px] text-slate-400">Cocok untuk cetak fisik sekali jalan (*Ctrl + P* di printer kantor desa).</p>
            </div>
          </div>

          <!-- FORM ROW 2: NOMOR & TANGGAL NASKAH -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Nomor Naskah / Surat:</label>
              <input 
                type="text" 
                id="input-nomor-naskah" 
                value="${defaultNoNaskah}"
                class="w-full p-3 rounded-xl text-xs font-mono border focus:outline-none focus:border-emerald-500 ${inputBg}"
                placeholder="misal: 511.2/014/VIII/2026"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Tanggal Naskah Surat:</label>
              <input 
                type="text" 
                id="input-tanggal-naskah" 
                value="${defaultDateStr}"
                class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}"
                placeholder="misal: 26 Agustus 2026"
              />
            </div>
          </div>

          <!-- SIFAT SURAT -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold ${textSecondary}">Sifat Surat:</label>
            <select id="input-sifat" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="Biasa" selected>Biasa</option>
              <option value="Penting">Penting / Segera</option>
              <option value="Peringatan">Peringatan / Jatuh Tempo</option>
            </select>
          </div>

          <!-- GENERATE ACTION BUTTON -->
          <div class="pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <button 
              id="generate-pdf-btn" 
              class="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <i data-lucide="file-check" class="w-4 h-4"></i>
              <span id="btn-generate-text">Terbitkan Surat PDF & Simpan ke Drive</span>
            </button>
          </div>

        </div>

        <!-- STATUS / RESULT BANNER -->
        <div id="result-status-card" class="hidden border rounded-2xl p-6 space-y-4 ${cardBg} border-emerald-500/50 bg-emerald-500/5">
          <div class="flex items-center gap-2 text-emerald-500 font-extrabold text-sm">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span id="result-status-title">Surat PDF Berhasil Diterbitkan!</span>
          </div>
          <p id="result-file-name" class="text-xs font-mono ${textSecondary}">Surat_Pemberitahuan.pdf</p>
          
          <div class="flex flex-wrap gap-3 pt-2">
            <a 
              id="btn-view-pdf" 
              href="#" 
              target="_blank" 
              class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <i data-lucide="external-link" class="w-4 h-4"></i>
              <span>Buka File PDF di Google Drive</span>
            </a>
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
      btnModeSatuan.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow';
      btnModeBlok.className = `flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.remove('hidden');
      wrapperBlok.classList.add('hidden');
      formPanelTitle.innerText = 'Parameter Surat Satuan';
      btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
    });

    // Switch to BLOK Mode
    btnModeBlok.addEventListener('click', () => {
      currentMode = 'BLOK';
      btnModeBlok.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow';
      btnModeSatuan.className = `flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.add('hidden');
      wrapperBlok.classList.remove('hidden');
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
    });

    // Block Selector Change
    blockSelect.addEventListener('change', (e) => {
      selectedBlock = e.target.value;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
    });

    kioskSelect.addEventListener('change', (e) => {
      selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
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
      generateBtn.className = 'w-full bg-slate-700 text-slate-300 p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow opacity-80 cursor-wait';

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
        generateBtn.className = 'w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }
}
