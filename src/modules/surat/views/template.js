import { themeManager } from '../../../shell/ThemeManager.js';
import { pdfService, DEFAULT_TEMPLATE_SETTINGS } from '../../../services/PdfService.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';

export function renderTemplateEditorView(container) {
  const isDark = themeManager.isDark();
  let settings = pdfService.getTemplateSettings();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  // Ruler & Indentation States
  let firstLineIndent = Number(settings.firstLineIndent) || 12.7; // mm
  let textAlign = settings.textAlign || 'justify';
  let lineSpacing = Number(settings.lineSpacing) || 1.35;
  let fontSize = Number(settings.fontSize) || 11;
  let currentLogoBase64 = settings.customLogoBase64;

  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-4 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100/90 text-slate-800'}">
      
      <!-- TOP ACTION BAR -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 py-2 px-3 rounded-2xl border ${cardBg} backdrop-blur-md shadow-md">
        <div class="flex items-center gap-3">
          <button id="btn-back-to-surat" class="p-2 rounded-xl border hover:bg-slate-800/30 text-slate-400 hover:text-emerald-500 transition-all shadow-sm" title="Kembali">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
          </button>
          <div>
            <h1 class="text-sm md:text-base font-extrabold ${textPrimary} flex items-center gap-2">
              <span>Word Document Editor</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">WYSIWYG A4</span>
            </h1>
            <p class="text-[11px] ${textSecondary}">Atur alinea menjorok, perataan teks (*Justify*), geser mistar ruler, dan edit teks langsung di lembar kerja.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-reset-template" class="border px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} text-rose-500 hover:border-rose-500 shadow-sm">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">Reset</span>
          </button>

          <button id="btn-test-preview" class="border px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Test PDF</span>
          </button>

          <button id="btn-save-template" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
            <i data-lucide="save" class="w-4 h-4"></i>
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      <!-- TOAST ALERT -->
      <div id="template-alert-box" class="hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i>
          <span id="template-alert-text">Template berhasil diperbarui!</span>
        </div>
      </div>

      <!-- MICROSOFT WORD / GOOGLE DOCS TOOLBAR -->
      <div class="p-2.5 rounded-2xl border ${cardBg} flex flex-wrap items-center justify-between gap-2 shadow-sm">
        
        <!-- Group 1: Typography & Size -->
        <div class="flex items-center gap-1.5">
          <div class="px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${inputBg}">
            <i data-lucide="type" class="w-3.5 h-3.5 text-slate-400"></i>
            <span class="font-serif">Bookman Old Style</span>
          </div>

          <div class="flex items-center border rounded-xl overflow-hidden ${inputBg}">
            <button id="btn-font-dec" class="px-2 py-1.5 hover:bg-slate-700/20 text-xs font-bold text-slate-400 hover:text-emerald-500">-</button>
            <span id="label-font-size" class="px-2 text-xs font-bold font-mono">${fontSize} pt</span>
            <button id="btn-font-inc" class="px-2 py-1.5 hover:bg-slate-700/20 text-xs font-bold text-slate-400 hover:text-emerald-500">+</button>
          </div>
        </div>

        <div class="h-5 w-px bg-slate-700/30 hidden sm:block"></div>

        <!-- Group 2: Text Alignment (Left, Center, Right, Justify) -->
        <div class="flex items-center gap-1 bg-slate-800/10 dark:bg-slate-900 p-1 rounded-xl border border-slate-700/30">
          <button id="btn-align-left" title="Rata Kiri (Ctrl+L)" class="p-1.5 rounded-lg text-xs font-bold transition-all ${textAlign === 'left' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
            <i data-lucide="align-left" class="w-4 h-4"></i>
          </button>
          <button id="btn-align-justify" title="Rata Kanan-Kiri / Justify (Ctrl+J)" class="p-1.5 rounded-lg text-xs font-bold transition-all ${textAlign === 'justify' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
            <i data-lucide="align-justify" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="h-5 w-px bg-slate-700/30 hidden sm:block"></div>

        <!-- Group 3: Alinea & Indent Controls -->
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold ${textSecondary} hidden md:inline">Alinea / Tab Menjorok:</span>
          <div class="flex items-center gap-1.5 border px-2.5 py-1 rounded-xl ${inputBg}">
            <i data-lucide="indent" class="w-3.5 h-3.5 text-emerald-500"></i>
            <input type="range" id="input-alinea-slider" min="0" max="30" step="1" value="${firstLineIndent}" class="w-20 sm:w-28 accent-emerald-500 cursor-pointer" />
            <span id="label-alinea-val" class="font-mono text-xs font-bold text-emerald-500 w-12 text-right">${firstLineIndent} mm</span>
          </div>
        </div>

        <div class="h-5 w-px bg-slate-700/30 hidden sm:block"></div>

        <!-- Group 4: Line Spacing -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-bold ${textSecondary} hidden lg:inline">Spasi:</span>
          <select id="select-line-spacing" class="px-2 py-1 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${inputBg}">
            <option value="1.0" ${lineSpacing === 1.0 ? 'selected' : ''}>1.0 (Rapat)</option>
            <option value="1.15" ${lineSpacing === 1.15 ? 'selected' : ''}>1.15</option>
            <option value="1.35" ${lineSpacing === 1.35 ? 'selected' : ''}>1.35 (Standar Resmi)</option>
            <option value="1.5" ${lineSpacing === 1.5 ? 'selected' : ''}>1.5 (Longgar)</option>
          </select>
        </div>

        <!-- Group 5: Upload Logo Button -->
        <label class="cursor-pointer border px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
          <i data-lucide="image" class="w-3.5 h-3.5 text-emerald-500"></i>
          <span>Ganti Logo PNG</span>
          <input type="file" id="tpl-logo-upload" accept="image/png,image/jpeg" class="hidden" />
        </label>
      </div>

      <!-- WORKSPACE CONTAINER WITH INTERACTIVE RULER & A4 CANVAS -->
      <div class="flex flex-col items-center justify-center space-y-2 pb-12">
        
        <!-- INTERACTIVE TOP RULER (MISTAR HORIZONTAL) -->
        <div class="w-full max-w-[820px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-t-xl px-8 py-1.5 relative select-none shadow-inner">
          <div class="relative h-6 flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold border-b border-slate-400/40">
            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span>15</span><span>16 cm</span>
          </div>

          <!-- Interactive Marker for First-Line Indent (Segitiga Alinea) -->
          <div id="ruler-indent-marker" class="absolute top-1 cursor-ew-resize transition-all" style="left: calc(32px + ${(firstLineIndent / 160) * 100}%);" title="Geser untuk mengatur alinea menjorok">
            <div class="w-3 h-3 bg-emerald-500 rotate-45 transform origin-center shadow-md border border-white"></div>
            <div class="w-0.5 h-4 bg-emerald-500 mx-auto opacity-70"></div>
          </div>
        </div>

        <!-- REALISTIC A4 WHITE PAPER CANVAS -->
        <div 
          id="a4-paper-canvas" 
          class="w-full max-w-[820px] min-h-[1050px] bg-white text-slate-950 p-8 sm:p-12 shadow-2xl rounded-b-xl border border-slate-300 font-serif relative space-y-6"
          style="font-family: 'Times New Roman', Georgia, serif; font-size: ${fontSize}pt; line-height: ${lineSpacing};"
        >
          
          <!-- 1. KOP SURAT RESMI -->
          <div class="relative border-b-2 border-slate-950 pb-2">
            <div class="flex items-center gap-4">
              <!-- Logo Container -->
              <div class="w-16 h-20 border border-dashed border-slate-300 rounded p-1 flex items-center justify-center bg-slate-50 shrink-0 relative group">
                <img id="paper-logo-img" src="${currentLogoBase64 || ''}" class="${currentLogoBase64 ? '' : 'hidden'} w-full h-full object-contain" />
                <div id="paper-logo-vector" class="${currentLogoBase64 ? 'hidden' : ''} w-full h-full border border-amber-600 rounded bg-white flex flex-col items-center justify-center p-0.5 text-center">
                  <span class="text-[7px] font-bold bg-slate-900 text-white w-full py-0.5 rounded">CILACAP</span>
                  <div class="w-full h-4 bg-red-600 my-0.5"></div>
                  <div class="w-full h-4 bg-blue-600"></div>
                </div>
              </div>

              <!-- Header Texts (Editable Direct Inline) -->
              <div class="flex-1 text-center space-y-0.5">
                <input type="text" id="paper-kop-kab" value="${settings.kopKabupaten || 'PEMERINTAH KABUPATEN CILACAP'}" class="w-full text-center font-bold text-xs uppercase tracking-wider outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
                <input type="text" id="paper-kop-kec" value="${settings.kopKecamatan || 'KECAMATAN KARANGPUCUNG'}" class="w-full text-center font-bold text-xs uppercase tracking-wider outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
                <input type="text" id="paper-kop-desa" value="${settings.kopDesa || 'PEMERINTAH DESA KARANGPUCUNG'}" class="w-full text-center font-bold text-sm uppercase tracking-wider outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
                <input type="text" id="paper-kop-alamat" value="${settings.kopAlamat || 'Jalan Pramuka No. 09 Tlp. 02806261727'}" class="w-full text-center text-[10px] outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
                <div class="flex items-center justify-center gap-2">
                  <input type="text" id="paper-kop-kota" value="${settings.kopKota || 'CILACAP'}" class="text-center text-[10px] font-bold outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 w-24" />
                </div>
              </div>

              <!-- Kode Pos -->
              <div class="absolute right-0 bottom-1">
                <input type="text" id="paper-kop-kodepos" value="${settings.kopKodePos || 'Kode Pos 53255'}" class="text-right text-[10px] outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 w-28" />
              </div>
            </div>

            <!-- Double Lines -->
            <div class="w-full h-0.5 bg-slate-950 mt-2"></div>
            <div class="w-full h-px bg-slate-950 mt-0.5"></div>
          </div>

          <!-- 2. METADATA SURAT (NOMOR, TANGGAL, SIFAT, PERIHAL) -->
          <div class="flex justify-between items-start text-xs pt-1">
            <div class="space-y-1 w-7/12">
              <div class="flex items-center gap-2">
                <span class="w-16">Nomor</span>
                <span>:</span>
                <input type="text" id="paper-no-naskah" value="${settings.defaultNoNaskah || '511.2/014/VIII/2026'}" class="flex-1 outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 font-mono" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16">Sifat</span>
                <span>:</span>
                <input type="text" id="paper-sifat" value="${settings.defaultSifat || 'Biasa'}" class="flex-1 outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16">Lampiran</span>
                <span>:</span>
                <span>-</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="w-16 shrink-0">Hal</span>
                <span class="shrink-0">:</span>
                <textarea id="paper-hal" rows="2" class="flex-1 outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 text-xs resize-none font-bold">${settings.halSurat || 'Pemberitahuan Pembayaran Sewa Tahunan Pasar Mukti Makmur'}</textarea>
              </div>
            </div>

            <!-- Tanggal (Kanan) -->
            <div class="text-right">
              <div class="flex items-center justify-end gap-1">
                <span>Cilacap,</span>
                <input type="text" id="paper-tgl-naskah" value="${settings.defaultDateStr || '26 Agustus 2026'}" class="text-right outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 w-36 font-semibold" />
              </div>
            </div>
          </div>

          <!-- 3. TUJUAN SURAT (YTH) -->
          <div class="text-xs space-y-1 pl-0">
            <p>Yth. Bapak/Ibu Penyewa Kios/Los/Lemprakan</p>
            <p class="pl-4">Pasar Mukti Makmur Desa Karangpucung</p>
            <p class="pl-4 pt-1">di</p>
            <p class="pl-6 font-bold">Tempat</p>
          </div>

          <!-- 4. PARAGRAF PEMBUKA (DENGAN ALINEA & TEXT-ALIGN REALTIME) -->
          <div class="space-y-2">
            <textarea 
              id="paper-paragraf-pembuka" 
              rows="4" 
              class="w-full outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded p-1.5 transition-all resize-y border border-transparent focus:border-amber-400"
              style="text-indent: ${firstLineIndent}mm; text-align: ${textAlign}; line-height: ${lineSpacing};"
            >${settings.paragrafPembuka || 'Berdasarkan Peraturan Desa (Perdes) Karangpucung Nomor 3 Tahun 2026 tentang Aset Desa, bersama ini kami beritahukan bahwa Pemerintah Desa Karangpucung akan melaksanakan penarikan sewa tahunan untuk fasilitas Kios/Los/Lemprakan di lingkungan Pasar Mukti Makmur Desa Karangpucung.\nAdapun rincian tagihan sewa tahunan Saudara/i adalah sebagai berikut:'}</textarea>
          </div>

          <!-- 5. TABEL RINCIAN TAGIHAN 2 KOLOM -->
          <div class="grid grid-cols-2 gap-4 text-xs py-1 border-y border-slate-200">
            <div class="space-y-1">
              <div class="flex items-center">
                <span class="w-32 font-normal">Pasar</span>
                <span class="w-3">:</span>
                <span class="font-bold font-serif text-emerald-800">[PASAR SANDANG]</span>
              </div>
              <div class="flex items-center">
                <span class="w-32 font-normal">Ukuran</span>
                <span class="w-3">:</span>
                <span class="font-bold font-mono">240 x 180</span>
              </div>
              <div class="flex items-center">
                <span class="w-32 font-normal">Kios/Los/Lemprakan</span>
                <span class="w-3">:</span>
                <span class="font-bold font-serif text-emerald-800">Blok A1</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center">
                <span class="w-24 font-normal">Tipe Unit</span>
                <span class="w-3">:</span>
                <span class="font-bold font-serif text-emerald-800">KIOS 2</span>
              </div>
              <div class="flex items-center">
                <span class="w-24 font-normal">Luas</span>
                <span class="w-3">:</span>
                <span class="font-bold font-mono">4.32 m²</span>
              </div>
              <div class="flex items-center">
                <span class="w-24 font-normal">Biaya Sewa</span>
                <span class="w-3">:</span>
                <span class="font-bold font-mono text-amber-800">Rp 250.000/thn</span>
              </div>
            </div>
          </div>

          <!-- 6. METODE PEMBAYARAN & REKENING -->
          <div class="space-y-2 text-xs" style="text-align: ${textAlign};">
            <textarea id="paper-paragraf-bayar" rows="2" class="w-full outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded p-1 resize-none">${settings.paragrafPembayaran || 'Pembayaran sewa tahunan tersebut dapat dilakukan pada batas waktu pembayaran mulai tanggal 31 Agustus 2026 sampai dengan selambat-lambatnya 7 September 2026, melalui metode berikut:'}</textarea>

            <div class="pl-4 space-y-1 text-left">
              <p class="font-bold">1. Transfer Bank:</p>
              <div class="pl-4 space-y-0.5 font-mono text-[11px]">
                <input type="text" id="paper-bank-nama" value="${settings.bankNama || 'Bank Jawa Tengah'}" class="w-64 font-bold outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 block" />
                <div class="flex items-center gap-1">
                  <span>No. Rekening :</span>
                  <input type="text" id="paper-bank-rek" value="${settings.bankRekening || '12345xxxx'}" class="outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 font-bold w-40" />
                </div>
                <div class="flex items-center gap-1">
                  <span>Atas Nama    :</span>
                  <input type="text" id="paper-bank-atasnama" value="${settings.bankAtasNama || 'Pemerintah Desa Karangpucung'}" class="outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 font-bold w-64" />
                </div>
                <p class="text-[10px] italic opacity-80">${settings.bankCatatan || '(Mohon menyertakan bukti pembayaran setelah melakukan transfer)'}</p>
              </div>

              <p class="font-bold pt-1.5">2. Pembayaran Tunai:</p>
              <div class="pl-4">
                <input type="text" id="paper-tunai-ket" value="${settings.tunaiKeterangan || 'Datang langsung ke Balai Desa Karangpucung pada hari dan jam kerja.'}" class="w-full outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 text-[11px]" />
              </div>
            </div>

            <textarea id="paper-paragraf-penutup" rows="2" class="w-full outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded p-1 resize-none pt-2">${settings.paragrafPenutup || 'Demikian surat pemberitahuan ini kami sampaikan. Atas kerja sama dan partisipasi Bapak/Ibu dalam mendukung pembangunan desa, kami ucapkan terima kasih.'}</textarea>
          </div>

          <!-- 7. TANDA TANGAN KEPALA DESA -->
          <div class="flex justify-end pt-4">
            <div class="text-center w-64 space-y-1">
              <input type="text" id="paper-ttd-jabatan" value="${settings.ttdJabatan || 'PJ. Kepala Desa Karangpucung'}" class="w-full text-center outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 text-xs" />
              
              <!-- Signature Whitespace -->
              <div class="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                (Ruang Tanda Tangan & Stempel)
              </div>

              <input type="text" id="paper-ttd-nama" value="${settings.ttdNama || 'A. ANJARNINGSIH, S.E.'}" class="w-full text-center font-bold text-xs uppercase underline outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
              <input type="text" id="paper-ttd-nip" value="${settings.ttdNip || 'NIP. 19790507 2003 12 2 006'}" class="w-full text-center text-[10px] font-bold outline-none bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1" />
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  // DOM ELEMENTS
  const paperCanvas = container.querySelector('#a4-paper-canvas');
  const alertBox = container.querySelector('#template-alert-box');
  const alertText = container.querySelector('#template-alert-text');
  
  const alineaSlider = container.querySelector('#input-alinea-slider');
  const labelAlineaVal = container.querySelector('#label-alinea-val');
  const rulerMarker = container.querySelector('#ruler-indent-marker');
  const paperPembuka = container.querySelector('#paper-paragraf-pembuka');
  
  const btnAlignLeft = container.querySelector('#btn-align-left');
  const btnAlignJustify = container.querySelector('#btn-align-justify');
  const selectLineSpacing = container.querySelector('#select-line-spacing');
  const labelFontSize = container.querySelector('#label-font-size');
  const btnFontDec = container.querySelector('#btn-font-dec');
  const btnFontInc = container.querySelector('#btn-font-inc');

  const logoUploadInput = container.querySelector('#tpl-logo-upload');
  const paperLogoImg = container.querySelector('#paper-logo-img');
  const paperLogoVector = container.querySelector('#paper-logo-vector');

  function showAlert(msg) {
    alertText.innerText = msg;
    alertBox.classList.remove('hidden');
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  }

  // 1. ALINEA SLIDER & RULER MARKER SYNC
  function updateAlinea(val) {
    firstLineIndent = Number(val);
    labelAlineaVal.innerText = `${firstLineIndent} mm`;
    paperPembuka.style.textIndent = `${firstLineIndent}mm`;
    rulerMarker.style.left = `calc(32px + ${(firstLineIndent / 160) * 100}%)`;
  }

  alineaSlider.addEventListener('input', (e) => updateAlinea(e.target.value));

  // 2. TEXT ALIGNMENT (LEFT / JUSTIFY)
  btnAlignLeft.addEventListener('click', () => {
    textAlign = 'left';
    btnAlignLeft.className = 'p-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white shadow';
    btnAlignJustify.className = 'p-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200';
    paperPembuka.style.textAlign = 'left';
  });

  btnAlignJustify.addEventListener('click', () => {
    textAlign = 'justify';
    btnAlignJustify.className = 'p-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-600 text-white shadow';
    btnAlignLeft.className = 'p-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-200';
    paperPembuka.style.textAlign = 'justify';
  });

  // 3. FONT SIZE CONTROLS
  btnFontDec.addEventListener('click', () => {
    if (fontSize > 9) {
      fontSize--;
      labelFontSize.innerText = `${fontSize} pt`;
      paperCanvas.style.fontSize = `${fontSize}pt`;
    }
  });

  btnFontInc.addEventListener('click', () => {
    if (fontSize < 14) {
      fontSize++;
      labelFontSize.innerText = `${fontSize} pt`;
      paperCanvas.style.fontSize = `${fontSize}pt`;
    }
  });

  // 4. LINE SPACING
  selectLineSpacing.addEventListener('change', (e) => {
    lineSpacing = Number(e.target.value);
    paperCanvas.style.lineHeight = String(lineSpacing);
  });

  // 5. UPLOAD LOGO
  if (logoUploadInput) {
    logoUploadInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        currentLogoBase64 = event.target.result;
        paperLogoImg.src = currentLogoBase64;
        paperLogoImg.classList.remove('hidden');
        paperLogoVector.classList.add('hidden');
        showAlert('Logo resmi berhasil diunggah di lembar kerja!');
      };
      reader.readAsDataURL(file);
    });
  }

  // 6. GATHER FULL FORM VALUES
  function getFullFormValues() {
    return {
      kopKabupaten: container.querySelector('#paper-kop-kab').value.trim(),
      kopKecamatan: container.querySelector('#paper-kop-kec').value.trim(),
      kopDesa: container.querySelector('#paper-kop-desa').value.trim(),
      kopAlamat: container.querySelector('#paper-kop-alamat').value.trim(),
      kopKota: container.querySelector('#paper-kop-kota').value.trim(),
      kopKodePos: container.querySelector('#paper-kop-kodepos').value.trim(),
      defaultNoNaskah: container.querySelector('#paper-no-naskah').value.trim(),
      defaultDateStr: container.querySelector('#paper-tgl-naskah').value.trim(),
      defaultSifat: container.querySelector('#paper-sifat').value.trim(),
      halSurat: container.querySelector('#paper-hal').value.trim(),
      paragrafPembuka: container.querySelector('#paper-paragraf-pembuka').value.trim(),
      paragrafPembayaran: container.querySelector('#paper-paragraf-bayar').value.trim(),
      bankNama: container.querySelector('#paper-bank-nama').value.trim(),
      bankRekening: container.querySelector('#paper-bank-rek').value.trim(),
      bankAtasNama: container.querySelector('#paper-bank-atasnama').value.trim(),
      tunaiKeterangan: container.querySelector('#paper-tunai-ket').value.trim(),
      paragrafPenutup: container.querySelector('#paper-paragraf-penutup').value.trim(),
      ttdJabatan: container.querySelector('#paper-ttd-jabatan').value.trim(),
      ttdNama: container.querySelector('#paper-ttd-nama').value.trim(),
      ttdNip: container.querySelector('#paper-ttd-nip').value.trim(),
      firstLineIndent: firstLineIndent,
      textAlign: textAlign,
      lineSpacing: lineSpacing,
      fontSize: fontSize,
      customLogoBase64: currentLogoBase64
    };
  }

  // 7. SAVE BUTTON
  container.querySelector('#btn-save-template')?.addEventListener('click', () => {
    const values = getFullFormValues();
    pdfService.saveTemplateSettings(values);
    showAlert('Perubahan template dan alinea berhasil disimpan dan langsung aktif!');
  });

  // 8. RESET BUTTON
  container.querySelector('#btn-reset-template')?.addEventListener('click', () => {
    if (confirm('Kembalikan lembar template ke format standar resmi bawaan?')) {
      pdfService.resetTemplateSettings();
      renderTemplateEditorView(container);
      showAlert('Template berhasil direset ke standar awal.');
    }
  });

  // 9. TEST PREVIEW PDF
  container.querySelector('#btn-test-preview')?.addEventListener('click', () => {
    const values = getFullFormValues();
    pdfService.saveTemplateSettings(values);

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
      nomor_naskah: values.defaultNoNaskah,
      tanggal_naskah: values.defaultDateStr,
      sifat: values.defaultSifat,
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

  // 10. BACK BUTTON
  container.querySelector('#btn-back-to-surat')?.addEventListener('click', () => {
    if (window._navigate) window._navigate('/surat/pemberitahuan');
  });
}
