import { jsPDF } from 'jspdf';

// Helper to convert ALL CAPS to Title Case (Kapital huruf depan)
export function toTitleCase(str) {
  if (!str || str === '-' || str.toLowerCase() === 'penyewa kios' || str.toLowerCase() === 'lahan kosong') {
    return 'Penyewa';
  }
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

/**
 * Smart sequential letter number generator
 * Automatically increments the number portion in any letter number format (e.g. 511.2/014/VIII/2026 -> 511.2/015/VIII/2026)
 * @param {string} templateStr - Base letter number from user input
 * @param {number} indexOffset - Zero-based index for batch printing
 * @returns {string} - Computed sequential number
 */
export function generateSequentialNumber(templateStr, indexOffset = 0) {
  if (!templateStr || typeof templateStr !== 'string') {
    return `511.2/${String(1 + indexOffset).padStart(3, '0')}/VIII/2026`;
  }

  const str = templateStr.trim();

  // Pattern 1: Delimited by slashes (e.g. "511.2/014/VIII/2026" or "511.2/001/Ds.Krp/VIII/2026")
  const parts = str.split('/');
  for (let i = 0; i < parts.length; i++) {
    // Find the first part that is purely digits or starts with leading zeros
    if (/^\d+$/.test(parts[i])) {
      const rawNum = parts[i];
      const startNum = parseInt(rawNum, 10) || 1;
      const nextNum = startNum + indexOffset;
      const paddedNum = String(nextNum).padStart(rawNum.length, '0');
      
      const newParts = [...parts];
      newParts[i] = paddedNum;
      return newParts.join('/');
    }
  }

  // Pattern 2: Any sequence of digits found in string
  const match = str.match(/\d+/);
  if (match) {
    const rawNum = match[0];
    const idx = match.index;
    const startNum = parseInt(rawNum, 10) || 1;
    const nextNum = startNum + indexOffset;
    const paddedNum = String(nextNum).padStart(rawNum.length, '0');

    return str.substring(0, idx) + paddedNum + str.substring(idx + rawNum.length);
  }

  // Fallback
  return `${str}-${String(1 + indexOffset).padStart(3, '0')}`;
}

// Helper for formatted Indonesian date
export function getIndonesianDateStr(date = new Date()) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

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
  defaultDateStr: '27 Agustus 2026',
  defaultSifat: 'Biasa',
  halSurat: 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur',

  // 3. PARAGRAF PEMBUKA (PERDES NO 4/2025 & NO 3/2026) & ALINEA
  paragrafPembuka: 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 4 Tahun 2025 tentang Pungutan Pasar Mukti Makmur dan Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:',
  firstLineIndent: 12.7, // mm (0.5 inch standard alinea)
  textAlign: 'justify',  // justify | left
  lineSpacing: 1.35,

  // 4. TABEL RINCIAN & PENJAJARAN TITIK DUA (RULER POSITIONS)
  tableColonLeft: 36,   // mm from left margin to colon
  tableCol2Offset: 80,  // mm from left margin to 2nd column
  tableColonRight: 24,  // mm from 2nd col to colon

  // 5. METODE PEMBAYARAN
  paragrafPembayaran: 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:',
  bankNama: 'Bank Jawa Tengah',
  bankRekening: '12345xxxx',
  bankAtasNama: 'Pemerintah Desa Karangpucung',
  bankCatatan: '(Mohon menyertakan bukti pembayaran setelah melakukan transfer)',
  tunaiKeterangan: 'Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.',

  // 6. PENUTUP
  paragrafPenutup: 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.',

  // 7. TANDA TANGAN PEJABAT
  ttdJabatan: 'PJ. Kepala Desa Karangpucung',
  ttdNama: 'A. ANJARNINGSIH, S.E.',
  ttdNip: 'NIP. 19790507 2003 12 2 006',

  // 8. FORMAT & MARGIN (INCH / MM)
  fontFamily: 'times',
  fontSize: 11,
  marginTop: 19.3,   // 0.76 inch
  marginBottom: 19.3,// 0.76 inch
  marginLeft: 25.4,  // 1 inch
  marginRight: 25.4, // 1 inch

  // 9. CUSTOM LOGO
  customLogoBase64: null
};

