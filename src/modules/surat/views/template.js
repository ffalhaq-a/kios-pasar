import { themeManager } from '../../../shell/ThemeManager.js';
import { pdfService, DEFAULT_TEMPLATE_SETTINGS } from '../../../services/PdfService.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';

export function renderTemplateEditorView(container) {
  const isDark = themeManager.isDark();
  const settings = pdfService.getTemplateSettings();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  let currentLogoBase64 = settings.customLogoBase64;

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER & ACTION BUTTONS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 py-2.5 px-4 rounded-2xl border ${cardBg} backdrop-blur-md shadow-md">
        <div class="flex items-center gap-3">
          <button id="btn-back-to-surat" class="p-2 rounded-xl border hover:bg-slate-800/30 text-slate-400 hover:text-emerald-500 transition-all shadow-sm" title="Kembali ke Halaman Surat">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h1 class="text-base font-extrabold ${textPrimary} flex items-center gap-2">
              <span>Pengaturan Template Surat Pemberitahuan</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Formulir Terstruktur</span>
            </h1>
            <p class="text-xs ${textSecondary} mt-0.5">Ubah redaksi surat, identitas kop, nomor rekening bank, dan pejabat penandatangan dengan mudah & rapi.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-reset-template" class="border px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} text-rose-500 hover:border-rose-500 shadow-sm">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>Reset Standar</span>
          </button>

          <button id="btn-test-preview" class="border px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Test Preview PDF</span>
          </button>

          <button id="btn-save-template" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Template</span>
          </button>
        </div>
      </div>

      <!-- TOAST ALERT -->
      <div id="template-alert-box" class="hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
          <span id="template-alert-text">Pengaturan template surat berhasil disimpan!</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- KOLOM KIRI: KOP, PERIHAL & REKENING (7 COLS) -->
        <div class="lg:col-span-7 space-y-6">

          <!-- 1. KOP SURAT & LOGO -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <i data-lucide="building-2" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm font-bold ${textPrimary}">1. Identitas Kop Surat & Logo Instansi</h3>
            </div>

            <!-- Upload Logo Row -->
            <div class="p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}">
              <div class="flex items-center gap-3">
                <div class="w-12 h-14 border rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden p-1 shrink-0">
                  <img id="logo-preview-img" src="${currentLogoBase64 || ''}" class="${currentLogoBase64 ? '' : 'hidden'} w-full h-full object-contain" />
                  <span id="logo-preview-placeholder" class="${currentLogoBase64 ? 'hidden' : ''} text-[9px] font-bold text-slate-400 text-center">Vektor Resmi</span>
                </div>
                <div>
                  <p class="text-xs font-bold ${textPrimary}">Logo Resmi Daerah / Pasar</p>
                  <p class="text-[11px] ${textSecondary}">Format PNG atau JPG dengan latar belakang transparan.</p>
                </div>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto">
                <label class="flex-1 sm:flex-none cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                  <span>Upload Logo</span>
                  <input type="file" id="tpl-logo-upload" accept="image/png,image/jpeg" class="hidden" />
                </label>
                ${currentLogoBase64 ? `
                  <button id="tpl-logo-delete" class="p-1.5 rounded-xl border text-rose-500 hover:bg-rose-500/10 border-rose-500/30 transition-all" title="Hapus Logo Custom">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Grid Input Kop -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Pemerintah Kabupaten:</label>
                <input type="text" id="tpl-kop-kab" value="${settings.kopKabupaten || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Kecamatan:</label>
                <input type="text" id="tpl-kop-kec" value="${settings.kopKecamatan || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="sm:col-span-2 space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Pemerintah Desa / Instansi:</label>
                <input type="text" id="tpl-kop-desa" value="${settings.kopDesa || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="sm:col-span-2 space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Alamat Kantor & Nomor Telepon:</label>
                <input type="text" id="tpl-kop-alamat" value="${settings.kopAlamat || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Kabupaten / Kota:</label>
                <input type="text" id="tpl-kop-kota" value="${settings.kopKota || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Kode Pos:</label>
                <input type="text" id="tpl-kop-kodepos" value="${settings.kopKodePos || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
              </div>
            </div>
          </div>

          <!-- 2. PERIHAL & PARAGRAF PEMBUKA -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm font-bold ${textPrimary}">2. Perihal & Paragraf Dasar Hukum</h3>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Hal / Perihal Surat:</label>
                <input type="text" id="tpl-hal-surat" value="${settings.halSurat || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Paragraf Pembuka & Dasar Peraturan Desa (Perdes):</label>
                <textarea id="tpl-paragraf-pembuka" rows="3" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">${settings.paragrafPembuka || ''}</textarea>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Alinea / Tab Menjorok (mm):</label>
                  <input type="number" step="0.5" id="tpl-first-line-indent" value="${settings.firstLineIndent || 12.7}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}" />
                  <span class="text-[10px] text-slate-500">12.7 mm = 0.5 inch (Standar Alinea)</span>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Perataan Teks Paragraf:</label>
                  <select id="tpl-text-align" class="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none ${inputBg}">
                    <option value="justify" ${settings.textAlign === 'justify' ? 'selected' : ''}>Rata Kanan-Kiri (Justify - Standar Resmi)</option>
                    <option value="left" ${settings.textAlign === 'left' ? 'selected' : ''}>Rata Kiri (Align Left)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. METODE PEMBAYARAN & REKENING BANK -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                <i data-lucide="credit-card" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm font-bold ${textPrimary}">3. Instruksi Pembayaran & Rekening Bank</h3>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Kalimat Pengantar & Batas Waktu Pembayaran:</label>
                <textarea id="tpl-paragraf-pembayaran" rows="2" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}">${settings.paragrafPembayaran || ''}</textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Nama Bank:</label>
                  <input type="text" id="tpl-bank-nama" value="${settings.bankNama || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Nomor Rekening:</label>
                  <input type="text" id="tpl-bank-rekening" value="${settings.bankRekening || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Atas Nama Rekening:</label>
                  <input type="text" id="tpl-bank-atasnama" value="${settings.bankAtasNama || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Catatan Tambahan Transfer:</label>
                <input type="text" id="tpl-bank-catatan" value="${settings.bankCatatan || '(Mohon menyertakan bukti pembayaran setelah melakukan transfer)'}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Petunjuk Pembayaran Tunai:</label>
                <input type="text" id="tpl-tunai-ket" value="${settings.tunaiKeterangan || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
              </div>
            </div>
          </div>

        </div>

        <!-- KOLOM KANAN: PEJABAT, PENUTUP & MARGIN (5 COLS) -->
        <div class="lg:col-span-5 space-y-6">

          <!-- 4. PEJABAT PENANDATANGAN & PENUTUP -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
                <i data-lucide="stamp" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm font-bold ${textPrimary}">4. Pejabat Penandatangan</h3>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Jabatan Penandatangan:</label>
                <input type="text" id="tpl-ttd-jabatan" value="${settings.ttdJabatan || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Nama Lengkap & Gelar Pejabat:</label>
                <input type="text" id="tpl-ttd-nama" value="${settings.ttdNama || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">NIP Pejabat:</label>
                <input type="text" id="tpl-ttd-nip" value="${settings.ttdNip || ''}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none ${inputBg}" />
              </div>

              <div class="space-y-1 pt-1">
                <label class="text-[11px] font-bold ${textSecondary}">Kalimat Penutup Surat:</label>
                <textarea id="tpl-paragraf-penutup" rows="2" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none ${inputBg}">${settings.paragrafPenutup || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- 5. UKURAN FONT & MARGIN KERTAS -->
          <div class="${cardBg} border rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
              <div class="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg">
                <i data-lucide="sliders" class="w-4 h-4"></i>
              </div>
              <h3 class="text-sm font-bold ${textPrimary}">5. Ukuran Font & Margin Kertas</h3>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Ukuran Huruf Isi (Font Size):</label>
                <select id="tpl-font-size" class="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none ${inputBg}">
                  <option value="10" ${settings.fontSize === 10 ? 'selected' : ''}>10 pt (Kompak & Padat)</option>
                  <option value="11" ${settings.fontSize === 11 ? 'selected' : ''}>11 pt (Standar Resmi Bookman Old Style)</option>
                  <option value="12" ${settings.fontSize === 12 ? 'selected' : ''}>12 pt (Besar & Longgar)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold ${textSecondary}">Spasi Antar Baris (Line Spacing):</label>
                <select id="tpl-line-spacing" class="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none ${inputBg}">
                  <option value="1.0" ${settings.lineSpacing === 1.0 ? 'selected' : ''}>1.0 (Rapat)</option>
                  <option value="1.15" ${settings.lineSpacing === 1.15 ? 'selected' : ''}>1.15</option>
                  <option value="1.35" ${settings.lineSpacing === 1.35 ? 'selected' : ''}>1.35 (Standar Resmi Kedinasan)</option>
                  <option value="1.5" ${settings.lineSpacing === 1.5 ? 'selected' : ''}>1.5 (Longgar)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Margin Atas/Bawah (mm):</label>
                  <input type="number" step="0.1" id="tpl-margin-top" value="${settings.marginTop || 19.3}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none ${inputBg}" />
                  <span class="text-[10px] text-slate-500">19.3 mm = 0.76 inch</span>
                </div>

                <div class="space-y-1">
                  <label class="text-[11px] font-bold ${textSecondary}">Margin Kiri/Kanan (mm):</label>
                  <input type="number" step="0.1" id="tpl-margin-left" value="${settings.marginLeft || 25.4}" class="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none ${inputBg}" />
                  <span class="text-[10px] text-slate-500">25.4 mm = 1.0 inch</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  // HANDLERS
  const alertBox = container.querySelector('#template-alert-box');
  const alertText = container.querySelector('#template-alert-text');
  const logoUploadInput = container.querySelector('#tpl-logo-upload');
  const logoPreviewImg = container.querySelector('#logo-preview-img');
  const logoPlaceholder = container.querySelector('#logo-preview-placeholder');

  function showAlert(msg) {
    alertText.innerText = msg;
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  }

  // Back button
  container.querySelector('#btn-back-to-surat')?.addEventListener('click', () => {
    if (window._navigate) window._navigate('/surat/pemberitahuan');
  });

  // Upload Logo Handler
  if (logoUploadInput) {
    logoUploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        currentLogoBase64 = event.target.result;
        logoPreviewImg.src = currentLogoBase64;
        logoPreviewImg.classList.remove('hidden');
        logoPlaceholder.classList.add('hidden');
        showAlert('Logo baru berhasil dipilih. Klik "Simpan Template" untuk mengaktifkan.');
      };
      reader.readAsDataURL(file);
    });
  }

  // Delete Logo Handler
  container.querySelector('#tpl-logo-delete')?.addEventListener('click', () => {
    currentLogoBase64 = null;
    logoPreviewImg.src = '';
    logoPreviewImg.classList.add('hidden');
    logoPlaceholder.classList.remove('hidden');
    showAlert('Logo custom dihapus. Sistem akan menggunakan vektor resmi.');
  });

  // Form Extractor
  function getFormValues() {
    return {
      kopKabupaten: container.querySelector('#tpl-kop-kab').value.trim(),
      kopKecamatan: container.querySelector('#tpl-kop-kec').value.trim(),
      kopDesa: container.querySelector('#tpl-kop-desa').value.trim(),
      kopAlamat: container.querySelector('#tpl-kop-alamat').value.trim(),
      kopKota: container.querySelector('#tpl-kop-kota').value.trim(),
      kopKodePos: container.querySelector('#tpl-kop-kodepos').value.trim(),
      halSurat: container.querySelector('#tpl-hal-surat').value.trim(),
      paragrafPembuka: container.querySelector('#tpl-paragraf-pembuka').value.trim(),
      firstLineIndent: Number(container.querySelector('#tpl-first-line-indent').value) || 12.7,
      textAlign: container.querySelector('#tpl-text-align').value,
      paragrafPembayaran: container.querySelector('#tpl-paragraf-pembayaran').value.trim(),
      bankNama: container.querySelector('#tpl-bank-nama').value.trim(),
      bankRekening: container.querySelector('#tpl-bank-rekening').value.trim(),
      bankAtasNama: container.querySelector('#tpl-bank-atasnama').value.trim(),
      bankCatatan: container.querySelector('#tpl-bank-catatan').value.trim(),
      tunaiKeterangan: container.querySelector('#tpl-tunai-ket').value.trim(),
      ttdJabatan: container.querySelector('#tpl-ttd-jabatan').value.trim(),
      ttdNama: container.querySelector('#tpl-ttd-nama').value.trim(),
      ttdNip: container.querySelector('#tpl-ttd-nip').value.trim(),
      paragrafPenutup: container.querySelector('#tpl-paragraf-penutup').value.trim(),
      fontSize: Number(container.querySelector('#tpl-font-size').value) || 11,
      lineSpacing: Number(container.querySelector('#tpl-line-spacing').value) || 1.35,
      marginTop: Number(container.querySelector('#tpl-margin-top').value) || 19.3,
      marginBottom: Number(container.querySelector('#tpl-margin-top').value) || 19.3,
      marginLeft: Number(container.querySelector('#tpl-margin-left').value) || 25.4,
      marginRight: Number(container.querySelector('#tpl-margin-left').value) || 25.4,
      customLogoBase64: currentLogoBase64
    };
  }

  // Save Button
  container.querySelector('#btn-save-template')?.addEventListener('click', () => {
    const updated = getFormValues();
    pdfService.saveTemplateSettings(updated);
    showAlert('Pengaturan template surat berhasil disimpan dan langsung aktif untuk seluruh cetakan!');
  });

  // Reset Button
  container.querySelector('#btn-reset-template')?.addEventListener('click', () => {
    if (confirm('Kembalikan seluruh template surat ke format standar resmi bawaan?')) {
      pdfService.resetTemplateSettings();
      renderTemplateEditorView(container);
      showAlert('Template berhasil direset ke standar awal.');
    }
  });

  // Test Preview Button
  container.querySelector('#btn-test-preview')?.addEventListener('click', () => {
    const tempSettings = getFormValues();
    pdfService.saveTemplateSettings(tempSettings);

    const kiosks = spreadsheetService.loadKiosks();
    const sampleKiosk = kiosks[0] || {
      id: 'SND-A1',
      zona: 'PASAR SANDANG',
      blokKode: 'A1',
      pedagang: 'NAPSIYAH',
      tipeKios: 'KIOS 2',
      luasDimensi: '240 x 180',
      luasM2: '4.32',
      sewaBulanan: 'Rp 250.000/thn'
    };

    const doc = pdfService.generateSuratPemberitahuan({
      nomor_naskah: '511.2/014/VIII/2026',
      tanggal_naskah: '26 Agustus 2026',
      sifat: 'Biasa',
      nama_pedagang: sampleKiosk.pedagang,
      jenis_pasar: 'Sandang',
      blok_kios: 'Blok A1',
      tipe_kios: sampleKiosk.tipeKios,
      luas_dimensi: sampleKiosk.luasDimensi,
      luas_m2: sampleKiosk.luasM2,
      biaya_sewa: sampleKiosk.sewaBulanan
    });

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  });
}
