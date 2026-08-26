import { jsPDF } from 'jspdf';

class PdfService {
  constructor() {
    this.customLogoBase64 = null;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('pasar_custom_logo_v2');
      if (saved) {
        this.customLogoBase64 = saved;
      }
    } catch (e) {}
  }

  saveCustomLogo(base64) {
    this.customLogoBase64 = base64;
    if (base64) {
      localStorage.setItem('pasar_custom_logo_v2', base64);
    } else {
      localStorage.removeItem('pasar_custom_logo_v2');
    }
  }

  /**
   * Generates a single official notice letter (Surat Pemberitahuan)
   * Exact margins: Top/Bottom 0.76 inch (19.3mm), Left/Right 1 inch (25.4mm)
   * Font: Bookman / Serif 11 pt
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

    kiosksList.forEach((kiosk, idx) => {
      if (idx > 0) {
        doc.addPage('a4', 'portrait');
      }

      const letterData = {
        nomor_naskah: commonParams.nomor_naskah || '511.2/014/VIII/2026',
        tanggal_naskah: commonParams.tanggal_naskah || '26 Agustus 2026',
        sifat: commonParams.sifat || 'Biasa',
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
   * Renders the complete official government layout with Bookman Old Style 11 pt and 0.76"/1" margins
   */
  renderSingleLetterPage(doc, data) {
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    
    // User Specified Exact Margins:
    // Left & Right: 1 inch = 25.4 mm
    // Top & Bottom: 0.76 inch = 19.3 mm
    const marginLeft = 25.4;
    const marginRight = 25.4;
    const marginTop = 19.3;
    const contentWidth = pageWidth - marginLeft - marginRight; // 159.2 mm

    // Primary Serif Font (Bookman / Times matching Word & Google Docs)
    const primaryFont = 'times';

    // ==========================================
    // 1. KOP SURAT RESMI KEDINASAN (HEADER)
    // ==========================================
    const logoX = marginLeft + 1;
    const logoY = marginTop;
    const logoWidth = 20;
    const logoHeight = 24;

    let logoDrawn = false;
    if (this.customLogoBase64) {
      try {
        doc.addImage(this.customLogoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        logoDrawn = true;
      } catch (err) {
        console.warn('Error loading custom logo, using vector fallback:', err);
      }
    }

    if (!logoDrawn) {
      this.drawVectorLogo(doc, logoX, logoY);
    }

    // Header Text (Centered between logo right and right margin)
    const headerCenterX = (logoX + logoWidth + (pageWidth - marginRight)) / 2;

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH KABUPATEN CILACAP', headerCenterX, marginTop + 4, { align: 'center' });
    doc.text('KECAMATAN KARANGPUCUNG', headerCenterX, marginTop + 9, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, marginTop + 15, { align: 'center' });

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9.5);
    doc.text('Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, marginTop + 20, { align: 'center' });
    doc.text('CILACAP', headerCenterX, marginTop + 24.5, { align: 'center' });

    // Kode Pos (Right aligned under Kop)
    doc.setFontSize(9.5);
    doc.text('Kode Pos 53255', pageWidth - marginRight, marginTop + 27.5, { align: 'right' });

    // Double Border Lines below Kop (Thick line on top, thin line on bottom)
    const lineY = marginTop + 29.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, lineY, pageWidth - marginRight, lineY);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, lineY + 1, pageWidth - marginRight, lineY + 1);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL (11 pt)
    // ==========================================
    const startY = lineY + 7.5;
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Date (Right Column)
    doc.text(`Cilacap, ${data.tanggal_naskah || '26 Agustus 2026'}`, pageWidth - marginRight, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = marginLeft + 20;
    const colVal = marginLeft + 23;

    doc.text('Nomor', marginLeft, startY + 4.5);
    doc.text(':', colColon, startY + 4.5);
    doc.text(data.nomor_naskah || '511.2/014/VIII/2026', colVal, startY + 4.5);

    doc.text('Sifat', marginLeft, startY + 9.5);
    doc.text(':', colColon, startY + 9.5);
    doc.text(data.sifat || 'Biasa', colVal, startY + 9.5);

    doc.text('Lampiran', marginLeft, startY + 14.5);
    doc.text(':', colColon, startY + 14.5);
    doc.text('-', colVal, startY + 14.5);

    doc.text('Hal', marginLeft, startY + 19.5);
    doc.text(':', colColon, startY + 19.5);
    doc.text('Pemberitahuan Pembayaran Sewa', colVal, startY + 19.5);
    doc.text('Tahunan Pasar Mukti Makmur', colVal, startY + 24.5);

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
    const openingText = 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.';
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, marginLeft, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: 1.35 });

    const ySubText = yPembuka + 16;
    doc.text('Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:', marginLeft, ySubText);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-COLUMN GRID)
    // ==========================================
    const yTabel = ySubText + 6;
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
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP (10.5 pt)
    // ==========================================
    const yPembayaran = yTabel + 18;
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10.5);
    const textInstruksi = 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:';
    doc.text(textInstruksi, marginLeft, yPembayaran, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.3 });

    const yMetode = yPembayaran + 10;
    doc.text('1. Transfer Bank:', marginLeft, yMetode);
    doc.text('Bank Jawa Tengah', marginLeft + 6, yMetode + 5);
    doc.text('No. Rekening : 12345xxxx', marginLeft + 6, yMetode + 9.5);
    doc.text('Atas Nama    : Pemerintah Desa Karangpucung', marginLeft + 6, yMetode + 14);
    doc.text('(Mohon menyertakan bukti pembayaran setelah melakukan transfer)', marginLeft + 6, yMetode + 18.5);

    const yTunai = yMetode + 24;
    doc.text('2. Pembayaran Tunai:', marginLeft, yTunai);
    doc.text('Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.', marginLeft + 6, yTunai + 5);

    const yPenutup = yTunai + 12;
    const penutupText = 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    doc.text(penutupText, marginLeft, yPenutup, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.35 });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA (11 pt)
    // ==========================================
    const yTtd = yPenutup + 12.5;
    const ttdCenterX = pageWidth - marginRight - 38;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(11);
    doc.text('PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Name
    const yNamaTtd = yTtd + 24;
    doc.setFont(primaryFont, 'bold');
    doc.text('A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline
    const nameWidth = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(10);
    doc.text('NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5.2, { align: 'center' });
  }

  /**
   * High-Precision Official Kabupaten Cilacap Emblem Vector
   */
  drawVectorLogo(doc, logoX, logoY) {
    // Shield Outline (Outer gold border)
    doc.setDrawColor(217, 119, 6);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(logoX, logoY, 20, 25, 2.5, 2.5, 'FD');

    // Black top header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(logoX + 1, logoY + 1, 18, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CILACAP', logoX + 10, logoY + 4.6, { align: 'center' });

    // Red upper field
    doc.setFillColor(220, 38, 38);
    doc.rect(logoX + 2, logoY + 6.5, 16, 8, 'F');

    // Blue lower field (ocean motif)
    doc.setFillColor(2, 132, 199);
    doc.rect(logoX + 2, logoY + 14.5, 16, 8.5, 'F');

    // Golden Central Monument
    doc.setFillColor(245, 158, 11);
    doc.rect(logoX + 8.5, logoY + 8, 3, 13, 'F');

    // Monument top spire
    doc.triangle(logoX + 8.5, logoY + 8, logoX + 11.5, logoY + 8, logoX + 10, logoY + 6.8, 'F');

    // White wave stripes
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(logoX + 3, logoY + 18, logoX + 17, logoY + 18);
    doc.line(logoX + 4, logoY + 20.5, logoX + 16, logoY + 20.5);
  }
}

export const pdfService = new PdfService();
