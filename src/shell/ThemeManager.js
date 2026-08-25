/**
 * ThemeManager - Pengelola Mode Gelap (Dark) dan Terang (Light).
 * Menyimpan preferensi pengguna di localStorage dan menerapkan class pada <html>.
 */
class ThemeManager {
  constructor() {
    // 1. Baca tema tersimpan di localStorage, default ke 'dark'
    this.theme = localStorage.getItem('theme') || 'dark';
    this.listeners = [];
  }

  init() {
    this.applyTheme();
  }

  /**
   * Mengubah tema dari Dark -> Light atau sebaliknya
   */
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
    this.notify();
  }

  isDark() {
    return this.theme === 'dark';
  }

  /**
   * Menerapkan class CSS pada elemen <html> dan <body>
   */
  applyTheme() {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (this.theme === 'dark') {
      htmlEl.classList.add('dark');
      bodyEl.classList.remove('bg-slate-100', 'text-slate-900');
      bodyEl.classList.add('bg-slate-900', 'text-slate-100');
    } else {
      htmlEl.classList.remove('dark');
      bodyEl.classList.remove('bg-slate-900', 'text-slate-100');
      bodyEl.classList.add('bg-slate-100', 'text-slate-900');
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.theme));
  }
}

export const themeManager = new ThemeManager();
