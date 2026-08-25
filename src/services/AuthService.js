export const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbzGTU7gWu_FlR2NbWkuh4p2RL0XHnMa3szvQlZ2mO9LcbKITDuO8WF937rQ0lCKs_87/exec';

class AuthService {
  constructor() {
    this.sessionKey = 'pasar_user_session';
    this.usersCacheKey = 'pasar_users_cache_v1';
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

  getCachedUsers() {
    const saved = localStorage.getItem(this.usersCacheKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { username: 'admin', password: 'admin123', nama: 'Kepala Pasar Karangpucung', role: 'ADMIN' },
      { username: 'petugas', password: 'petugas123', nama: 'Petugas Penagihan Lapangan', role: 'PETUGAS' }
    ];
  }

  saveUsersCache(users) {
    if (Array.isArray(users) && users.length > 0) {
      localStorage.setItem(this.usersCacheKey, JSON.stringify(users));
    }
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
      console.warn('Google API Offline, checking local user database cache:', e);
    }

    // 2. Offline Fallback Check using cached database users
    const cachedUsers = this.getCachedUsers();
    const foundUser = cachedUsers.find(
      usr => String(usr.username).toLowerCase().trim() === u.toLowerCase() && String(usr.password).trim() === p
    );

    if (foundUser) {
      const userObj = {
        username: foundUser.username,
        nama: foundUser.nama || foundUser.username,
        role: foundUser.role || 'ADMIN'
      };
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
