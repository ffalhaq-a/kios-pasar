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
    const isOccupied = Boolean(k.pedagang && k.pedagang !== '-');
    const isLunas = String(k.statusBayar || '').toLowerCase() === 'lunas';

    container.innerHTML = `
      <div class="p-4 md:p-6 space-y-5 max-w-2xl mx-auto overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
        
        <!-- Mobile Header Badge (44px touch-friendly) -->
        <div class="flex items-center justify-between">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 mb-1">
              <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
              <span>PENDATAAN LAPANGAN (PWA)</span>
            </div>
            <h1 class="text-xl font-extrabold ${textPrimary}">Inspeksi Kios Lapangan</h1>
          </div>

          <!-- Touch target minimum 44px height -->
          <button id="scan-qr-btn" class="min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
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
          <select id="kiosk-select" class="w-full min-h-[44px] p-3 rounded-xl text-xs font-bold border focus:outline-none focus:border-emerald-500 ${inputBg}">
            ${kiosks.map(item => `
              <option value="${item.id}" ${item.id === selectedKioskId ? 'selected' : ''}>
                Blok ${item.blokKode || item.id} - ${item.pedagang !== '-' ? item.pedagang : '(KOSONG)'} [${item.zona}]
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Field Update Form (Touch targets >= 44px) -->
        <form id="field-form" class="${cardBg} border rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
            <div>
              <h3 class="text-base font-extrabold ${textPrimary}">Blok ${k.blokKode || k.id}</h3>
              <p class="text-[11px] ${textSecondary} font-mono">${k.zona} • QR: ${k.qrCode || 'QR-' + k.id}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                isOccupied ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/30'
              }">
                ${isOccupied ? 'TERISI' : 'KOSONG'}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                isLunas ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                'bg-rose-500/10 text-rose-500 border border-rose-500/30'
              }">
                ${isLunas ? 'LUNAS' : 'BELUM BAYAR'}
              </span>
            </div>
          </div>

          <!-- Photo Upload Preview Section -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1.5">Foto Kondisi Fisik Kios:</label>
            <div id="photo-dropzone" class="min-h-[100px] border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100'}">
              ${k.fotoKios ? `
                <img src="${k.fotoKios}" class="w-full h-40 object-cover rounded-lg mb-2" />
                <span class="text-[11px] text-emerald-500 font-semibold">Klik untuk ganti foto</span>
              ` : `
                <i data-lucide="camera" class="w-8 h-8 ${textSecondary} mb-2"></i>
                <span class="text-xs font-bold ${textPrimary}">Ambil / Upload Foto Kios</span>
                <span class="text-[10px] ${textSecondary} mt-0.5">Dukungan Kamera Handphone</span>
              `}
              <input type="file" id="photo-input" accept="image/*" class="hidden" />
            </div>
          </div>

          <!-- Status Dropdown -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Status Ketersediaan Kios:</label>
            <select id="status-input" class="w-full min-h-[44px] p-3 rounded-xl text-xs font-medium border ${inputBg}">
              <option value="terisi" ${isOccupied ? 'selected' : ''}>🟢 Terisi (Aktif Beroperasi)</option>
              <option value="kosong" ${!isOccupied ? 'selected' : ''}>🔴 Kosong (Tersedia Sewa)</option>
            </select>
          </div>

          <!-- Nama Pedagang -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Nama Penyewa / Pedagang:</label>
            <input type="text" id="pedagang-input" value="${k.pedagang === '-' ? '' : k.pedagang}" placeholder="Nama lengkap pedagang..." class="w-full min-h-[44px] p-3 rounded-xl text-xs font-medium border ${inputBg}" />
          </div>

          <!-- Status Pembayaran -->
          <div>
            <label class="text-xs font-semibold ${textSecondary} block mb-1">Status Pembayaran Sewa:</label>
            <select id="status-bayar-input" class="w-full min-h-[44px] p-3 rounded-xl text-xs font-medium border ${inputBg}">
              <option value="lunas" ${isLunas ? 'selected' : ''}>✅ Sudah Bayar (Lunas)</option>
              <option value="belum_bayar" ${!isLunas ? 'selected' : ''}>⏳ Belum Bayar / Tertunggak</option>
            </select>
          </div>

          <!-- Dates Row -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold ${textSecondary} block mb-1">Tgl Pembayaran:</label>
              <input type="date" id="tgl-bayar-input" value="${k.tglPembayaran === '-' ? '' : k.tglPembayaran}" class="w-full min-h-[44px] p-2.5 rounded-xl text-xs border ${inputBg}" />
            </div>
            <div>
              <label class="text-xs font-semibold ${textSecondary} block mb-1">Tgl Habis Sewa:</label>
              <input type="date" id="tgl-habis-input" value="${k.tglHabisSewa === '-' ? '' : k.tglHabisSewa}" class="w-full min-h-[44px] p-2.5 rounded-xl text-xs border ${inputBg}" />
            </div>
          </div>

          <!-- Action Buttons (>= 44px Touch Targets) -->
          <div class="pt-2 flex items-center gap-3">
            <button type="submit" class="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Simpan Data Lapangan</span>
            </button>
            <button type="button" id="export-btn" class="min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-500"></i>
              <span>Export</span>
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
      const isStatusTerisi = container.querySelector('#status-input').value === 'terisi';
      const inputPedagang = container.querySelector('#pedagang-input').value.trim();
      const statusBayarVal = container.querySelector('#status-bayar-input').value;
      let tglBayarVal = container.querySelector('#tgl-bayar-input').value;

      if (statusBayarVal === 'lunas' && (!tglBayarVal || tglBayarVal === '-')) {
        tglBayarVal = new Date().toISOString().slice(0, 10);
      }

      k.status = isStatusTerisi ? 'terisi' : 'kosong';
      k.pedagang = isStatusTerisi ? (inputPedagang || 'Penyewa Lapangan') : '-';
      k.statusBayar = isStatusTerisi ? statusBayarVal : 'belum_bayar';
      k.tglPembayaran = tglBayarVal || '-';
      k.tglHabisSewa = container.querySelector('#tgl-habis-input').value || '2026-12-31';

      spreadsheetService.updateKios(k.id, k);
      alert(`Data Blok ${k.blokKode || k.id} berhasil diperbarui dari Lapangan!`);
      renderContent();
      if (window.lucide) window.lucide.createIcons();
    });

    // Export CSV
    container.querySelector('#export-btn').addEventListener('click', () => {
      spreadsheetService.downloadCSV();
    });
  }

  renderContent();

  // Background subscription to keep field data live
  spreadsheetService.subscribe(() => {
    if (container && container.isConnected) {
      kiosks = spreadsheetService.loadKiosks();
      renderContent();
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
