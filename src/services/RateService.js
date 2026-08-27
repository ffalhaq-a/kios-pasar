// Default Kiosk & Market Retribution Rates
export const DEFAULT_RATES = {
  kiosKelas1: 300000,
  kiosKelas2: 250000,
  los: 225000,
  lemprakan: 215000
};

class RateService {
  constructor() {
    this.storageKey = 'pasar_tarif_settings_v1';
    this.listeners = [];
  }

  getRates() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...DEFAULT_RATES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error loading rates:', e);
    }
    return { ...DEFAULT_RATES };
  }

  saveRates(rates) {
    try {
      const clean = {
        kiosKelas1: Number(rates.kiosKelas1) || DEFAULT_RATES.kiosKelas1,
        kiosKelas2: Number(rates.kiosKelas2) || DEFAULT_RATES.kiosKelas2,
        los: Number(rates.los) || DEFAULT_RATES.los,
        lemprakan: Number(rates.lemprakan) || DEFAULT_RATES.lemprakan
      };
      localStorage.setItem(this.storageKey, JSON.stringify(clean));
      this.notify();
      return true;
    } catch (e) {
      console.error('Error saving rates:', e);
      return false;
    }
  }

  resetRates() {
    localStorage.removeItem(this.storageKey);
    this.notify();
  }

  /**
   * Determine rate based on kiosk type string
   * @param {string} tipeKios - e.g. "KIOS 1", "KIOS 2", "LOS", "LEMPRAKAN"
   * @returns {number}
   */
  getRateForType(tipeKios) {
    const rates = this.getRates();
    const typeUpper = String(tipeKios || '').toUpperCase().trim();

    if (typeUpper.includes('1') || typeUpper.includes('KELAS 1') || typeUpper.includes('UTAMA')) {
      return rates.kiosKelas1;
    }
    if (typeUpper.includes('2') || typeUpper.includes('KELAS 2')) {
      return rates.kiosKelas2;
    }
    if (typeUpper.includes('LEMPRAKAN') || typeUpper.includes('LMP')) {
      return rates.lemprakan;
    }
    // Default to LOS
    return rates.los;
  }

  /**
   * Format number to Indonesian Rupiah currency string
   * @param {number} amount 
   * @returns {string} e.g. "Rp 300.000/thn"
   */
  formatRupiah(amount) {
    const num = Number(amount) || 0;
    return `Rp ${num.toLocaleString('id-ID')}/thn`;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getRates()));
  }
}

export const rateService = new RateService();
