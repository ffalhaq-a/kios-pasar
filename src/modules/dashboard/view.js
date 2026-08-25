import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderDashboardView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  const totalKios = kiosks.length;
  const terisi = kiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;
  const kosong = totalKios - terisi;
  const okupansi = totalKios > 0 ? Math.round((terisi / totalKios) * 100) : 0;

  // Zone Breakdown
  const sandangKiosks = kiosks.filter(k => k.zona === 'PASAR SANDANG');
  const sayurKiosks = kiosks.filter(k => k.zona === 'PASAR SAYUR');

  const sandangTerisi = sandangKiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;
  const sayurTerisi = sayurKiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;

  // Total Revenue Calculation
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
            <span class="text-xs font-bold text-emerald-500">MASTER KAWASAN PASAR</span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Ringkasan Eksekutif Kawasan Pasar</h2>
          <p class="text-xs ${textSecondary}">Desa Karangpucung, Kecamatan Karangpucung • Kabupaten Cilacap</p>
        </div>

        <button id="export-excel-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all w-fit">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
          <span>Download Master Dataset CSV</span>
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
          <p class="text-[11px] ${textSecondary} mt-1">Gabungan Sandang & Sayur</p>
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
          <p class="text-[11px] ${textSecondary} mt-1">Total Retribusi Sewa Tahunan</p>
        </div>
      </div>

      <!-- Side-by-Side Zone Cards (Pasar Sandang vs Pasar Sayur) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Pasar Sandang Card -->
        <div class="${cardBg} border rounded-2xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">👕</span>
              <div>
                <h3 class="text-sm font-bold ${textPrimary}">ZONA PASAR SANDANG</h3>
                <p class="text-[10px] ${textSecondary}">Pakaian, Sepatu, Tas, Warung Makan</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
              320 Unit
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-1">
            <div class="p-2.5 rounded-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border">
              <span class="${textSecondary}">Terisi Beroperasi:</span>
              <p class="text-sm font-bold text-emerald-500 mt-0.5">${sandangTerisi} Unit</p>
            </div>
            <div class="p-2.5 rounded-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border">
              <span class="${textSecondary}">Kosong Tersedia:</span>
              <p class="text-sm font-bold text-rose-500 mt-0.5">${320 - sandangTerisi} Unit</p>
            </div>
          </div>

          <div class="w-full ${progressBg} rounded-full h-2 overflow-hidden border flex">
            <div class="bg-emerald-500 h-full" style="width: ${(sandangTerisi/320)*100}%"></div>
          </div>
        </div>

        <!-- Pasar Sayur Card -->
        <div class="${cardBg} border rounded-2xl p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">🥬</span>
              <div>
                <h3 class="text-sm font-bold ${textPrimary}">ZONA PASAR SAYUR</h3>
                <p class="text-[10px] ${textSecondary}">Sayuran, Sembako, Daging, Tempe</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              292 Unit
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-1">
            <div class="p-2.5 rounded-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border">
              <span class="${textSecondary}">Terisi Beroperasi:</span>
              <p class="text-sm font-bold text-emerald-500 mt-0.5">${sayurTerisi} Unit</p>
            </div>
            <div class="p-2.5 rounded-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border">
              <span class="${textSecondary}">Kosong Tersedia:</span>
              <p class="text-sm font-bold text-rose-500 mt-0.5">${292 - sayurTerisi} Unit</p>
            </div>
          </div>

          <div class="w-full ${progressBg} rounded-full h-2 overflow-hidden border flex">
            <div class="bg-emerald-500 h-full" style="width: ${(sayurTerisi/292)*100}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#export-excel-btn').addEventListener('click', () => {
    spreadsheetService.downloadCSV();
  });
}
