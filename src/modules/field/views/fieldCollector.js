import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { themeManager } from '../../../shell/ThemeManager.js';

export function renderFieldCollectorView(container) {
  const isDark = themeManager.isDark();
  let kiosks = spreadsheetService.loadKiosks();
  let selectedKioskId = kiosks[0]?.id || '';

  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800';

  function getSelectedKiosk() {
    return kiosks.find(k => k.id === selectedKioskId) || kiosks[0];
  }

  function renderContent() {
    const k = getSelectedKiosk();

    container.innerHTML = `
      <div class="p-4 md:p-6 space-y-5 max-w-2xl mx-auto overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
        
        <!-- Mobile Header Badge -->
        <div class="flex items-center justify-between">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 mb-1">
              <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
              <span>MODE PENDATAAN LAPANGAN (PWA)</span>
            </div>
            <h2 class="text-xl font-bold ${textPrimary}">Inspeksi Kios Lapangan</h2>
          </div>

          <button id="scan-qr-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
            <i data-lucide="qr-code" class="w-4 h-4"></i>
            <span>Scan QR</span>
          </button>
        </div>

        <!-- Quick Kiosk Selector Dropdown -->
        <div class="${cardBg} border rounded-2xl p-4 space-y-3">
          <label class="text-xs font-bold ${textSecondary} flex items-center gap-2">
            <i data-lucide="store" class="w-4 h-4 text-emerald-500"></i>
            PILIH KIOS PASAR:
          </label>
          <select id="kiosk-select" class="w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
            ${kiosks.map(item => `
              <option value="${item.id}" ${item.id === selectedKioskId ? 'selected' : ''}>
                ${item.nama} - ${item.pedagang !== '-' ? item.pedagang : '(Kosong)'} [${item.status.toUpperCase()}]
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Field Update Form -->
        <form id="field-form" class="${cardBg} border rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <div>
              <h3 class="text-sm font-bold ${textPrimary}">${k.nama}</h3>
              <p class="text-[11px] ${textSecondary} font-mono">Kode QR: ${k.qrCode || 'QR-' + k.id}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              k.status === 'terisi' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
              k.status === 'kosong' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30' :
              'bg-amber-500/10 text-amber-500 border border-amber-500/30'
            }">
              ${k.status}
            </span>
          </div>

          <!-- Photo Upload Preview Section -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1.5">Foto Kondisi Fisik Kios:</label>
            <div id="photo-dropzone" class="border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100'}">
              ${k.fotoKios ? `
                <img src="${k.fotoKios}" class="w-full h-40 object-cover rounded-lg mb-2" />
                <span class="text-[11px] text-emerald-500 font-semibold">Klik untuk ganti foto</span>
              ` : `
                <i data-lucide="camera" class="w-8 h-8 ${textSecondary} mb-2"></i>
                <span class="text-xs font-medium ${textPrimary}">Ambil / Upload Foto Kios</span>
                <span class="text-[10px] ${textSecondary} mt-0.5">Dukungan Kamera Handphone</span>
              `}
              <input type="file" id="photo-input" accept="image/*" class="hidden" />
            </div>
          </div>

          <!-- Status Dropdown -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Status Lapangan:</label>
            <select id="status-input" class="w-full p-2.5 rounded-xl text-xs font-medium border ${inputBg}">
              <option value="terisi" ${k.status === 'terisi' ? 'selected' : ''}>🟢 Terisi (Aktif Beroperasi)</option>
              <option value="kosong" ${k.status === 'kosong' ? 'selected' : ''}>🔴 Kosong (Tersedia Sewa)</option>
              <option value="jatuh_tempo" ${k.status === 'jatuh_tempo' ? 'selected' : ''}>🟡 Jatuh Tempo (Perlu Penagihan)</option>
            </select>
          </div>

          <!-- Nama Pedagang -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Nama Penyewa / Pedagang:</label>
            <input type="text" id="pedagang-input" value="${k.pedagang === '-' ? '' : k.pedagang}" placeholder="Nama lengkap pedagang..." class="w-full p-2.5 rounded-xl text-xs font-medium border ${inputBg}" />
          </div>

          <!-- Kategori Usaha -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Kategori Usaha / Komoditas:</label>
            <input type="text" id="kategori-input" value="${k.kategori}" placeholder="misal: Sembako, Daging, Bumbu..." class="w-full p-2.5 rounded-xl text-xs font-medium border ${inputBg}" />
          </div>

          <!-- Biaya Sewa Bulanan -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Biaya Sewa Bulanan:</label>
            <input type="text" id="sewa-input" value="${k.sewaBulanan}" class="w-full p-2.5 rounded-xl text-xs font-medium border ${inputBg}" />
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex items-center gap-3">
            <button type="submit" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Simpan Data Lapangan</span>
            </button>
            <button type="button" id="export-btn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-500"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </form>
      </div>
    `;

    // Dropdown change
    container.querySelector('#kiosk-select').addEventListener('change', (e) => {
      selectedKioskId = e.target.value;
      renderContent();
      if (window.lucide) window.lucide.createIcons();
    });

    // QR Scan Simulation
    container.querySelector('#scan-qr-btn').addEventListener('click', () => {
      const randomIdx = Math.floor(Math.random() * kiosks.length);
      selectedKioskId = kiosks[randomIdx].id;
      alert(`[QR Scanner] Berhasil memindai QR Code: ${kiosks[randomIdx].qrCode || kiosks[randomIdx].id}`);
      renderContent();
      if (window.lucide) window.lucide.createIcons();
    });

    // Photo Upload Dropzone
    const dropzone = container.querySelector('#photo-dropzone');
    const photoInput = container.querySelector('#photo-input');
    dropzone.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          k.fotoKios = evt.target.result;
          renderContent();
          if (window.lucide) window.lucide.createIcons();
        };
        reader.readAsDataURL(file);
      }
    });

    // Save Form
    container.querySelector('#field-form').addEventListener('submit', (e) => {
      e.preventDefault();
      k.status = container.querySelector('#status-input').value;
      k.pedagang = container.querySelector('#pedagang-input').value.trim() || '-';
      k.kategori = container.querySelector('#kategori-input').value.trim() || 'Tersedia';
      k.sewaBulanan = container.querySelector('#sewa-input').value.trim() || 'Rp 1.500.000';

      spreadsheetService.saveKiosks(kiosks);
      alert(`Data ${k.nama} berhasil diperbarui di Spreadsheet Service!`);
      renderContent();
      if (window.lucide) window.lucide.createIcons();
    });

    // Export CSV
    container.querySelector('#export-btn').addEventListener('click', () => {
      spreadsheetService.downloadCSV();
    });
  }

  renderContent();
}
