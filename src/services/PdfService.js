import { jsPDF } from 'jspdf';

/**
 * Official PDF Generator Engine for Pasar Mukti Makmur Karangpucung 2026
 * Supports custom logo image (PNG/JPG/Base64) with vector fallback.
 */

// Cache for loaded logo image
let cachedLogoImage = null;

// Function to preload logo
export async function preloadLogo(url = '/assets/logo_cilacap.png') {
  if (cachedLogoImage) return cachedLogoImage;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoImage = reader.result;
        resolve(cachedLogoImage);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

export class PdfService {
  /**
   * Set custom logo base64 directly
   */
  setCustomLogo(base64Data) {
    cachedLogoImage = base64Data;
  }

  /**
   * Generates a single official notice PDF
   */
  generateSingleNotice(data, customLogo = null) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const logo = customLogo || cachedLogoImage;
    this.renderNoticePage(doc, data, logo);
    return doc;
  }

  /**
   * Generates a bundled multi-page PDF for a whole block in ~1 second
   */
  generateBatchNotice(kiosksList, globalParams, onProgress = null, customLogo = null) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const total = kiosksList.length;
    const logo = customLogo || cachedLogoImage;

    kiosksList.forEach((kiosk, index) => {
      if (index > 0) {
        doc.addPage('a4', 'portrait');
      }

      const mergedData = {
        ...globalParams,
        ...kiosk
      };

      this.renderNoticePage(doc, mergedData, logo);

      if (onProgress) {
        onProgress(Math.round(((index + 1) / total) * 100), index + 1, total);
      }
    });

    return doc;
  }

  /**
   * Renders exact 1-to-1 match of Google Docs template on A4 page
   */
  renderNoticePage(doc, data, logoImage = null) {
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2); // 170mm

    // ==========================================
    // 1. KOP SURAT RESMI (DENGAN LOGO CILACAP)
    // ==========================================
    
    // PENGATURAN POSISI & UKURAN LOGO CILACAP
    const logoX = margin + 2;      // Jarak dari tepi kiri (mm)
    const logoY = 12;              // Jarak dari tepi atas (mm)
    const logoWidth = 20;          // Lebar logo (mm)
    const logoHeight = 24;         // Tinggi logo (mm)

    if (logoImage) {
      // Jika ada file gambar PNG/JPG logo resmi
      try {
        doc.addImage(logoImage, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (err) {
        this.drawVectorLogo(doc, logoX, logoY);
      }
    } else {
      // Vector Emblem Cilacap Presisi Bawaan
      this.drawVectorLogo(doc, logoX, logoY);
    }

    // Kop Text Header (Centered)
    const headerCenterX = margin + 22 + (contentWidth - 22) / 2;

    doc.setFont('times', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH KABUPATEN CILACAP', headerCenterX, 15, { align: 'center' });
    doc.text('KECAMATAN KARANGPUCUNG', headerCenterX, 20, { align: 'center' });

    doc.setFontSize(13.5);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, 26, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, 31, { align: 'center' });
    doc.text('CILACAP', headerCenterX, 35.5, { align: 'center' });

    // Kode Pos (Right aligned under Kop)
    doc.setFontSize(9.5);
    doc.text('Kode Pos 53255', pageWidth - margin, 38.5, { align: 'right' });

    // Double Border Lines below Kop
    doc.setLineWidth(0.8);
    doc.line(margin, 40.5, pageWidth - margin, 40.5);
    doc.setLineWidth(0.2);
    doc.line(margin, 41.5, pageWidth - margin, 41.5);

    // ==========================================
    // 2. NOMOR NASKAH & TANGGAL
    // ==========================================
    const startY = 48;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Date (Right Column)
    doc.text(`Cilacap, ${data.tanggal_naskah || '26 Agustus 2026'}`, pageWidth - margin, startY, { align: 'right' });

    // Left Column Metadata
    const colColon = margin + 18;
    const colVal = margin + 21;

    doc.text('Nomor', margin, startY + 4);
    doc.text(':', colColon, startY + 4);
    doc.text(data.nomor_naskah || '511.2/014/VIII/2026', colVal, startY + 4);

    doc.text('Sifat', margin, startY + 9);
    doc.text(':', colColon, startY + 9);
    doc.text(data.sifat || 'Biasa', colVal, startY + 9);

    doc.text('Lampiran', margin, startY + 14);
    doc.text(':', colColon, startY + 14);
    doc.text('-', colVal, startY + 14);

    doc.text('Hal', margin, startY + 19);
    doc.text(':', colColon, startY + 19);
    doc.text('Pemberitahuan Pembayaran Sewa', colVal, startY + 19);
    doc.text('Tahunan Pasar Mukti Makmur', colVal, startY + 23.5);

    // ==========================================
    // 3. TUJUAN SURAT (KEPADA YTH)
    // ==========================================
    const yTujuan = startY + 30;
    doc.text('Yth. Bapak/Ibu Penyewa Kios/Los/Lemprakan', margin, yTujuan);
    doc.text('Pasar Mukti Makmur Desa Karangpucung', margin + 7.5, yTujuan + 4.5);

    doc.text('di', margin + 7.5, yTujuan + 11);
    doc.text('Tempat', margin, yTujuan + 15.5);

    // ==========================================
    // 4. PARAGRAF PEMBUKA
    // ==========================================
    const yPembuka = yTujuan + 22.5;
    const openingText = 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.';
    
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, margin, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: 1.35 });

    const ySubText = yPembuka + 15;
    doc.text('Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:', margin, ySubText);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (TABULAR PLAIN FORMAT)
    // ==========================================
    const yTabel = ySubText + 5.5;
    const col2X = margin + 85;

    // Row 1
    doc.setFont('times', 'normal');
    doc.text('Pasar', margin, yTabel);
    doc.text(':', margin + 35, yTabel);
    doc.setFont('times', 'bold');
    doc.text(data.jenis_pasar || 'Sandang', margin + 38, yTabel);

    doc.setFont('times', 'normal');
    doc.text('Tipe Unit', col2X, yTabel);
    doc.text(':', col2X + 25, yTabel);
    doc.setFont('times', 'bold');
    doc.text(data.tipe_kios || 'LOS', col2X + 28, yTabel);

    // Row 2
    doc.setFont('times', 'normal');
    doc.text('Ukuran', margin, yTabel + 5);
    doc.text(':', margin + 35, yTabel + 5);
    doc.setFont('times', 'bold');
    doc.text(data.luas_dimensi || '200 x 200', margin + 38, yTabel + 5);

    doc.setFont('times', 'normal');
    doc.text('Luas', col2X, yTabel + 5);
    doc.text(':', col2X + 25, yTabel + 5);
    doc.setFont('times', 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, col2X + 28, yTabel + 5);

    // Row 3
    doc.setFont('times', 'normal');
    doc.text('Kios/Los/Lemprakan', margin, yTabel + 10);
    doc.text(':', margin + 35, yTabel + 10);
    doc.setFont('times', 'bold');
    doc.text(data.blok_kios || 'Blok A1', margin + 38, yTabel + 10);

    doc.setFont('times', 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 10);
    doc.text(':', col2X + 25, yTabel + 10);
    doc.setFont('times', 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', col2X + 28, yTabel + 10);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yPembayaran = yTabel + 16.5;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text('Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:', margin, yPembayaran, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.3 });

    const yMetode = yPembayaran + 9;
    doc.text('1. Transfer Bank:', margin, yMetode);
    doc.text('Bank Jawa Tengah', margin + 6, yMetode + 4.5);
    doc.text('No. Rekening : 12345xxxx', margin + 6, yMetode + 9);
    doc.text('Atas Nama    : Pemerintah Desa Karangpucung', margin + 6, yMetode + 13.5);
    doc.text('(Mohon menyertakan bukti pembayaran setelah melakukan transfer)', margin + 6, yMetode + 18);

    const yTunai = yMetode + 23;
    doc.text('2. Pembayaran Tunai:', margin, yTunai);
    doc.text('Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.', margin + 6, yTunai + 4.5);

    const yPenutup = yTunai + 10.5;
    const penutupText = 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.';
    doc.text(penutupText, margin, yPenutup, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: 1.35 });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA
    // ==========================================
    const yTtd = yPenutup + 12;
    const ttdCenterX = pageWidth - margin - 35;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Area
    const yNamaTtd = yTtd + 24;
    doc.setFont('times', 'bold');
    doc.text('A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline
    const nameWidth = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5, { align: 'center' });
  }

  /**
   * Vector Logo Cilacap Fallback
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

    // Inner shield colors (Yellow & Blue monument motif)
    doc.setFillColor(220, 38, 38);
    doc.rect(logoX + 2, logoY + 6.5, 16, 7.5, 'F');
    doc.setFillColor(2, 132, 199);
    doc.rect(logoX + 2, logoY + 14, 16, 8, 'F');

    // Center Monument/Tower
    doc.setFillColor(250, 204, 21);
    doc.rect(logoX + 8.5, logoY + 7.5, 3, 12, 'F');
  }
}

export const pdfService = new PdfService();
