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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan Retribusi Sewa</h1>
          <p class="text-xs ${textSecondary} mt-0.5">
            Dibuat menggunakan Template Master Google Docs & tersimpan otomatis sebagai PDF di Google Drive
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Refresh Button -->
          <button id="refresh-data-btn" class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- MAIN CARD (CLEAN FULL-WIDTH FORM) -->
      <div class="border rounded-2xl p-6 space-y-6 ${cardBg}">
        
        <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h2 class="text-sm font-bold ${textPrimary} flex items-center gap-2">
            <i data-lucide="file-edit" class="w-4 h-4 text-emerald-500"></i>
            <span>Parameter Surat Pemberitahuan</span>
          </h2>
          <span id="info-badge-summary" class="text-xs font-mono font-bold text-emerald-500">
            ${selectedKiosk ? `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}` : ''}
          </span>
        </div>

        <!-- FORM GRID (2 COLUMNS) -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <!-- COLUMN 1: SELECTOR PEDAGANG / KIOS -->
          <div class="md:col-span-6 space-y-1.5">
            <label class="text-xs font-bold ${textSecondary}">Pilih Kios / Nama Pedagang:</label>
            <select id="kiosk-select" class="w-full p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
              ${kiosks.map(k => `
                <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                  [${getCleanBlokName(k)}] ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} - Pasar ${getCleanJenisPasar(k)} (${k.sewaBulanan || 'Rp 225.000/thn'})
                </option>
              `).join('')}
            </select>
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
            <span>File PDF yang diterbitkan akan otomatis tersimpan rapi di subfolder <strong>Arsip_Surat_Pemberitahuan</strong> di Google Drive Desa.</span>
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
              <span id="progress-percent" class="font-mono text-slate-300">50%</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div id="progress-bar-fill" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300" style="width: 50%;"></div>
            </div>
            <p id="progress-subtext" class="text-[11px] text-slate-400">Mengisi template Google Docs dan mengonversi menjadi file PDF...</p>
          </div>

          <!-- RESULT SUCCESS BANNER -->
          <div id="result-status-card" class="hidden border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${cardBg} border-emerald-500/50 bg-emerald-500/5 shadow-sm">
            <div class="flex items-center gap-3 text-emerald-500 font-extrabold text-xs">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <div>
                <p id="result-status-title" class="text-sm">Surat PDF Berhasil Diterbitkan ke Google Drive!</p>
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
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                <span>Buka PDF di Google Drive</span>
              </a>
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
    const kioskSelect = container.querySelector('#kiosk-select');
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

    const resultCard = container.querySelector('#result-status-card');
    const resultFileName = container.querySelector('#result-file-name');
    const btnViewPdf = container.querySelector('#btn-view-pdf');
    const infoBadgeSummary = container.querySelector('#info-badge-summary');

    kioskSelect.addEventListener('change', (e) => {
      selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
      if (selectedKiosk) {
        infoBadgeSummary.innerText = `${getCleanBlokName(selectedKiosk)} • ${selectedKiosk.pedagang} • ${selectedKiosk.sewaBulanan || 'Rp 225.000/thn'}`;
      }
    });

    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('animate-spin');
      await spreadsheetService.fetchRemoteKiosks();
      refreshBtn.classList.remove('animate-spin');
      renderSuratView(container, selectedKiosk ? selectedKiosk.id : null);
    });

    // GENERATE GOOGLE DOCS TO DRIVE PDF TRIGGER
    generateBtn.addEventListener('click', async () => {
      if (!selectedKiosk) {
        alert('Silakan pilih Kios/Pedagang terlebih dahulu!');
        return;
      }

      const currentUser = authService.getCurrentUser();
      const petugasName = currentUser ? `${currentUser.nama} (${currentUser.username})` : 'Petugas Pasar';

      generateBtn.disabled = true;
      generateBtn.className = 'w-full bg-slate-700 text-slate-300 p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow opacity-80 cursor-wait';
      btnText.innerText = 'Memproses PDF di Google Drive...';
      
      progressBox.classList.remove('hidden');
      resultCard.classList.add('hidden');
      progressBarFill.style.width = '35%';
      progressPercent.innerText = '35%';
      progressStatusText.innerText = 'Mengisi template Google Docs master desa...';

      try {
        const cleanBlok = getCleanBlokName(selectedKiosk);
        const cleanPasar = getCleanJenisPasar(selectedKiosk);

        const payload = {
          action: 'generateSuratPemberitahuan',
          apiToken: API_SECURITY_TOKEN,
          nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
          tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
          sifat: inputSifat.value || 'Biasa',
          nama_pedagang: selectedKiosk.pedagang === '-' ? 'Penyewa Kios' : selectedKiosk.pedagang,
          jenis_pasar: cleanPasar,
          blok_kios: cleanBlok,
          tipe_kios: selectedKiosk.tipeKios || 'LOS',
          luas_dimensi: selectedKiosk.luasDimensi || '200 x 200',
          luas_m2: selectedKiosk.luasM2 || '4.0',
          biaya_sewa: selectedKiosk.sewaBulanan || 'Rp 225.000/thn',
          user: petugasName
        };

        progressBarFill.style.width = '70%';
        progressPercent.innerText = '70%';
        progressStatusText.innerText = 'Mengonversi ke PDF & menyimpan ke Google Drive...';

        const res = await fetch(GOOGLE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });

        const json = await res.json();

        if (json.status === 'success' && (json.pdfUrl || json.pdfViewUrl)) {
          progressBarFill.style.width = '100%';
          progressPercent.innerText = '100%';
          progressStatusText.innerText = 'Surat PDF Berhasil Disimpan ke Google Drive!';

          resultFileName.innerText = json.fileName || 'Surat_Pemberitahuan.pdf';
          btnViewPdf.href = json.pdfViewUrl || json.pdfUrl;
          resultCard.classList.remove('hidden');

          setTimeout(() => {
            progressBox.classList.add('hidden');
          }, 600);

          resultCard.scrollIntoView({ behavior: 'smooth' });
        } else {
          progressBox.classList.add('hidden');
          alert('Gagal membuat PDF: ' + (json.message || 'Respons server tidak valid'));
        }
      } catch (err) {
        progressBox.classList.add('hidden');
        console.error('Error generating document in Google Drive:', err);
        alert('Terjadi kendala saat menghubungi server Google Drive: ' + err.toString());
      } finally {
        generateBtn.disabled = false;
        btnText.innerText = 'Terbitkan Surat PDF & Simpan ke Drive';
        generateBtn.className = 'w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }
}
