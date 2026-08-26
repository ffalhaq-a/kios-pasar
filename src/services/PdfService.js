import { jsPDF } from 'jspdf';

/**
 * Pure Native High-Speed Vector PDF Generator for Pasar Mukti Makmur Karangpucung 2026
 * Generates official A4 documents in 1 second with 100% reliability and zero plugins.
 */
export class PdfService {
  /**
   * Generates a single official notice PDF
   */
  generateSingleNotice(data) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.renderNoticePage(doc, data, 1, 1);
    return doc;
  }

  /**
   * Generates a bundled multi-page PDF for a whole block (e.g. 40+ kiosks in ~1 second)
   */
  generateBatchNotice(kiosksList, globalParams, onProgress = null) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const total = kiosksList.length;

    kiosksList.forEach((kiosk, index) => {
      if (index > 0) {
        doc.addPage('a4', 'portrait');
      }

      const mergedData = {
        ...globalParams,
        ...kiosk
      };

      this.renderNoticePage(doc, mergedData, index + 1, total);

      if (onProgress) {
        onProgress(Math.round(((index + 1) / total) * 100), index + 1, total);
      }
    });

    return doc;
  }

  /**
   * Renders a single official A4 page with crisp vector elements
   */
  renderNoticePage(doc, data, pageNum = 1, totalPages = 1) {
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2); // 170mm

    // ==========================================
    // 1. KOP SURAT PEMERINTAH DESA KARANGPUCUNG
    // ==========================================
    
    // Emblem shield outline
    const logoX = margin + 2;
    const logoY = 14;
    doc.setDrawColor(30, 41, 59);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(logoX, logoY, 18, 22, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('CILACAP', logoX + 9, logoY + 12, { align: 'center' });

    // Kop Text Header (Centered)
    const headerCenterX = margin + 18 + (contentWidth - 18) / 2;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH KABUPATEN CILACAP', headerCenterX, 17, { align: 'center' });
    doc.text('KECAMATAN KARANGPUCUNG', headerCenterX, 22, { align: 'center' });

    doc.setFontSize(13);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, 28, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text('Jalan Pramuka No. 09 Tlp. 02806261727 CILACAP Kode Pos 53255', headerCenterX, 33, { align: 'center' });

    // Double Border Lines below Kop
    doc.setLineWidth(0.8);
    doc.line(margin, 36.5, pageWidth - margin, 36.5);
    doc.setLineWidth(0.2);
    doc.line(margin, 37.5, pageWidth - margin, 37.5);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL
    // ==========================================
    const startY = 44;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Left Column
    doc.text('Nomor', margin, startY);
    doc.text(':', margin + 20, startY);
    doc.setFont('times', 'bold');
    doc.text(data.nomor_naskah || '511.2/014/VIII/2026', margin + 23, startY);

    doc.setFont('times', 'normal');
    doc.text('Sifat', margin, startY + 5);
    doc.text(':', margin + 20, startY + 5);
    doc.text(data.sifat || 'Biasa', margin + 23, startY + 5);

    doc.text('Lampiran', margin, startY + 10);
    doc.text(':', margin + 20, startY + 10);
    doc.text('-', margin + 23, startY + 10);

    doc.text('Hal', margin, startY + 15);
    doc.text(':', margin + 20, startY + 15);
    doc.setFont('times', 'bold');
    doc.text('Pemberitahuan Pembayaran Sewa Tahunan', margin + 23, startY + 15);

    // Right Column (Date)
    doc.setFont('times', 'normal');
    doc.text(`Cilacap, ${data.tanggal_naskah || '26 Agustus 2026'}`, pageWidth - margin, startY, { align: 'right' });

    // ==========================================
    // 3. TUJUAN SURAT (KEPADA YTH)
    // ==========================================
    const yTujuan = startY + 24;
    doc.text('Yth. Bapak/Ibu:', margin, yTujuan);
    doc.setFont('times', 'bold');
    doc.text(data.nama_pedagang || 'Penyewa Kios', margin + 24, yTujuan);

    doc.setFont('times', 'normal');
    doc.text('Penyewa Kios/Los/Lemprakan Pasar Mukti Makmur Desa Karangpucung', margin, yTujuan + 5);
    doc.text('di Tempat', margin, yTujuan + 10);

    // ==========================================
    // 4. PARAGRAF PEMBUKA
    // ==========================================
    const yPembuka = yTujuan + 18;
    const openingText = 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.';
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, margin, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: 1.35 });

    const ySubText = yPembuka + 15;
    doc.text('Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:', margin, ySubText);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (2-KOLOM BERGARIS RAPI)
    // ==========================================
    const yTabel = ySubText + 4;
    const boxHeight = 22;

    // Draw clean outer table box
    doc.setDrawColor(180, 185, 195);
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(margin, yTabel, contentWidth, boxHeight, 1, 1, 'FD');

    // Horizontal separator lines inside box
    doc.line(margin, yTabel + 7.3, pageWidth - margin, yTabel + 7.3);
    doc.line(margin, yTabel + 14.6, pageWidth - margin, yTabel + 14.6);

    // Vertical divider line in the middle
    const midX = margin + (contentWidth / 2);
    doc.line(midX, yTabel, midX, yTabel + boxHeight);

    // Row 1
    // Left Col: Pasar
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Pasar', margin + 3, yTabel + 5.2);
    doc.text(':', margin + 38, yTabel + 5.2);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.jenis_pasar || 'Sandang', margin + 41, yTabel + 5.2);

    // Right Col: Tipe Unit
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Tipe Unit', midX + 3, yTabel + 5.2);
    doc.text(':', midX + 30, yTabel + 5.2);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.tipe_kios || 'LOS', midX + 33, yTabel + 5.2);

    // Row 2
    // Left Col: Ukuran
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Ukuran', margin + 3, yTabel + 12.5);
    doc.text(':', margin + 38, yTabel + 12.5);
    doc.setTextColor(0, 0, 0);
    doc.text(data.luas_dimensi || '200 x 200', margin + 41, yTabel + 12.5);

    // Right Col: Luas
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Luas', midX + 3, yTabel + 12.5);
    doc.text(':', midX + 30, yTabel + 12.5);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${data.luas_m2 || '4.0'} m²`, midX + 33, yTabel + 12.5);

    // Row 3
    // Left Col: Kios/Los/Lemprakan
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Kios/Los/Lemprakan', margin + 3, yTabel + 19.8);
    doc.text(':', margin + 38, yTabel + 19.8);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.blok_kios || 'Blok A1', margin + 41, yTabel + 19.8);

    // Right Col: Biaya Sewa
    doc.setFont('times', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text('Biaya Sewa', midX + 3, yTabel + 19.8);
    doc.text(':', midX + 30, yTabel + 19.8);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', midX + 33, yTabel + 19.8);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yAfterTable = yTabel + boxHeight + 4;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 s.d. selambat-lambatnya 7 September 2026 melalui:', margin, yAfterTable, { maxWidth: contentWidth, align: 'justify' });

    doc.text('1. Transfer Bank  : Bank Jateng (No. Rek: 12345xxxx a.n Pemerintah Desa Karangpucung)', margin + 3, yAfterTable + 7);
    doc.text('2. Tunai               : Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.', margin + 3, yAfterTable + 12);

    doc.text('Demikian surat pemberitahuan ini kami sampaikan, atas perhatian dan kerja samanya kami ucapkan terima kasih.', margin, yAfterTable + 19, { maxWidth: contentWidth, align: 'justify' });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA
    // ==========================================
    const yTtd = yAfterTable + 27;
    const ttdCenterX = pageWidth - margin - 35;

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Name
    doc.text('A. ANJARNINGSIH, S.E.', ttdCenterX, yTtd + 22, { align: 'center' });
    
    // Underline name
    const nameWidth = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yTtd + 23, ttdCenterX + (nameWidth / 2), yTtd + 23);

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('NIP. 19790507 2003 12 2 006', ttdCenterX, yTtd + 27, { align: 'center' });
  }
}

export const pdfService = new PdfService();
