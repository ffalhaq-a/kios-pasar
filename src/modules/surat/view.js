import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';
import { authService, GOOGLE_API_URL } from '../../services/AuthService.js';
import { API_SECURITY_TOKEN } from '../../utils/security.js';

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

  // Mode: 'SATUAN' | 'BATCH'
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

  // Selected kiosks for batch mode (max 5)
  let selectedBatchKiosks = (blockGroups[selectedBlock] || []).slice(0, 5);

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  container.innerHTML = `
    <div class="p-6 space-y-5 w-full h-full overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- TOOLBAR HEADER -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan Retribusi Sewa</h1>
          <p class="text-xs ${textSecondary} mt-0.5">
            Dibuat menggunakan Template Master Google Docs & tersimpan otomatis sebagai PDF di Google Drive
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Mode Switcher Pill -->
          <div class="flex items-center p-1 rounded-xl border ${cardBg}">
            <button id="mode-satuan-btn" class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow">
              <i data-lucide="user" class="w-3.5 h-3.5"></i>
              <span>Cetak Satuan (1 Surat)</span>
            </button>
            <button id="mode-batch-btn" class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Cetak Batch (Maks 5 Surat)</span>
            </button>
          </div>

          <!-- Refresh Button -->
          <button id="refresh-data-btn" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- MAIN CARD -->
      <div class="border rounded-2xl p-6 space-y-6 ${cardBg}">
        
        <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h2 class="text-sm font-bold ${textPrimary} flex items-center gap-2">
            <i data-lucide="file-edit" class="w-4 h-4 text-emerald-500"></i>
            <span id="form-panel-title">Parameter Cetak Satuan</span>
          </h2>
          <span id="info-badge-summary" class="text-xs font-mono font-bold text-emerald-500">
            ${selectedKiosk ? `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}` : ''}
          </span>
        </div>

        <!-- FORM GRID -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <!-- COLUMN 1: SELECTOR (SATUAN / BATCH) -->
          <div class="md:col-span-6 space-y-1.5">
            
            <!-- SATUAN SELECTOR -->
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

            <!-- BATCH SELECTOR (BLOK + CHECKLIST MAKS 5) -->
            <div id="wrapper-select-batch" class="hidden space-y-3">
              <div class="space-y-1">
                <label class="text-xs font-bold ${textSecondary}">Pilih Blok:</label>
                <select id="block-select" class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
                  ${availableBlocks.map(b => `
                    <option value="${b}" ${b === selectedBlock ? 'selected' : ''}>
                      ${b} (Total ${blockGroups[b].length} Pedagang)
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- CHECKLIST PEDAGANG (MAKS 5) -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px] font-bold">
                  <span class="${textSecondary}">Pilih Pedagang yang Ingin Diterbitkan:</span>
                  <span id="batch-selected-count" class="text-emerald-500 font-mono font-extrabold">5 / 5 Terpilih</span>
                </div>
                <div id="batch-kiosks-list" class="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
                  <!-- Rendered dynamically -->
                </div>
              </div>
            </div>

          </div>

          <!-- COLUMN 2: SIFAT SURAT -->
          <div class="md:col-span-6 space-y-1.5">
            <label class="text-xs font-bold ${textSecondary}">Sifat Surat:</label>
            <select id="input-sifat" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              <option value="Biasa" selected>Biasa</option>
              <option value="Penting">Penting / Segera</option>
              <option value="Peringatan">Peringatan / Jatuh Tempo</option>
            </select>
          </div>

          <!-- COLUMN 3: NOMOR NASKAH -->
          <div class="md:col-span-6 space-y-1.5">
            <label class="text-xs font-bold ${textSecondary}">Nomor Naskah / Surat:</label>
            <input 
              type="text" 
              id="input-nomor-naskah" 
              value="${defaultNoNaskah}"
              class="w-full p-3 rounded-xl text-xs font-mono border focus:outline-none focus:border-emerald-500 ${inputBg}"
              placeholder="misal: 511.2/014/VIII/2026"
            />
          </div>

          <!-- COLUMN 4: TANGGAL NASKAH -->
          <div class="md:col-span-6 space-y-1.5">
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

        <!-- CLOUD STORAGE INFO BANNER -->
        <div class="p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
          <div class="flex items-center gap-2">
            <i data-lucide="cloud" class="w-4 h-4 shrink-0"></i>
            <span id="cloud-info-text">File PDF yang diterbitkan akan tersimpan otomatis di subfolder <strong>Arsip_Surat_Pemberitahuan</strong> di Google Drive Desa.</span>
          </div>
          <span class="text-[11px] font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0">
            GOOGLE DRIVE CLOUD
          </span>
        </div>

        <!-- BOTTOM CONTROLS, PROGRESS INDICATOR & RESULT BANNER -->
        <div class="space-y-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          
          <!-- PROGRESS INDICATOR BAR -->
          <div id="progress-indicator-box" class="hidden border rounded-2xl p-4 space-y-2.5 bg-slate-900 border-slate-700/80 shadow-lg">
            <div class="flex items-center justify-between text-xs font-bold">
              <span id="progress-status-label" class="text-emerald-400 flex items-center gap-2">
                <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
                <span id="progress-status-text">Memproses dokumen di Google Drive...</span>
              </span>
              <span id="progress-percent" class="font-mono text-slate-300">0%</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div id="progress-bar-fill" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300" style="width: 0%;"></div>
            </div>
            <p id="progress-subtext" class="text-[11px] text-slate-400">Mengisi template Google Docs dan mengonversi menjadi file PDF...</p>
          </div>

          <!-- RESULT SUCCESS BANNER (SINGLE / LIST) -->
          <div id="result-status-card" class="hidden border rounded-xl p-4 space-y-3 ${cardBg} border-emerald-500/50 bg-emerald-500/5 shadow-sm">
            <div class="flex items-center gap-3 text-emerald-500 font-extrabold text-xs">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <div>
                <p id="result-status-title" class="text-sm">Surat PDF Berhasil Diterbitkan ke Google Drive!</p>
                <p id="result-status-subtitle" class="text-xs font-mono font-normal text-slate-400">Dokumen telah tersimpan rapi di Google Drive.</p>
              </div>
            </div>

            <!-- RESULT ITEMS LIST -->
            <div id="result-items-container" class="space-y-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <!-- Result links rendered here -->
            </div>
          </div>

          <!-- GENERATE ACTION BUTTON -->
          <button 
            id="generate-pdf-btn" 
            class="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <i data-lucide="file-check" class="w-4 h-4"></i>
            <span id="btn-generate-text">Terbitkan Surat PDF & Simpan ke Drive</span>
          </button>

        </div>

      </div>

    </div>
  `;

  // Attach interactive listeners
  initSuratListeners();

  function initSuratListeners() {
    const btnModeSatuan = container.querySelector('#mode-satuan-btn');
    const btnModeBatch = container.querySelector('#mode-batch-btn');
    const wrapperSatuan = container.querySelector('#wrapper-select-satuan');
    const wrapperBatch = container.querySelector('#wrapper-select-batch');
    const formPanelTitle = container.querySelector('#form-panel-title');
    const infoBadgeSummary = container.querySelector('#info-badge-summary');

    const kioskSelect = container.querySelector('#kiosk-select');
    const blockSelect = container.querySelector('#block-select');
    const batchKiosksList = container.querySelector('#batch-kiosks-list');
    const batchSelectedCount = container.querySelector('#batch-selected-count');

    const inputNo = container.querySelector('#input-nomor-naskah');
    const inputTgl = container.querySelector('#input-tanggal-naskah');
    const inputSifat = container.querySelector('#input-sifat');
    const generateBtn = container.querySelector('#generate-pdf-btn');
    const btnText = container.querySelector('#btn-generate-text');
    const refreshBtn = container.querySelector('#refresh-data-btn');

    const progressBox = container.querySelector('#progress-indicator-box');
    const progressBarFill = container.querySelector('#progress-bar-fill');
    const progressPercent = container.querySelector('#progress-percent');
    const progressStatusText = container.querySelector('#progress-status-text');
    const progressSubtext = container.querySelector('#progress-subtext');

    const resultCard = container.querySelector('#result-status-card');
    const resultTitle = container.querySelector('#result-status-title');
    const resultSubtitle = container.querySelector('#result-status-subtitle');
    const resultItemsContainer = container.querySelector('#result-items-container');

    // Render Batch Checklist for selected block (max 5)
    function renderBatchChecklist() {
      const blockKiosks = blockGroups[selectedBlock] || [];
      batchKiosksList.innerHTML = blockKiosks.map((k, idx) => {
        const isChecked = selectedBatchKiosks.some(sk => sk.id === k.id);
        return `
          <label class="flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-800/50 cursor-pointer select-none">
            <div class="flex items-center gap-2">
              <input type="checkbox" value="${k.id}" ${isChecked ? 'checked' : ''} class="batch-checkbox rounded text-emerald-600 focus:ring-emerald-500" />
              <span class="font-bold">[${getCleanBlokName(k)}] ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang}</span>
            </div>
            <span class="text-[11px] font-mono text-emerald-500">${k.sewaBulanan || 'Rp 225.000/thn'}</span>
          </label>
        `;
      }).join('');

      // Add change listeners
      const checkboxes = batchKiosksList.querySelectorAll('.batch-checkbox');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const checked = Array.from(checkboxes).filter(c => c.checked);
          if (checked.length > 5) {
            cb.checked = false;
            alert('Maksimal 5 surat per penerbitan batch untuk menjaga stabilitas Google Drive!');
            return;
          }
          selectedBatchKiosks = kiosks.filter(k => Array.from(checkboxes).filter(c => c.checked).map(c => c.value).includes(k.id));
          updateBatchSummary();
        });
      });

      updateBatchSummary();
    }

    function updateBatchSummary() {
      batchSelectedCount.innerText = `${selectedBatchKiosks.length} / 5 Terpilih`;
      if (currentMode === 'BATCH') {
        btnText.innerText = `Terbitkan ${selectedBatchKiosks.length} Surat PDF ke Google Drive`;
        infoBadgeSummary.innerText = `${selectedBlock} • ${selectedBatchKiosks.length} Surat Siap Diterbitkan`;
      }
    }

    // Switch to SATUAN Mode
    btnModeSatuan.addEventListener('click', () => {
      currentMode = 'SATUAN';
      btnModeSatuan.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow';
      btnModeBatch.className = `px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.remove('hidden');
      wrapperBatch.classList.add('hidden');
      formPanelTitle.innerText = 'Parameter Cetak Satuan';
      btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
      if (selectedKiosk) {
        infoBadgeSummary.innerText = `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}`;
      }
    });

    // Switch to BATCH Mode
    btnModeBatch.addEventListener('click', () => {
      currentMode = 'BATCH';
      btnModeBatch.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow';
      btnModeSatuan.className = `px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.add('hidden');
      wrapperBatch.classList.remove('hidden');
      formPanelTitle.innerText = `Parameter Cetak Batch (${selectedBlock} - Maks 5 Surat)`;
      renderBatchChecklist();
    });

    // Block Selector Change
    blockSelect.addEventListener('change', (e) => {
      selectedBlock = e.target.value;
      selectedBatchKiosks = (blockGroups[selectedBlock] || []).slice(0, 5);
      formPanelTitle.innerText = `Parameter Cetak Batch (${selectedBlock} - Maks 5 Surat)`;
      renderBatchChecklist();
    });

    kioskSelect.addEventListener('change', (e) => {
      selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
      if (selectedKiosk && currentMode === 'SATUAN') {
        infoBadgeSummary.innerText = `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}`;
      }
    });

    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('animate-spin');
      await spreadsheetService.fetchRemoteKiosks();
      refreshBtn.classList.remove('animate-spin');
      renderSuratView(container, selectedKiosk ? selectedKiosk.id : null);
    });

    // GENERATE PROCESSOR
    generateBtn.addEventListener('click', async () => {
      const isBatch = currentMode === 'BATCH';
      const targetList = isBatch ? selectedBatchKiosks : (selectedKiosk ? [selectedKiosk] : []);

      if (targetList.length === 0) {
        alert(isBatch ? 'Pilih minimal 1 pedagang dalam batch!' : 'Pilih Kios/Pedagang terlebih dahulu!');
        return;
      }

      const currentUser = authService.getCurrentUser();
      const petugasName = currentUser ? `${currentUser.nama} (${currentUser.username})` : 'Petugas Pasar';

      generateBtn.disabled = true;
      generateBtn.className = 'w-full bg-slate-700 text-slate-300 p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow opacity-80 cursor-wait';
      
      progressBox.classList.remove('hidden');
      resultCard.classList.add('hidden');
      resultItemsContainer.innerHTML = '';

      const successfulResults = [];

      try {
        const total = targetList.length;

        for (let i = 0; i < total; i++) {
          const currentKiosk = targetList[i];
          const cleanBlok = getCleanBlokName(currentKiosk);
          const cleanPasar = getCleanJenisPasar(currentKiosk);

          const curPercent = Math.round(((i + 1) / total) * 100);
          progressBarFill.style.width = `${curPercent}%`;
          progressPercent.innerText = `${curPercent}%`;
          progressStatusText.innerText = `Memproses surat ${i + 1} dari ${total}: [${cleanBlok}] ${currentKiosk.pedagang}...`;
          progressSubtext.innerText = `Mengisi template Google Docs dan mengonversi menjadi file PDF resmi...`;

          const payload = {
            action: 'generateSuratPemberitahuan',
            apiToken: API_SECURITY_TOKEN,
            nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
            tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
            sifat: inputSifat.value || 'Biasa',
            nama_pedagang: currentKiosk.pedagang === '-' ? 'Penyewa Kios' : currentKiosk.pedagang,
            jenis_pasar: cleanPasar,
            blok_kios: cleanBlok,
            tipe_kios: currentKiosk.tipeKios || 'LOS',
            luas_dimensi: currentKiosk.luasDimensi || '200 x 200',
            luas_m2: currentKiosk.luasM2 || '4.0',
            biaya_sewa: currentKiosk.sewaBulanan || 'Rp 225.000/thn',
            user: petugasName
          };

          const res = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
          });

          const json = await res.json();

          if (json.status === 'success' && (json.pdfUrl || json.pdfViewUrl)) {
            successfulResults.push({
              blok: cleanBlok,
              nama: currentKiosk.pedagang,
              fileName: json.fileName || `Surat_${cleanBlok}.pdf`,
              url: json.pdfViewUrl || json.pdfUrl
            });
          }
        }

        if (successfulResults.length > 0) {
          resultTitle.innerText = `${successfulResults.length} Surat PDF Berhasil Diterbitkan ke Google Drive!`;
          resultSubtitle.innerText = `Seluruh file PDF telah tersimpan rapi di folder Arsip_Surat_Pemberitahuan.`;

          resultItemsContainer.innerHTML = successfulResults.map((r, idx) => `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">${idx + 1}</span>
                <span class="text-xs font-bold ${textPrimary}">[${r.blok}] ${r.nama}</span>
              </div>
              <a href="${r.url}" target="_blank" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>Buka PDF di Drive</span>
              </a>
            </div>
          `).join('');

          resultCard.classList.remove('hidden');

          setTimeout(() => {
            progressBox.classList.add('hidden');
          }, 600);

          resultCard.scrollIntoView({ behavior: 'smooth' });
        } else {
          progressBox.classList.add('hidden');
          alert('Gagal menerbitkan surat. Silakan periksa koneksi Google Drive.');
        }

      } catch (err) {
        progressBox.classList.add('hidden');
        console.error('Error in batch generation:', err);
        alert('Terjadi kendala saat memproses dokumen di Google Drive: ' + err.toString());
      } finally {
        generateBtn.disabled = false;
        if (currentMode === 'SATUAN') {
          btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
        } else {
          btnText.innerText = `Terbitkan ${selectedBatchKiosks.length} Surat PDF ke Google Drive`;
        }
        generateBtn.className = 'w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }
}