class PdfService {
  constructor() {
    this.storageKey = 'pasar_template_settings_v5';
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
   * Generates multi-page batch notice letters in a single PDF file with sequential auto-increment numbering
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
    const baseNomor = commonParams.nomor_naskah || settings.defaultNoNaskah || '511.2/014/VIII/2026';
    const baseTanggal = commonParams.tanggal_naskah || settings.defaultDateStr || '27 Agustus 2026';
    const baseSifat = commonParams.sifat || settings.defaultSifat || 'Biasa';

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const cleanJenisPasar = (kiosk.zona || '').toUpperCase().includes('SAYUR') || String(kiosk.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
      const cleanBlokKode = kiosk.blokKode ? (kiosk.blokKode.startsWith('Blok') ? kiosk.blokKode : `Blok ${kiosk.blokKode}`) : (kiosk.id || '-');

      // Auto-increment sequential number based on input reference
      const currentSequentialNo = generateSequentialNumber(baseNomor, idx);

      const letterData = {
        ...commonParams,
        nomor_naskah: currentSequentialNo,
        tanggal_naskah: baseTanggal,
        sifat: baseSifat,
        nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa' : kiosk.pedagang,
        jenis_pasar: cleanJenisPasar,
        blok_kios: cleanBlokKode,
        tipe_kios: kiosk.tipeKios || 'LOS',
        luas_dimensi: kiosk.luasDimensi || '200 x 200',
        luas_m2: kiosk.luasM2 || '4.0',
        biaya_sewa: kiosk.sewaBulanan || 'Rp 225.000/thn'
      };

      this.renderSingleLetterPage(doc, letterData);
    });

