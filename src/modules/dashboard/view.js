import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderDashboardView(container) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // 1. Overall Master Stats (612 Units)
  const totalKios = kiosks.length;
  const terisi = kiosks.filter(k => k.pedagang && k.pedagang !== '-').length;
  const kosong = totalKios - terisi;
  
  // Sudah Bayar vs Jatuh Tempo / Belum Bayar
  const sudahBayar = kiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const belumBayar = kiosks.filter(k => k.pedagang !== '-' && k.statusBayar !== 'lunas').length;

  // 2. Unit Type Breakdown (Kios 1, Kios 2, Los, Lemprakan)
  const countKios1 = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('KIOS 1')).length;
  const countKios2 = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('KIOS 2')).length;
  const countLos = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('LOS')).length;
  const countLemprakan = kiosks.filter(k => (k.tipeKios || '').toUpperCase().includes('LEMPRAKAN')).length;

  // 3. Zone Breakdown (Pasar Sandang vs Pasar Sayur)
  const sandangKiosks = kiosks.filter(k => k.zona === 'PASAR SANDANG');
  const sayurKiosks = kiosks.filter(k => k.zona === 'PASAR SAYUR');

  const sandangTerisi = sandangKiosks.filter(k => k.pedagang && k.pedagang !== '-').length;
  const sandangKosong = sandangKiosks.length - sandangTerisi;
  const sandangSudahBayar = sandangKiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const sandangBelumBayar = sandangTerisi - sandangSudahBayar;

  const sayurTerisi = sayurKiosks.filter(k => k.pedagang && k.pedagang !== '-').length;
  const sayurKosong = sayurKiosks.length - sayurTerisi;
  const sayurSudahBayar = sayurKiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
  const sayurBelumBayar = sayurTerisi - sayurSudahBayar;

  // List of kiosks needing payment attention
  const expiringKiosks = kiosks.filter(k => k.pedagang !== '-' && (k.statusBayar === 'belum_bayar' || k.statusBayar === 'hampir_habis' || k.statusBayar === 'jatuh_tempo')).slice(0, 5);

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- Title Bar (Clean Title ONLY - Subtitle Removed as Requested) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Ringkasan Utama & Status Pembayaran</h1>
        </div>

        <button id="export-excel-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all w-fit">
          <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
          <span>Download Master Dataset CSV</span>
        </button>
      </div>

      <!-- 1. BARIS ATAS: 5 KARTU STATISTIK UTAMA -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
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
            <div class="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
              <i data-lucide="building" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-rose-500">${kosong}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5">Siap Disewakan</p>
        </div>

        <!-- Sudah Bayar -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Sudah Bayar</span>
            <div class="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg">
              <i data-lucide="badge-check" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-teal-500">${sudahBayar}</p>
          <p class="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">Sewa Lunas Aktif</p>
        </div>

        <!-- Belum Bayar -->
        <div class="${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary}">Belum Bayar</span>
            <div class="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-amber-500">${belumBayar}</p>
          <p class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Perlu Penagihan</p>
        </div>
      </div>

      <!-- 2. BARIS KE-2: 4 KARTU BREAKDOWN TIPE UNIT (WARNA PENUH SELURUH KARTU - NO HEADER TEXT) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- KIOS 1 (Full Solid Emerald Card) -->
        <div class="rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
          <div>
            <span class="text-xs font-extrabold uppercase opacity-90 tracking-wider">KIOS 1</span>
            <p class="text-2xl font-black mt-1">${countKios1} <span class="text-xs font-medium opacity-80">Unit</span></p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
            K1
          </div>
        </div>

        <!-- KIOS 2 (Full Solid Teal Card) -->
        <div class="rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-md">
          <div>
            <span class="text-xs font-extrabold uppercase opacity-90 tracking-wider">KIOS 2</span>
            <p class="text-2xl font-black mt-1">${countKios2} <span class="text-xs font-medium opacity-80">Unit</span></p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
            K2
          </div>
        </div>

        <!-- LOS (Full Solid Blue Card) -->
        <div class="rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
          <div>
            <span class="text-xs font-extrabold uppercase opacity-90 tracking-wider">LOS</span>
            <p class="text-2xl font-black mt-1">${countLos} <span class="text-xs font-medium opacity-80">Unit</span></p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
            LOS
          </div>
        </div>

        <!-- LEMPRAKAN (Full Solid Purple Card) -->
        <div class="rounded-2xl p-4 flex items-center justify-between bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-md">
          <div>
            <span class="text-xs font-extrabold uppercase opacity-90 tracking-wider">LEMPRAKAN</span>
            <p class="text-2xl font-black mt-1">${countLemprakan} <span class="text-xs font-medium opacity-80">Unit</span></p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
            LMP
          </div>
        </div>
      </div>

      <!-- PERINGATAN PENAGIHAN SEWA KIOS -->
      <div class="border rounded-2xl p-5 ${isDark ? 'bg-amber-950/30 border-amber-800/60' : 'bg-amber-50 border-amber-200'}">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <i data-lucide="bell-ring" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-amber-500">Peringatan Penagihan Sewa Kios</h3>
              <p class="text-xs ${textSecondary}">Daftar kios yang belum menyetor pembayaran retribusi sewa.</p>
            </div>
          </div>
          <button data-goto="/pedagang/daftar" class="nav-goto-btn bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-bold transition-all">
            Kelola Penagihan &rarr;
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${expiringKiosks.length > 0 ? expiringKiosks.map(k => `
            <div class="p-3 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-200'}">
              <div>
                <span class="font-bold text-amber-500">Blok ${k.blokKode || k.id}</span>
                <p class="font-semibold ${textPrimary} truncate max-w-[140px]">${k.pedagang}</p>
                <p class="text-[10px] ${textSecondary}">${k.zona}</p>
              </div>
              <div class="text-right">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                  ${k.sewaBulanan || 'Rp 225.000'}
                </span>
                <p class="text-[10px] text-amber-500 font-bold mt-1">Belum Bayar</p>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-3 text-center text-xs text-amber-600 font-medium py-2">
              Semua status pembayaran sewa lunas dan aman.
            </div>
          `}
        </div>
      </div>

      <!-- 3. STATISTIK PASAR SANDANG (CLEAN TITLE & FULL SOLID CARD KIRI) -->
      <div class="${cardBg} border rounded-2xl p-5 space-y-4">
        <div class="border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h3 class="text-base font-extrabold ${textPrimary}">Statistik Pasar Sandang</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- KOTAK BESAR JUMLAH UNIT (KIRI) -->
          <div class="md:col-span-1 rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold tracking-wider uppercase opacity-90">Kawasan Sandang</span>
              <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <i data-lucide="store" class="w-6 h-6"></i>
              </div>
            </div>
            <div>
              <p class="text-4xl font-black">${sandangKiosks.length}</p>
              <p class="text-sm font-semibold opacity-90 mt-1">Total Jumlah Unit</p>
            </div>
          </div>

          <!-- 4 CARD GRID STATISTIK (KANAN) -->
          <div class="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <!-- Unit Terisi -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Unit Terisi</span>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-emerald-500">${sandangTerisi} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Unit Kosong -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Unit Kosong</span>
                <i data-lucide="building" class="w-4 h-4 text-rose-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-rose-500">${sandangKosong} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Sudah Bayar -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Sudah Bayar</span>
                <i data-lucide="badge-check" class="w-4 h-4 text-teal-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-teal-500">${sandangSudahBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Belum Bayar -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Belum Bayar</span>
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-amber-500">${sandangBelumBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. STATISTIK PASAR SAYUR (CLEAN TITLE & FULL SOLID CARD KIRI) -->
      <div class="${cardBg} border rounded-2xl p-5 space-y-4">
        <div class="border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h3 class="text-base font-extrabold ${textPrimary}">Statistik Pasar Sayur</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- KOTAK BESAR JUMLAH UNIT (KIRI) -->
          <div class="md:col-span-1 rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/20">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold tracking-wider uppercase opacity-90">Kawasan Sayur</span>
              <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <i data-lucide="store" class="w-6 h-6"></i>
              </div>
            </div>
            <div>
              <p class="text-4xl font-black">${sayurKiosks.length}</p>
              <p class="text-sm font-semibold opacity-90 mt-1">Total Jumlah Unit</p>
            </div>
          </div>

          <!-- 4 CARD GRID STATISTIK (KANAN) -->
          <div class="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <!-- Unit Terisi -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Unit Terisi</span>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-emerald-500">${sayurTerisi} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Unit Kosong -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Unit Kosong</span>
                <i data-lucide="building" class="w-4 h-4 text-rose-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-rose-500">${sayurKosong} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Sudah Bayar -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Sudah Bayar</span>
                <i data-lucide="badge-check" class="w-4 h-4 text-teal-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-teal-500">${sayurSudahBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Belum Bayar -->
            <div class="p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold">Belum Bayar</span>
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-amber-500">${sayurBelumBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>
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
