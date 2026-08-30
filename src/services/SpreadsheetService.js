import { GOOGLE_API_URL, authService } from './AuthService.js';
import { escapeHTML, sanitizeFormulaInput, API_SECURITY_TOKEN } from '../utils/security.js';

/**
 * Format any date string, ISO timestamp, or Google Sheets Date representation into clean DD/MM/YYYY format without time
 * @param {string|Date} dateStr - e.g. "Wed Aug 26 2026 00:00:00 GMT+0700", "2026-08-26T17:00:00.000Z", "2026-08-26", "26/08/2026"
 * @returns {string} e.g. "26/08/2026" or "-"
 */
export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === 'null' || dateStr === 'undefined' || dateStr === '') return '-';
  
  const cleanStr = String(dateStr).trim();
  if (cleanStr === '-' || cleanStr === '') return '-';

  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    return cleanStr;
  }

  // Try parsing via standard Date object
  const parsedDate = new Date(cleanStr);
  if (!isNaN(parsedDate.getTime())) {
    const d = String(parsedDate.getDate()).padStart(2, '0');
    const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const y = parsedDate.getFullYear();
    return `${d}/${m}/${y}`;
  }

  // Fallback ISO YYYY-MM-DD parsing
  const isoPart = cleanStr.split('T')[0].trim();
  const parts = isoPart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  return cleanStr;
}

class SpreadsheetService {
  constructor() {
    this.storageKey = 'pasar_mukti_makmur_master_v5';
    this.listeners = [];
    this.isFetchingRemote = false;

    // Auto sync from Google Sheets on initialization
    this.fetchRemoteKiosks();
  }

