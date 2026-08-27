import { themeManager } from '../../shell/ThemeManager.js';
import { rateService } from '../../services/RateService.js';
import { authService } from '../../services/AuthService.js';
import { escapeHTML } from '../../utils/security.js';

export function renderPengaturanView(container) {
  const isDark = themeManager.isDark();
  const rates = rateService.getRates();
  const users = authService.getCachedUsers();
  const currentUser = authService.getCurrentUser();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  if (!window._activePengaturanTab) {
    window._activePengaturanTab = 'tarif';
  }

  const activeTab = window._activePengaturanTab;

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary} flex items-center gap-2">
            <i data-lucide="settings" class="w-6 h-6 text-emerald-500"></i>
            <span>Pengaturan Sistem Pasar</span>
          </h1>
          <p class="text-xs ${textSecondary} mt-0.5">Kelola tarif sewa unit kios tahunan, manajemen akun login, dan keamanan sistem.</p>
        </div>

        <!-- TAB NAVIGATION BUTTONS -->
        <div class="flex items-center gap-1.5 p-1 rounded-2xl border ${cardBg}">
          <button id="tab-btn-tarif" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'tarif' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
              : `${textSecondary} hover:${textPrimary} hover:bg-slate-800/20`
          }">
            <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
            <span>Tarif Sewa Kios</span>
          </button>

          <button id="tab-btn-akses" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'akses' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
              : `${textSecondary} hover:${textPrimary} hover:bg-slate-800/20`
          }">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Akses Login & User</span>
          </button>
        </div>
      </div>

      <!-- TAB CONTENT -->
      ${activeTab === 'tarif' ? `
        <!-- TAB 1: PENGATURAN TARIF SEWA -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- FORM TARIF (8 COLS) -->
          <div class="lg:col-span-8 space-y-5">
            <div class="${cardBg} border rounded-2xl p-5 space-y-5">
              <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                <div class="flex items-center gap-2">
                  <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <i data-lucide="tags" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold ${textPrimary}">Tarif Sewa Tahunan Pasar Mukti Makmur</h3>
                    <p class="text-[11px] ${textSecondary}">Berdasarkan Peraturan Desa (Perdes) Karangpucung Terbaru</p>
                  </div>
                </div>
                <button id="btn-reset-rates" class="text-xs text-rose-500 hover:underline font-semibold flex items-center gap-1">
                  <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                  <span>Reset Default Perdes</span>
                </button>
              </div>

              <form id="form-rates" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <!-- Kios Kelas 1 -->
                  <div class="p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-extrabold ${textPrimary} flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Kios Kelas 1</span>
                      </label>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">Utama</span>
                    </div>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-xs font-bold ${textSecondary}">Rp</span>
                      <input type="number" id="rate-kios1" value="${rates.kiosKelas1}" step="5000" min="0" class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                    </div>
                    <p class="text-[10px] ${textSecondary}">Tarif resmi per unit per tahun</p>
                  </div>

                  <!-- Kios Kelas 2 -->
                  <div class="p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-extrabold ${textPrimary} flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        <span>Kios Kelas 2</span>
                      </label>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-500">Standar</span>
                    </div>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-xs font-bold ${textSecondary}">Rp</span>
                      <input type="number" id="rate-kios2" value="${rates.kiosKelas2}" step="5000" min="0" class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                    </div>
                    <p class="text-[10px] ${textSecondary}">Tarif resmi per unit per tahun</p>
                  </div>

                  <!-- Los -->
                  <div class="p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-extrabold ${textPrimary} flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Los Pasar</span>
                      </label>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500">Los Basah/Kering</span>
                    </div>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-xs font-bold ${textSecondary}">Rp</span>
                      <input type="number" id="rate-los" value="${rates.los}" step="5000" min="0" class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                    </div>
                    <p class="text-[10px] ${textSecondary}">Tarif resmi per unit per tahun</p>
                  </div>

                  <!-- Lemprakan -->
                  <div class="p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-extrabold ${textPrimary} flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <span>Lemprakan</span>
                      </label>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500">Hamparan</span>
                    </div>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-xs font-bold ${textSecondary}">Rp</span>
                      <input type="number" id="rate-lemprakan" value="${rates.lemprakan}" step="5000" min="0" class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                    </div>
                    <p class="text-[10px] ${textSecondary}">Tarif resmi per unit per tahun</p>
                  </div>

                </div>

                <div class="pt-3 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                  <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>Simpan & Terapkan Tarif Baru</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- RINGKASAN TARIF KANAN (4 COLS) -->
          <div class="lg:col-span-4 space-y-4">
            <div class="${cardBg} border rounded-2xl p-5 space-y-4">
              <h4 class="text-xs font-extrabold ${textPrimary} uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="info" class="w-4 h-4 text-emerald-500"></i>
                <span>Ketentuan Tarif Sewa</span>
              </h4>
              <p class="text-xs ${textSecondary} leading-relaxed">
                Perubahan tarif ini akan secara otomatis diterapkan pada:
              </p>
              <ul class="space-y-2 text-xs ${textSecondary}">
                <li class="flex items-start gap-2">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i>
                  <span>Penerbitan Surat Pemberitahuan Retribusi Sewa Tahunan.</span>
                </li>
                <li class="flex items-start gap-2">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i>
                  <span>Kalkulasi otomatis saat data sewa kios masih kosong.</span>
                </li>
                <li class="flex items-start gap-2">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i>
                  <span>Perhitungan rekapitulasi target pendapatan pasar desa.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      ` : `
        <!-- TAB 2: MANAJEMEN AKSES LOGIN & USER -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- TABEL DAFTAR PENGGUNA (8 COLS) -->
          <div class="lg:col-span-8 space-y-5">
            <div class="${cardBg} border rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                <div class="flex items-center gap-2">
                  <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <i data-lucide="users" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold ${textPrimary}">Daftar Pengguna Sistem</h3>
                    <p class="text-[11px] ${textSecondary}">Akun yang memiliki hak akses login ke aplikasi</p>
                  </div>
                </div>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  ${users.length} Akun Terdaftar
                </span>
              </div>

              <!-- Tabel Pengguna -->
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="text-[10px] uppercase tracking-wider font-extrabold ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}">
                    <tr>
                      <th class="px-3.5 py-2.5 rounded-l-xl">Username</th>
                      <th class="px-3.5 py-2.5">Nama Petugas</th>
                      <th class="px-3.5 py-2.5">Hak Akses (Role)</th>
                      <th class="px-3.5 py-2.5 text-center">Password</th>
                      <th class="px-3.5 py-2.5 rounded-r-xl text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}">
                    ${users.map(u => `
                      <tr class="hover:bg-slate-800/10 transition-colors">
                        <td class="px-3.5 py-3 font-extrabold ${textPrimary} flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[10px]">
                            ${u.username.charAt(0).toUpperCase()}
                          </div>
                          <span>${escapeHTML(u.username)}</span>
                        </td>
                        <td class="px-3.5 py-3 font-medium ${textPrimary}">
                          ${escapeHTML(u.nama || u.username)}
                        </td>
                        <td class="px-3.5 py-3">
                          <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            u.role === 'ADMIN' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }">
                            ${escapeHTML(u.role || 'PETUGAS')}
                          </span>
                        </td>
                        <td class="px-3.5 py-3 text-center font-mono ${textSecondary}">
                          ••••••••
                        </td>
                        <td class="px-3.5 py-3 text-right">
                          ${u.username.toLowerCase() === 'admin' ? `
                            <span class="text-[10px] font-bold text-slate-500">Super Admin</span>
                          ` : `
                            <button data-delete-user="${escapeHTML(u.username)}" class="btn-delete-user p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all" title="Hapus Akun">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          `}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          <!-- FORM TAMBAH / UBAH PENGGUNA (4 COLS) -->
          <div class="lg:col-span-4 space-y-4">
            <div class="${cardBg} border rounded-2xl p-5 space-y-4">
              <h4 class="text-xs font-extrabold ${textPrimary} uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="user-plus" class="w-4 h-4 text-emerald-500"></i>
                <span>Tambah Pengguna Baru</span>
              </h4>

              <form id="form-add-user" class="space-y-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Username:</label>
                  <input type="text" id="new-username" placeholder="contoh: bendahara" required class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Nama Lengkap:</label>
                  <input type="text" id="new-nama" placeholder="contoh: Bpk. Slamet" required class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Password:</label>
                  <input type="password" id="new-password" placeholder="Minimal 6 karakter" required class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Hak Akses (Role):</label>
                  <select id="new-role" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}">
                    <option value="PETUGAS">PETUGAS (Penagihan & Data)</option>
                    <option value="ADMIN">ADMIN (Akses Penuh)</option>
                  </select>
                </div>

                <div class="pt-2">
                  <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Simpan Pengguna</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      `}

    </div>
  `;

  // Tab Handlers
  container.querySelector('#tab-btn-tarif')?.addEventListener('click', () => {
    window._activePengaturanTab = 'tarif';
    renderPengaturanView(container);
    if (window.lucide) window.lucide.createIcons();
  });

  container.querySelector('#tab-btn-akses')?.addEventListener('click', () => {
    window._activePengaturanTab = 'akses';
    renderPengaturanView(container);
    if (window.lucide) window.lucide.createIcons();
  });

  // Rates Form Submit
  const formRates = container.querySelector('#form-rates');
  if (formRates) {
    formRates.addEventListener('submit', (e) => {
      e.preventDefault();
      const newRates = {
        kiosKelas1: Number(container.querySelector('#rate-kios1').value) || 300000,
        kiosKelas2: Number(container.querySelector('#rate-kios2').value) || 250000,
        los: Number(container.querySelector('#rate-los').value) || 225000,
        lemprakan: Number(container.querySelector('#rate-lemprakan').value) || 215000
      };

      if (rateService.saveRates(newRates)) {
        alert('✅ Tarif sewa tahunan berhasil diperbarui dan diterapkan ke seluruh sistem!');
        renderPengaturanView(container);
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Reset Rates Button
  container.querySelector('#btn-reset-rates')?.addEventListener('click', () => {
    if (confirm('Kembalikan tarif sewa ke standar Perdes (Kios 1: 300rb, Kios 2: 250rb, Los: 225rb, Lemprakan: 215rb)?')) {
      rateService.resetRates();
      renderPengaturanView(container);
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Add User Form Submit
  const formAddUser = container.querySelector('#form-add-user');
  if (formAddUser) {
    formAddUser.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = container.querySelector('#new-username').value.trim();
      const n = container.querySelector('#new-nama').value.trim();
      const p = container.querySelector('#new-password').value.trim();
      const r = container.querySelector('#new-role').value;

      const res = authService.addUser({ username: u, nama: n, password: p, role: r });
      if (res.success) {
        alert(`✅ ${res.message}`);
        renderPengaturanView(container);
        if (window.lucide) window.lucide.createIcons();
      } else {
        alert(`⚠️ ${res.message}`);
      }
    });
  }

  // Delete User Handler
  container.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const u = btn.getAttribute('data-delete-user');
      if (confirm(`Apakah Anda yakin ingin menghapus akun "${u}"?`)) {
        const res = authService.deleteUser(u);
        if (res.success) {
          alert(`✅ ${res.message}`);
          renderPengaturanView(container);
          if (window.lucide) window.lucide.createIcons();
        } else {
          alert(`⚠️ ${res.message}`);
        }
      }
    });
  });
}
