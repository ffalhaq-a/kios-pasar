import { GOOGLE_API_URL, authService } from './AuthService.js';
import { escapeHTML, sanitizeFormulaInput, API_SECURITY_TOKEN } from '../utils/security.js';

/**
 * Format any date string or ISO timestamp into clean DD/MM/YYYY format without time
 * @param {string} dateStr - e.g. "2026-12-30T17:00:00.000Z", "2026-12-31", "31/12/2026"
 * @returns {string} e.g. "30/12/2026" or "-"
 */
export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === 'null' || dateStr === 'undefined') return '-';
  
  const cleanStr = String(dateStr).split('T')[0].trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    return cleanStr;
  }

  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  return cleanStr;
}

class SpreadsheetService {
  constructor() {
    this.storageKey = 'pasar_mukti_makmur_master_v4';
    this.listeners = [];
    this.isFetchingRemote = false;

    // Auto sync from Google Sheets on initialization
    this.fetchRemoteKiosks();
  }

  loadKiosks() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored master kiosk data:', e);
      }
    }

    return [];
  }

  async fetchRemoteKiosks() {
    if (this.isFetchingRemote) return;
    this.isFetchingRemote = true;

    try {
      const res = await fetch(`${GOOGLE_API_URL}?action=getKiosks&apiToken=${API_SECURITY_TOKEN}`);
      const json = await res.json();

      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        const cleanedData = json.data.map(k => ({
          ...k,
          pedagang: escapeHTML(k.pedagang || '-'),
          nik: escapeHTML(k.nik || '-'),
          alamat: escapeHTML(k.alamat || '-'),
          kategori: escapeHTML(k.kategori || 'Umum'),
          luasM2: String(k.luasM2 || ''),
          sewaBulanan: String(k.sewaBulanan || ''),
          tglPembayaran: String(k.tglPembayaran || '-').split('T')[0],
          tglHabisSewa: String(k.tglHabisSewa || '2026-12-31').split('T')[0],
          statusBayar: String(k.statusBayar || 'belum_bayar')
        }));

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
      // Security Hardening: Sanitize formula injection & escape HTML
      const cleanUpdated = {
        ...updatedFields,
        pedagang: sanitizeFormulaInput(updatedFields.pedagang || '-'),
        nik: sanitizeFormulaInput(updatedFields.nik || '-'),
        alamat: sanitizeFormulaInput(updatedFields.alamat || '-'),
        kategori: sanitizeFormulaInput(updatedFields.kategori || 'Umum'),
        tglPembayaran: updatedFields.tglPembayaran ? String(updatedFields.tglPembayaran).split('T')[0] : '-',
        tglHabisSewa: updatedFields.tglHabisSewa ? String(updatedFields.tglHabisSewa).split('T')[0] : '2026-12-31'
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
}

export const spreadsheetService = new SpreadsheetService();
