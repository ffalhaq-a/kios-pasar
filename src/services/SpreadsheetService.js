import { initialKiosData, initialInfrastructureData } from '../modules/denah/data/sampleData.js';

/**
 * Service to manage Kiosk dataset integration with Spreadsheet / CSV format.
 */
class SpreadsheetService {
  constructor() {
    this.storageKey = 'pasar_kios_data_v2';
    this.infraKey = 'pasar_infra_data_v2';
  }

  loadKiosks() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored kiosk data:', e);
      }
    }
    return JSON.parse(JSON.stringify(initialKiosData));
  }

  loadInfrastructure() {
    const saved = localStorage.getItem(this.infraKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored infra data:', e);
      }
    }
    return JSON.parse(JSON.stringify(initialInfrastructureData));
  }

  saveKiosks(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    window._kioskData = data;
  }

  saveInfrastructure(data) {
    localStorage.setItem(this.infraKey, JSON.stringify(data));
    window._infraData = data;
  }

  /**
   * Converts current Kiosk data into CSV string format suitable for Google Sheets import.
   */
  exportToCSV(data = null) {
    const kiosks = data || this.loadKiosks();
    if (!kiosks || kiosks.length === 0) return '';

    const headers = ['ID', 'Nama Kios', 'Tipe Bentuk', 'X', 'Y', 'Status', 'Pedagang', 'Kategori', 'Sewa Berakhir', 'Biaya Sewa', 'QR Code'];
    
    const rows = kiosks.map(k => [
      `"${k.id || ''}"`,
      `"${k.nama || ''}"`,
      `"${k.shape_type || 'rect'}"`,
      k.x || 0,
      k.y || 0,
      `"${k.status || ''}"`,
      `"${k.pedagang || ''}"`,
      `"${k.kategori || ''}"`,
      `"${k.sewaBerakhir || ''}"`,
      `"${k.sewaBulanan || ''}"`,
      `"${k.qrCode || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Download CSV file directly
   */
  downloadCSV() {
    const csvContent = this.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_kios_pasar_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const spreadsheetService = new SpreadsheetService();