    return doc;
  }

  /**
   * Renders the complete official government layout
   */
  renderSingleLetterPage(doc, data) {
    const settings = this.getTemplateSettings();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    
    const marginLeft = Number(settings.marginLeft) || 25.4;
    const marginRight = Number(settings.marginRight) || 25.4;
    const marginTop = Number(settings.marginTop) || 19.3;
    const contentWidth = pageWidth - marginLeft - marginRight; // 159.2 mm

    const primaryFont = settings.fontFamily || 'times';
    const baseFontSize = Number(settings.fontSize) || 11;
    const lineSpacingFactor = Number(settings.lineSpacing) || 1.35;
    const alignMode = settings.textAlign === 'left' ? 'left' : 'justify';
    const alineaIndent = Number(settings.firstLineIndent) || 12.7;

    const colonLeftX = marginLeft + (Number(settings.tableColonLeft) || 36);
    const col2X = marginLeft + (Number(settings.tableCol2Offset) || 80);
    const colonRightX = col2X + (Number(settings.tableColonRight) || 24);

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
    const dateText = data.tanggal_naskah || settings.defaultDateStr || '27 Agustus 2026';
    doc.text(`Cilacap, ${dateText}`, pageWidth - marginRight, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = marginLeft + 20;
    const colVal = marginLeft + 23;

    doc.text('Nomor', marginLeft, startY + 4.5);
    doc.text(':', colColon, startY + 4.5);
    doc.text(data.nomor_naskah || settings.defaultNoNaskah || '511.2/014/VIII/2026', colVal, startY + 4.5);

    doc.text('Sifat', marginLeft, startY + 9.5);
    doc.text(':', colColon, startY + 9.5);
    doc.text(data.sifat || settings.defaultSifat || 'Biasa', colVal, startY + 9.5);

    doc.text('Lampiran', marginLeft, startY + 14.5);
    doc.text(':', colColon, startY + 14.5);
    doc.text('-', colVal, startY + 14.5);

    doc.text('Hal', marginLeft, startY + 19.5);
    doc.text(':', colColon, startY + 19.5);
    
    // Perihal text with multi-line wrap
    const halLines = doc.splitTextToSize(settings.halSurat || 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur', contentWidth - 45);
    doc.text(halLines, colVal, startY + 19.5);

    // ==========================================
    // 3. TUJUAN SURAT (KEPADA YTH - TITLE CASE: Napsiyah Blok A1 Pasar Sandang)
    // ==========================================
    const yTujuan = startY + 31;
    const merchantTitle = toTitleCase(data.nama_pedagang);
    const blokName = data.blok_kios || 'Blok A1';
    const pasarName = (data.jenis_pasar || 'Sandang').startsWith('Pasar') ? data.jenis_pasar : `Pasar ${data.jenis_pasar || 'Sandang'}`;

    doc.text(`Yth. ${merchantTitle} ${blokName} ${pasarName}`, marginLeft, yTujuan);
    doc.text('di', marginLeft + 7.5, yTujuan + 5.5);
    doc.text('Tempat', marginLeft + 7.5, yTujuan + 10.5);

    // ==========================================
    // 4. PARAGRAF PEMBUKA (DENGAN PERDES NO 4/2025 & NO 3/2026 + ALINEA)
    // ==========================================
    const yPembuka = yTujuan + 19;
    const rawParagraph = (settings.paragrafPembuka || 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 4 Tahun 2025 tentang Pungutan Pasar Mukti Makmur dan Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:').split('\n');

    let currentY = yPembuka;

    rawParagraph.forEach((paraText, pIdx) => {
      if (!paraText.trim()) return;

      if (pIdx === 0 && alineaIndent > 0) {
        // First line with indent
        const firstLineIndentWidth = contentWidth - alineaIndent;
        const lines = doc.splitTextToSize(paraText, firstLineIndentWidth);

        if (lines.length > 0) {
          doc.text(lines[0], marginLeft + alineaIndent, currentY, { align: alignMode, maxWidth: firstLineIndentWidth });
          currentY += (5.2 * (lineSpacingFactor / 1.35));

          if (lines.length > 1) {
            const restLines = doc.splitTextToSize(paraText.substring(lines[0].length).trim(), contentWidth);
            doc.text(restLines, marginLeft, currentY, { align: alignMode, maxWidth: contentWidth, lineHeightFactor: lineSpacingFactor });
            currentY += (restLines.length * 5.2 * (lineSpacingFactor / 1.35));
          }
        }
      } else {
        const splitText = doc.splitTextToSize(paraText, contentWidth);
        doc.text(splitText, marginLeft, currentY, { align: alignMode, maxWidth: contentWidth, lineHeightFactor: lineSpacingFactor });
        currentY += (splitText.length * 5.2 * (lineSpacingFactor / 1.35));
      }
      currentY += 2;
    });

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-COLUMN GRID WITH RULER POSITIONS)
    // ==========================================
    const yTabel = currentY + 2;

    // Row 1
    doc.setFont(primaryFont, 'normal');
    doc.text('Pasar', marginLeft, yTabel);
    doc.text(':', colonLeftX, yTabel);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.jenis_pasar || 'Sandang', colonLeftX + 3, yTabel);

    doc.setFont(primaryFont, 'normal');
    doc.text('Tipe Unit', col2X, yTabel);
    doc.text(':', colonRightX, yTabel);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.tipe_kios || 'LOS', colonRightX + 3, yTabel);

    // Row 2
    doc.setFont(primaryFont, 'normal');
    doc.text('Ukuran', marginLeft, yTabel + 5.5);
    doc.text(':', colonLeftX, yTabel + 5.5);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.luas_dimensi || '200 x 200', colonLeftX + 3, yTabel + 5.5);

    doc.setFont(primaryFont, 'normal');
    doc.text('Luas', col2X, yTabel + 5.5);
    doc.text(':', colonRightX, yTabel + 5.5);
    doc.setFont(primaryFont, 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, colonRightX + 3, yTabel + 5.5);

    // Row 3
    doc.setFont(primaryFont, 'normal');
    doc.text('Kios/Los/Lemprakan', marginLeft, yTabel + 11);
    doc.text(':', colonLeftX, yTabel + 11);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.blok_kios || 'Blok A1', colonLeftX + 3, yTabel + 11);

    doc.setFont(primaryFont, 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 11);
    doc.text(':', colonRightX, yTabel + 11);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', colonRightX + 3, yTabel + 11);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yPembayaran = yTabel + 18;
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize - 0.5);
    const textInstruksi = settings.paragrafPembayaran || 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:';
    doc.text(textInstruksi, marginLeft, yPembayaran, { maxWidth: contentWidth, align: alignMode, lineHeightFactor: 1.3 });

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
    doc.text(penutupText, marginLeft, yPenutup, { maxWidth: contentWidth, align: alignMode, lineHeightFactor: 1.35 });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA (RUANG TTD BASAH & STEMPEL)
    // ==========================================
    const yTtd = yPenutup + 12.5;
    const ttdCenterX = pageWidth - marginRight - 38;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    doc.text(settings.ttdJabatan || 'PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Ruang Tanda Tangan & Cap Stempel Basah (~24mm)
    const yNamaTtd = yTtd + 24;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize);
    doc.text(settings.ttdNama || 'A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline Name
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
