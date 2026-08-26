import { spreadsheetService, formatDateDDMMYYYY } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';
import { authService } from '../../services/AuthService.js';
import { pdfService } from '../../services/PdfService.js';

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
    <div class="p-6 space-y-5 w-full h-full overflow-y-auto ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- TOOLBAR HEADER -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan Retribusi Sewa</h1>
        </div>

        <!-- RIGHT ACTION BUTTONS IN SINGLE HORIZONTAL ROW -->
        <div class="flex items-center gap-2 flex-wrap">
          
          <!-- Mode Switcher Pill -->
          <div class="flex items-center p-1 rounded-xl border ${cardBg}">
            <button id="mode-satuan-btn" class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow">
              <i data-lucide="user" class="w-3.5 h-3.5"></i>
              <span>Cetak Satuan</span>
            </button>
            <button id="mode-blok-btn" class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Cetak Massal Per Blok</span>
            </button>
          </div>

          <!-- Refresh Button beside Cetak Massal -->
          <button id="refresh-data-btn" class="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- MAIN CARD (SCROLLABLE & EXPANDABLE) -->
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

        <!-- FORM GRID (2 COLUMNS) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <!-- COLUMN 1: SELECTOR (SATUAN / BLOK) -->
          <div class="md:col-span-6 space-y-1.5">
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

            <div id="wrapper-select-blok" class="hidden space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Blok yang Ingin Dicetak Massal:</label>
              <select id="block-select" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
                ${availableBlocks.map(b => `
                  <option value="${b}" ${b === selectedBlock ? 'selected' : ''}>
                    ${b} (${blockGroups[b].length} Pedagang / Halaman)
                  </option>
                `).join('')}
              </select>
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

        <!-- BATCH HELPER INFO BOX (ONLY IN BLOK MODE) -->
        <div id="batch-info-box" class="hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
          <div class="flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
            <span id="batch-info-text">Seluruh surat di blok ini akan disatukan menjadi 1 File PDF multi-halaman siap cetak.</span>
          </div>
          <span class="text-[11px] font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded-lg">
            INSTAN 1-2 DETIK
          </span>
        </div>

        <!-- BOTTOM CONTROLS, PROGRESS INDICATOR & RESULT BANNER -->
        <div class="space-y-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          
          <!-- PROGRESS INDICATOR BAR -->
          <div id="progress-indicator-box" class="hidden border rounded-2xl p-4 space-y-2.5 bg-slate-900 border-slate-700/80 shadow-lg">
            <div class="flex items-center justify-between text-xs font-bold">
              <span id="progress-status-label" class="text-emerald-400 flex items-center gap-2">
                <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
                <span id="progress-status-text">Menyusun halaman surat PDF...</span>
              </span>
              <span id="progress-percent" class="font-mono text-slate-300">0%</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div id="progress-bar-fill" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-200" style="width: 0%;"></div>
            </div>
            <p id="progress-subtext" class="text-[11px] text-slate-400">Memproses dokumen A4 dengan tata letak resmi desa...</p>
          </div>

          <!-- RESULT SUCCESS BANNER -->
          <div id="result-status-card" class="hidden border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${cardBg} border-emerald-500/50 bg-emerald-500/5 shadow-sm">
            <div class="flex items-center gap-3 text-emerald-500 font-extrabold text-xs">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <div>
                <p id="result-status-title" class="text-sm">Surat PDF Berhasil Dibuat & Siap Dicetak!</p>
                <p id="result-file-name" class="text-xs font-mono font-normal text-slate-400">Surat_Pemberitahuan.pdf</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <a 
                id="btn-view-pdf" 
                href="#" 
                target="_blank" 
                class="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                <span>Buka & Cetak PDF</span>
              </a>
            </div>
          </div>

          <!-- GENERATE ACTION BUTTON -->
          <button 
            id="generate-pdf-btn" 
            class="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <i data-lucide="file-check" class="w-4 h-4"></i>
            <span id="btn-generate-text">Terbitkan Surat PDF Sekarang</span>
          </button>

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
    const batchInfoBox = container.querySelector('#batch-info-box');
    const formPanelTitle = container.querySelector('#form-panel-title');
    const batchInfoText = container.querySelector('#batch-info-text');
    const infoBadgeSummary = container.querySelector('#info-badge-summary');

    const kioskSelect = container.querySelector('#kiosk-select');
    const blockSelect = container.querySelector('#block-select');
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
    const resultFileName = container.querySelector('#result-file-name');
    const btnViewPdf = container.querySelector('#btn-view-pdf');

    // Switch to SATUAN Mode
    btnModeSatuan.addEventListener('click', () => {
      currentMode = 'SATUAN';
      btnModeSatuan.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow';
      btnModeBlok.className = `px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.remove('hidden');
      wrapperBlok.classList.add('hidden');
      batchInfoBox.classList.add('hidden');
      formPanelTitle.innerText = 'Parameter Cetak Satuan';
      btnText.innerText = 'Terbitkan Surat PDF Sekarang';
      updateSummaryBadge();
    });

    // Switch to BLOK Mode
    btnModeBlok.addEventListener('click', () => {
      currentMode = 'BLOK';
      btnModeBlok.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 text-white shadow';
      btnModeSatuan.className = `px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${textSecondary} hover:text-emerald-500`;
      wrapperSatuan.classList.add('hidden');
      wrapperBlok.classList.remove('hidden');
      batchInfoBox.classList.remove('hidden');
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
      infoBadgeSummary.innerText = `${selectedBlock} • Total ${count} Pedagang / Halaman`;
    });

    // Block Selector Change
    blockSelect.addEventListener('change', (e) => {
      selectedBlock = e.target.value;
      const count = blockGroups[selectedBlock] ? blockGroups[selectedBlock].length : 0;
      formPanelTitle.innerText = `Parameter Cetak Massal (${selectedBlock})`;
      btnText.innerText = `Terbitkan 1 PDF Bundel ${selectedBlock} (${count} Halaman)`;
      batchInfoText.innerText = `Seluruh ${count} pedagang di ${selectedBlock} akan digabung dalam 1 file PDF.`;
      infoBadgeSummary.innerText = `${selectedBlock} • Total ${count} Pedagang / Halaman`;
    });

    kioskSelect.addEventListener('change', (e) => {
      selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
      updateSummaryBadge();
    });

    function updateSummaryBadge() {
      if (selectedKiosk) {
        infoBadgeSummary.innerText = `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}`;
      }
    }

    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('animate-spin');
      await spreadsheetService.fetchRemoteKiosks();
      refreshBtn.classList.remove('animate-spin');
      renderSuratView(container, selectedKiosk ? selectedKiosk.id : null);
    });

    // HIGH-SPEED INSTANT PDF GENERATOR TRIGGER (SATUAN & MASSAL PER BLOK)
    generateBtn.addEventListener('click', async () => {
      generateBtn.disabled = true;
      generateBtn.className = 'w-full bg-slate-700 text-slate-300 p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow opacity-80 cursor-wait';
      progressBox.classList.remove('hidden');
      resultCard.classList.add('hidden');

      try {
        const isBatch = currentMode !== 'SATUAN';
        const globalParams = {
          nomor_naskah: inputNo.value.trim() || '511.2/014/VIII/2026',
          tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
          sifat: inputSifat.value || 'Biasa'
        };

        let pdfDoc;
        let fileName;

        if (!isBatch) {
          if (!selectedKiosk) {
            alert('Silakan pilih Kios/Pedagang terlebih dahulu!');
            generateBtn.disabled = false;
            progressBox.classList.add('hidden');
            return;
          }

          progressPercent.innerText = '50%';
          progressBarFill.style.width = '50%';
          progressStatusText.innerText = 'Menyusun dokumen PDF surat satuan...';

          const singleData = {
            ...globalParams,
            nama_pedagang: selectedKiosk.pedagang === '-' ? 'Penyewa Kios' : selectedKiosk.pedagang,
            jenis_pasar: getCleanJenisPasar(selectedKiosk),
            blok_kios: getCleanBlokName(selectedKiosk),
            tipe_kios: selectedKiosk.tipeKios || 'LOS',
            luas_dimensi: selectedKiosk.luasDimensi || '200 x 200',
            luas_m2: selectedKiosk.luasM2 || '4.0',
            biaya_sewa: selectedKiosk.sewaBulanan || 'Rp 225.000/thn'
          };

          pdfDoc = pdfService.generateSingleNotice(singleData);
          fileName = `Surat_Pemberitahuan_${singleData.blok_kios.replace(/\s+/g, '_')}_${singleData.nama_pedagang.replace(/\s+/g, '_')}_2026.pdf`;
        } else {
          // BATCH PER BLOK
          const targetKiosks = blockGroups[selectedBlock] || [];
          if (targetKiosks.length === 0) {
            alert(`Tidak ada data kios di ${selectedBlock}!`);
            generateBtn.disabled = false;
            progressBox.classList.add('hidden');
            return;
          }

          const kioskList = targetKiosks.map(k => ({
            nama_pedagang: k.pedagang === '-' ? 'Penyewa Kios' : k.pedagang,
            jenis_pasar: getCleanJenisPasar(k),
            blok_kios: getCleanBlokName(k),
            tipe_kios: k.tipeKios || 'LOS',
            luas_dimensi: k.luasDimensi || '200 x 200',
            luas_m2: k.luasM2 || '4.0',
            biaya_sewa: k.sewaBulanan || 'Rp 225.000/thn'
          }));

          pdfDoc = pdfService.generateBatchNotice(kioskList, globalParams, (percent, cur, total) => {
            progressPercent.innerText = `${percent}%`;
            progressBarFill.style.width = `${percent}%`;
            progressStatusText.innerText = `Menyusun halaman ${cur} dari ${total} pedagang...`;
          });

          fileName = `Bundel_Surat_Massal_${selectedBlock.replace(/\s+/g, '_')}_2026.pdf`;
        }

        // Complete Progress
        progressPercent.innerText = '100%';
        progressBarFill.style.width = '100%';
        progressStatusText.innerText = 'File PDF Berhasil Dibuat!';

        // Create Blob URL for Instant Download & Preview
        const pdfBlob = pdfDoc.output('blob');
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);

        // Auto Download file
        pdfDoc.save(fileName);

        // Update result card
        resultFileName.innerText = fileName;
        btnViewPdf.href = pdfBlobUrl;
        resultCard.classList.remove('hidden');

        setTimeout(() => {
          progressBox.classList.add('hidden');
        }, 600);

        resultCard.scrollIntoView({ behavior: 'smooth' });

      } catch (err) {
        console.error('Error generating instant PDF:', err);
        progressBox.classList.add('hidden');
        alert('Terjadi kendala saat menyusun PDF: ' + err.toString());
      } finally {
        generateBtn.disabled = false;
        if (currentMode === 'SATUAN') {
          btnText.innerText = 'Terbitkan Surat PDF Sekarang';
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
