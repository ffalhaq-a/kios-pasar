import { jsPDF } from 'jspdf';

// Official Default Template Configuration
export const DEFAULT_TEMPLATE_SETTINGS = {
  // 1. KOP SURAT
  kopKabupaten: 'PEMERINTAH KABUPATEN CILACAP',
  kopKecamatan: 'KECAMATAN KARANGPUCUNG',
  kopDesa: 'PEMERINTAH DESA KARANGPUCUNG',
  kopAlamat: 'Jalan Pramuka No. 09 Tlp. 02806261727',
  kopKota: 'CILACAP',
  kopKodePos: 'Kode Pos 53255',

  // 2. METADATA & PERIHAL
  defaultNoNaskah: '511.2/014/VIII/2026',
  defaultDateStr: '26 Agustus 2026',
  defaultSifat: 'Biasa',
  halSurat: 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur',
  tujuanSurat: 'Yth. Bapak/Ibu Penyewa Kios/Los/Lemprakan\nPasar Mukti Makmur Desa Karangpucung\ndi\nTempat',

  // 3. PARAGRAF PEMBUKA
  paragrafPembuka: 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:',

  // 4. METODE PEMBAYARAN
  paragrafPembayaran: 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:',
  bankNama: 'Bank Jawa Tengah',
  bankRekening: '12345xxxx',
  bankAtasNama: 'Pemerintah Desa Karangpucung',
  bankCatatan: '(Mohon menyertakan bukti pembayaran setelah melakukan transfer)',
  tunaiKeterangan: 'Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.',

  // 5. PENUTUP
  paragrafPenutup: 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.',

  // 6. TANDA TANGAN PEJABAT
  ttdJabatan: 'PJ. Kepala Desa Karangpucung',
  ttdNama: 'A. ANJARNINGSIH, S.E.',
  ttdNip: 'NIP. 19790507 2003 12 2 006',

  // 7. FORMAT & MARGIN (INCH / MM)
  fontSize: 11,
  marginTop: 19.3,   // 0.76 inch
  marginBottom: 19.3,// 0.76 inch
  marginLeft: 25.4,  // 1 inch
  marginRight: 25.4, // 1 inch

  // 8. CUSTOM LOGO
  customLogoBase64: null
};

class PdfService {
  constructor() {
    this.storageKey = 'pasar_template_settings_v1';
    this.customLogoKey = 'pasar_custom_logo_v2';
    this.loadSettings();
  }

  getTemplateSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      const customLogo = localStorage.getItem(this.customLogoKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_TEMPLATE_SETTINGS,
          ...parsed,
          customLogoBase64: customLogo || parsed.customLogoBase64 || null
        };
      }
    } catch (e) {
      console.warn('Error reading template settings, using default:', e);
    }
    const customLogo = localStorage.getItem(this.customLogoKey);
    return {
      ...DEFAULT_TEMPLATE_SETTINGS,
      customLogoBase64: customLogo || null
    };
  }

  saveTemplateSettings(settings) {
    try {
      const cleanSettings = { ...settings };
      if (cleanSettings.customLogoBase64 !== undefined) {
        if (cleanSettings.customLogoBase64) {
          localStorage.setItem(this.customLogoKey, cleanSettings.customLogoBase64);
        } else {
          localStorage.removeItem(this.customLogoKey);
        }
        delete cleanSettings.customLogoBase64;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(cleanSettings));
    } catch (e) {
      console.error('Error saving template settings:', e);
    }
  }

  resetTemplateSettings() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.customLogoKey);
  }

  saveCustomLogo(base64) {
    if (base64) {
      localStorage.setItem(this.customLogoKey, base64);
    } else {
      localStorage.removeItem(this.customLogoKey);
    }
  }

  loadSettings() {
    // initialize
    return this.getTemplateSettings();
  }

  /**
   * Generates a single official notice letter (Surat Pemberitahuan)
   * @param {Object} data 
   * @returns {jsPDF}
   */
  generateSuratPemberitahuan(data) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.renderSingleLetterPage(doc, data);
    return doc;
  }

  /**
   * Generates multi-page batch notice letters in a single PDF file
   * @param {Array<Object>} kiosksList 
   * @param {Object} commonParams 
   * @returns {jsPDF}
   */
  generateBatchSurat(kiosksList, commonParams = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const settings = this.getTemplateSettings();

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const letterData = {
        nomor_naskah: commonParams.nomor_naskah || settings.defaultNoNaskah,
        tanggal_naskah: commonParams.tanggal_naskah || settings.defaultDateStr,
        sifat: commonParams.sifat || settings.defaultSifat,
        nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang,
        jenis_pasar: (kiosk.zona || '').toUpperCase().includes('SAYUR') ? 'Sayur' : 'Sandang',
        blok_kios: kiosk.blokKode ? (kiosk.blokKode.startsWith('Blok') ? kiosk.blokKode : `Blok ${kiosk.blokKode}`) : (kiosk.id || '-'),
        tipe_kios: kiosk.tipeKios || 'LOS',
        luas_dimensi: kiosk.luasDimensi || '200 x 200',
        luas_m2: kiosk.luasM2 || '4.0',
        biaya_sewa: kiosk.sewaBulanan || 'Rp 225.000/thn',
        ...commonParams
      };

      this.renderSingleLetterPage(doc, letterData);
    });

    return doc;
  }

  /**
   * Renders the complete official government layout with customizable template settings
   */
  renderSingleLetterPage(doc, data) {
    const settings = this.getTemplateSettings();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    
    const marginLeft = Number(settings.marginLeft) || 25.4;
    const marginRight = Number(settings.marginRight) || 25.4;
    const marginTop = Number(settings.marginTop) || 19.3;
    const contentWidth = pageWidth - marginLeft - marginRight; // 159.2 mm

    const primaryFont = 'times';
    const baseFontSize = Number(settings.fontSize) || 11;

    // ==========================================
    // 1. KOP SURAT RESMI KEDINASAN (HEADER)
    // ==========================================
    const logoX = marginLeft + 1;
    const logoY = marginTop;
    const logoWidth = 20;
    const logoHeight = 24;

    let logoDrawn = false;
    if (settings.customLogoBase64) {
      try {
        doc.addImage(settings.customLogoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        logoDrawn = true;
      } catch (err) {
        console.warn('Error loading custom logo, using vector fallback:', err);
      }
    }

    if (!logoDrawn) {
      this.drawVectorLogo(doc, logoX, logoY);
    }

    const headerCenterX = (logoX + logoWidth + (pageWidth - marginRight)) / 2;

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(settings.kopKabupaten || 'PEMERINTAH KABUPATEN CILACAP', headerCenterX, marginTop + 4, { align: 'center' });
    doc.text(settings.kopKecamatan || 'KECAMATAN KARANGPUCUNG', headerCenterX, marginTop + 9, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text(settings.kopDesa || 'PEMERINTAH DESA KARANGPUCUNG', headerCenterX, marginTop + 15, { align: 'center' });

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9.5);
    doc.text(settings.kopAlamat || 'Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, marginTop + 20, { align: 'center' });
    doc.text(settings.kopKota || 'CILACAP', headerCenterX, marginTop + 24.5, { align: 'center' });

    // Kode Pos (Right aligned under Kop)
    doc.setFontSize(9.5);
    doc.text(settings.kopKodePos || 'Kode Pos 53255', pageWidth - marginRight, marginTop + 27.5, { align: 'right' });

    // Double Border Lines below Kop
    const lineY = marginTop + 29.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, lineY + 1, pageWidth - marginRight, lineY + 1);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL
    // ==========================================
    const startY = lineY + 7.5;
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    doc.setTextColor(0, 0, 0);

    // Date (Right Column)
    doc.text(`Cilacap, ${data.tanggal_naskah || settings.defaultDateStr}`, pageWidth - marginRight, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = marginLeft + 20;
    const colVal = marginLeft + 23;

    doc.text('Nomor', marginLeft, startY + 4.5);
    doc.text(':', colColon, startY + 4.5);
    doc.text(data.nomor_naskah || settings.defaultNoNaskah, colVal, startY + 4.5);

    doc.text('Sifat', marginLeft, startY + 9.5);
    doc.text(':', colColon, startY + 9.5);
    doc.text(data.sifat || settings.defaultSifat, colVal, startY + 9.5);

    doc.text('Lampiran', marginLeft, startY + 14.5);
    doc.text(':', colColon, startY + 14.5);
    doc.text('-', colVal, startY + 14.5);

    doc.text('Hal', marginLeft, startY + 19.5);
    doc.text(':', colColon, startY + 19.5);
    
    // Perihal text with multi-line wrap
    const halLines = doc.splitTextToSize(settings.halSurat || 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur', contentWidth - 45);
    doc.text(halLines, colVal, startY + 19.5);

    // ==========================================
    // 3. TUJUAN SURAT (KEPADA YTH)
    // ==========================================
    const yTujuan = startY + 32;
    doc.text('Yth. Bapak/Ibu Penyewa Kios/Los/Lemprakan', marginLeft, yTujuan);
    doc.text('Pasar Mukti Makmur Desa Karangpucung', marginLeft + 7.5, yTujuan + 5);

    doc.text('di', marginLeft + 7.5, yTujuan + 12);
    doc.text('Tempat', marginLeft, yTujuan + 17);

    // ==========================================
    // 4. PARAGRAF PEMBUKA
    // ==========================================
    const yPembuka = yTujuan + 24;
    const openingText = settings.paragrafPembuka || 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:';
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, marginLeft, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: 1.35 });

    const ySubText = yPembuka + (splitOpening.length * 5.2) + 2;

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-COLUMN GRID)
    // ==========================================
    const yTabel = ySubText + 4;
    const col2X = marginLeft + 80;

    // Row 1
    doc.setFont(primaryFont, 'normal');
    doc.text('Pasar', marginLeft, yTabel);
    doc.text(':', marginLeft + 35, yTabel);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.jenis_pasar || 'Sandang', marginLeft + 38, yTabel);

    doc.setFont(primaryFont, 'normal');
    doc.text('Tipe Unit', col2X, yTabel);
    doc.text(':', col2X + 24, yTabel);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.tipe_kios || 'LOS', col2X + 27, yTabel);

    // Row 2
    doc.setFont(primaryFont, 'normal');
    doc.text('Ukuran', marginLeft, yTabel + 5.5);
    doc.text(':', marginLeft + 35, yTabel + 5.5);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.luas_dimensi || '200 x 200', marginLeft + 38, yTabel + 5.5);

    doc.setFont(primaryFont, 'normal');
    doc.text('Luas', col2X, yTabel + 5.5);
    doc.text(':', col2X + 24, yTabel + 5.5);
    doc.setFont(primaryFont, 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, col2X + 27, yTabel + 5.5);

    // Row 3
    doc.setFont(primaryFont, 'normal');
    doc.text('Kios/Los/Lemprakan', marginLeft, yTabel + 11);
    doc.text(':', marginLeft + 35, yTabel + 11);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.blok_kios || 'Blok A1', marginLeft + 38, yTabel + 11);

    doc.setFont(primaryFont, 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 11);
    doc.text(':', col2X + 24, yTabel + 11);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', col2X + 27, yTabel + 11);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yPembayaran = yTabel + 18;
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize - 0.5);
    const textInstruksi = settings.paragrafPembayaran || 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:';
    doc.text(textInstruksi, marginLeft, yPembayaran, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.3 });

    const yMetode = yPembayaran + 10;
    doc.text('1. Transfer Bank:', marginLeft, yMetode);
    doc.text(settings.bankNama || 'Bank Jawa Tengah', marginLeft + 6, yMetode + 5);
    doc.text(`No. Rekening : ${settings.bankRekening || '12345xxxx'}`, marginLeft + 6, yMetode + 9.5);
    doc.text(`Atas Nama    : ${settings.bankAtasNama || 'Pemerintah Desa Karangpucung'}`, marginLeft + 6, yMetode + 14);
    doc.text(settings.bankCatatan || '(Mohon menyertakan bukti pembayaran setelah melakukan transfer)', marginLeft + 6, yMetode + 18.5);

    const yTunai = yMetode + 24;
    doc.text('2. Pembayaran Tunai:', marginLeft, yTunai);
    doc.text(settings.tunaiKeterangan || 'Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.', marginLeft + 6, yTunai + 5);

    const yPenutup = yTunai + 12;
    const penutupText = settings.paragrafPenutup || 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    doc.text(penutupText, marginLeft, yPenutup, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.35 });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA
    // ==========================================
    const yTtd = yPenutup + 12.5;
    const ttdCenterX = pageWidth - marginRight - 38;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    doc.text(settings.ttdJabatan || 'PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Name
    const yNamaTtd = yTtd + 24;
    doc.setFont(primaryFont, 'bold');
    doc.text(settings.ttdNama || 'A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline
    const nameWidth = doc.getTextWidth(settings.ttdNama || 'A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize - 1);
    doc.text(settings.ttdNip || 'NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5.2, { align: 'center' });
  }

  /**
   * Official Emblem Vector
   */
  drawVectorLogo(doc, logoX, logoY) {
    doc.setDrawColor(217, 119, 6);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(logoX, logoY, 20, 25, 2.5, 2.5, 'FD');

    doc.setFillColor(15, 23, 42);
    doc.rect(logoX + 1, logoY + 1, 18, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CILACAP', logoX + 10, logoY + 4.6, { align: 'center' });

    doc.setFillColor(220, 38, 38);
    doc.rect(logoX + 2, logoY + 6.5, 16, 8, 'F');

    doc.setFillColor(2, 132, 199);
    doc.rect(logoX + 2, logoY + 14.5, 16, 8.5, 'F');

    doc.setFillColor(245, 158, 11);
    doc.rect(logoX + 8.5, logoY + 8, 3, 13, 'F');

    doc.triangle(logoX + 8.5, logoY + 8, logoX + 11.5, logoY + 8, logoX + 10, logoY + 6.8, 'F');

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(logoX + 3, logoY + 18, logoX + 17, logoY + 18);
    doc.line(logoX + 4, logoY + 20.5, logoX + 16, logoY + 20.5);
  }
}

export const pdfService = new PdfService();
