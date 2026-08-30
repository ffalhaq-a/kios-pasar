import { jsPDF } from 'jspdf';
import { rateService } from './RateService.js';

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
 * Automatically increments the number portion in any letter number format (e.g. 400.10.2/90/2005 -> 400.10.2/91/2005)
 * @param {string} templateStr - Base letter number from user input
 * @param {number} indexOffset - Zero-based index for batch printing
 * @returns {string} - Computed sequential number
 */
export function generateSequentialNumber(templateStr, indexOffset = 0) {
  if (!templateStr || typeof templateStr !== 'string') {
    return `400.10.2/${90 + indexOffset}/2005`;
  }

  const str = templateStr.trim();

  // Pattern 1: Delimited by slashes (e.g. "400.10.2/90/2005" or "511.2/014/VIII/2026")
  const parts = str.split('/');
  for (let i = 0; i < parts.length; i++) {
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

/**
 * Helper to convert number/currency to Indonesian words (Terbilang)
 * e.g. 250000 -> "Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function angkaKeTerbilang(angka) {
  const bilangan = typeof angka === 'number' ? Math.floor(angka) : parseInt(String(angka).replace(/[^0-9]/g, ''), 10) || 0;
  if (bilangan === 0) return 'Nol Rupiah';

  const kata = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function convert(n) {
    if (n < 12) return kata[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + convert(n % 10) : '');
    if (n < 200) return 'Seratus' + (n - 100 !== 0 ? ' ' + convert(n - 100) : '');
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n - 1000 !== 0 ? ' ' + convert(n - 1000) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Milyar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    return String(n);
  }

  return convert(bilangan).trim() + ' Rupiah';
}

/**
 * Mathematical word-spacing distribution to guarantee 100% exact right-margin justification
 */
function drawJustifiedLine(doc, line, x, y, targetWidth, isLastLine = false) {
  if (!line || !line.trim()) return;
  if (isLastLine) {
    doc.text(line.trim(), x, y, { align: 'left' });
    return;
  }

  const words = line.trim().split(/\s+/);
  if (words.length <= 1) {
    doc.text(line.trim(), x, y, { align: 'left' });
    return;
  }

  const wordsWidth = words.reduce((acc, w) => acc + doc.getTextWidth(w), 0);
  const totalSpaceNeeded = targetWidth - wordsWidth;
  const spaceWidth = totalSpaceNeeded / (words.length - 1);
  const normalSpaceWidth = doc.getTextWidth(' ');

  // Guard against unnatural huge gaps
  if (spaceWidth > normalSpaceWidth * 3.5 || spaceWidth < 0) {
    doc.text(line.trim(), x, y, { align: 'left' });
    return;
  }

  let curX = x;
  for (let i = 0; i < words.length; i++) {
    doc.text(words[i], curX, y);
    curX += doc.getTextWidth(words[i]) + spaceWidth;
  }
}

/**
 * Render justified paragraph with exact first-line indent
 */
function renderParagraph(doc, text, x, y, width, indent, lineHeight = 4.8) {
  if (!text || !text.trim()) return y;

  const words = text.trim().split(/\s+/);
  let lines = [];
  let currentLine = [];
  let isFirstLine = true;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const allowedWidth = isFirstLine ? (width - indent) : width;
    const testLine = [...currentLine, word].join(' ');

    if (doc.getTextWidth(testLine) <= allowedWidth) {
      currentLine.push(word);
    } else {
      if (currentLine.length === 0) {
        lines.push({ text: word, isFirst: isFirstLine });
      } else {
        lines.push({ text: currentLine.join(' '), isFirst: isFirstLine });
        currentLine = [word];
        isFirstLine = false;
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push({ text: currentLine.join(' '), isFirst: isFirstLine });
  }

  let curY = y;
  lines.forEach((l, idx) => {
    const isLast = (idx === lines.length - 1);
    const targetW = l.isFirst ? (width - indent) : width;
    const lineX = l.isFirst ? (x + indent) : x;

    drawJustifiedLine(doc, l.text, lineX, curY, targetW, isLast);
    curY += lineHeight;
  });

  return curY;
}

/**
 * Render numbered list item with hanging indent
 */
function renderNumberedItem(doc, numStr, text, x, y, numIndent, textIndent, width, lineHeight = 4.4) {
  const numX = x + numIndent;
  const textX = x + textIndent;
  const textWidth = width - textIndent;

  doc.text(numStr, numX, y);

  const words = text.trim().split(/\s+/);
  let lines = [];
  let currentLine = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = [...currentLine, word].join(' ');

    if (doc.getTextWidth(testLine) <= textWidth) {
      currentLine.push(word);
    } else {
      if (currentLine.length === 0) {
        lines.push(word);
      } else {
        lines.push(currentLine.join(' '));
        currentLine = [word];
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  let curY = y;
  lines.forEach((lineText, idx) => {
    const isLast = (idx === lines.length - 1);
    drawJustifiedLine(doc, lineText, textX, curY, textWidth, isLast);
    curY += lineHeight;
  });

  return curY + 1.2;
}

// Official Default Template Configuration (Margin Kiri/Kanan 1.5 cm, Atas/Bawah 1 cm, Default No. 400.10.2/90/2005)
export const DEFAULT_TEMPLATE_SETTINGS = {
  // 1. KOP SURAT
  kopKabupaten: 'PEMERINTAH KABUPATEN CILACAP',
  kopKecamatan: 'KECAMATAN KARANGPUCUNG',
  kopDesa: 'PEMERINTAH DESA KARANGPUCUNG',
  kopAlamat: 'Jalan Pramuka No. 09 Tlp. 02806261727',
  kopKota: 'CILACAP',
  kopKodePos: 'Kode Pos 53255',

  // 2. METADATA & PERIHAL (DEFAULT RESMI 400.10.2/90/2005)
  defaultNoNaskah: '400.10.2/90/2005',
  defaultDateStr: '27 Agustus 2026',
  defaultSifat: 'Biasa',
  halSurat: 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur',

  // 3. PARAGRAF PEMBUKA (PERDES NO 4/2025 & NO 3/2026) & ALINEA
  paragrafPembuka: 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 4 Tahun 2025 tentang Pungutan Pasar Mukti Makmur dan Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:',
  firstLineIndent: 12.7, // mm (0.5 inch standard alinea)
  textAlign: 'justify',
  lineSpacing: 1.35,

  // 4. TABEL RINCIAN & PENJAJARAN TITIK DUA (RULER POSITIONS)
  tableColonLeft: 38,   // mm from left margin to colon
  tableCol2Offset: 95,  // mm from left margin to 2nd column
  tableColonRight: 25,  // mm from 2nd col to colon

  // 5. METODE PEMBAYARAN RESMI DESA
  paragrafPembayaran: 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 14 September 2026, dengan cara sebagai berikut:',
  bankNama: 'Bank Jateng',
  bankRekening: '3065001968',
  bankAtasNama: 'PEMERINTAH DESA KARANGPUCUNG',

  // 6. PENUTUP
  paragrafPenutup: 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.',

  // 7. TANDA TANGAN PEJABAT
  ttdJabatan: 'PJ. Kepala Desa Karangpucung',
  ttdNama: 'A. ANJARNINGSIH, S.E.',
  ttdNip: 'NIP. 19790507 2003 12 2 006',

  // 8. FORMAT & MARGIN: KIRI/KANAN 1.5 CM (15 MM), ATAS/BAWAH 1 CM (10 MM)
  fontFamily: 'times',
  fontSize: 12,
  marginTop: 10.0,   // 1 cm
  marginBottom: 10.0,// 1 cm
  marginLeft: 15.0,  // 1.5 cm
  marginRight: 15.0, // 1.5 cm

  // 9. CUSTOM LOGO
  customLogoBase64: null
};

class PdfService {
  constructor() {
    this.storageKey = 'pasar_template_settings_v10';
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
    const baseNomor = commonParams.nomor_naskah || settings.defaultNoNaskah || '400.10.2/90/2005';
    const baseTanggal = commonParams.tanggal_naskah || settings.defaultDateStr || '27 Agustus 2026';
    const baseSifat = commonParams.sifat || settings.defaultSifat || 'Biasa';

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const cleanJenisPasar = (kiosk.zona || '').toUpperCase().includes('SAYUR') || String(kiosk.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
      const cleanBlokKode = kiosk.blokKode ? (kiosk.blokKode.startsWith('Blok') ? kiosk.blokKode : `Blok ${kiosk.blokKode}`) : (kiosk.id || '-');

      // Auto-increment sequential number based on input reference (e.g. 400.10.2/90/2005 -> 400.10.2/91/2005)
      const currentSequentialNo = generateSequentialNumber(baseNomor, idx);

      const rentCalc = rateService.calculateRent(kiosk.luasM2, kiosk.tipeKios, kiosk.sewaBulanan);
      const computedRate = rentCalc.formattedTotal;

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
        biaya_sewa: computedRate
      };

      this.renderSingleLetterPage(doc, letterData);
    });

    return doc;
  }

  /**
   * Renders the complete official government layout with 1.5 cm Left/Right margins and exact justification
   */
  renderSingleLetterPage(doc, data) {
    const settings = this.getTemplateSettings();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    
    // Left/Right: 1.5 cm (15 mm), Top/Bottom: 1.0 cm (10 mm)
    const marginLeft = Number(settings.marginLeft) || 15.0;
    const marginRight = Number(settings.marginRight) || 15.0;
    const marginTop = Number(settings.marginTop) || 10.0;
    const contentWidth = pageWidth - marginLeft - marginRight; // 180 mm

    const primaryFont = settings.fontFamily || 'times';
    const baseFontSize = Number(data.fontSize || settings.fontSize) || 12;
    const alineaIndent = Number(settings.firstLineIndent) || 12.7;

    const colonLeftX = marginLeft + (Number(settings.tableColonLeft) || 38);
    const col2X = marginLeft + (Number(settings.tableCol2Offset) || 95);
    const colonRightX = col2X + (Number(settings.tableColonRight) || 25);

    // ==========================================
    // 1. KOP SURAT RESMI KEDINASAN (HEADER)
    // ==========================================
    const logoX = marginLeft + 1;
    const logoY = marginTop + 1;
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
    doc.text(settings.kopKabupaten || 'PEMERINTAH KABUPATEN CILACAP', headerCenterX, marginTop + 4.5, { align: 'center' });
    doc.text(settings.kopKecamatan || 'KECAMATAN KARANGPUCUNG', headerCenterX, marginTop + 9.5, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text(settings.kopDesa || 'PEMERINTAH DESA KARANGPUCUNG', headerCenterX, marginTop + 15.5, { align: 'center' });

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9.5);
    doc.text(settings.kopAlamat || 'Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, marginTop + 20.5, { align: 'center' });
    doc.text(settings.kopKota || 'CILACAP', headerCenterX, marginTop + 25.0, { align: 'center' });

    // Kode Pos (Right aligned under Kop at 195 mm)
    doc.setFontSize(9.5);
    doc.text(settings.kopKodePos || 'Kode Pos 53255', pageWidth - marginRight, marginTop + 28.0, { align: 'right' });

    // Double Border Lines below Kop (15 mm to 195 mm)
    const lineY = marginTop + 30.0;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, lineY + 1.0, pageWidth - marginRight, lineY + 1.0);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL
    // ==========================================
    const startY = lineY + 7.5;
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    doc.setTextColor(0, 0, 0);

    // Date (Right Column at 195 mm)
    const dateText = data.tanggal_naskah || settings.defaultDateStr || '27 Agustus 2026';
    doc.text(`Cilacap, ${dateText}`, pageWidth - marginRight, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = marginLeft + 20;
    const colVal = marginLeft + 23;

    doc.text('Nomor', marginLeft, startY + 4.5);
    doc.text(':', colColon, startY + 4.5);
    doc.text(data.nomor_naskah || settings.defaultNoNaskah || '400.10.2/90/2005', colVal, startY + 4.5);

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
    const yTujuan = startY + 31.0;
    const merchantTitle = toTitleCase(data.nama_pedagang);
    const blokName = data.blok_kios || 'Blok A1';
    const pasarName = (data.jenis_pasar || 'Sandang').startsWith('Pasar') ? data.jenis_pasar : `Pasar ${data.jenis_pasar || 'Sandang'}`;

    doc.text(`Yth. ${merchantTitle} ${blokName} ${pasarName}`, marginLeft, yTujuan);
    doc.text('di', marginLeft + 7.5, yTujuan + 5.5);
    doc.text('Tempat', marginLeft + 7.5, yTujuan + 10.5);

    // ==========================================
    // 4. PARAGRAF PEMBUKA (100% EXACT JUSTIFY & ALINEA)
    // ==========================================
    const yPembuka = yTujuan + 18.0;
    const para1 = 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 4 Tahun 2025 tentang Pungutan Pasar Mukti Makmur dan Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.';
    const para2 = 'Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:';

    let currentY = renderParagraph(doc, para1, marginLeft, yPembuka, contentWidth, alineaIndent, 4.8);
    currentY += 1.0;
    currentY = renderParagraph(doc, para2, marginLeft, currentY, contentWidth, 0, 4.8);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-COLUMN GRID WITH RULER POSITIONS)
    // ==========================================
    const yTabel = currentY + 1.5;

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
    doc.text('Ukuran', marginLeft, yTabel + 5.0);
    doc.text(':', colonLeftX, yTabel + 5.0);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.luas_dimensi || '200 x 200', colonLeftX + 3, yTabel + 5.0);

    doc.setFont(primaryFont, 'normal');
    doc.text('Luas', col2X, yTabel + 5.0);
    doc.text(':', colonRightX, yTabel + 5.0);
    doc.setFont(primaryFont, 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, colonRightX + 3, yTabel + 5.0);

    // Row 3
    doc.setFont(primaryFont, 'normal');
    doc.text('Kios/Los/Lemprakan', marginLeft, yTabel + 10.0);
    doc.text(':', colonLeftX, yTabel + 10.0);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.blok_kios || 'Blok A1', colonLeftX + 3, yTabel + 10.0);

    doc.setFont(primaryFont, 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 10.0);
    doc.text(':', colonRightX, yTabel + 10.0);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', colonRightX + 3, yTabel + 10.0);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN RESMI (ALINEA + HANGING INDENT POIN 1,2,3)
    // ==========================================
    const yPembayaran = yTabel + 16.0;
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);

    const paraBayar = settings.paragrafPembayaran || 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 14 September 2026, dengan cara sebagai berikut:';
    
    // Paragraf Pembayaran dengan Alinea Menjorok Lurus
    let curYBayar = renderParagraph(doc, paraBayar, marginLeft, yPembayaran, contentWidth, alineaIndent, 4.8);
    curYBayar += 1.5;

    // Poin 1: Transfer Bank Jateng + Catatan "BLOK A1 SANDANG" saat transfer
    const rawBlokCode = (data.blok_kios || 'A1').replace(/^blok\s+/i, '').trim().toUpperCase();
    const rawPasar = (data.jenis_pasar || 'Sandang').replace(/^pasar\s+/i, '').trim().toUpperCase();
    const transferNote = `"BLOK ${rawBlokCode} ${rawPasar}"`;
    const item1Text = `Transfer Bank Jateng No Rekening 3065001968 atas nama PEMERINTAH DESA KARANGPUCUNG, menyertakan catatan ${transferNote} saat transfer.`;
    curYBayar = renderNumberedItem(doc, '1.', item1Text, marginLeft, curYBayar, 0, 5.5, contentWidth, 4.6);

    // Poin 2: Pembayaran Tunai (Hanging Indent)
    const item2Text = 'Pembayaran Tunai datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.';
    curYBayar = renderNumberedItem(doc, '2.', item2Text, marginLeft, curYBayar, 0, 5.5, contentWidth, 4.6);

    // Poin 3: Dua Materai 10.000 (Hanging Indent)
    const item3Text = 'Membawa Dua Materai 10.000 dan Bukti transfer (jika melakukan pembayaran transfer) untuk tanda tangan sewa.';
    curYBayar = renderNumberedItem(doc, '3.', item3Text, marginLeft, curYBayar, 0, 5.5, contentWidth, 4.6);

    // Paragraf Penutup (Alinea Menjorok Lurus)
    curYBayar += 2.0;
    const penutupText = settings.paragrafPenutup || 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    const yPenutupDone = renderParagraph(doc, penutupText, marginLeft, curYBayar, contentWidth, alineaIndent, 4.8);

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA (EXTRA ENTER / SPASI VERTIKAL LEBIH LEGA)
    // ==========================================
    const yTtd = yPenutupDone + 7.5;
    const ttdCenterX = pageWidth - marginRight - 38;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    doc.text(settings.ttdJabatan || 'PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Ruang Tanda Tangan & Cap Stempel Basah (~21mm)
    const yNamaTtd = yTtd + 21;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize);
    doc.text(settings.ttdNama || 'A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline Name
    const nameWidth = doc.getTextWidth(settings.ttdNama || 'A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize - 1);
    doc.text(settings.ttdNip || 'NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5.0, { align: 'center' });
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

  /**
   * =========================================================================
   * GENERATOR SURAT PERJANJIAN SEWA KIOS (8 PASAL - 3 HALAMAN LEGA STANDAR 12PT)
   * =========================================================================
   */
  generateSuratPerjanjian(data) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    this.renderPerjanjianPages(doc, data);
    return doc;
  }

  generateBatchSuratPerjanjian(kiosksList, commonParams = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const baseNomor = commonParams.nomor_perjanjian || '      / KRPC / 2026';
    const settings = this.getTemplateSettings();

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const cleanJenisPasar = (kiosk.zona || '').toUpperCase().includes('SAYUR') || String(kiosk.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
      const cleanBlokKode = kiosk.blokKode ? (kiosk.blokKode.startsWith('Blok') ? kiosk.blokKode : `Blok ${kiosk.blokKode}`) : (kiosk.id || '-');
      const currentSequentialNo = generateSequentialNumber(baseNomor, idx);
      const rentCalc = rateService.calculateRent(kiosk.luasM2, kiosk.tipeKios, kiosk.sewaBulanan);

      const rawNumericSewa = parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000;
      const formattedSewaRupiah = new Intl.NumberFormat('id-ID').format(rawNumericSewa);
      const terbilangSewa = angkaKeTerbilang(rawNumericSewa);

      const itemData = {
        ...commonParams,
        nomor_perjanjian: currentSequentialNo,
        nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang,
        nik: kiosk.nik && kiosk.nik !== '-' ? kiosk.nik : '................................',
        jenis_pasar: cleanJenisPasar,
        blok_kios: cleanBlokKode,
        tipe_kios: kiosk.tipeKios || 'LOS',
        kategori: kiosk.kategori || 'Umum',
        luas_dimensi: kiosk.luasDimensi || '200 x 200',
        luas_m2: kiosk.luasM2 || '4.0',
        jumlah_unit: `${rentCalc.unitCount || 1} (${rentCalc.unitCount === 1 ? 'Satu' : rentCalc.unitCount === 2 ? 'Dua' : String(rentCalc.unitCount)}) Unit Usaha`,
        biaya_sewa_angka: formattedSewaRupiah,
        biaya_sewa_terbilang: terbilangSewa,
        alamat: kiosk.alamat && kiosk.alamat !== '-' ? kiosk.alamat : 'Desa Karangpucung'
      };

      this.renderPerjanjianPages(doc, itemData, idx * 3);
    });

    return doc;
  }

  renderPerjanjianPages(doc, data, pageOffset = 0) {
    const settings = this.getTemplateSettings();
    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = Number(settings.marginLeft) || 15.0;
    const marginRight = Number(settings.marginRight) || 15.0;
    const marginTop = Number(settings.marginTop) || 10.0;
    const contentWidth = pageWidth - marginLeft - marginRight; // 180 mm

    const primaryFont = data.fontFamily || settings.fontFamily || 'times';
    const baseFontSize = Number(data.fontSize || settings.fontSize) || 12;
    const alineaIndent = 12.7;

    // Helper Footer Penomoran Halaman
    const drawFooter = (pageNum) => {
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Surat Perjanjian Sewa Kios Pasar Mukti Makmur • Halaman ${pageNum} dari 3`, pageWidth / 2, pageHeight - 7.5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    // =========================================================================
    // HALAMAN 1: KOP, JUDUL, KOMPARISI PIHAK I & II, KONSIDERANS 1-4
    // =========================================================================
    const logoX = marginLeft + 1;
    const logoY = marginTop + 1;
    const logoWidth = 20;
    const logoHeight = 24;

    let logoDrawn = false;
    if (settings.customLogoBase64) {
      try {
        doc.addImage(settings.customLogoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        logoDrawn = true;
      } catch (err) {}
    }
    if (!logoDrawn) this.drawVectorLogo(doc, logoX, logoY);

    const headerCenterX = (logoX + logoWidth + (pageWidth - marginRight)) / 2;

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(12);
    doc.text(settings.kopKabupaten || 'PEMERINTAH KABUPATEN CILACAP', headerCenterX, marginTop + 4.5, { align: 'center' });
    doc.text(settings.kopKecamatan || 'KECAMATAN KARANGPUCUNG', headerCenterX, marginTop + 9.5, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text(settings.kopDesa || 'PEMERINTAH DESA KARANGPUCUNG', headerCenterX, marginTop + 15.5, { align: 'center' });

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9.5);
    doc.text(settings.kopAlamat || 'Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, marginTop + 20.5, { align: 'center' });
    doc.text(settings.kopKota || 'CILACAP', headerCenterX, marginTop + 25.0, { align: 'center' });
    doc.text(settings.kopKodePos || 'Kode Pos 53255', pageWidth - marginRight, marginTop + 28.0, { align: 'right' });

    // Double Border Lines
    const lineY = marginTop + 30.0;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, lineY + 1.0, pageWidth - marginRight, lineY + 1.0);

    // Judul & Nomor Perjanjian
    let curY = lineY + 6.5;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize + 0.5);
    doc.text('SURAT PERJANJIAN SEWA TANAH/BANGUNAN', pageWidth / 2, curY, { align: 'center' });
    doc.text('PEMERINTAH DESA KARANGPUCUNG', pageWidth / 2, curY + 5.0, { align: 'center' });

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize);
    const noPerjanjian = data.nomor_perjanjian || '      / KRPC / 2026';
    doc.text(`Nomor : ${noPerjanjian}`, pageWidth / 2, curY + 10.0, { align: 'center' });

    // Paragraf Pembuka
    curY += 16.0;
    const tglAkadText = data.tanggal_akad_lengkap || `Bahwa, Pada hari ini ${data.hari || '............'}, tanggal ${data.tanggal || '....'} Bulan ${data.bulan || '............'} Tahun 2026, Yang bertanda tangan di bawah ini:`;
    curY = renderParagraph(doc, tglAkadText, marginLeft, curY, contentWidth, 0, 4.8);
    curY += 2.0;

    // PIHAK PERTAMA
    doc.text('1.', marginLeft, curY);
    doc.text('Nama', marginLeft + 6, curY);
    doc.text(':', marginLeft + 48, curY);
    doc.setFont(primaryFont, 'bold');
    doc.text('A. ANJARNINGSIH, S.E.', marginLeft + 51, curY);

    doc.setFont(primaryFont, 'normal');
    doc.text('Jabatan', marginLeft + 6, curY + 4.8);
    doc.text(':', marginLeft + 48, curY + 4.8);
    doc.text('Pj. Kepala Desa Karangpucung', marginLeft + 51, curY + 4.8);

    doc.text('Alamat', marginLeft + 6, curY + 9.6);
    doc.text(':', marginLeft + 48, curY + 9.6);
    doc.text('Rt. 03 Rw. 08 Desa Karangpucung', marginLeft + 51, curY + 9.6);

    doc.text('No. KTP', marginLeft + 6, curY + 14.4);
    doc.text(':', marginLeft + 48, curY + 14.4);
    doc.text(data.ktp_pihak1 || '-', marginLeft + 51, curY + 14.4);

    curY = renderParagraph(doc, 'Dalam hal ini bertindak atas nama Pemerintah Desa Karangpucung yang selanjutnya disebut PIHAK PERTAMA.', marginLeft + 6, curY + 19.2, contentWidth - 6, 0, 4.6);
    curY += 2.5;

    // PIHAK KEDUA
    doc.text('2.', marginLeft, curY);
    doc.text('Nama', marginLeft + 6, curY);
    doc.text(':', marginLeft + 48, curY);
    doc.setFont(primaryFont, 'bold');
    doc.text(data.nama_pedagang || '................................', marginLeft + 51, curY);

    doc.setFont(primaryFont, 'normal');
    doc.text('No. KTP / NIK', marginLeft + 6, curY + 4.8);
    doc.text(':', marginLeft + 48, curY + 4.8);
    doc.text(data.nik || '................................', marginLeft + 51, curY + 4.8);

    doc.text('No. Kios/Los/Lemprakan', marginLeft + 6, curY + 9.6);
    doc.text(':', marginLeft + 48, curY + 9.6);
    doc.setFont(primaryFont, 'bold');
    doc.text(`${data.blok_kios || '-'} (${data.jenis_pasar || 'Sandang'})`, marginLeft + 51, curY + 9.6);

    doc.setFont(primaryFont, 'normal');
    doc.text('Jumlah Unit', marginLeft + 6, curY + 14.4);
    doc.text(':', marginLeft + 48, curY + 14.4);
    doc.text(data.jumlah_unit || '1 (Satu) Unit Usaha', marginLeft + 51, curY + 14.4);

    doc.text('Jenis Dagang / Usaha', marginLeft + 6, curY + 19.2);
    doc.text(':', marginLeft + 48, curY + 19.2);
    doc.text(data.kategori || 'Umum', marginLeft + 51, curY + 19.2);

    doc.text('Luas Kios/Los/Lemprakan', marginLeft + 6, curY + 24.0);
    doc.text(':', marginLeft + 48, curY + 24.0);
    doc.text(`${data.luas_m2 || '4.0'} m² (${data.luas_dimensi || '200 x 200'})`, marginLeft + 51, curY + 24.0);

    doc.text('Alamat', marginLeft + 6, curY + 28.8);
    doc.text(':', marginLeft + 48, curY + 28.8);
    doc.text(data.alamat || 'Desa Karangpucung', marginLeft + 51, curY + 28.8);

    curY = renderParagraph(doc, 'Dalam hal ini bertindak atas nama diri pribadi yang selanjutnya disebut PIHAK KEDUA.', marginLeft + 6, curY + 33.6, contentWidth - 6, 0, 4.6);
    curY += 3.0;

    // Konsiderans Poin 1 s/d 4
    doc.text('Para pihak menerangkan terlebih dahulu:', marginLeft, curY);
    curY += 4.8;

    const kons1 = '1. Bahwa PIHAK PERTAMA adalah yang paling berhak penuh dan pemilik sah sebidang tanah/bangunan Hak Milik yang diuraikan dalam SPPT. No. 33.01.080.003.0008.0, yang terletak di Pasar Mukti Makmur Desa Karangpucung. Dan untuk selanjutnya disebut TANAH/BANGUNAN.';
    curY = renderNumberedItem(doc, '1.', kons1.substring(3), marginLeft, curY, 0, 5.5, contentWidth, 4.5);

    const kons2 = '2. Bahwa PIHAK PERTAMA akan menyewakan TANAH/BANGUNAN tersebut di atas kepada PIHAK KEDUA dan PIHAK KEDUA benar-benar telah menyatakan persetujuannya untuk menyewa TANAH/BANGUNAN dari PIHAK PERTAMA.';
    curY = renderNumberedItem(doc, '2.', kons2.substring(3), marginLeft, curY, 0, 5.5, contentWidth, 4.5);

    const kons3 = '3. Bahwa para pihak menerangkan, bahwa PIHAK PERTAMA dengan ini menyewakan kepada PIHAK KEDUA, yang dengan ini menyewa TANAH/BANGUNAN dari PIHAK PERTAMA, yang ditanda tangani oleh kedua belah pihak dengan meterai cukup serta dilampirkan dalam perjanjian ini.';
    curY = renderNumberedItem(doc, '3.', kons3.substring(3), marginLeft, curY, 0, 5.5, contentWidth, 4.5);

    const kons4 = '4. Selanjutnya para pihak menerangkan bahwa Perjanjian Sewa TANAH/BANGUNAN ini dilangsungkan dan diterima dengan syarat-syarat ketentuan-ketentuan yang diatur dalam 8 (Delapan) pasal, seperti berikut di bawah ini :';
    curY = renderNumberedItem(doc, '4.', kons4.substring(3), marginLeft, curY, 0, 5.5, contentWidth, 4.5);

    drawFooter(1);

    // =========================================================================
    // HALAMAN 2: PASAL 1, PASAL 2, PASAL 3, PASAL 4
    // =========================================================================
    doc.addPage('a4', 'portrait');
    curY = marginTop + 6.0;

    // Header kecil Halaman 2
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    doc.text('SURAT PERJANJIAN SEWA TANAH/BANGUNAN PEMERINTAH DESA KARANGPUCUNG', pageWidth / 2, curY, { align: 'center' });
    doc.setLineWidth(0.2);
    doc.line(marginLeft, curY + 2.0, pageWidth - marginRight, curY + 2.0);

    curY += 7.5;
    doc.setFontSize(baseFontSize);

    // PASAL 1
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 1', pageWidth / 2, curY, { align: 'center' });
    doc.text('Jangka Waktu', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas1_1 = `Sewa-menyewa ini dilangsungkan dan diterima untuk jangka waktu 1 (satu) Tahun terhitung sejak tanggal (${data.tgl_mulai || '31 Agustus 2026'}) dan berakhir pada tanggal (${data.tgl_selesai || '31 Agustus 2027'}).`;
    curY = renderNumberedItem(doc, '(1)', pas1_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas1_2 = 'Setelah jangka waktu tersebut berakhir dan PIHAK KEDUA bermaksud untuk memperpanjang, maka PIHAK KEDUA harus memberitahukan kepada PIHAK PERTAMA secara tertulis, selambat-lambatnya ( 2 ) ( dua ) bulan sebelum berakhirnya perjanjian ini.';
    curY = renderNumberedItem(doc, '(2)', pas1_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas1_3 = 'Syarat-syarat serta ketentuan-ketentuan perihal perpanjangan sewa tanah tersebut akan ditentukan dalam Surat Perjanjian baru.';
    curY = renderNumberedItem(doc, '(3)', pas1_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 2
    curY += 1.5;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 2', pageWidth / 2, curY, { align: 'center' });
    doc.text('Harga Sewa dan Tahapan Pembayaran', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas2_1 = `Biaya sewa selama 1 ( satu ) tahun ditetapkan sebesar Rp ${data.biaya_sewa_angka || '250.000'},- (${data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah'}).`;
    curY = renderNumberedItem(doc, '(1)', pas2_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas2_2 = 'Pembayaran dilakukan secara tunai/ transfer dikirimkan ke rekening Bank Jateng 3065001968 an. PEMERINTAH DESA KARANGPUCUNG.';
    curY = renderNumberedItem(doc, '(2)', pas2_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas2_3 = 'Pembayaran dilakukan mulai tanggal 31 Agustus 2026 sampai dengan 14 September 2026.';
    curY = renderNumberedItem(doc, '(3)', pas2_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 3
    curY += 1.5;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 3', pageWidth / 2, curY, { align: 'center' });
    doc.text('Kewajiban Pihak Pertama', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas3_1 = 'Pihak Pertama memiliki kewajiban untuk menyerahkan Tanah/Bangunan dimaksud kepada Pihak Kedua dalam keadaan Baik.';
    curY = renderNumberedItem(doc, '(1)', pas3_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas3_2 = 'Pajak Bumi dan Bangunan atas Tanah/Bangunan dimaksud menjadi Kewajiban Pihak Pertama.';
    curY = renderNumberedItem(doc, '(2)', pas3_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas3_3 = 'Pihak Pertama menjamin kepada Pihak Kedua, bahwa Tanah/Bangunan yang disebutkan dalam perjanjian ini benar-benar milik Pihak Pertama, tidak digadaikan dengan cara apapun juga bebas dari sitaan, tidak tersangkut suatu perkara hukum dan belum pernah dijual atau dialihkan hak-haknya kepada siapapun juga.';
    curY = renderNumberedItem(doc, '(3)', pas3_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas3_4 = 'Pihak Pertama menjamin kepada Pihak Kedua selama perjanjian ini berlaku membebaskan Pihak Kedua dari segala tuntutan atau gugatan dari siapapun juga berkenaan dengan Tanah/Bangunan tersebut sebelum di sewa oleh Pihak Kedua.';
    curY = renderNumberedItem(doc, '(4)', pas3_4, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 4
    curY += 1.5;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 4', pageWidth / 2, curY, { align: 'center' });
    doc.text('Kewajiban Pihak Kedua', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas4_1 = 'Pihak Kedua memiliki kewajiban atas pemeliharaan dan menjaga Aset Desa yang menjadi Objek Sewa selama masa sewa, segala kerusakan ataupun kehilangan yang timbul selama masa sewa menjadi tanggung jawab Pihak Kedua.';
    curY = renderNumberedItem(doc, '(1)', pas4_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_2 = 'Pihak Kedua memiliki kewajiban membayar semua biaya yang timbul dalam persiapan dan pelaksanaan Kerjasama Pemanfaatan.';
    curY = renderNumberedItem(doc, '(2)', pas4_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_3 = 'Pihak Kedua dilarang menjamin/menggadaikan Tanah/Bangunan yang dimaksud dalam perjanjian ini.';
    curY = renderNumberedItem(doc, '(3)', pas4_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_4 = 'Pihak Kedua dilarang merubah bentuk, fungsi dan manfaat atas Aset Desa yang menjadi Objek Sewa dalam perjanjian ini.';
    curY = renderNumberedItem(doc, '(4)', pas4_4, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_5 = 'Pihak Kedua dilarang menyewakan kembali (sub-sewa) seluruh atau sebagian Aset Desa yang menjadi Objek Sewa dalam perjanjian ini.';
    curY = renderNumberedItem(doc, '(5)', pas4_5, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_6 = 'Apabila Pihak Kedua akan merubah dan atau menambah bangunan harus sesuai Ijin dari Pihak Pertama.';
    curY = renderNumberedItem(doc, '(6)', pas4_6, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_7 = 'Apabila Pihak Kedua diketahui menyewakan kembali (sub-sewa) wajib membayar ganti rugi kepada Pemerintah Desa sebesar 70% dari nominal sub-sewa yang diterima Pihak Kedua.';
    curY = renderNumberedItem(doc, '(7)', pas4_7, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas4_8 = 'Segala biaya retribusi dan lainnya kecuali Pajak Bumi dan Bangunan, selama masa perjanjian ini menjadi kewajiban Pihak Kedua.';
    curY = renderNumberedItem(doc, '(8)', pas4_8, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    drawFooter(2);

    // =========================================================================
    // HALAMAN 3: PASAL 5, PASAL 6, PASAL 7, PASAL 8 & TANDA TANGAN + MATERAI
    // =========================================================================
    doc.addPage('a4', 'portrait');
    curY = marginTop + 6.0;

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    doc.text('SURAT PERJANJIAN SEWA TANAH/BANGUNAN PEMERINTAH DESA KARANGPUCUNG', pageWidth / 2, curY, { align: 'center' });
    doc.setLineWidth(0.2);
    doc.line(marginLeft, curY + 2.0, pageWidth - marginRight, curY + 2.0);

    curY += 7.5;
    doc.setFontSize(baseFontSize);

    // PASAL 5
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 5', pageWidth / 2, curY, { align: 'center' });
    doc.text('Berakhirnya Perjanjian', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    curY = renderNumberedItem(doc, '(1)', 'Tujuan Perjanjian telah tercapai.', marginLeft, curY, 0, 7.5, contentWidth, 4.5);
    curY = renderNumberedItem(doc, '(2)', 'Salah satu pihak tidak melaksanakan atau melanggar ketentuan Perjanjian.', marginLeft, curY, 0, 7.5, contentWidth, 4.5);
    curY = renderNumberedItem(doc, '(3)', 'Bertentangan dengan ketentuan Peraturan Perundang-Undangan.', marginLeft, curY, 0, 7.5, contentWidth, 4.5);
    curY = renderNumberedItem(doc, '(4)', 'Terdapat hal yang merugikan kepentingan masyarakat Desa, daerah atau nasional.', marginLeft, curY, 0, 7.5, contentWidth, 4.5);
    curY = renderNumberedItem(doc, '(5)', 'Berakhirnya jangka waktu Perjanjian.', marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 6
    curY += 1.0;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 6', pageWidth / 2, curY, { align: 'center' });
    doc.text('Force Majeure', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas6_1 = 'Yang dimaksud dengan force majeure dalam Perjanjian ini adalah peristiwa yang terjadi diluar kendali Pihak Pertama dan Pihak Kedua seperti bencana alam, huru-hara, perang, kerusuhan massa, dan kebijakan Pemerintah baik pusat maupun daerah, yang mempengaruhi Tanah/Bangunan Pihak Pertama dan/atau Pihak Kedua yang dimaksud dalam perjanjian ini.';
    curY = renderNumberedItem(doc, '(1)', pas6_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas6_2 = 'Apabila Tanah/Bangunan Pihak Pertama dan/atau Pihak Kedua yang dimaksud dalam Perjanjian ini mengalami kerugian dalam bentuk apapun karena peristiwa force majeure, maka segala kerugian yang timbul akan sepenuhnya menjadi beban dan tanggung jawab masing-masing pihak.';
    curY = renderNumberedItem(doc, '(2)', pas6_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas6_3 = 'Dalam hal peristiwa force majeure tersebut di atas mengakibatkan kegiatan usaha Pihak Kedua yang dimaksud dalam perjanjian ini ditutup dan/atau tidak dapat beroperasi maka para pihak sepakat untuk mengakhiri Perjanjian ini dan untuk selanjutnya masing-masing pihak saling melepaskan haknya dan untuk tidak saling menuntut pihak lainnya.';
    curY = renderNumberedItem(doc, '(3)', pas6_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 7
    curY += 1.0;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 7', pageWidth / 2, curY, { align: 'center' });
    doc.text('Lain-Lain', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas7_1 = 'Hal-hal yang belum cukup diatur dalam perjanjian, akan diatur sebagai perjanjian tambahan (addendum) yang merupakan satu kesatuan dan bagian yang tidak terpisahkan dari Perjanjian Kerjasama Pemanfaatan ini.';
    curY = renderNumberedItem(doc, '(1)', pas7_1, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas7_2 = 'Semua perselisihan yang timbul dari atau sehubungan dengan perjanjian ini akan diupayakan diselesaikan secara kekeluargaan. Apabila dalam proses secara kekeluargaan tidak dapat menyelesaikan perselisihan yang timbul, maka para pihak sepakat untuk menempuh jalur hukum sesuai dengan hukum yang berlaku di Republik Indonesia.';
    curY = renderNumberedItem(doc, '(2)', pas7_2, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    const pas7_3 = 'Demikian Perjanjian ini dibuat dalam rangkap dua dan bermeterai cukup, masing-masing pihak memegang satu diantaranya sebagai asli dan mempunyai kekuatan hukum yang sama.';
    curY = renderNumberedItem(doc, '(3)', pas7_3, marginLeft, curY, 0, 7.5, contentWidth, 4.5);

    // PASAL 8
    curY += 1.0;
    doc.setFont(primaryFont, 'bold');
    doc.text('Pasal 8', pageWidth / 2, curY, { align: 'center' });
    doc.text('Penutup', pageWidth / 2, curY + 4.5, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    curY += 9.0;

    const pas8 = 'Demikian Perjanjian Sewa ini dibuat, setelah para pihak membaca dan memahami tanpa paksaan atau tekanan dari siapapun bersama-sama menyepakatinya dengan disaksikan oleh 2 (dua) orang saksi sesuai dengan ketentuan yang berlaku.';
    curY = renderParagraph(doc, pas8, marginLeft, curY, contentWidth, alineaIndent, 4.6);
    curY += 5.0;

    // ==========================================
    // KOLOM TANDA TANGAN PIHAK I & II + MATERAI
    // ==========================================
    const colPihak1X = marginLeft + 32;
    const colPihak2X = pageWidth - marginRight - 32;

    doc.setFont(primaryFont, 'bold');
    doc.text('PIHAK PERTAMA', colPihak1X, curY, { align: 'center' });
    doc.text('PIHAK KEDUA', colPihak2X, curY, { align: 'center' });

    // Kotak Materai 10.000 di kolom Pihak Kedua
    const materaiW = 26;
    const materaiH = 14;
    const materaiX = colPihak2X - (materaiW / 2);
    const materaiY = curY + 5.0;

    doc.setDrawColor(160, 160, 160);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.rect(materaiX, materaiY, materaiW, materaiH);
    doc.setLineDashPattern([], 0); // reset dash

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);
    doc.text('MATERAI', colPihak2X, materaiY + 5.5, { align: 'center' });
    doc.text('10.000', colPihak2X, materaiY + 10.0, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const yNamaSign = curY + 26.0;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize);

    // Nama Pihak 1 (Pj. Kades)
    doc.text('A. ANJARNINGSIH, S.E.', colPihak1X, yNamaSign, { align: 'center' });
    const p1Width = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.3);
    doc.line(colPihak1X - (p1Width / 2), yNamaSign + 0.8, colPihak1X + (p1Width / 2), yNamaSign + 0.8);
    doc.setFontSize(baseFontSize - 1.5);
    doc.text('NIP. 19790507 2003 12 2 006', colPihak1X, yNamaSign + 5.0, { align: 'center' });

    // Nama Pihak 2 (Pedagang)
    doc.setFontSize(baseFontSize);
    const namaPedagangSign = data.nama_pedagang && data.nama_pedagang !== '-' ? data.nama_pedagang.toUpperCase() : '……………………..';
    doc.text(namaPedagangSign, colPihak2X, yNamaSign, { align: 'center' });
    const p2Width = doc.getTextWidth(namaPedagangSign);
    doc.line(colPihak2X - (p2Width / 2), yNamaSign + 0.8, colPihak2X + (p2Width / 2), yNamaSign + 0.8);

    // ==========================================
    // SAKSI - SAKSI
    // ==========================================
    const ySaksi = yNamaSign + 10.0;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(baseFontSize - 0.5);
    doc.text('SAKSI - SAKSI :', marginLeft, ySaksi);

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(baseFontSize - 0.5);
    const saksi1Name = data.saksi1 || '...........................................';
    const saksi2Name = data.saksi2 || '...........................................';

    doc.text(`1.  ${saksi1Name}`, marginLeft + 5, ySaksi + 5.5);
    doc.text('(                                         )', marginLeft + 105, ySaksi + 5.5);

    doc.text(`2.  ${saksi2Name}`, marginLeft + 5, ySaksi + 11.0);
    doc.text('(                                         )', marginLeft + 105, ySaksi + 11.0);

    drawFooter(3);
  }

  /**
   * =========================================================================
   * GENERATOR KWITANSI PEMBAYARAN RESMI (LEMBAR KAS DESA)
   * =========================================================================
   */
  generateKwitansi(data) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    this.renderKwitansiPage(doc, data);
    return doc;
  }

  generateBatchKwitansi(kiosksList, commonParams = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const baseNomor = commonParams.nomor_kwitansi || 'KW/2026/001';

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const cleanJenisPasar = (kiosk.zona || '').toUpperCase().includes('SAYUR') || String(kiosk.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
      const cleanBlokKode = kiosk.blokKode ? (kiosk.blokKode.startsWith('Blok') ? kiosk.blokKode : `Blok ${kiosk.blokKode}`) : (kiosk.id || '-');
      const currentSequentialNo = generateSequentialNumber(baseNomor, idx);
      const rentCalc = rateService.calculateRent(kiosk.luasM2, kiosk.tipeKios, kiosk.sewaBulanan);

      const rawNumericSewa = parseInt(String(rentCalc.totalAnnualRent || rentCalc.formattedTotal).replace(/[^0-9]/g, ''), 10) || 250000;
      const formattedSewaRupiah = new Intl.NumberFormat('id-ID').format(rawNumericSewa);
      const terbilangSewa = angkaKeTerbilang(rawNumericSewa);

      const kwitansiData = {
        ...commonParams,
        nomor_kwitansi: currentSequentialNo,
        nama_pedagang: kiosk.pedagang === '-' ? 'Penyewa Kios' : kiosk.pedagang,
        nik: kiosk.nik || '-',
        jenis_pasar: cleanJenisPasar,
        blok_kios: cleanBlokKode,
        tipe_kios: kiosk.tipeKios || 'LOS',
        kategori: kiosk.kategori || 'Umum',
        luas_dimensi: kiosk.luasDimensi || '200 x 200',
        luas_m2: kiosk.luasM2 || '4.0',
        jumlah_unit: `${rentCalc.unitCount || 1} Unit Usaha`,
        biaya_sewa_angka: formattedSewaRupiah,
        biaya_sewa_terbilang: terbilangSewa,
        tanggal_bayar: kiosk.tglPembayaran && kiosk.tglPembayaran !== '-' ? kiosk.tglPembayaran : '31 Agustus 2026'
      };

      this.renderKwitansiPage(doc, kwitansiData);
    });

    return doc;
  }

  renderKwitansiPage(doc, data) {
    const settings = this.getTemplateSettings();
    const pageWidth = 210;
    const marginLeft = 15.0;
    const marginRight = 15.0;
    const marginTop = 12.0;
    const contentWidth = pageWidth - marginLeft - marginRight; // 180 mm

    const primaryFont = data.fontFamily || 'times';

    // Outer Decorative Border for Official Receipt
    doc.setDrawColor(6, 95, 70); // Emerald color
    doc.setLineWidth(0.8);
    doc.roundedRect(marginLeft, marginTop, contentWidth, 130, 3, 3);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft + 1.5, marginTop + 1.5, contentWidth - 3, 127);

    // KOP KWITANSI
    const logoX = marginLeft + 4;
    const logoY = marginTop + 4;
    this.drawVectorLogo(doc, logoX, logoY);

    const headerCenterX = (logoX + 22 + (pageWidth - marginRight - 4)) / 2;

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('PEMERINTAH KABUPATEN CILACAP • KECAMATAN KARANGPUCUNG', headerCenterX, marginTop + 7.5, { align: 'center' });
    doc.setFontSize(13);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, marginTop + 13.0, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(8.5);
    doc.text('PENGELOLAAN PASAR MUKTI MAKMUR DESA KARANGPUCUNG', headerCenterX, marginTop + 17.5, { align: 'center' });
    doc.text('Alamat: Jl. Pramuka No. 09 Tlp. 02806261727 Cilacap 53255', headerCenterX, marginTop + 21.5, { align: 'center' });

    // Separator Line
    doc.setDrawColor(6, 95, 70);
    doc.setLineWidth(0.6);
    doc.line(marginLeft + 4, marginTop + 24.5, pageWidth - marginRight - 4, marginTop + 24.5);

    // JUDUL KWITANSI
    let curY = marginTop + 30.5;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(13);
    doc.text('BUKTI PEMBAYARAN / KWITANSI SEWA PASAR', pageWidth / 2, curY, { align: 'center' });
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10);
    const noKwitansi = data.nomor_kwitansi || 'KW/2026/001';
    doc.text(`Nomor : ${noKwitansi}`, pageWidth / 2, curY + 4.8, { align: 'center' });

    // KWITANSI FORM FIELDS
    curY += 11.0;
    const colLabelX = marginLeft + 6;
    const colColonX = marginLeft + 42;
    const colValX = marginLeft + 45;

    // 1. Telah Diterima Dari
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10.5);
    doc.text('Telah Diterima Dari', colLabelX, curY);
    doc.text(':', colColonX, curY);
    doc.setFont(primaryFont, 'bold');
    doc.text(toTitleCase(data.nama_pedagang || 'Penyewa Kios'), colValX, curY);

    // 2. Uang Sejumlah (Terbilang Box)
    curY += 6.5;
    doc.setFont(primaryFont, 'normal');
    doc.text('Uang Sejumlah', colLabelX, curY);
    doc.text(':', colColonX, curY);

    // Terbilang italic box
    const terbilangText = `# ${data.biaya_sewa_terbilang || 'Dua Ratus Lima Puluh Ribu Rupiah'} #`;
    doc.setFont(primaryFont, 'bolditalic');
    doc.setFillColor(240, 253, 244); // light emerald background
    doc.setDrawColor(187, 247, 208);
    doc.rect(colValX - 1, curY - 3.8, contentWidth - 48, 6.5, 'FD');
    doc.setTextColor(6, 95, 70);
    doc.text(terbilangText, colValX + 1.5, curY + 0.5);
    doc.setTextColor(0, 0, 0);

    // 3. Untuk Pembayaran
    curY += 8.5;
    doc.setFont(primaryFont, 'normal');
    doc.text('Untuk Pembayaran', colLabelX, curY);
    doc.text(':', colColonX, curY);
    const bayarDesc = `Sewa Tahunan ${data.blok_kios || 'Kios'} Pasar ${data.jenis_pasar || 'Sandang'} (Luas ${data.luas_m2 || '4.0'} m² / ${data.jumlah_unit || '1 Unit'}) Periode Tahun 2026/2027.`;
    doc.text(bayarDesc, colValX, curY);

    // 4. Nominal Tagihan Box (Rp ...)
    curY += 9.5;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(12);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.rect(colLabelX, curY - 4.5, 55, 9, 'FD');
    doc.text(`Rp ${data.biaya_sewa_angka || '250.000'},-`, colLabelX + 4, curY + 1.5);

    // Status Badge LUNAS
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(22, 163, 74);
    doc.roundedRect(colLabelX + 58, curY - 4.5, 28, 9, 1.5, 1.5, 'FD');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(10.5);
    doc.text('🟢 LUNAS', colLabelX + 63, curY + 1.5);
    doc.setTextColor(0, 0, 0);

    // TANDA TANGAN PENYETOR & BENDAHARA
    const ttdPenyetorX = marginLeft + 35;
    const ttdBendaharaX = pageWidth - marginRight - 40;
    const yTtd = curY + 6.0;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9.5);
    doc.text('Penyetor / Pedagang,', ttdPenyetorX, yTtd, { align: 'center' });

    const tglKwitansi = data.tanggal_bayar || data.tanggal_naskah || '31 Agustus 2026';
    doc.text(`Karangpucung, ${tglKwitansi}`, ttdBendaharaX, yTtd - 4.0, { align: 'center' });
    doc.text('Bendahara / Pengelola Pasar,', ttdBendaharaX, yTtd, { align: 'center' });

    const yNamaTtd = yTtd + 20.0;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    const pedagangName = data.nama_pedagang && data.nama_pedagang !== '-' ? toTitleCase(data.nama_pedagang) : '( ............................ )';
    doc.text(pedagangName, ttdPenyetorX, yNamaTtd, { align: 'center' });
    doc.text('( PEMERINTAH DESA )', ttdBendaharaX, yNamaTtd, { align: 'center' });
  }
}

export const pdfService = new PdfService();
