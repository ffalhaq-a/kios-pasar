import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderDashboardView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // 1. Overall Master Stats (612 Units)
  const totalKios = kiosks.length;
  const terisi = kiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;
  const kosong = totalKios - terisi;
  
  // Sudah Bayar vs Jatuh Tempo
  const sudahBayar = kiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const jatuhTempo = kiosks.filter(k => (k.statusBayar === 'menunggu' || k.statusBayar === 'menunggak' || k.status === 'jatuh_tempo') && k.pedagang !== '-').length;

  // 2. Zone Breakdown (Pasar Sandang vs Pasar Sayur)
  const sandangKiosks = kiosks.filter(k => k.zona === 'PASAR SANDANG');
  const sayurKiosks = kiosks.filter(k => k.zona === 'PASAR SAYUR');

  const sandangTerisi = sandangKiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;
  const sandangKosong = sandangKiosks.length - sandangTerisi;
  const sandangSudahBayar = sandangKiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const sandangJatuhTempo = sandangKiosks.length - sandangKosong - sandangSudahBayar;

  const sayurTerisi = sayurKiosks.filter(k => k.status === 'terisi' || (k.pedagang && k.pedagang !== '-')).length;
  const sayurKosong = sayurKiosks.length - sayurTerisi;
  const sayurSudahBayar = sayurKiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const sayurJatuhTempo = sayurKiosks.length - sayurKosong - sayurSudahBayar;

  // List of kiosks nearing expiration for Alert Widget
  const expiringKiosks = kiosks.filter(k => k.pedagang !== '-' && (k.statusBayar === 'menunggu' || k.statusBayar === 'menunggak' || k.status === 'jatuh_tempo')).slice(0, 5);

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Title & Header Badge -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              PASAR MUKTI MAKMUR KARANGPUCUNG 2026
            </span>
            <span class="text-xs font-bold text-emerald-500">GLOBAL EXECUTIVE DASHBOARD</span>
          </div>
          <h2 class="text-xl font-bold ${textPrimary}">Ringkasan Utama & Status Pembayaran</h2>
          <p class="text-xs ${textSecondary}">Desa Karangpucung, Kecamatan Karangpucung • Kabupaten Cilacap</p>
        </div>

        <button id="export-excel-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all w-fit">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
          <span>Download Master Dataset CSV</span>
        </button>
      </div>

      <!-- 1. GRID STATISTIK UTAMA (Jumlah Unit, Terisi, Kosong, Sudah Bayar, Jatuh Tempo) -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <!-- Total Unit -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Jumlah Unit</span>
            <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
              <i data-lucide="store" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${totalKios}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5">Total Kawasan Utuh</p>
        </div>

        <!-- Unit Terisi -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Unit Terisi</span>
            <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-emerald-500">${terisi}</p>
          <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">${Math.round((terisi/totalKios)*100)}% Okupansi</p>
        </div>

        <!-- Unit Kosong -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Unit Kosong</span>
            <div class="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <i data-lucide="building" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-rose-500">${kosong}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5">Siap Disewakan</p>
        </div>

        <!-- Sudah Bayar (Lunas) -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Sudah Bayar</span>
            <div class="p-2 bg-teal-500/10 text-teal-500 rounded-lg">
              <i data-lucide="badge-check" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-teal-500">${sudahBayar}</p>
          <p class="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">Sewa Lunas Aktif</p>
        </div>

        <!-- Jatuh Tempo -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Jatuh Tempo</span>
            <div class="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-amber-500">${jatuhTempo}</p>
          <p class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Perlu Penagihan</p>
        </div>
      </div>

      <!-- PERINGATAN KIOS AKAN HABIS MASA SEWA (EXPIRATION ALERTS BANNER) -->
      <div class="border rounded-2xl p-5 ${isDark ? 'bg-amber-950/30 border-amber-800/60' : 'bg-amber-50 border-amber-200'}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <i data-lucide="bell-ring" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-amber-500">Peringatan Masa Sewa Kios</h3>
              <p class="text-xs ${textSecondary}">Kios yang mendekati atau telah memasuki tenggat waktu habis sewa.</p>
            </div>
          </div>
          <button data-goto="/pedagang/daftar" class="nav-goto-btn bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-bold transition-all">
            Kelola Penagihan &rarr;
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${expiringKiosks.map(k => `
            <div class="p-3 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-200'}">
              <div>
                <span class="font-bold text-amber-500">Blok ${k.blokKode || k.id}</span>
                <p class="font-semibold ${textPrimary} truncate max-w-[140px]">${k.pedagang}</p>
                <p class="text-[10px] ${textSecondary}">${k.zona}</p>
              </div>
              <div class="text-right">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  ${k.tglHabisSewa || '2026-12-31'}
                </span>
                <p class="text-[10px] text-rose-500 font-bold mt-1">Perlu Tagihan</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. STATISTIK PASAR SANDANG -->
      <div class="${cardBg} border rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
              👕
            </div>
            <div>
              <h3 class="text-base font-bold ${textPrimary}">Statistik Pasar Sandang</h3>
              <p class="text-xs ${textSecondary}">Pakaian, Sepatu, Tas, Warung Makan (320 Unit)</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
            ZONA SANDANG
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Unit Terisi:</span>
            <p class="text-lg font-extrabold text-emerald-500 mt-0.5">${sandangTerisi} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Unit Kosong:</span>
            <p class="text-lg font-extrabold text-rose-500 mt-0.5">${sandangKosong} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Sewa Sudah Bayar:</span>
            <p class="text-lg font-extrabold text-teal-500 mt-0.5">${sandangSudahBayar} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Tenggat / Jatuh Tempo:</span>
            <p class="text-lg font-extrabold text-amber-500 mt-0.5">${sandangJatuhTempo} Unit</p>
          </div>
        </div>
      </div>

      <!-- 3. STATISTIK PASAR SAYUR -->
      <div class="${cardBg} border rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
              🥬
            </div>
            <div>
              <h3 class="text-base font-bold ${textPrimary}">Statistik Pasar Sayur</h3>
              <p class="text-xs ${textSecondary}">Sayuran, Sembako, Daging, Tempe, Garam (292 Unit)</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            ZONA SAYUR
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Unit Terisi:</span>
            <p class="text-lg font-extrabold text-emerald-500 mt-0.5">${sayurTerisi} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Unit Kosong:</span>
            <p class="text-lg font-extrabold text-rose-500 mt-0.5">${sayurKosong} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Sewa Sudah Bayar:</span>
            <p class="text-lg font-extrabold text-teal-500 mt-0.5">${sayurSudahBayar} Unit</p>
          </div>

          <div class="p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}">
            <span class="${textSecondary}">Tenggat / Jatuh Tempo:</span>
            <p class="text-lg font-extrabold text-amber-500 mt-0.5">${sayurJatuhTempo} Unit</p>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#export-excel-btn').addEventListener('click', () => {
    spreadsheetService.downloadCSV();
  });

  container.querySelectorAll('.nav-goto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-goto');
      if (path && window._navigate) window._navigate(path);
    });
  });
}