  loadKiosks() {
    const keys = [this.storageKey, 'pasar_mukti_makmur_master_v4', 'pasar_mukti_makmur_master_v3', 'pasar_mukti_makmur_master_v2'];
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {}
      }
    }

    return [];
  }

  async fetchRemoteKiosks() {
    if (this.isFetchingRemote) return;
    this.isFetchingRemote = true;

    try {
      let json = null;

      // Method 1: Try GET with full parameter encoding
      try {
        const res = await fetch(`${GOOGLE_API_URL}?action=getKiosks&apiToken=${encodeURIComponent(API_SECURITY_TOKEN)}`, {
          redirect: 'follow'
        });
        json = await res.json();
      } catch (e) {
        console.warn('GET getKiosks failed, attempting POST fallback...', e);
      }

      // Method 2: POST fallback
      if (!json || json.status !== 'success' || !Array.isArray(json.data)) {
        const res = await fetch(GOOGLE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'getKiosks',
            apiToken: API_SECURITY_TOKEN
          }),
          redirect: 'follow'
        });
        json = await res.json();
      }

      if (json && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        const cleanedData = json.data.map(k => {
          // Normalisasi Data: Deteksi jika kolom zona dan blokKode terbalik dari Google Sheets
          let finalZona = String(k.zona || '').trim().toUpperCase();
          let finalBlok = String(k.blokKode || '').trim();

          const rawId = String(k.id || '').trim();
          const cleanIdSuffix = rawId.replace(/^(SND|SYR)-/i, '').trim();

          if (finalBlok.includes('PASAR')) {
            // Kolom terbalik: blokKode berisi Nama Pasar, zona berisi Kode Blok
            finalZona = finalBlok;
            finalBlok = k.zona ? String(k.zona).trim() : cleanIdSuffix;
          } else if (!finalZona.includes('PASAR')) {
            // Jika zona tidak memuat kata PASAR, infer dari ID
            finalZona = rawId.startsWith('SYR') ? 'PASAR SAYUR' : 'PASAR SANDANG';
            if (!finalBlok || finalBlok.includes('PASAR')) {
              finalBlok = cleanIdSuffix;
            }
          }

          // Bersihkan prefix 'Blok ' jika ada agar konsisten 'A1', 'B2', dll
          finalBlok = finalBlok.replace(/^blok\s+/i, '').replace(/^(SND|SYR)-/i, '').trim();

          return {
            ...k,
            id: rawId,
            zona: finalZona,
            blokKode: finalBlok,
            pedagang: escapeHTML(k.pedagang || '-'),
            nik: escapeHTML(k.nik || '-'),
            alamat: escapeHTML(k.alamat || '-'),
            kategori: escapeHTML(k.kategori || 'Umum'),
            luasM2: String(k.luasM2 || ''),
            sewaBulanan: String(k.sewaBulanan || ''),
            tglPembayaran: k.tglPembayaran ? String(k.tglPembayaran) : '-',
            tglHabisSewa: k.tglHabisSewa ? String(k.tglHabisSewa) : '2026-12-31',
            statusBayar: String(k.statusBayar || 'belum_bayar')
          };
        });

        this.saveKiosksLocally(cleanedData);
      }
    } catch (e) {
      console.warn('Google Sheets API offline or unreachable, using local data:', e);
    } finally {
      this.isFetchingRemote = false;
    }
  }

  saveKiosksLocally(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    window._kioskData = data;
    this.notify();
  }

  async updateKios(id, updatedFields) {
    const kiosks = this.loadKiosks();
    const idx = kiosks.findIndex(k => k.id === id);
    if (idx !== -1) {
      const cleanUpdated = {
        ...updatedFields,
        pedagang: sanitizeFormulaInput(updatedFields.pedagang || '-'),
        nik: sanitizeFormulaInput(updatedFields.nik || '-'),
        alamat: sanitizeFormulaInput(updatedFields.alamat || '-'),
        kategori: sanitizeFormulaInput(updatedFields.kategori || 'Umum'),
        tglPembayaran: updatedFields.tglPembayaran ? String(updatedFields.tglPembayaran) : '-',
        tglHabisSewa: updatedFields.tglHabisSewa ? String(updatedFields.tglHabisSewa) : '2026-12-31'
      };

      const updatedItem = { ...kiosks[idx], ...cleanUpdated };
      kiosks[idx] = updatedItem;
      
      this.saveKiosksLocally(kiosks);

      const currentUser = authService.getCurrentUser();
      const petugasName = currentUser ? `${currentUser.nama} (${currentUser.username})` : 'Sistem';

      try {
        fetch(GOOGLE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateKios',
            kiosk: updatedItem,
            user: petugasName,
            apiToken: API_SECURITY_TOKEN
          }),
          redirect: 'follow'
        }).then(r => r.json()).then(res => {
          console.log('Google Sheets Sync result:', res);
        }).catch(err => {
          console.warn('Google Sheets Sync background error:', err);
        });
      } catch (err) {
        console.warn('Error triggering Google Sheets update:', err);
      }

      return updatedItem;
    }
    return null;
  }

  getStats(zone = null) {
    let kiosks = this.loadKiosks();
    if (zone) {
      kiosks = kiosks.filter(k => k.zona === zone);
    }

    const total = kiosks.length;
    const terisi = kiosks.filter(k => k.pedagang && k.pedagang !== '-').length;
    const kosong = total - terisi;
    const sudahBayar = kiosks.filter(k => k.statusBayar === 'lunas' && k.pedagang !== '-').length;
    const belumBayar = kiosks.filter(k => k.statusBayar === 'belum_bayar' && k.pedagang !== '-').length;
    const jatuhTempo = kiosks.filter(k => (k.statusBayar === 'jatuh_tempo' || k.statusBayar === 'hampir_habis') && k.pedagang !== '-').length;

    const totalSewa = kiosks.reduce((acc, curr) => {
      const num = parseInt((curr.sewaBulanan || '').replace(/[^0-9]/g, '')) || 225000;
      return acc + num;
    }, 0);

    return {
      total,
      terisi,
      kosong,
      sudahBayar,
      belumBayar,
      jatuhTempo,
      okupansiPercent: total > 0 ? Math.round((terisi / total) * 100) : 0,
      totalSewaFormatted: `Rp ${totalSewa.toLocaleString('id-ID')}`
    };
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

  exportToCSV() {
    const kiosks = this.loadKiosks();
    if (!kiosks || kiosks.length === 0) return '';

    const headers = ['ID UNIK', 'ZONA PASAR', 'BLOK', 'NAMA PEDAGANG', 'NIK', 'ALAMAT', 'JENIS USAHA', 'TIPE KIOS', 'LUAS (M2)', 'BIAYA SEWA TAHUNAN', 'TGL PEMBAYARAN', 'TGL HABIS SEWA', 'STATUS BAYAR', 'NOMOR HP', 'CATATAN'];
    
    const rows = kiosks.map(k => [
      `"${k.id || ''}"`,
      `"${k.zona || ''}"`,
      `"${k.blokKode || k.id || ''}"`,
      `"${k.pedagang === '-' ? 'KOSONG' : sanitizeFormulaInput(k.pedagang)}"`,
      `"${sanitizeFormulaInput(k.nik || '')}"`,
      `"${sanitizeFormulaInput(k.alamat || '')}"`,
      `"${sanitizeFormulaInput(k.kategori || '')}"`,
      `"${k.tipeKios || ''}"`,
      `"${k.luasM2 || ''}"`,
      `"${k.sewaBulanan || ''}"`,
      `"${formatDateDDMMYYYY(k.tglPembayaran)}"`,
      `"${formatDateDDMMYYYY(k.tglHabisSewa)}"`,
      `"${k.statusBayar || ''}"`,
      `"${sanitizeFormulaInput(k.nomorHp || '')}"`,
      `"${sanitizeFormulaInput(k.catatan || '')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  downloadCSV() {
    const csvContent = this.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pendataan_Master_Pasar_Mukti_Makmur_612_Unit_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Log generated letter(s) to Google Sheets (Buku_Agenda_Surat) and Google Drive
   * @param {Array<Object>} entries - [{ nomorSurat, tanggalSurat, perihal, lampiran, tanggalKirim, tujuan, ket }]
   * @param {string|null} pdfBase64 - Base64 encoded PDF string
   * @param {string|null} fileName - Output filename for Google Drive
   * @param {string} marketZone - 'PASAR SANDANG' or 'PASAR SAYUR'
   * @returns {Promise<Object>}
   */
  async logSuratToAgenda(entries, pdfBase64 = null, fileName = null, marketZone = 'PASAR SANDANG') {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { success: false, message: 'Tidak ada data surat untuk dicatat.' };
    }

    // 1. Save to Local Agenda Cache immediately
    try {
      const localAgendaKey = 'pasar_buku_agenda_surat_v1';
      const existing = JSON.parse(localStorage.getItem(localAgendaKey) || '[]');
      const startNo = existing.length + 1;

      const formattedLocal = entries.map((item, idx) => ({
        no: startNo + idx,
        nomorSurat: item.nomorSurat,
        tanggalSurat: item.tanggalSurat,
        perihal: item.perihal,
        lampiran: item.lampiran || '-',
        tanggalKirim: item.tanggalKirim || formatDateDDMMYYYY(new Date()),
        tujuan: item.tujuan,
        ket: item.ket || (pdfBase64 ? 'Tersimpan di Cloud' : 'Tercetak'),
        createdAt: new Date().toISOString()
      }));

      const merged = [...formattedLocal, ...existing];
      localStorage.setItem(localAgendaKey, JSON.stringify(merged.slice(0, 1000)));
      this.notify();
    } catch (e) {
      console.warn('Error saving local agenda cache:', e);
    }

    // 2. Transmit to Google Apps Script (Drive + Spreadsheet)
    try {
      const cleanZone = String(marketZone || 'PASAR SANDANG').toUpperCase().includes('SAYUR') ? 'PASAR SAYUR' : 'PASAR SANDANG';

      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'logSurat',
          apiToken: API_SECURITY_TOKEN,
          zona: cleanZone,
          entries: entries,
          pdfBase64: pdfBase64 || null,
          fileName: fileName || `Surat_${entries[0]?.nomorSurat || 'Pasar'}.pdf`
        }),
        redirect: 'follow'
      });

      const json = await res.json();
      if (json && json.status === 'success') {
        return { 
          success: true, 
          message: 'Berhasil dicatat di Buku Agenda & Google Drive!', 
          driveUrl: json.driveUrl, 
          totalLogged: entries.length 
        };
      }
    } catch (e) {
      console.warn('Remote Agenda Log offline or background sync:', e);
    }

    return { 
      success: true, 
      message: 'Tercatat di Buku Agenda Lokal.', 
      totalLogged: entries.length 
    };
  }

  getAgendaLogs() {
    try {
      const localAgendaKey = 'pasar_buku_agenda_surat_v1';
      return JSON.parse(localStorage.getItem(localAgendaKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Fetch fresh real-time agenda logs from Google Sheets (Buku_Agenda_Surat)
   */
  async fetchRemoteAgenda() {
    try {
      const res = await fetch(`${GOOGLE_API_URL}?action=getAgendaSurat&apiToken=${encodeURIComponent(API_SECURITY_TOKEN)}`, {
        redirect: 'follow'
      });
      const json = await res.json();
      if (json && json.status === 'success' && Array.isArray(json.data)) {
        const localAgendaKey = 'pasar_buku_agenda_surat_v1';
        localStorage.setItem(localAgendaKey, JSON.stringify(json.data));
        this.notify();
        return { success: true, count: json.data.length, data: json.data };
      }
    } catch (e) {
      console.warn('Error fetching remote agenda:', e);
    }
    return { success: false, data: this.getAgendaLogs() };
  }

  /**
   * Clear local agenda logs cache
   */
  clearLocalAgenda() {
    const localAgendaKey = 'pasar_buku_agenda_surat_v1';
    localStorage.removeItem(localAgendaKey);
    this.notify();
  }

  // ==========================================
  // PERJANJIAN HISTORY LOGS
  // ==========================================
  getPerjanjianLogs() {
    try {
      const key = 'pasar_buku_perjanjian_logs_v1';
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  savePerjanjianLog(item) {
    try {
      const key = 'pasar_buku_perjanjian_logs_v1';
      const existing = this.getPerjanjianLogs();
      existing.unshift({
        id: 'PRJ-' + Date.now(),
        timestamp: new Date().toISOString(),
        ...item
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
      this.notify();
    } catch (e) {
      console.warn('Error saving local perjanjian log:', e);
    }
  }

  // ==========================================
  // KWITANSI HISTORY LOGS
  // ==========================================
  getKwitansiLogs() {
    try {
      const key = 'pasar_buku_kwitansi_logs_v1';
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  saveKwitansiLog(item) {
    try {
      const key = 'pasar_buku_kwitansi_logs_v1';
      const existing = this.getKwitansiLogs();
      existing.unshift({
        id: 'KW-' + Date.now(),
        timestamp: new Date().toISOString(),
        ...item
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
      this.notify();
    } catch (e) {
      console.warn('Error saving local kwitansi log:', e);
    }
  }

  /**
   * Log Surat Perjanjian to Google Sheets & Google Drive
   */
  async logPerjanjianToAgenda(entries, pdfBase64 = null, fileName = null, marketZone = 'PASAR SANDANG') {
    if (!Array.isArray(entries) || entries.length === 0) return { success: false };

    try {
      const cleanZone = String(marketZone || 'PASAR SANDANG').toUpperCase().includes('SAYUR') ? 'PASAR SAYUR' : 'PASAR SANDANG';
      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'logPerjanjian',
          apiToken: API_SECURITY_TOKEN,
          zona: cleanZone,
          entries: entries,
          pdfBase64: pdfBase64 || null,
          fileName: fileName || `Perjanjian_${entries[0]?.nomorPerjanjian || 'Pasar'}.pdf`
        }),
        redirect: 'follow'
      });
      return await res.json();
    } catch (e) {
      console.warn('Perjanjian Drive Sync background:', e);
      return { success: true, localOnly: true };
    }
  }

  /**
   * Log Kwitansi Pembayaran to Google Sheets & Google Drive
   */
  async logKwitansiToAgenda(entries, pdfBase64 = null, fileName = null, marketZone = 'PASAR SANDANG') {
    if (!Array.isArray(entries) || entries.length === 0) return { success: false };

    try {
      const cleanZone = String(marketZone || 'PASAR SANDANG').toUpperCase().includes('SAYUR') ? 'PASAR SAYUR' : 'PASAR SANDANG';
      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'logKwitansi',
          apiToken: API_SECURITY_TOKEN,
          zona: cleanZone,
          entries: entries,
          pdfBase64: pdfBase64 || null,
          fileName: fileName || `Kwitansi_${entries[0]?.nomorKwitansi || 'Pasar'}.pdf`
        }),
        redirect: 'follow'
      });
      return await res.json();
    } catch (e) {
      console.warn('Kwitansi Drive Sync background:', e);
      return { success: true, localOnly: true };
    }
  }
  /**
   * Generate Surat Perjanjian via Google Docs Template API
   */
  async generateRemotePerjanjianDoc(data) {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'generatePerjanjian',
          apiToken: API_SECURITY_TOKEN,
          ...data
        }),
        redirect: 'follow'
      });
      return await res.json();
    } catch (e) {
      console.warn('Error generating remote perjanjian:', e);
      return { status: 'error', message: e.message };
    }
  }

  /**
   * Generate Kwitansi via Google Docs Template API
   */
  async generateRemoteKwitansiDoc(data) {
    try {
      const res = await fetch(GOOGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'generateKwitansi',
          apiToken: API_SECURITY_TOKEN,
          ...data
        }),
        redirect: 'follow'
      });
      return await res.json();
    } catch (e) {
      console.warn('Error generating remote kwitansi:', e);
      return { status: 'error', message: e.message };
    }
  }
}

export const spreadsheetService = new SpreadsheetService();
