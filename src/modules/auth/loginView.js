import { authService } from '../../services/AuthService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderLoginView(container) {
  const isDark = themeManager.isDark();

  container.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-4 md:p-8 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans">
      
      <!-- Main Split Card (2 Columns) -->
      <div class="w-full max-w-5xl border rounded-3xl overflow-hidden shadow-2xl backdrop-blur grid grid-cols-1 lg:grid-cols-12 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}">
        
        <!-- LEFT COLUMN: Vector Illustration & Branding (7 Cols on LG) -->
        <div class="lg:col-span-7 p-6 md:p-10 flex flex-col justify-between relative bg-gradient-to-br ${isDark ? 'from-slate-900 via-emerald-950/40 to-slate-950' : 'from-emerald-50/70 via-teal-50/50 to-slate-50'} border-b lg:border-b-0 lg:border-r ${isDark ? 'border-slate-800' : 'border-slate-200/80'}">
          
          <!-- Top Left Branding Logo -->
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
              <i data-lucide="store" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-sm font-extrabold tracking-wider uppercase ${isDark ? 'text-slate-100' : 'text-slate-900'}">PASAR MUKTI MAKMUR</h2>
              <p class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Karangpucung, Cilacap • 2026</p>
            </div>
          </div>

          <!-- Illustration Image Container -->
          <div class="my-auto py-4 flex items-center justify-center">
            <div class="relative w-full max-w-md rounded-2xl overflow-hidden shadow-xl border ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}">
              <img 
                src="/assets/login_illustration.jpg" 
                alt="Market Service Counter Vector Illustration" 
                class="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          <!-- Bottom Text Footer -->
          <div class="mt-6 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200/60'} text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center justify-between">
            <span>Sistem Digital Retribusi & Kios</span>
            <span class="font-bold text-emerald-500">v2.0 • 612 Unit</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: Login Form & Account Hints (5 Cols on LG) -->
        <div class="lg:col-span-5 p-6 md:p-10 flex flex-col justify-center space-y-6">
          
          <div>
            <h1 class="text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}">
              Selamat Datang 👋
            </h1>
            <p class="text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-relaxed">
              Silakan masuk dengan akun pengelola pasar untuk mengakses dashboard & data retribusi.
            </p>
          </div>

          <form id="login-form" class="space-y-4">
            
            <div id="login-error-alert" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
              <span id="login-error-msg">Username atau Password salah!</span>
            </div>

            <!-- Username Input -->
            <div>
              <label class="block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5">
                Username Pengelola:
              </label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-3.5 top-3.5"></i>
                <input 
                  type="text" 
                  id="username-input"
                  required
                  placeholder="Masukkan username..." 
                  class="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-emerald-500 transition-all ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label class="block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1.5">
                Kata Sandi (Password):
              </label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-3.5 top-3.5"></i>
                <input 
                  type="password" 
                  id="password-input"
                  required
                  placeholder="Masukkan kata sandi..." 
                  class="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:border-emerald-500 transition-all ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }"
                />
              </div>
            </div>

            <!-- Remember Me & Theme Toggle -->
            <div class="flex items-center justify-between text-xs pt-1">
              <label class="flex items-center gap-2 cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-600'}">
                <input type="checkbox" id="remember-me" checked class="w-4 h-4 rounded accent-emerald-600" />
                <span>Ingat Sesi Login</span>
              </label>

              <button type="button" id="toggle-theme-login" class="text-xs font-semibold text-emerald-500 hover:underline">
                Mode ${isDark ? 'Terang' : 'Gelap'}
              </button>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              id="submit-login-btn"
              class="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <i data-lucide="log-in" class="w-4 h-4"></i>
              <span>Masuk Ke Sistem</span>
            </button>
          </form>

          <!-- Account Hints Box -->
          <div class="pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} space-y-2">
            <p class="text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}">Akun Default Sistem:</p>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
                <span class="font-bold text-emerald-500 block">👑 Kepala Pasar</span>
                <p class="font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5">User: admin</p>
                <p class="font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}">Pass: admin123</p>
              </div>

              <div class="p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}">
                <span class="font-bold text-blue-500 block">📱 Petugas Lapangan</span>
                <p class="font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5">User: petugas</p>
                <p class="font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}">Pass: petugas123</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const themeBtn = container.querySelector('#toggle-theme-login');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.toggleTheme();
      renderLoginView(container);
    });
  }

  const form = container.querySelector('#login-form');
  const alertEl = container.querySelector('#login-error-alert');
  const alertMsg = container.querySelector('#login-error-msg');
  const submitBtn = container.querySelector('#submit-login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.classList.add('hidden');

    const username = container.querySelector('#username-input').value;
    const password = container.querySelector('#password-input').value;
    const remember = container.querySelector('#remember-me').checked;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
      <span>Memverifikasi Akun...</span>
    `;
    if (window.lucide) window.lucide.createIcons();

    const res = await authService.login(username, password, remember);

    if (res.success) {
      if (window._navigate) {
        window._navigate('/dashboard');
      }
    } else {
      alertMsg.innerText = res.message || 'Username atau Password salah!';
      alertEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i data-lucide="log-in" class="w-4 h-4"></i>
        <span>Masuk Ke Sistem</span>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
