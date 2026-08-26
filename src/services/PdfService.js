import { jsPDF } from 'jspdf';

const STORAGE_KEY = 'pasar_pdf_settings_2026';

const DEFAULT_SETTINGS = {
  logoBase64: null,
  logoAspectRatio: 0.833, // Default 20/24 ~ 0.833
  lockAspect: true,
  logoX: 22,
  logoY: 12,
  logoWidth: 20,
  logoHeight: 24,
  margin: 20,
  fontFamily: 'times',      // 'times' | 'helvetica' | 'courier'
  bodyFontSize: 9.5,        // points
  headerFontSize: 13.5,     // points
  lineSpacing: 1.35         // line height multiplier
};

/**
 * Official PDF Generator Engine for Pasar Mukti Makmur Karangpucung 2026
 * Supports full typography customization (Font Family, Font Size, Line Spacing) and Logo controls.
 */
export class PdfService {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Failed to load PDF settings from localStorage', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (err) {
      console.error('Failed to save PDF settings to localStorage', err);
    }
    return this.settings;
  }

  resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
    return this.settings;
  }

  getSettings() {
    return { ...this.settings };
  }

  /**
   * Generates a single official notice PDF
   */
  generateSingleNotice(data) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.renderNoticePage(doc, data);
    return doc;
  }

  /**
   * Generates a bundled multi-page PDF for a whole block in ~1 second
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

      this.renderNoticePage(doc, mergedData);

      if (onProgress) {
        onProgress(Math.round(((index + 1) / total) * 100), index + 1, total);
      }
    });

    return doc;
  }

  /**
   * Renders exact 1-to-1 match of Google Docs template on A4 page with dynamic typography
   */
  renderNoticePage(doc, data) {
    const cfg = this.settings;
    const pageWidth = 210;
    const margin = Number(cfg.margin) || 20;
    const contentWidth = pageWidth - (margin * 2); // 170mm default

    const font = cfg.fontFamily || 'times';
    const bodyFs = Number(cfg.bodyFontSize) || 9.5;
    const headerFs = Number(cfg.headerFontSize) || 13.5;
    const lineSpacing = Number(cfg.lineSpacing) || 1.35;

    // ==========================================
    // 1. KOP SURAT RESMI (DENGAN LOGO CILACAP)
    // ==========================================
    
    const logoX = Number(cfg.logoX) || 22;
    const logoY = Number(cfg.logoY) || 12;
    let logoWidth = Number(cfg.logoWidth) || 20;
    let logoHeight = Number(cfg.logoHeight) || 24;

    // Ensure maximum safe height
    const maxSafeHeight = 27;
    if (logoHeight > maxSafeHeight) {
      if (cfg.lockAspect && cfg.logoAspectRatio) {
        logoWidth = maxSafeHeight * cfg.logoAspectRatio;
      }
      logoHeight = maxSafeHeight;
    }

    if (cfg.logoBase64) {
      try {
        doc.addImage(cfg.logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (err) {
        this.drawVectorLogo(doc, logoX, logoY, logoWidth, logoHeight);
      }
    } else {
      this.drawVectorLogo(doc, logoX, logoY, logoWidth, logoHeight);
    }

    // Kop Text Header (Centered)
    const headerLeftBound = logoX + logoWidth + 2;
    const headerCenterX = headerLeftBound + (pageWidth - margin - headerLeftBound) / 2;

    doc.setFont(font, 'bold');
    doc.setFontSize(headerFs - 2);
    doc.setTextColor(0, 0, 0);
    doc.text('PEMERINTAH KABUPATEN CILACAP', headerCenterX, 15, { align: 'center' });
    doc.text('KECAMATAN KARANGPUCUNG', headerCenterX, 20, { align: 'center' });

    doc.setFontSize(headerFs);
    doc.text('PEMERINTAH DESA KARANGPUCUNG', headerCenterX, 26, { align: 'center' });

    doc.setFont(font, 'normal');
    doc.setFontSize(bodyFs);
    doc.text('Jalan Pramuka No. 09 Tlp. 02806261727', headerCenterX, 31, { align: 'center' });
    doc.text('CILACAP', headerCenterX, 35.5, { align: 'center' });

    // Kode Pos (Right aligned under Kop)
    doc.setFontSize(bodyFs);
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
    doc.setFont(font, 'normal');
    doc.setFontSize(bodyFs + 0.5);
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
    
    doc.setFont(font, 'normal');
    doc.setFontSize(bodyFs);
    const splitOpening = doc.splitTextToSize(openingText, contentWidth);
    doc.text(splitOpening, margin, yPembuka, { align: 'justify', maxWidth: contentWidth, lineHeightFactor: lineSpacing });

    const ySubText = yPembuka + 15;
    doc.text('Adapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:', margin, ySubText);

    // ==========================================
    // 5. TABEL RINCIAN TAGIHAN (TABULAR PLAIN FORMAT)
    // ==========================================
    const yTabel = ySubText + 5.5;
    const col2X = margin + 85;

    // Row 1
    doc.setFont(font, 'normal');
    doc.text('Pasar', margin, yTabel);
    doc.text(':', margin + 35, yTabel);
    doc.setFont(font, 'bold');
    doc.text(data.jenis_pasar || 'Sandang', margin + 38, yTabel);

    doc.setFont(font, 'normal');
    doc.text('Tipe Unit', col2X, yTabel);
    doc.text(':', col2X + 25, yTabel);
    doc.setFont(font, 'bold');
    doc.text(data.tipe_kios || 'LOS', col2X + 28, yTabel);

    // Row 2
    doc.setFont(font, 'normal');
    doc.text('Ukuran', margin, yTabel + 5);
    doc.text(':', margin + 35, yTabel + 5);
    doc.setFont(font, 'bold');
    doc.text(data.luas_dimensi || '200 x 200', margin + 38, yTabel + 5);

    doc.setFont(font, 'normal');
    doc.text('Luas', col2X, yTabel + 5);
    doc.text(':', col2X + 25, yTabel + 5);
    doc.setFont(font, 'bold');
    doc.text(`${data.luas_m2 || '4.0'} m²`, col2X + 28, yTabel + 5);

    // Row 3
    doc.setFont(font, 'normal');
    doc.text('Kios/Los/Lemprakan', margin, yTabel + 10);
    doc.text(':', margin + 35, yTabel + 10);
    doc.setFont(font, 'bold');
    doc.text(data.blok_kios || 'Blok A1', margin + 38, yTabel + 10);

    doc.setFont(font, 'normal');
    doc.text('Biaya Sewa', col2X, yTabel + 10);
    doc.text(':', col2X + 25, yTabel + 10);
    doc.setFont(font, 'bold');
    doc.text(data.biaya_sewa || 'Rp 225.000/thn', col2X + 28, yTabel + 10);

    // ==========================================
    // 6. INSTRUKSI PEMBAYARAN & PENUTUP
    // ==========================================
    const yPembayaran = yTabel + 16.5;
    
    doc.setFont(font, 'normal');
    doc.setFontSize(bodyFs);
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
    doc.text(penutupText, margin, yPenutup, { maxWidth: contentWidth, align: 'justify', lineHeightFactor: lineSpacing });

    // ==========================================
    // 7. TANDA TANGAN KEPALA DESA
    // ==========================================
    const yTtd = yPenutup + 12;
    const ttdCenterX = pageWidth - margin - 35;

    doc.setFont(font, 'normal');
    doc.setFontSize(bodyFs + 0.5);
    doc.text('PJ. Kepala Desa Karangpucung', ttdCenterX, yTtd, { align: 'center' });

    // Signature Area
    const yNamaTtd = yTtd + 24;
    doc.setFont(font, 'bold');
    doc.text('A. ANJARNINGSIH, S.E.', ttdCenterX, yNamaTtd, { align: 'center' });
    
    // Underline
    const nameWidth = doc.getTextWidth('A. ANJARNINGSIH, S.E.');
    doc.setLineWidth(0.4);
    doc.line(ttdCenterX - (nameWidth / 2), yNamaTtd + 0.8, ttdCenterX + (nameWidth / 2), yNamaTtd + 0.8);

    doc.setFont(font, 'bold');
    doc.setFontSize(bodyFs);
    doc.text('NIP. 19790507 2003 12 2 006', ttdCenterX, yNamaTtd + 5, { align: 'center' });
  }

  /**
   * Vector Logo Cilacap Fallback
   */
  drawVectorLogo(doc, logoX, logoY, logoWidth = 20, logoHeight = 24) {
    doc.setDrawColor(20, 20, 20);
    doc.setFillColor(235, 240, 248);
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 2, 2, 'FD');

    // Inner top black banner
    doc.setFillColor(15, 23, 42);
    doc.rect(logoX + 1, logoY + 1, logoWidth - 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CILACAP', logoX + (logoWidth / 2), logoY + 4.5, { align: 'center' });

    // Inner shield colors (Yellow & Blue monument motif)
    const innerH = logoHeight - 8;
    doc.setFillColor(220, 38, 38);
    doc.rect(logoX + 2, logoY + 6.5, logoWidth - 4, innerH / 2, 'F');
    doc.setFillColor(2, 132, 199);
    doc.rect(logoX + 2, logoY + 6.5 + innerH / 2, logoWidth - 4, innerH / 2, 'F');

    // Center Monument/Tower
    doc.setFillColor(250, 204, 21);
    doc.rect(logoX + (logoWidth / 2) - 1.5, logoY + 7.5, 3, logoHeight - 12, 'F');
  }
}

export const pdfService = new PdfService();
