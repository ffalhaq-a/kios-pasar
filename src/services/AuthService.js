export const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbzGTU7gWu_FlR2NbWkuh4p2RL0XHnMa3szvQlZ2mO9LcbKITDuO8WF937rQ0lCKs_87/exec';

class AuthService {
  constructor() {
    this.sessionKey = 'pasar_user_session';
    this.listeners = [];
  }

  getCurrentUser() {
    const session = sessionStorage.getItem(this.sessionKey) || localStorage.getItem(this.sessionKey);
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        console.error('Error parsing session:', e);
      }
    }
    return null;
  }

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  async login(username, password, remember = true) {
    const u = (username || '').trim();
    const p = (password || '').trim();

    if (!u || !p) {
      return { success: false, message: 'Username dan Password wajib diisi!' };
    }

    try {
      // 1. Authenticate via Google Apps Script API
      const res = await fetch(`${GOOGLE_API_URL}?action=login&username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`);
      const json = await res.json();

      if (json.status === 'success' && json.user) {
        const userObj = json.user;
        if (remember) {
          localStorage.setItem(this.sessionKey, JSON.stringify(userObj));
        } else {
          sessionStorage.setItem(this.sessionKey, JSON.stringify(userObj));
        }
        this.notify();
        return { success: true, user: userObj };
      }
    } catch (e) {
      console.warn('API Offline or error, checking fallback accounts:', e);
    }

    // 2. Fallback Account Check (Admin & Petugas)
    if (u.toLowerCase() === 'admin' && p === 'admin123') {
      const userObj = { username: 'admin', nama: 'Kepala Pasar Karangpucung', role: 'ADMIN' };
      if (remember) localStorage.setItem(this.sessionKey, JSON.stringify(userObj));
      else sessionStorage.setItem(this.sessionKey, JSON.stringify(userObj));
      this.notify();
      return { success: true, user: userObj };
    }

    if (u.toLowerCase() === 'petugas' && p === 'petugas123') {
      const userObj = { username: 'petugas', nama: 'Petugas Penagihan Lapangan', role: 'PETUGAS' };
      if (remember) localStorage.setItem(this.sessionKey, JSON.stringify(userObj));
      else sessionStorage.setItem(this.sessionKey, JSON.stringify(userObj));
      this.notify();
      return { success: true, user: userObj };
    }

    return { success: false, message: 'Username atau Password salah!' };
  }

  logout() {
    sessionStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.sessionKey);
    this.notify();
    if (window._navigate) {
      window._navigate('/login');
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const authService = new AuthService();
