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
    doc.setFontSize(baseFontSize - 0.5);

    const paraBayar = settings.paragrafPembayaran || 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 14 September 2026, dengan cara sebagai berikut:';
    
    // Paragraf Pembayaran dengan Alinea Menjorok Lurus
    let curYBayar = renderParagraph(doc, paraBayar, marginLeft, yPembayaran, contentWidth, alineaIndent, 4.5);
    curYBayar += 1.5;

    // Poin 1: Transfer Bank Jateng + Catatan "BLOK A1 SANDANG"
    const rawBlokCode = (data.blok_kios || 'A1').replace(/^blok\s+/i, '').trim().toUpperCase();
    const rawPasar = (data.jenis_pasar || 'Sandang').replace(/^pasar\s+/i, '').trim().toUpperCase();
    const transferNote = `"BLOK ${rawBlokCode} ${rawPasar}"`;
    const item1Text = `Transfer Bank Jateng No Rekening 3065001968 atas nama PEMERINTAH DESA KARANGPUCUNG. Menyertakan Nomor Surat Pemberitahuan sebagai nomor referensi dan catatan ${transferNote}.`;
    curYBayar = renderNumberedItem(doc, '1.', item1Text, marginLeft, curYBayar, 6, alineaIndent, contentWidth, 4.3);

    // Poin 2: Pembayaran Tunai (Hanging Indent)
    const item2Text = 'Pembayaran Tunai datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.';
    curYBayar = renderNumberedItem(doc, '2.', item2Text, marginLeft, curYBayar, 6, alineaIndent, contentWidth, 4.3);

    // Poin 3: Dua Materai 10.000 (Hanging Indent)
    const item3Text = 'Membawa Dua Materai 10.000 dan Bukti transfer (jika melakukan pembayaran transfer) untuk tanda tangan sewa.';
    curYBayar = renderNumberedItem(doc, '3.', item3Text, marginLeft, curYBayar, 6, alineaIndent, contentWidth, 4.3);

    // Paragraf Penutup (Alinea Menjorok Lurus)
    curYBayar += 2.0;
    const penutupText = settings.paragrafPenutup || 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    const yPenutupDone = renderParagraph(doc, penutupText, marginLeft, curYBayar, contentWidth, alineaIndent, 4.6);

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
}

export const pdfService = new PdfService();
