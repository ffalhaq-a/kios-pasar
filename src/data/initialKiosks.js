/**
 * Master Default Dataset for 610 Market Units (Pasar Mukti Makmur Karangpucung)
 * Guarantees 0ms immediate loading in Incognito mode, new devices, and offline environments.
 */

export function generateInitialKiosks() {
  const kiosks = [];

  // =========================================================================
  // 1. PASAR SANDANG (408 UNIT)
  // =========================================================================
  // Blok A: 50 Unit (Kios 1 & Kios 2)
  for (let i = 1; i <= 50; i++) {
    const isKios1 = i <= 20;
    kiosks.push({
      id: `SND-A${i}`,
      blokKode: `A${i}`,
      zona: 'PASAR SANDANG',
      pedagang: '-',
      nik: '-',
      alamat: 'Desa Karangpucung',
      kategori: 'Pakaian & Tekstil',
      tipeKios: isKios1 ? 'KIOS 1' : 'KIOS 2',
      luasDimensi: isKios1 ? '300 x 300' : '250 x 250',
      luasM2: isKios1 ? '9.0' : '6.25',
      sewaBulanan: isKios1 ? 'Rp 300.000/thn' : 'Rp 250.000/thn',
      tglPembayaran: '-',
      tglHabisSewa: '2026-12-31',
      statusBayar: 'belum_bayar',
      nomorHp: '',
      catatan: ''
    });
  }

  // Blok B: 50 Unit (Kios 2 & Los)
  for (let i = 1; i <= 50; i++) {
    const isKios = i <= 20;
    kiosks.push({
      id: `SND-B${i}`,
      blokKode: `B${i}`,
      zona: 'PASAR SANDANG',
      pedagang: '-',
      nik: '-',
      alamat: 'Desa Karangpucung',
      kategori: 'Kelontong & Sandang',
      tipeKios: isKios ? 'KIOS 2' : 'LOS',
      luasDimensi: isKios ? '250 x 250' : '200 x 200',
      luasM2: isKios ? '6.25' : '4.0',
      sewaBulanan: isKios ? 'Rp 250.000/thn' : 'Rp 225.000/thn',
      tglPembayaran: '-',
      tglHabisSewa: '2026-12-31',
      statusBayar: 'belum_bayar',
      nomorHp: '',
      catatan: ''
    });
  }

  // Blok C, D, E, F: Masing-masing 50 Unit (LOS) = 200 Unit
  const sandangLosBlocks = ['C', 'D', 'E', 'F'];
  sandangLosBlocks.forEach(block => {
    for (let i = 1; i <= 50; i++) {
      kiosks.push({
        id: `SND-${block}${i}`,
        blokKode: `${block}${i}`,
        zona: 'PASAR SANDANG',
        pedagang: '-',
        nik: '-',
        alamat: 'Desa Karangpucung',
        kategori: 'Sandang & Umum',
        tipeKios: 'LOS',
        luasDimensi: '200 x 200',
        luasM2: '4.0',
        sewaBulanan: 'Rp 225.000/thn',
        tglPembayaran: '-',
        tglHabisSewa: '2026-12-31',
        statusBayar: 'belum_bayar',
        nomorHp: '',
        catatan: ''
      });
    }
  });

  // Blok G: 50 Unit (LOS)
  for (let i = 1; i <= 50; i++) {
    kiosks.push({
      id: `SND-G${i}`,
      blokKode: `G${i}`,
      zona: 'PASAR SANDANG',
      pedagang: '-',
      nik: '-',
      alamat: 'Desa Karangpucung',
      kategori: 'Jasa & Aneka Barang',
      tipeKios: 'LOS',
      luasDimensi: '200 x 200',
      luasM2: '4.0',
      sewaBulanan: 'Rp 225.000/thn',
      tglPembayaran: '-',
      tglHabisSewa: '2026-12-31',
      statusBayar: 'belum_bayar',
      nomorHp: '',
      catatan: ''
    });
  }

  // Blok H: 58 Unit (LEMPRAKAN SANDANG)
  for (let i = 1; i <= 58; i++) {
    kiosks.push({
      id: `SND-H${i}`,
      blokKode: `H${i}`,
      zona: 'PASAR SANDANG',
      pedagang: '-',
      nik: '-',
      alamat: 'Desa Karangpucung',
      kategori: 'Lemprakan Sandang',
      tipeKios: 'LEMPRAKAN',
      luasDimensi: '150 x 200',
      luasM2: '3.0',
      sewaBulanan: 'Rp 215.000/thn',
      tglPembayaran: '-',
      tglHabisSewa: '2026-12-31',
      statusBayar: 'belum_bayar',
      nomorHp: '',
      catatan: ''
    });
  }

  // =========================================================================
  // 2. PASAR SAYUR (202 UNIT)
  // =========================================================================
  // Blok Sayur A & B: Masing-masing 40 Unit (Kios 2 & Los Sayur) = 80 Unit
  ['A', 'B'].forEach(block => {
    for (let i = 1; i <= 40; i++) {
      const isKios = i <= 10;
      kiosks.push({
        id: `SYR-${block}${i}`,
        blokKode: `${block}${i}`,
        zona: 'PASAR SAYUR',
        pedagang: '-',
        nik: '-',
        alamat: 'Desa Karangpucung',
        kategori: 'Sembako & Bumbu',
        tipeKios: isKios ? 'KIOS 2' : 'LOS',
        luasDimensi: isKios ? '250 x 250' : '200 x 200',
        luasM2: isKios ? '6.25' : '4.0',
        sewaBulanan: isKios ? 'Rp 250.000/thn' : 'Rp 225.000/thn',
        tglPembayaran: '-',
        tglHabisSewa: '2026-12-31',
        statusBayar: 'belum_bayar',
        nomorHp: '',
        catatan: ''
      });
    }
  });

  // Blok Sayur C & D: Masing-masing 40 Unit (LOS SAYUR) = 80 Unit
  ['C', 'D'].forEach(block => {
    for (let i = 1; i <= 40; i++) {
      kiosks.push({
        id: `SYR-${block}${i}`,
        blokKode: `${block}${i}`,
        zona: 'PASAR SAYUR',
        pedagang: '-',
        nik: '-',
        alamat: 'Desa Karangpucung',
        kategori: 'Sayur & Hasil Bumi',
        tipeKios: 'LOS',
        luasDimensi: '200 x 200',
        luasM2: '4.0',
        sewaBulanan: 'Rp 225.000/thn',
        tglPembayaran: '-',
        tglHabisSewa: '2026-12-31',
        statusBayar: 'belum_bayar',
        nomorHp: '',
        catatan: ''
      });
    }
  });

  // Blok Sayur E: 42 Unit (LEMPRAKAN SAYUR)
  for (let i = 1; i <= 42; i++) {
    kiosks.push({
      id: `SYR-E${i}`,
      blokKode: `E${i}`,
      zona: 'PASAR SAYUR',
      pedagang: '-',
      nik: '-',
      alamat: 'Desa Karangpucung',
      kategori: 'Lemprakan Sayuran',
      tipeKios: 'LEMPRAKAN',
      luasDimensi: '150 x 200',
      luasM2: '3.0',
      sewaBulanan: 'Rp 215.000/thn',
      tglPembayaran: '-',
      tglHabisSewa: '2026-12-31',
      statusBayar: 'belum_bayar',
      nomorHp: '',
      catatan: ''
    });
  }

  return kiosks;
}
