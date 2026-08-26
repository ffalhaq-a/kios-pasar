import { spreadsheetService } from '../../services/SpreadsheetService.js';
import { themeManager } from '../../shell/ThemeManager.js';
import { pdfService } from '../../services/PdfService.js';

export function renderSuratView(container, targetKiosId = null) {
  const isDark = themeManager.isDark();
  const kiosks = spreadsheetService.loadKiosks();

  // Helper formatting
  const getCleanBlokName = (k) => {
    if (!k) return 'Blok A1';
    let code = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '').trim();
    return `Blok ${code}`;
  };

  const getCleanJenisPasar = (k) => {
    if (!k) return 'Sandang';
    return (k.zona || '').toUpperCase().includes('SAYUR') ? 'Sayur' : 'Sandang';
  };

  // Find target kiosk if provided
  let selectedKiosk = kiosks.find(k => k.id === targetKiosId) || kiosks[0] || null;

  // Extract unique blocks for Batch Printing
  const uniqueBlocks = Array.from(
    new Set(
      kiosks.map(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        const match = rawCode.match(/^[A-Za-z]+/);
        return match ? match[0].toUpperCase() : null;
      }).filter(Boolean)
    )
  ).sort();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  // Default values
  const defaultNoNaskah = '511.2/014/VIII/2026';
  const defaultDateStr = '26 Agustus 2026';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan Retribusi Sewa</h1>
          <p class="text-xs ${textSecondary} mt-0.5">Format Bookman Old Style 11 pt • Margin Atas/Bawah 0.76" & Kiri/Kanan 1" • Instan 0.2 Detik</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Tombol Upload Logo -->
          <label class="cursor-pointer border px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="image" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Upload File Logo PNG</span>
            <input type="file" id="upload-logo-input" accept="image/png,image/jpeg" class="hidden" />
          </label>

          <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <i data-lucide="zap" class="w-3.5 h-3.5"></i>
            <span>Client-Side 0.2s</span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- KOLOM KIRI: FORMULIR SURAT SATUAN & BATCH (7 COLS) -->
        <div class="lg:col-span-7 space-y-5">
          
          <!-- CARD 1: FORMULIR CETAK SATUAN -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <i data-lucide="file-text" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Cetak Surat Perorangan (Satuan)</h3>
              </div>
              <span class="text-[11px] font-mono ${textSecondary}">${kiosks.length} Data Siap</span>
            </div>

            <!-- Pilih Kios / Pedagang -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Kios / Nama Pedagang:</label>
              <select id="kiosk-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}">
                ${kiosks.map(k => `
                  <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                    ${getCleanBlokName(k)} • ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} • ${k.zona} (${k.sewaBulanan || 'Rp 225.000/thn'})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Metadata Surat Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Nomor Naskah:</label>
                <input type="text" id="input-no-naskah" value="${defaultNoNaskah}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Tanggal Naskah:</label>
                <input type="text" id="input-tgl-naskah" value="${defaultDateStr}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Sifat Surat:</label>
                <select id="input-sifat" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}">
                  <option value="Biasa" selected>Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Segera">Segera</option>
                </select>
              </div>
            </div>

            <!-- ACTION BUTTONS SATUAN -->
            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button id="btn-generate-instant" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Download PDF Satuan (0.2s)</span>
              </button>

              <button id="btn-preview-instant" class="border px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-500"></i>
                <span>Preview Layar</span>
              </button>
            </div>
          </div>

          <!-- CARD 2: CETAK MASSAL PER BLOK (BATCH GENERATOR) -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <i data-lucide="layers" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Cetak Massal 1 Blok Sekaligus (Batch PDF)</h3>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">1 File Multi-Halaman</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Blok Target:</label>
              <div class="flex gap-2">
                <select id="batch-block-select" class="flex-1 px-3 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">
                  <option value="ALL">Semua Blok (Seluruh 610 Unit Pasar)</option>
                  ${uniqueBlocks.map(b => {
                    const count = kiosks.filter(k => {
                      const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
                      return rawCode.toUpperCase().startsWith(b);
                    }).length;
                    return `<option value="${b}">Blok ${b} (${count} Pedagang / Unit)</option>`;
                  }).join('')}
                </select>

                <button id="btn-batch-generate" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all shrink-0">
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>Cetak Massal</span>
                </button>
              </div>
              <p class="text-[11px] ${textSecondary}">Menghasilkan 1 file PDF yang memuat seluruh surat pedagang di blok terpilih secara berurutan dan siap langsung diprint.</p>
            </div>
          </div>

          <!-- NOTIFIKASI STATUS -->
          <div id="status-alert-box" class="hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
            <div class="flex items-center gap-2">
              <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
              <span id="status-alert-text">Surat PDF berhasil diterbitkan instan!</span>
            </div>
          </div>

        </div>

        <!-- KOLOM KANAN: LIVE PREVIEW DOKUMEN (5 COLS) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="${cardBg} border rounded-2xl p-5 space-y-3 sticky top-4">
            <div class="flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <i data-lucide="file-check" class="w-4 h-4 text-emerald-500"></i>
                <h3 class="text-xs font-bold ${textPrimary}">Ringkasan Surat Terpilih</h3>
              </div>
              <span id="preview-badge-blok" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                ${selectedKiosk ? getCleanBlokName(selectedKiosk) : 'Blok A1'}
              </span>
            </div>

            <!-- Mini Spec Sheet -->
            <div class="text-xs space-y-2 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}">
              <div class="flex justify-between py-1 border-b border-slate-800/40">
                <span class="${textSecondary}">Penyewa:</span>
                <span id="preview-pedagang" class="font-bold ${textPrimary}">${selectedKiosk ? (selectedKiosk.pedagang === '-' ? 'Lahan Kosong' : selectedKiosk.pedagang) : '-'}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-800/40">
                <span class="${textSecondary}">Kawasan Pasar:</span>
                <span id="preview-pasar" class="font-bold">${selectedKiosk ? selectedKiosk.zona : 'PASAR SANDANG'}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-800/40">
                <span class="${textSecondary}">Tipe Unit:</span>
                <span id="preview-tipe" class="font-bold">${selectedKiosk ? (selectedKiosk.tipeKios || 'LOS') : 'LOS'}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-slate-800/40">
                <span class="${textSecondary}">Ukuran & Luas:</span>
                <span id="preview-luas" class="font-bold">${selectedKiosk ? `${selectedKiosk.luasDimensi || '200 x 200'} (${selectedKiosk.luasM2 || '4.0'} m²)` : '-'}</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="${textSecondary}">Biaya Sewa / Thn:</span>
                <span id="preview-sewa" class="font-bold text-amber-500">${selectedKiosk ? (selectedKiosk.sewaBulanan || 'Rp 225.000/thn') : 'Rp 225.000/thn'}</span>
              </div>
            </div>

            <div class="pt-2">
              <div class="p-3 rounded-xl border text-[11px] leading-relaxed ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}">
                <i data-lucide="info" class="w-3.5 h-3.5 inline mr-1 text-emerald-500"></i>
                Margin presisi: <strong>Atas/Bawah 0.76 inch (19.3 mm)</strong> & <strong>Kiri/Kanan 1 inch (25.4 mm)</strong>. Tipografi <strong>Bookman Old Style 11 pt</strong> dengan garis ganda kedinasan resmi.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  // EVENT LISTENERS
  const kioskSelect = container.querySelector('#kiosk-select');
  const inputNo = container.querySelector('#input-no-naskah');
  const inputTgl = container.querySelector('#input-tgl-naskah');
  const inputSifat = container.querySelector('#input-sifat');
  const uploadLogoInput = container.querySelector('#upload-logo-input');
  
  const btnGenerateInstant = container.querySelector('#btn-generate-instant');
  const btnPreviewInstant = container.querySelector('#btn-preview-instant');
  const btnBatchGenerate = container.querySelector('#btn-batch-generate');
  const batchBlockSelect = container.querySelector('#batch-block-select');

  const previewBadgeBlok = container.querySelector('#preview-badge-blok');
  const previewPedagang = container.querySelector('#preview-pedagang');
  const previewPasar = container.querySelector('#preview-pasar');
  const previewTipe = container.querySelector('#preview-tipe');
  const previewLuas = container.querySelector('#preview-luas');
  const previewSewa = container.querySelector('#preview-sewa');
  const statusAlertBox = container.querySelector('#status-alert-box');
  const statusAlertText = container.querySelector('#status-alert-text');

  function updatePreview(k) {
    if (!k) return;
    previewBadgeBlok.innerText = getCleanBlokName(k);
    previewPedagang.innerText = k.pedagang === '-' ? 'Lahan Kosong' : k.pedagang;
    previewPasar.innerText = k.zona || 'PASAR SANDANG';
    previewTipe.innerText = k.tipeKios || 'LOS';
    previewLuas.innerText = `${k.luasDimensi || '200 x 200'} (${k.luasM2 || '4.0'} m²)`;
    previewSewa.innerText = k.sewaBulanan || 'Rp 225.000/thn';
  }

  kioskSelect.addEventListener('change', (e) => {
    selectedKiosk = kiosks.find(k => k.id === e.target.value) || null;
    updatePreview(selectedKiosk);
  });

  // UPLOAD LOGO HANDLER
  if (uploadLogoInput) {
    uploadLogoInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        pdfService.saveCustomLogo(base64);
        statusAlertBox.classList.remove('hidden');
        statusAlertText.innerText = 'Logo resmi berhasil diunggah dan disimpan untuk semua surat PDF!';
        setTimeout(() => statusAlertBox.classList.add('hidden'), 5000);
      };
      reader.readAsDataURL(file);
    });
  }

  // 1. GENERATE INSTANT SATUAN (0.2s)
  btnGenerateInstant.addEventListener('click', () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const cleanBlok = getCleanBlokName(selectedKiosk);
    const cleanPasar = getCleanJenisPasar(selectedKiosk);

    const letterData = {
      nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
      tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
      sifat: inputSifat.value || 'Biasa',
      nama_pedagang: selectedKiosk.pedagang === '-' ? 'Penyewa Kios' : selectedKiosk.pedagang,
      jenis_pasar: cleanPasar,
      blok_kios: cleanBlok,
      tipe_kios: selectedKiosk.tipeKios || 'LOS',
      luas_dimensi: selectedKiosk.luasDimensi || '200 x 200',
      luas_m2: selectedKiosk.luasM2 || '4.0',
      biaya_sewa: selectedKiosk.sewaBulanan || 'Rp 225.000/thn'
    };

    const doc = pdfService.generateSuratPemberitahuan(letterData);
    const fileName = `Surat_Pemberitahuan_${cleanBlok.replace(/\s+/g, '_')}_${letterData.nama_pedagang.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    doc.save(fileName);

    statusAlertBox.classList.remove('hidden');
    statusAlertText.innerText = `Surat ${cleanBlok} berhasil diunduh instan (${fileName})`;
    setTimeout(() => statusAlertBox.classList.add('hidden'), 5000);
  });

  // 2. PREVIEW INSTANT DI TAB BARU
  btnPreviewInstant.addEventListener('click', () => {
    if (!selectedKiosk) {
      alert('Silakan pilih kios terlebih dahulu!');
      return;
    }

    const cleanBlok = getCleanBlokName(selectedKiosk);
    const cleanPasar = getCleanJenisPasar(selectedKiosk);

    const letterData = {
      nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
      tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
      sifat: inputSifat.value || 'Biasa',
      nama_pedagang: selectedKiosk.pedagang === '-' ? 'Penyewa Kios' : selectedKiosk.pedagang,
      jenis_pasar: cleanPasar,
      blok_kios: cleanBlok,
      tipe_kios: selectedKiosk.tipeKios || 'LOS',
      luas_dimensi: selectedKiosk.luasDimensi || '200 x 200',
      luas_m2: selectedKiosk.luasM2 || '4.0',
      biaya_sewa: selectedKiosk.sewaBulanan || 'Rp 225.000/thn'
    };

    const doc = pdfService.generateSuratPemberitahuan(letterData);
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  });

  // 3. BATCH GENERATOR (1 BLOK SEKALIGUS)
  btnBatchGenerate.addEventListener('click', () => {
    const selectedBlock = batchBlockSelect.value;
    let targetList = kiosks;

    if (selectedBlock !== 'ALL') {
      targetList = kiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(selectedBlock);
      });
    }

    if (targetList.length === 0) {
      alert('Tidak ada pedagang di blok terpilih!');
      return;
    }

    btnBatchGenerate.disabled = true;
    btnBatchGenerate.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Memproses ${targetList.length} Halaman...</span>`;

    setTimeout(() => {
      const commonParams = {
        nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
        tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
        sifat: inputSifat.value || 'Biasa'
      };

      const doc = pdfService.generateBatchSurat(targetList, commonParams);
      const batchFileName = selectedBlock === 'ALL' 
        ? `Bundle_Surat_Pemberitahuan_Semua_Blok_610_Unit.pdf` 
        : `Bundle_Surat_Pemberitahuan_Blok_${selectedBlock}_${targetList.length}_Pedagang.pdf`;

      doc.save(batchFileName);

      btnBatchGenerate.disabled = false;
      btnBatchGenerate.innerHTML = `<i data-lucide="printer" class="w-4 h-4"></i><span>Cetak Massal</span>`;

      statusAlertBox.classList.remove('hidden');
      statusAlertText.innerText = `Bundle PDF Blok ${selectedBlock} (${targetList.length} surat) berhasil diunduh instan!`;
      setTimeout(() => statusAlertBox.classList.add('hidden'), 6000);
    }, 100);
  });
}
