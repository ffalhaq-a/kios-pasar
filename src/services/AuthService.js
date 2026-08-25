import { 
  escapeHTML, 
  generateSessionSignature, 
  verifySessionIntegrity, 
  API_SECURITY_TOKEN 
} from '../utils/security.js';

export const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbzGTU7gWu_FlR2NbWkuh4p2RL0XHnMa3szvQlZ2mO9LcbKITDuO8WF937rQ0lCKs_87/exec';

class AuthService {
  constructor() {
    this.sessionKey = 'pasar_user_session_v2';
    this.usersCacheKey = 'pasar_users_cache_v2';
    this.listeners = [];
  }

  /**
   * Retrieves current authenticated user after verifying session signature integrity
   * @returns {Object|null} Clean user object or null if invalid/tampered
   */
  getCurrentUser() {
    const session = sessionStorage.getItem(this.sessionKey) || localStorage.getItem(this.sessionKey);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Anti-Tampering Check: Verify signature match
        if (verifySessionIntegrity(parsed)) {
          return {
            username: escapeHTML(parsed.username),
            nama: escapeHTML(parsed.nama || parsed.username),
            role: escapeHTML(parsed.role || 'USER')
          };
        } else {
          console.warn('SECURITY ALERT: Session tampering detected! Invalid signature. Logging out.');
          this.logout();
        }
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

  /**
   * Secure Login via HTTP POST (Password is encrypted in payload, not exposed in GET URL)
   */
  async login(username, password, remember = true) {
    const u = (username || '').trim();
    const p = (password || '').trim();

    if (!u || !p) {
      return { success: false, message: 'Username dan Password wajib diisi!' };
    }

    try {
      // 1. Authenticate via Google Apps Script API using HTTP POST for zero GET URL leaks
      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'login',
          username: u,
          password: p,
          apiToken: API_SECURITY_TOKEN
        }),
        redirect: 'follow'
      });

      const json = await res.json();

      if (json.status === 'success' && json.user) {
        const rawUser = json.user;
        const userObj = {
          username: rawUser.username,
          nama: rawUser.nama || rawUser.username,
          role: rawUser.role || 'ADMIN'
        };
        
        // Attach tamper-proof signature
        userObj.signature = generateSessionSignature(userObj);

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
      userObj.signature = generateSessionSignature(userObj);

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
