import { jsPDF } from 'jspdf';

class PdfService {
  constructor() {
    this.customLogoBase64 = null;
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('pasar_custom_logo_v1');
      if (saved) {
        this.customLogoBase64 = saved;
      }
    } catch (e) {}
  }

  saveCustomLogo(base64) {
    this.customLogoBase64 = base64;
    if (base64) {
      localStorage.setItem('pasar_custom_logo_v1', base64);
    } else {
      localStorage.removeItem('pasar_custom_logo_v1');
    }
  }

  /**
   * Generates a single official notice letter (Surat Pemberitahuan) matching official Cilacap template 100%
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
   * Generates multi-page batch notice letters in a single PDF file (e.g. 50-100 merchants in 1-2 seconds)
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
        jenis_pasar: kiosk.zona === 'PASAR SAYUR' ? 'Sayur' : 'Sandang',
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
   * Renders the complete, 100% exact official government layout on the current jsPDF page
   */
  renderSingleLetterPage(doc, data) {
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2); // 170mm

    // ==========================================
    // 1. KOP SURAT RESMI (HEADER)
    // ==========================================
    const logoX = margin + 2;
    const logoY = 12;
    const logoWidth = 20;
    const logoHeight = 24;

    // Draw Logo (Custom / Vector Fallback)
    let logoDrawn = false;
    if (this.customLogoBase64) {
      try {
        doc.addImage(this.customLogoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
        logoDrawn = true;
      } catch (err) {}
    }

    if (!logoDrawn) {
      this.drawVectorLogo(doc, logoX, logoY);
    }

    // Header Text (Centered)
    const headerCenterX = (margin + logoWidth + pageWidth - margin) / 2;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH KABUPATEN CILACAP', headerCenterX, 16, { align: 'center' });
    doc.text('KECAMATAN KARANGPUCUNG', headerCenterX, 21, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, 27, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, 32, { align: 'center' });
    doc.text('CILACAP', headerCenterX, 36.5, { align: 'center' });

    // Kode Pos (Right aligned under Kop)
    doc.setFontSize(9.5);
    doc.text('Kode Pos 53255', pageWidth - margin, 39, { align: 'right' });

    // Double Border Lines below Kop (Thick line on top, thin line on bottom)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, 41, pageWidth - margin, 41);
    doc.setLineWidth(0.25);
    doc.line(margin, 42, pageWidth - margin, 42);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL
    // ==========================================
    const startY = 49;
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);

    // Date (Right Column)
    doc.text(`Cilacap, ${data.tanggal_naskah || '26 Agustus 2026'}`, pageWidth - margin, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = margin + 18;
    const colVal = margin + 21;

    doc.text('Nomor', margin, startY + 4.5);
    doc.text(':', colColon, startY + 4.5);
    doc.text(data.nomor_naskah || '511.2/014/VIII/2026', colVal, startY + 4.5);

    doc.text('Sifat', margin, startY + 9.5);
    doc.text(':', colColon, startY + 9.5);
    doc.text(data.sifat || 'Biasa', colVal, startY + 9.5);

    doc.text('Lampiran', margin, startY + 14.5);
    doc.text(':', colColon, startY + 14.5);
    doc.text('-', colVal, startY + 14.5);

    doc.text('Hal', margin, startY + 19.5);
    doc.text(':', colColon, startY + 19.5);
    doc.text('Pemberitahuan Pembayaran Sewa', colVal, startY + 19.5);
    doc.text('Tahunan Pasar Mukti Makmur', colVal, startY + 24);

    // ==========================================
    // 3. TUJUAN SURAT (KEPADA YTH)
    // ==========================================
    const yTujuan = startY + 31;
    doc.text('Yth. Bapak/Ibu Penyewa Kios/Los/Lemprakan', margin, yTujuan);
    doc.text('Pasar Mukti Makmur Desa Karangpucung', margin + 7.5, yTujuan + 4.5);

    doc.text('di', margin + 7.5, yTujuan + 11.5);
    doc.text('Tempat', margin, yTujuan + 16);

    // ==========================================
    // 4. PARAGRAF PEMBUKA
    // ==========================================
    const yPembuka = yTujuan + 23;
    const openingText = 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.';
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, margin, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: 1.35 });

    const ySubText = yPembuka + 15.5;
    doc.text('Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:', margin, ySubText);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-COLUMN GRID)
    // ==========================================
    const yTabel = ySubText + 6;
    const col2X = margin + 85;

    // Row 1
    doc.setFont('times', 'normal');
    doc.text('Pasar', margin, yTabel);
    doc.text(':', margin + 36, yTabel);
    doc.setFont('times', 'bold');
    doc.text(data.jenis_pasar || 'Sandang', margin + 39, yTabel);

    doc.setFont('times', 'normal');
    doc.text('Tipe Unit', col2X, yTabel);
    doc.text(':', col2X + 25, yTabel);
    doc.setFont('times', 'bold');
    doc.text(data.tipe_kios || 'LOS', col2X + 28, yTabel);

    // Row 2
    doc.setFont('times', 'normal');
    doc.text('Ukuran', margin, yTabel + 5.5);
    doc.text(':', margin + 36, yTabel + 5.5);
    doc.setFont('times', 'bold');
    doc.text(data.luas_dimensi || '200 x 200', margin + 39, yTabel + 5.5);

    doc.setFont('times', 'normal');
    doc.text('Luas', col2X, yTabel + 5.5);
    doc.text(':', col2X + 25, yTabel + 5.5);
    doc.setFont('times', 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, col2X + 28, yTabel + 5.5);

    // Row 3
    doc.setFont('times', 'normal');
    doc.text('Kios/Los/Lemprakan', margin, yTabel + 11);
    doc.text(':', margin + 36, yTabel + 11);
    doc.setFont('times', 'bold');
    doc.text(data.blok_kios || 'Blok A1', margin + 39, yTabel + 11);

    doc.setFont('times', 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 11);
    doc.text(':', col2X + 25, yTabel + 11);
    doc.setFont('times', 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', col2X + 28, yTabel + 11);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yPembayaran = yTabel + 18;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9.8);
    const textInstruksi = 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:';
    doc.text(textInstruksi, margin, yPembayaran, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.3 });

    const yMetode = yPembayaran + 9.5;
    doc.text('1. Transfer Bank:', margin, yMetode);
    doc.text('Bank Jawa Tengah', margin + 6, yMetode + 4.5);
    doc.text('No. Rekening : 12345xxxx', margin + 6, yMetode + 9);
    doc.text('Atas Nama    : Pemerintah Desa Karangpucung', margin + 6, yMetode + 13.5);
    doc.text('(Mohon menyertakan bukti pembayaran setelah melakukan transfer)', margin + 6, yMetode + 18);

    const yTunai = yMetode + 23;
    doc.text('2. Pembayaran Tunai:', margin, yTunai);
    doc.text('Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.', margin + 6, yTunai + 4.5);

    const yPenutup = yTunai + 11;
    const penutupText = 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    doc.text(penutupText, margin, yPenutup, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.35 });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA
    // ==========================================
    const yTtd = yPenutup + 12.5;
    const ttdCenterX = pageWidth - margin - 35;

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.text('PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Name
    const yNamaTtd = yTtd + 24;
    doc.setFont('times', 'bold');
    doc.text('A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline
    const nameWidth = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5.2, { align: 'center' });
  }

  /**
   * Vector Logo Cilacap Official Colors Fallback
   */
  drawVectorLogo(doc, logoX, logoY) {
    doc.setDrawColor(20, 20, 20);
    doc.setFillColor(235, 240, 248);
    doc.roundedRect(logoX, logoY, 20, 24, 2, 2, 'FD');

    // Inner top black banner
    doc.setFillColor(15, 23, 42);
    doc.rect(logoX + 1, logoY + 1, 18, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CILACAP', logoX + 10, logoY + 4.5, { align: 'center' });

    // Shield red top
    doc.setFillColor(220, 38, 38);
    doc.rect(logoX + 2, logoY + 6.5, 16, 7.5, 'F');

    // Shield blue bottom
    doc.setFillColor(2, 132, 199);
    doc.rect(logoX + 2, logoY + 14, 16, 8, 'F');

    // Center Gold Monument/Tower
    doc.setFillColor(250, 204, 21);
    doc.rect(logoX + 8.5, logoY + 7.5, 3, 12, 'F');
  }
}

export const pdfService = new PdfService();
