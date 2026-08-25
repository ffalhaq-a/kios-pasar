import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderDashboardView(container) {
  const isDark = themeManager.isDark();
  const activeSheet = spreadsheetService.getActiveSheetName();
  const kiosks = spreadsheetService.loadKiosks();

  const totalKios = kiosks.length;
  const terisi = kiosks.filter(k => k.status === 'terisi').length;
  const kosong = kiosks.filter(k => k.status === 'kosong').length;
  const okupansi = totalKios > 0 ? Math.round((terisi / totalKios) * 100) : 0;

  // Breakdown Tipe Unit
  const countKios1 = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('KIOS 1')).length;
  const countKios2 = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('KIOS 2')).length;
  const countLos = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('LOS')).length;
  const countLemprakan = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('LEMPRAKAN')).length;

  // Total Nilai Sewa Tahunan Potensial
  const totalNilaiSewa = kiosks.reduce((acc, curr) => {
    const num = parseInt((curr.sewaBulanan || '').replace(/[^0-9]/g, '')) || 225000;
    return acc + num;
  }, 0);
  const formattedPotensiSewa = `Rp ${totalNilaiSewa.toLocaleString('id-ID')}`;

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const progressBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Title & Header Badge -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              PENDATAAN PASAR MUKTI MAKMUR 2026
            </span>
            <span class="text-xs font-bold text-emerald-500">${activeSheet}</span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Ringkasan Eksekutif ${activeSheet}</h2>
          <p class="text-xs ${textSecondary}">Desa Karangpucung, Kecamatan Karangpucung • Kabupaten Cilacap</p>
        </div>

        <button id="export-excel-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all w-fit">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
          <span>Download Laporan CSV</span>
        </button>
      </div>

      <!-- Main Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Total Unit -->
        <div class="${cardBg} border rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold ${textSecondary}">Total Unit Terdaftar</span>
            <div class="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <i data-lucide="store" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${totalKios} Unit</p>
          <p class="text-[11px] ${textSecondary} mt-1">Data Resmi ${activeSheet}</p>
        </div>

        <!-- Terisi -->
        <div class="${cardBg} border rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold ${textSecondary}">Unit Terisi (Aktif)</span>
            <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <i data-lucide="check-circle-2" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-emerald-500">${terisi} Unit</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Tingkat Okupansi: ${okupansi}%</p>
        </div>

        <!-- Kosong -->
        <div class="${cardBg} border rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold ${textSecondary}">Lahan / Kios Kosong</span>
            <div class="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <i data-lucide="building" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-rose-500">${kosong} Unit</p>
          <p class="text-[11px] ${textSecondary} mt-1">Siap Disewakan</p>
        </div>

        <!-- Potensi Retribusi Sewa -->
        <div class="${cardBg} border rounded-2xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold ${textSecondary}">Potensi Retribusi / Tahun</span>
            <div class="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <i data-lucide="coins" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-xl font-extrabold text-amber-500 font-mono">${formattedPotensiSewa}</p>
          <p class="text-[11px] ${textSecondary} mt-1">Total Nilai Sewa Tahunan</p>
        </div>
      </div>

      <!-- Unit Classification Breakdown Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="${cardBg} border rounded-xl p-4 flex items-center gap-3">
          <div class="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs">K1</div>
          <div>
            <p class="text-xs ${textSecondary}">KIOS TIPE 1</p>
            <p class="text-lg font-bold ${textPrimary}">${countKios1} Unit</p>
          </div>
        </div>

        <div class="${cardBg} border rounded-xl p-4 flex items-center gap-3">
          <div class="p-2.5 rounded-lg bg-teal-500/10 text-teal-500 font-bold text-xs">K2</div>
          <div>
            <p class="text-xs ${textSecondary}">KIOS TIPE 2</p>
            <p class="text-lg font-bold ${textPrimary}">${countKios2} Unit</p>
          </div>
        </div>

        <div class="${cardBg} border rounded-xl p-4 flex items-center gap-3">
          <div class="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">LOS</div>
          <div>
            <p class="text-xs ${textSecondary}">PETAK LOS</p>
            <p class="text-lg font-bold ${textPrimary}">${countLos} Unit</p>
          </div>
        </div>

        <div class="${cardBg} border rounded-xl p-4 flex items-center gap-3">
          <div class="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold text-xs">LMP</div>
          <div>
            <p class="text-xs ${textSecondary}">LEMPRAKAN</p>
            <p class="text-lg font-bold ${textPrimary}">${countLemprakan} Unit</p>
          </div>
        </div>
      </div>

      <!-- Occupancy Progress & Bar -->
      <div class="${cardBg} border rounded-2xl p-6 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold ${textPrimary}">Tingkat Okupansi Pasar (${activeSheet})</h3>
          <span class="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">${okupansi}% Okupansi</span>
        </div>
        <div class="w-full ${progressBg} rounded-full h-3.5 overflow-hidden border flex">
          <div class="bg-emerald-500 h-full transition-all" style="width: ${(terisi/totalKios)*100}%" title="Terisi: ${terisi}"></div>
          <div class="bg-rose-500/40 h-full transition-all" style="width: ${(kosong/totalKios)*100}%" title="Kosong: ${kosong}"></div>
        </div>
        <div class="flex items-center gap-6 text-xs ${textSecondary} pt-1">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span>Terisi Beroperasi (${terisi} Unit)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm bg-rose-500/40"></span>
            <span>Kosong Tersedia (${kosong} Unit)</span>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#export-excel-btn').addEventListener('click', () => {
    spreadsheetService.downloadCSV();
  });
}
