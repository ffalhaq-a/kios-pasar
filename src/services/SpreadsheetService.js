import { pasarMuktiMakmurData } from '../modules/denah/data/pasarMuktiMakmurData.js';
import { initialInfrastructureData } from '../modules/denah/data/sampleData.js';

class SpreadsheetService {
  constructor() {
    this.storageKey = 'pasar_mukti_makmur_active_sheet';
    this.activeSheetName = localStorage.getItem(this.storageKey) || 'PASAR SANDANG';
    this.listeners = [];
  }

  getAvailableSheets() {
    return Object.keys(pasarMuktiMakmurData.sheets);
  }

  getActiveSheetName() {
    return this.activeSheetName;
  }

  setActiveSheet(sheetName) {
    if (pasarMuktiMakmurData.sheets[sheetName]) {
      this.activeSheetName = sheetName;
      localStorage.setItem(this.storageKey, sheetName);
      window._kioskData = this.loadKiosks();
      this.notify();
    }
  }

  loadKiosks() {
    const customKey = `pasar_data_${this.activeSheetName.replace(/\s+/g, '_')}`;
    const saved = localStorage.getItem(customKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored kiosk data:', e);
      }
    }
    return JSON.parse(JSON.stringify(pasarMuktiMakmurData.sheets[this.activeSheetName] || []));
  }

  loadInfrastructure() {
    return JSON.parse(JSON.stringify(initialInfrastructureData));
  }

  saveKiosks(data) {
    const customKey = `pasar_data_${this.activeSheetName.replace(/\s+/g, '_')}`;
    localStorage.setItem(customKey, JSON.stringify(data));
    window._kioskData = data;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.activeSheetName));
  }

  exportToCSV() {
    const kiosks = this.loadKiosks();
    if (!kiosks || kiosks.length === 0) return '';

    const headers = ['BLOK', 'NAMA', 'NIK', 'ALAMAT', 'JENIS USAHA', 'LUAS', 'LUAS (M2)', 'KATEGORI', 'BIAYA SEWA', 'NOMOR HP'];
    
    const rows = kiosks.map(k => [
      `"${k.id || ''}"`,
      `"${k.pedagang === '-' ? 'KOSONG' : k.pedagang}"`,
      `"${k.nik || ''}"`,
      `"${k.alamat || ''}"`,
      `"${k.kategori || ''}"`,
      `"${k.luasDimensi || ''}"`,
      `"${k.luasM2 || ''}"`,
      `"${k.tipeKios || ''}"`,
      `"${k.sewaBulanan || ''}"`,
      `"${k.nomorHp || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  downloadCSV() {
    const csvContent = this.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pendataan_Pasar_Mukti_Makmur_${this.activeSheetName.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const spreadsheetService = new SpreadsheetService();
