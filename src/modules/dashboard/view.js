import { initialKiosData } from '../denah/data/sampleData.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderDashboardView(container) {
  const kiosks = window._kioskData || initialKiosData;
  const totalKios = kiosks.length;
  const terisi = kiosks.filter(k => k.status === 'terisi').length;
  const kosong = kiosks.filter(k => k.status === 'kosong').length;
  const jatuhTempo = kiosks.filter(k => k.status === 'jatuh_tempo').length;
  const okupansi = Math.round((terisi / totalKios) * 100);
  const isDark = themeManager.isDark();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const progressBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      <!-- Title & Subtitle -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold ${textPrimary}">Ringkasan Eksekutif Pasar</h2>
          <p class="text-xs ${textSecondary}">Pantau statistik okupansi kios, pendapatan, dan status sewa secara terpusat.</p>
        </div>
        <button class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Cetak Laporan</span>
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Total Kios -->
        <div class="${cardBg} border rounded-xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium ${textSecondary}">Total Kios Pasar</span>
            <div class="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <i data-lucide="store" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-bold ${textPrimary}">${totalKios} Unit</p>
          <p class="text-[11px] ${textSecondary} mt-1">Kapasitas Maksimal Blok A</p>
        </div>

        <!-- Terisi -->
        <div class="${cardBg} border rounded-xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium ${textSecondary}">Kios Terisi</span>
            <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-bold text-emerald-500">${terisi} Unit</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Tingkat Okupansi: ${okupansi}%</p>
        </div>

        <!-- Kosong -->
        <div class="${cardBg} border rounded-xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium ${textSecondary}">Kios Kosong</span>
            <div class="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <i data-lucide="x-circle" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-bold text-rose-500">${kosong} Unit</p>
          <p class="text-[11px] ${textSecondary} mt-1">Siap disewakan</p>
        </div>

        <!-- Jatuh Tempo -->
        <div class="${cardBg} border rounded-xl p-5 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium ${textSecondary}">Tenggat Sewa Bulan Ini</span>
            <div class="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="text-2xl font-bold text-amber-500">${jatuhTempo} Unit</p>
          <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Perlu penagihan/perpanjangan</p>
        </div>
      </div>

      <!-- Occupancy Progress & Visual Banner -->
      <div class="${cardBg} border rounded-xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold ${textPrimary}">Kesehatan Okupansi Pasar</h3>
          <span class="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">${okupansi}% Terisi</span>
        </div>
        <div class="w-full ${progressBg} rounded-full h-3 overflow-hidden border flex">
          <div class="bg-emerald-500 h-full" style="width: ${(terisi/totalKios)*100}%" title="Terisi: ${terisi}"></div>
          <div class="bg-amber-500 h-full" style="width: ${(jatuhTempo/totalKios)*100}%" title="Jatuh Tempo: ${jatuhTempo}"></div>
          <div class="bg-rose-400 h-full" style="width: ${(kosong/totalKios)*100}%" title="Kosong: ${kosong}"></div>
        </div>
        <div class="flex items-center gap-6 mt-4 text-xs ${textSecondary}">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span>Terisi (${terisi})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm bg-amber-500"></span>
            <span>Jatuh Tempo (${jatuhTempo})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm bg-rose-400"></span>
            <span>Kosong (${kosong})</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="${cardBg} border rounded-xl p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-emerald-500">Modul Pedagang</span>
            <h4 class="text-base font-bold ${textPrimary} mt-0.5">Kelola Data & Sub-Menu</h4>
            <p class="text-xs ${textSecondary} mt-1">Akses daftar pedagang dan kategori usaha pasar.</p>
          </div>
          <button data-goto="/pedagang" class="nav-goto-btn ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} text-xs px-3.5 py-2 rounded-lg font-medium transition-all">
            Buka Modul &rarr;
          </button>
        </div>

        <div class="${cardBg} border rounded-xl p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-teal-500">Modul Denah 2D</span>
            <h4 class="text-base font-bold ${textPrimary} mt-0.5">Visualisasi Denah Kios</h4>
            <p class="text-xs ${textSecondary} mt-1">Interaksi 2D Canvas dengan Konva.js.</p>
          </div>
          <button data-goto="/denah" class="nav-goto-btn ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} text-xs px-3.5 py-2 rounded-lg font-medium transition-all">
            Lihat Denah &rarr;
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.nav-goto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-goto');
      if (path && window._navigate) window._navigate(path);
    });
  });
}
