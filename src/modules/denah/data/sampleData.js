/**
 * Infrastructure & Kiosks Dataset with Multi-layer support & Non-rectangular polygons
 */
export const initialInfrastructureData = [
  // Jalan Desa (Utama) - Latar Utama Luar
  {
    id: 'JLN-01',
    nama: 'Jalan Desa Utama (Jl. Raya Pasar)',
    layer: 'jalan_desa',
    type: 'polygon',
    points: [0, 0, 800, 0, 800, 30, 0, 30],
    color: '#334155',
    label: 'JL. RAYA DESA (UTAMA)'
  },
  // Jalan Dalam Pasar (Koridor Tengah)
  {
    id: 'JLN-02',
    nama: 'Jalan Koridor Pasar Blok A',
    layer: 'jalan_pasar',
    type: 'polygon',
    points: [30, 130, 770, 130, 770, 160, 30, 160],
    color: '#475569',
    label: 'KORIDOR UTAMA PASAR'
  },
  // Area Parkir Motor
  {
    id: 'PRK-01',
    nama: 'Area Parkir Sepeda Motor',
    layer: 'parkir',
    type: 'polygon',
    points: [550, 40, 770, 40, 770, 120, 550, 120],
    color: '#1e3a8a', // Dark blue
    label: 'PARKIR MOTOR'
  },
  // Area Parkir Mobil
  {
    id: 'PRK-02',
    nama: 'Area Parkir Mobil / Drop Zone',
    layer: 'parkir',
    type: 'polygon',
    points: [550, 180, 770, 180, 770, 280, 550, 280],
    color: '#1e40af',
    label: 'PARKIR MOBIL & BONGKAR MUAT'
  }
];

export const initialKiosData = [
  // Row A - Kios Persegi (Kotak)
  {
    id: 'K-A01',
    nama: 'Kios A-01',
    shape_type: 'rect',
    x: 40,
    y: 40,
    width: 100,
    height: 80,
    status: 'terisi',
    pedagang: 'Hj. Siti Aminah',
    kategori: 'Sembako & Kelontong',
    sewaBerakhir: '2026-12-31',
    sewaBulanan: 'Rp 1.500.000',
    qrCode: 'QR-K-A01',
    fotoKios: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'K-A02',
    nama: 'Kios A-02',
    shape_type: 'rect',
    x: 160,
    y: 40,
    width: 100,
    height: 80,
    status: 'terisi',
    pedagang: 'Bpk. Ahmad Fauzi',
    kategori: 'Daging & Ayam Segar',
    sewaBerakhir: '2027-03-15',
    sewaBulanan: 'Rp 1.800.000',
    qrCode: 'QR-K-A02',
    fotoKios: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&auto=format&fit=crop&q=60'
  },
  // K-A03: Kios Bentuk TRAPESIUM (Sudut Pojok)
  {
    id: 'K-A03',
    nama: 'Kios A-03 (Sudut Trapesium)',
    shape_type: 'polygon',
    x: 280,
    y: 40,
    points: [0, 0, 110, 0, 90, 80, 0, 80], // Polygon Trapesium
    status: 'jatuh_tempo',
    pedagang: 'Ibu Ratna Juwita',
    kategori: 'Bumbu Dapur & Sayuran',
    sewaBerakhir: '2026-08-30',
    sewaBulanan: 'Rp 1.200.000',
    qrCode: 'QR-K-A03',
    fotoKios: ''
  },
  // K-A04: Kios Bentuk SEGITIGA (Sudut Hook)
  {
    id: 'K-A04',
    nama: 'Kios A-04 (Segitiga Hook)',
    shape_type: 'polygon',
    x: 410,
    y: 40,
    points: [0, 0, 110, 0, 0, 80], // Polygon Segitiga
    status: 'kosong',
    pedagang: '-',
    kategori: 'Tersedia',
    sewaBerakhir: '-',
    sewaBulanan: 'Rp 1.400.000',
    qrCode: 'QR-K-A04',
    fotoKios: ''
  },
  // Row B
  {
    id: 'K-B01',
    nama: 'Kios B-01',
    shape_type: 'rect',
    x: 40,
    y: 180,
    width: 100,
    height: 80,
    status: 'terisi',
    pedagang: 'Warung Nasi Bu Endang',
    kategori: 'Kuliner & Makanan',
    sewaBerakhir: '2026-11-20',
    sewaBulanan: 'Rp 2.000.000',
    qrCode: 'QR-K-B01',
    fotoKios: ''
  },
  {
    id: 'K-B02',
    nama: 'Kios B-02',
    shape_type: 'rect',
    x: 160,
    y: 180,
    width: 100,
    height: 80,
    status: 'kosong',
    pedagang: '-',
    kategori: 'Tersedia',
    sewaBerakhir: '-',
    sewaBulanan: 'Rp 1.500.000',
    qrCode: 'QR-K-B02',
    fotoKios: ''
  },
  // K-B03: Kios L-Shape / Custom Polygon
  {
    id: 'K-B03',
    nama: 'Kios B-03 (Trapesium Terbalik)',
    shape_type: 'polygon',
    x: 280,
    y: 180,
    points: [20, 0, 110, 0, 110, 80, 0, 80],
    status: 'terisi',
    pedagang: 'Toko Baju Barokah',
    kategori: 'Pakaian & Tekstil',
    sewaBerakhir: '2027-01-10',
    sewaBulanan: 'Rp 1.600.000',
    qrCode: 'QR-K-B03',
    fotoKios: ''
  },
  {
    id: 'K-B04',
    nama: 'Kios B-04',
    shape_type: 'rect',
    x: 410,
    y: 180,
    width: 100,
    height: 80,
    status: 'jatuh_tempo',
    pedagang: 'Kios Plastik Pak Joko',
    kategori: 'Perlengkapan & Plastik',
    sewaBerakhir: '2026-08-28',
    sewaBulanan: 'Rp 1.300.000',
    qrCode: 'QR-K-B04',
    fotoKios: ''
  }
];
