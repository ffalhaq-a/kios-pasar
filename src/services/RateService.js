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
   * Determine base rate based on kiosk type string
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
   * Calculate number of business units based on area (7.5 m2 base with 1.0 m2 tolerance)
   * Formula:
   * <= 8.50 m2  -> 1 Unit Usaha
   * 8.51 - 16.00 m2 -> 2 Unit Usaha
   * 16.01 - 23.50 m2 -> 3 Unit Usaha
   * 23.51 - 31.00 m2 -> 4 Unit Usaha, etc.
   * @param {number|string} luasM2 - Area in square meters
   * @returns {number}
   */
  calculateUnitCount(luasM2) {
    const luas = parseFloat(String(luasM2).replace(/,/g, '.')) || 0;
    if (luas <= 0) return 1;

    const baseUnit = 7.5;
    const toleransi = 1.0;

    // Threshold 1 unit: <= 8.5 m2
    if (luas <= baseUnit + toleransi) {
      return 1;
    }

    // Step calculation: Math.ceil((luas - 1.0) / 7.5)
    const unit = Math.ceil((luas - toleransi) / baseUnit);
    return Math.max(1, unit);
  }

  /**
   * Calculate dynamic total annual rent for a kiosk
   * @param {number|string} luasM2 
   * @param {string} tipeKios 
   * @param {string|number|null} fallbackRateStr 
   * @returns {Object} { unitCount, baseRate, totalRent, formattedTotal, summary }
   */
  calculateRent(luasM2, tipeKios, fallbackRateStr = null) {
    const unitCount = this.calculateUnitCount(luasM2);
    let baseRate = this.getRateForType(tipeKios);

    if (!baseRate && fallbackRateStr) {
      baseRate = parseInt(String(fallbackRateStr).replace(/[^0-9]/g, '')) || 225000;
    }

    const totalRent = unitCount * baseRate;
    const formattedTotal = `Rp ${totalRent.toLocaleString('id-ID')}/thn`;
    const formattedBase = `Rp ${baseRate.toLocaleString('id-ID')}`;

    const summary = unitCount > 1 
      ? `${formattedTotal} (${unitCount} Unit Usaha @ ${formattedBase})`
      : formattedTotal;

    return {
      unitCount,
      baseRate,
      totalRent,
      formattedTotal,
      formattedBase,
      summary
    };
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
