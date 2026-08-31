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
      
      <!-- Title Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Ringkasan Utama & Status Pembayaran</h1>
          ${totalKios === 0 ? `<p class="text-xs text-amber-500 font-bold mt-1 animate-pulse">Menghubungkan & Memuat data 610 unit pasar dari Google Sheets...</p>` : ''}
        </div>

        <div class="flex items-center gap-2">
          <button id="sync-dashboard-btn" class="border px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Sinkronisasi Data</span>
          </button>

          <button id="export-excel-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all w-fit">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      <!-- 1. BARIS ATAS: 5 KARTU STATISTIK UTAMA -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <!-- Total Unit -->
        <div data-card-filter='{"zona":"ALL","status":"ALL","tipe":"ALL"}' title="Klik untuk melihat seluruh pedagang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-blue-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-blue-400 transition-colors">Jumlah Unit</span>
            <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
              <i data-lucide="store" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${totalKios}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Total Kawasan Utuh</span>
            <span class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- Unit Terisi -->
        <div data-card-filter='{"status":"terisi"}' title="Klik untuk melihat pedagang aktif / terisi" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-emerald-400 transition-colors">Unit Terisi</span>
            <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-emerald-500">${terisi}</p>
          <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center justify-between">
            <span>${totalKios > 0 ? Math.round((terisi/totalKios)*100) : 0}% Okupansi</span>
            <span class="opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- Unit Kosong -->
        <div data-card-filter='{"status":"kosong"}' title="Klik untuk melihat unit kosong siap sewa" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-rose-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-rose-400 transition-colors">Unit Kosong</span>
            <div class="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-all">
              <i data-lucide="building" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-rose-500">${kosong}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Siap Disewakan</span>
            <span class="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- Sudah Bayar -->
        <div data-card-filter='{"statusBayar":"lunas"}' title="Klik untuk melihat daftar pedagang lunas" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-teal-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-teal-400 transition-colors">Sudah Bayar</span>
            <div class="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg group-hover:bg-teal-500 group-hover:text-white transition-all">
              <i data-lucide="badge-check" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-teal-500">${sudahBayar}</p>
          <p class="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5 flex items-center justify-between">
            <span>Sewa Lunas Aktif</span>
            <span class="opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- Belum Bayar -->
        <div data-card-filter='{"statusBayar":"belum_bayar"}' title="Klik untuk melihat daftar pedagang yang belum bayar" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-amber-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-amber-400 transition-colors">Belum Bayar</span>
            <div class="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all">
              <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold text-amber-500">${belumBayar}</p>
          <p class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center justify-between">
            <span>Perlu Penagihan</span>
            <span class="opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>
      </div>

      <!-- 2. BARIS KE-2: 4 KARTU BREAKDOWN TIPE UNIT -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- KIOS 1 -->
        <div data-card-filter='{"tipe":"KIOS 1"}' title="Klik untuk menyaring Kios 1" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-emerald-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-emerald-400 transition-colors">KIOS 1</span>
            <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <i data-lucide="store" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${countKios1}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Total Unit Kios 1</span>
            <span class="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- KIOS 2 -->
        <div data-card-filter='{"tipe":"KIOS 2"}' title="Klik untuk menyaring Kios 2" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-teal-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-teal-400 transition-colors">KIOS 2</span>
            <div class="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg group-hover:bg-teal-500 group-hover:text-white transition-all">
              <i data-lucide="store" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${countKios2}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Total Unit Kios 2</span>
            <span class="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- LOS -->
        <div data-card-filter='{"tipe":"LOS"}' title="Klik untuk menyaring Los" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-blue-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-blue-400 transition-colors">LOS</span>
            <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
              <i data-lucide="layout-grid" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${countLos}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Total Unit Los</span>
            <span class="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
        </div>

        <!-- LEMPRAKAN -->
        <div data-card-filter='{"tipe":"LEMPRAKAN"}' title="Klik untuk menyaring Lemprakan" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 hover:shadow-lg hover:border-purple-500/50 group ${cardBg} border rounded-2xl p-4 relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold ${textSecondary} group-hover:text-purple-400 transition-colors">LEMPRAKAN</span>
            <div class="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
              <i data-lucide="layers" class="w-4 h-4"></i>
            </div>
          </div>
          <p class="text-2xl font-extrabold ${textPrimary}">${countLemprakan}</p>
          <p class="text-[10px] ${textSecondary} mt-0.5 flex items-center justify-between">
            <span>Total Unit Lemprakan</span>
            <span class="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Buka &rarr;</span>
          </p>
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
          <button data-goto="/pedagang" data-filter='{"statusBayar":"belum_bayar"}' class="nav-goto-filter-btn bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1">
            <span>Kelola Penagihan</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${expiringKiosks.length > 0 ? expiringKiosks.map(k => `
            <div class="p-3 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-200'}">
              <div>
                <span class="font-mono font-bold text-amber-500">${k.blokKode || k.id}</span>
                <p class="font-semibold ${textPrimary}">${k.pedagang}</p>
                <p class="text-[10px] ${textSecondary}">${k.zona}</p>
              </div>
              <div class="text-right">
                <span class="font-mono font-bold text-amber-500 block">${k.sewaBulanan || 'Rp 225.000'}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Belum Bayar</span>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-3 text-center py-4 text-xs text-emerald-500 font-medium">
              Semua pedagang telah melunasi sewa retribusi!
            </div>
          `}
        </div>
      </div>

      <!-- 3. STATISTIK PASAR SANDANG -->
      <div class="${cardBg} border rounded-2xl p-5 space-y-4">
        <div class="border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h3 class="text-base font-extrabold ${textPrimary}">Statistik Pasar Sandang</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- KOTAK BESAR JUMLAH UNIT (KIRI) -->
          <div data-card-filter='{"zona":"PASAR SANDANG"}' title="Klik untuk melihat seluruh pedagang Pasar Sandang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all md:col-span-1 rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20 group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold tracking-wider uppercase opacity-90">Kawasan Sandang</span>
              <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white group-hover:text-blue-600 transition-all">
                <i data-lucide="store" class="w-6 h-6"></i>
              </div>
            </div>
            <div>
              <p class="text-4xl font-black">${sandangKiosks.length}</p>
              <p class="text-sm font-semibold opacity-90 mt-1 flex items-center justify-between">
                <span>Total Jumlah Unit</span>
                <span class="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Buka &rarr;</span>
              </p>
            </div>
          </div>

          <!-- 4 CARD GRID STATISTIK (KANAN) -->
          <div class="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <!-- Unit Terisi -->
            <div data-card-filter='{"zona":"PASAR SANDANG","status":"terisi"}' title="Klik untuk melihat unit terisi di Pasar Sandang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-emerald-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-emerald-400 transition-colors">Unit Terisi</span>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-emerald-500">${sandangTerisi} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Unit Kosong -->
            <div data-card-filter='{"zona":"PASAR SANDANG","status":"kosong"}' title="Klik untuk melihat unit kosong di Pasar Sandang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-rose-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-rose-400 transition-colors">Unit Kosong</span>
                <i data-lucide="building" class="w-4 h-4 text-rose-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-rose-500">${sandangKosong} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Sudah Bayar -->
            <div data-card-filter='{"zona":"PASAR SANDANG","statusBayar":"lunas"}' title="Klik untuk melihat pedagang lunas di Pasar Sandang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-teal-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-teal-400 transition-colors">Sudah Bayar</span>
                <i data-lucide="badge-check" class="w-4 h-4 text-teal-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-teal-500">${sandangSudahBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Belum Bayar -->
            <div data-card-filter='{"zona":"PASAR SANDANG","statusBayar":"belum_bayar"}' title="Klik untuk melihat pedagang belum bayar di Pasar Sandang" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-amber-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-amber-400 transition-colors">Belum Bayar</span>
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-amber-500">${sandangBelumBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. STATISTIK PASAR SAYUR -->
      <div class="${cardBg} border rounded-2xl p-5 space-y-4">
        <div class="border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <h3 class="text-base font-extrabold ${textPrimary}">Statistik Pasar Sayur</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- KOTAK BESAR JUMLAH UNIT (KIRI) -->
          <div data-card-filter='{"zona":"PASAR SAYUR"}' title="Klik untuk melihat seluruh pedagang Pasar Sayur" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all md:col-span-1 rounded-2xl p-5 border flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/20 group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold tracking-wider uppercase opacity-90">Kawasan Sayur</span>
              <div class="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white group-hover:text-emerald-600 transition-all">
                <i data-lucide="store" class="w-6 h-6"></i>
              </div>
            </div>
            <div>
              <p class="text-4xl font-black">${sayurKiosks.length}</p>
              <p class="text-sm font-semibold opacity-90 mt-1 flex items-center justify-between">
                <span>Total Jumlah Unit</span>
                <span class="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Buka &rarr;</span>
              </p>
            </div>
          </div>

          <!-- 4 CARD GRID STATISTIK (KANAN) -->
          <div class="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
            <!-- Unit Terisi -->
            <div data-card-filter='{"zona":"PASAR SAYUR","status":"terisi"}' title="Klik untuk melihat unit terisi di Pasar Sayur" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-emerald-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-emerald-400 transition-colors">Unit Terisi</span>
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-emerald-500">${sayurTerisi} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Unit Kosong -->
            <div data-card-filter='{"zona":"PASAR SAYUR","status":"kosong"}' title="Klik untuk melihat unit kosong di Pasar Sayur" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-rose-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-rose-400 transition-colors">Unit Kosong</span>
                <i data-lucide="building" class="w-4 h-4 text-rose-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-rose-500">${sayurKosong} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Sudah Bayar -->
            <div data-card-filter='{"zona":"PASAR SAYUR","statusBayar":"lunas"}' title="Klik untuk melihat pedagang lunas di Pasar Sayur" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-teal-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-teal-400 transition-colors">Sudah Bayar</span>
                <i data-lucide="badge-check" class="w-4 h-4 text-teal-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-teal-500">${sayurSudahBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>

            <!-- Belum Bayar -->
            <div data-card-filter='{"zona":"PASAR SAYUR","statusBayar":"belum_bayar"}' title="Klik untuk melihat pedagang belum bayar di Pasar Sayur" class="card-interactive-filter cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all p-4 rounded-xl border flex flex-col justify-between group hover:border-amber-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center justify-between mb-2">
                <span class="${textSecondary} font-semibold group-hover:text-amber-400 transition-colors">Belum Bayar</span>
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>
              </div>
              <p class="text-2xl font-extrabold text-amber-500">${sayurBelumBayar} <span class="text-xs font-normal ${textSecondary}">Unit</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const syncBtn = container.querySelector('#sync-dashboard-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.querySelector('i')?.classList.add('animate-spin');
      await spreadsheetService.fetchRemoteKiosks();
      syncBtn.querySelector('i')?.classList.remove('animate-spin');
    });
  }

  container.querySelector('#export-excel-btn')?.addEventListener('click', () => {
    spreadsheetService.downloadCSV();
  });

  // Actionable Interactive Metric Cards Click Handler
  container.querySelectorAll('.card-interactive-filter').forEach(card => {
    card.addEventListener('click', () => {
      const filterStr = card.getAttribute('data-card-filter');
      if (filterStr) {
        try {
          window._initialPedagangFilter = JSON.parse(filterStr);
        } catch (e) {
          window._initialPedagangFilter = {};
        }
      }
      if (window._navigate) window._navigate('/pedagang/daftar');
    });
  });

  container.querySelectorAll('.nav-goto-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filterStr = btn.getAttribute('data-filter');
      if (filterStr) {
        try {
          window._initialPedagangFilter = JSON.parse(filterStr);
        } catch (e) {
          window._initialPedagangFilter = {};
        }
      }
      const path = btn.getAttribute('data-goto') || '/pedagang/daftar';
      if (window._navigate) window._navigate(path);
    });
  });

  container.querySelectorAll('.nav-goto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-goto');
      if (path && window._navigate) window._navigate(path);
    });
  });
}
