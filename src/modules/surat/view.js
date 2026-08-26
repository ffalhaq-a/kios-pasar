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
    return (k.zona || '').toUpperCase().includes('SAYUR') || String(k.id || '').startsWith('SYR') ? 'Sayur' : 'Sandang';
  };

  // Find target kiosk if provided
  let selectedKiosk = kiosks.find(k => k.id === targetKiosId) || kiosks[0] || null;

  // Group kiosks by Pasar
  const sandangKiosks = kiosks.filter(k => getCleanJenisPasar(k) === 'Sandang');
  const sayurKiosks = kiosks.filter(k => getCleanJenisPasar(k) === 'Sayur');

  // Extract unique blocks
  const getBlockList = (kioskList) => {
    const map = new Map();
    kioskList.forEach(k => {
      const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
      const match = rawCode.match(/^[A-Za-z]+/);
      const blockLetter = match ? match[0].toUpperCase() : 'LAIN';
      map.set(blockLetter, (map.get(blockLetter) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([letter, count]) => ({ letter, count }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  };

  const allBlocks = getBlockList(kiosks);

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  // Default SRIKANDI Tag Values
  const defaultNoNaskah = '${nomor_naskah}';
  const defaultDateStr = '${tanggal_naskah}';
  const defaultSifat = '${sifat}';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary}">Penerbitan Surat Pemberitahuan</h1>
          <p class="text-xs ${textSecondary} mt-0.5">Format standar SRIKANDI • Cetak Satuan, Per Blok, atau Per Pasar Sekaligus</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Tombol Ke Pengaturan Template -->
          <button id="btn-goto-template" class="border px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="sliders" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Edit Template Surat</span>
          </button>

          <!-- Tombol Upload Logo -->
          <label class="cursor-pointer border px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="image" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Upload Logo PNG</span>
            <input type="file" id="upload-logo-input" accept="image/png,image/jpeg" class="hidden" />
          </label>
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
            </div>

            <!-- Pilih Kios / Pedagang -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold ${textSecondary}">Pilih Kios / Nama Pedagang:</label>
              <select id="kiosk-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}">
                ${kiosks.map(k => `
                  <option value="${k.id}" ${selectedKiosk && selectedKiosk.id === k.id ? 'selected' : ''}>
                    [${getCleanJenisPasar(k)}] ${getCleanBlokName(k)} • ${k.pedagang === '-' ? '(KOSONG)' : k.pedagang} • ${k.sewaBulanan || 'Rp 225.000/thn'}
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
                  <option value="${defaultSifat}" selected>\${sifat} (SRIKANDI)</option>
                  <option value="Biasa">Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Segera">Segera</option>
                </select>
              </div>
            </div>

            <!-- ACTION BUTTONS SATUAN -->
            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button id="btn-generate-instant" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>Download PDF Satuan</span>
              </button>

              <button id="btn-preview-instant" class="border px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
                <i data-lucide="eye" class="w-4 h-4 text-emerald-500"></i>
                <span>Preview Layar</span>
              </button>
            </div>
          </div>

          <!-- CARD 2: CETAK MASSAL (PER PASAR / PER BLOK) -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                  <i data-lucide="layers" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold ${textPrimary}">Cetak Massal (Per Pasar / Per Blok)</h3>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Scope Selector -->
              <div class="space-y-1.5">
                <label class="text-xs font-bold ${textSecondary}">Pilihan Lingkup Cetak:</label>
                <select id="batch-scope-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">
                  <option value="ALL">Seluruh Pasar (${kiosks.length} Unit)</option>
                  <option value="SANDANG">Khusus Pasar Sandang (${sandangKiosks.length} Unit)</option>
                  <option value="SAYUR">Khusus Pasar Sayur (${sayurKiosks.length} Unit)</option>
                  <option value="BLOCK">Pilih Blok Tertentu</option>
                </select>
              </div>

              <!-- Block Selector -->
              <div id="batch-block-wrapper" class="space-y-1.5 opacity-50 pointer-events-none transition-all">
                <label class="text-xs font-bold ${textSecondary}">Pilih Blok:</label>
                <select id="batch-block-select" class="w-full px-3 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">
                  ${allBlocks.map(b => `
                    <option value="${b.letter}">Blok ${b.letter} (${b.count} Unit)</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="pt-2">
              <button id="btn-batch-generate" class="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span id="batch-btn-label">Cetak Massal Seluruh Pasar (${kiosks.length} Surat)</span>
              </button>
            </div>
          </div>

          <!-- NOTIFIKASI STATUS -->
          <div id="status-alert-box" class="hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
            <div class="flex items-center gap-2">
              <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
              <span id="status-alert-text">Surat PDF berhasil diterbitkan!</span>
            </div>
          </div>

        </div>

        <!-- KOLOM KANAN: RINGKASAN SURAT TERPILIH (5 COLS) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="${cardBg} border rounded-2xl p-5 space-y-4 sticky top-4">
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
                <span class="${textSecondary}">Kawasan:</span>
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
              <div class="p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i>
                  <span>Format Standar SRIKANDI (A4)</span>
                </span>
                <span class="text-[10px] text-emerald-500 font-mono">TTE Ready</span>
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
  
  const btnGotoTemplate = container.querySelector('#btn-goto-template');
  if (btnGotoTemplate) {
    btnGotoTemplate.addEventListener('click', () => {
      if (window._navigate) window._navigate('/surat/template');
    });
  }

  const btnGenerateInstant = container.querySelector('#btn-generate-instant');
  const btnPreviewInstant = container.querySelector('#btn-preview-instant');
  
  const batchScopeSelect = container.querySelector('#batch-scope-select');
  const batchBlockWrapper = container.querySelector('#batch-block-wrapper');
  const batchBlockSelect = container.querySelector('#batch-block-select');
  const btnBatchGenerate = container.querySelector('#btn-batch-generate');
  const batchBtnLabel = container.querySelector('#batch-btn-label');

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

  // BATCH SCOPE CHANGE
  function updateBatchButtonLabel() {
    const scope = batchScopeSelect.value;
    if (scope === 'ALL') {
      batchBlockWrapper.classList.add('opacity-50', 'pointer-events-none');
      batchBtnLabel.innerText = `Cetak Massal Seluruh Pasar (${kiosks.length} Surat)`;
    } else if (scope === 'SANDANG') {
      batchBlockWrapper.classList.add('opacity-50', 'pointer-events-none');
      batchBtnLabel.innerText = `Cetak Massal Khusus Pasar Sandang (${sandangKiosks.length} Surat)`;
    } else if (scope === 'SAYUR') {
      batchBlockWrapper.classList.add('opacity-50', 'pointer-events-none');
      batchBtnLabel.innerText = `Cetak Massal Khusus Pasar Sayur (${sayurKiosks.length} Surat)`;
    } else if (scope === 'BLOCK') {
      batchBlockWrapper.classList.remove('opacity-50', 'pointer-events-none');
      const blk = batchBlockSelect.value;
      const blkCount = kiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(blk);
      }).length;
      batchBtnLabel.innerText = `Cetak Massal Blok ${blk} (${blkCount} Surat)`;
    }
  }

  batchScopeSelect.addEventListener('change', updateBatchButtonLabel);
  batchBlockSelect.addEventListener('change', updateBatchButtonLabel);

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
        statusAlertText.innerText = 'Logo resmi berhasil diunggah!';
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
      sifat: inputSifat.value || defaultSifat,
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
    statusAlertText.innerText = `Surat ${cleanBlok} berhasil diunduh (${fileName})`;
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
      sifat: inputSifat.value || defaultSifat,
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

  // 3. BATCH GENERATOR (PER PASAR / PER BLOK)
  btnBatchGenerate.addEventListener('click', () => {
    const scope = batchScopeSelect.value;
    let targetList = [];
    let batchFileName = '';

    if (scope === 'ALL') {
      targetList = kiosks;
      batchFileName = `Bundle_Surat_Pemberitahuan_Semua_Pasar_610_Unit.pdf`;
    } else if (scope === 'SANDANG') {
      targetList = sandangKiosks;
      batchFileName = `Bundle_Surat_Pemberitahuan_Pasar_Sandang_318_Unit.pdf`;
    } else if (scope === 'SAYUR') {
      targetList = sayurKiosks;
      batchFileName = `Bundle_Surat_Pemberitahuan_Pasar_Sayur_292_Unit.pdf`;
    } else if (scope === 'BLOCK') {
      const selectedBlock = batchBlockSelect.value;
      targetList = kiosks.filter(k => {
        const rawCode = (k.blokKode || k.id || '').replace(/^(SND|SYR)-/i, '').replace(/^blok\s+/i, '');
        return rawCode.toUpperCase().startsWith(selectedBlock);
      });
      batchFileName = `Bundle_Surat_Pemberitahuan_Blok_${selectedBlock}_${targetList.length}_Pedagang.pdf`;
    }

    if (targetList.length === 0) {
      alert('Tidak ada data pada lingkup cetak yang dipilih!');
      return;
    }

    btnBatchGenerate.disabled = true;
    btnBatchGenerate.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Memproses ${targetList.length} Halaman...</span>`;

    setTimeout(() => {
      const commonParams = {
        nomor_naskah: inputNo.value.trim() || defaultNoNaskah,
        tanggal_naskah: inputTgl.value.trim() || defaultDateStr,
        sifat: inputSifat.value || defaultSifat
      };

      const doc = pdfService.generateBatchSurat(targetList, commonParams);
      doc.save(batchFileName);

      btnBatchGenerate.disabled = false;
      updateBatchButtonLabel();

      statusAlertBox.classList.remove('hidden');
      statusAlertText.innerText = `Bundle PDF (${targetList.length} surat) berhasil diunduh instan!`;
      setTimeout(() => statusAlertBox.classList.add('hidden'), 6000);
    }, 100);
  });
}
