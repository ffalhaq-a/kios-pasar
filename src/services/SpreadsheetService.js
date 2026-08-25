import { pasarMuktiMakmurData } from '../modules/denah/data/pasarMuktiMakmurData.js';
import { initialInfrastructureData } from '../modules/denah/data/sampleData.js';

class SpreadsheetService {
  constructor() {
    this.storageKey = 'pasar_mukti_makmur_master_v3';
    this.listeners = [];
  }

  /**
   * Load Unified Master Dataset (612 Units = 320 Sandang + 292 Sayur)
   */
  loadKiosks() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored master kiosk data:', e);
      }
    }

    // Merge Pasar Sandang & Pasar Sayur into one master array
    const sandangList = (pasarMuktiMakmurData.sheets['PASAR SANDANG'] || []).map(item => ({
      ...item,
      id: `SND-${item.id}`,
      blokKode: item.id,
      zona: 'PASAR SANDANG',
      tglPembayaran: item.status === 'terisi' ? '2026-01-15' : '-',
      tglHabisSewa: item.sewaBerakhir || '2026-12-31',
      statusBayar: item.status === 'terisi' ? 'lunas' : 'kosong',
      catatan: ''
    }));

    const sayurList = (pasarMuktiMakmurData.sheets['PASAR SAYUR'] || []).map(item => ({
      ...item,
      id: `SYR-${item.id}`,
      blokKode: item.id,
      zona: 'PASAR SAYUR',
      tglPembayaran: item.status === 'terisi' ? '2026-01-20' : '-',
      tglHabisSewa: item.sewaBerakhir || '2026-12-31',
      statusBayar: item.status === 'terisi' ? 'lunas' : 'kosong',
      catatan: ''
    }));

    const masterData = [...sandangList, ...sayurList];
    this.saveKiosks(masterData);
    return masterData;
  }

  loadInfrastructure() {
    return JSON.parse(JSON.stringify(initialInfrastructureData));
  }

  saveKiosks(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    window._kioskData = data;
    this.notify();
  }

  /**
   * Update single Kiosk / Merchant Record by ID
   */
  updateKios(id, updatedFields) {
    const kiosks = this.loadKiosks();
    const idx = kiosks.findIndex(k => k.id === id);
    if (idx !== -1) {
      kiosks[idx] = { ...kiosks[idx], ...updatedFields };
      this.saveKiosks(kiosks);
      return kiosks[idx];
    }
    return null;
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

    const headers = ['ID UNIK', 'ZONA PASAR', 'BLOK', 'NAMA PEDAGANG', 'NIK', 'ALAMAT', 'JENIS USAHA', 'TIPE KIOS', 'LUAS (M2)', 'BIAYA SEWA', 'TGL PEMBAYARAN', 'TGL HABIS SEWA', 'STATUS BAYAR', 'NOMOR HP', 'CATATAN'];
    
    const rows = kiosks.map(k => [
      `"${k.id || ''}"`,
      `"${k.zona || ''}"`,
      `"${k.blokKode || k.id || ''}"`,
      `"${k.pedagang === '-' ? 'KOSONG' : k.pedagang}"`,
      `"${k.nik || ''}"`,
      `"${k.alamat || ''}"`,
      `"${k.kategori || ''}"`,
      `"${k.tipeKios || ''}"`,
      `"${k.luasM2 || ''}"`,
      `"${k.sewaBulanan || ''}"`,
      `"${k.tglPembayaran || ''}"`,
      `"${k.tglHabisSewa || ''}"`,
      `"${k.statusBayar || ''}"`,
      `"${k.nomorHp || ''}"`,
      `"${k.catatan || ''}"`
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
