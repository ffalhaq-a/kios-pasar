import { authService } from '../../services/AuthService.js';
import { themeManager } from '../../shell/ThemeManager.js';

export function renderLoginView(container) {
  const isDark = themeManager.isDark();

  container.innerHTML = `
    <div class="min-h-screen w-full flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} font-sans overflow-x-hidden">
      
      <!-- Full Screen 2-Column Grid Layout (No Margins, Pure White/Dark Background) -->
      <div class="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 ${isDark ? 'bg-slate-950' : 'bg-white'}">
        
        <!-- LEFT COLUMN: Vector Illustration (7 Cols on LG, Centered, Pure Background) -->
        <div class="lg:col-span-7 p-6 md:p-12 flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}">
          <div class="w-full max-w-2xl flex items-center justify-center">
            <img 
              src="/assets/login_illustration.jpg" 
              alt="Market Service Counter Vector Illustration" 
              class="w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>

        <!-- RIGHT COLUMN: Clean Login Form (5 Cols on LG, Pure Background) -->
        <div class="lg:col-span-5 p-8 md:p-16 flex flex-col justify-center ${isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-100'}">
          
          <div class="max-w-md w-full mx-auto space-y-6">
            
            <div>
              <h1 class="text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}">
                Selamat Datang 👋
              </h1>
            </div>

            <form id="login-form" class="space-y-5">
              
              <div id="login-error-alert" class="hidden p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
                <span id="login-error-msg">Username atau Password salah!</span>
              </div>

              <!-- Username Input -->
              <div>
                <label class="block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2">
                  Username Pengelola:
                </label>
                <div class="relative">
                  <i data-lucide="user" class="w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-4 top-4"></i>
                  <input 
                    type="text" 
                    id="username-input"
                    required
                    placeholder="Masukkan username..." 
                    class="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-2xl text-xs font-medium border focus:outline-none focus:border-emerald-500 transition-all ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }"
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div>
                <label class="block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2">
                  Kata Sandi (Password):
                </label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} absolute left-4 top-4"></i>
                  <input 
                    type="password" 
                    id="password-input"
                    required
                    placeholder="Masukkan kata sandi..." 
                    class="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-2xl text-xs font-medium border focus:outline-none focus:border-emerald-500 transition-all ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
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
                class="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <i data-lucide="log-in" class="w-4.5 h-4.5"></i>
                <span>Masuk Ke Sistem</span>
              </button>
            </form>

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
