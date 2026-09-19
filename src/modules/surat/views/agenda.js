import { themeManager } from '../../../shell/ThemeManager.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { escapeHTML } from '../../../utils/security.js';

export function renderAgendaSuratView(container) {
  if (!container) return;

  const isDark = themeManager.isDark();
  let currentTab = window._agendaCurrentTab || 'surat'; // 'surat' | 'perjanjian' | 'kwitansi'
  let currentSort = window._agendaCurrentSort || 'num_asc'; // 'num_asc' | 'num_desc' | 'raw'

  let agendaLogs = spreadsheetService.getAgendaLogs() || [];
  let perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
  let kwitansiLogs = spreadsheetService.getKwitansiLogs() || [];

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 mb-2">
            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
            <span>ARSIP & BUKU AGENDA DINAS DIGITAL</span>
          </div>
          <h1 class="text-xl md:text-2xl font-extrabold ${textPrimary}">Buku Agenda & Riwayat Dokumen</h1>
          <p class="text-xs ${textSecondary}">Rekapitulasi riwayat penomoran naskah, surat perjanjian, kwitansi, dan arsip PDF di Google Drive.</p>
        </div>

        <div class="flex items-center gap-2">
          <button id="btn-sync-cloud-agenda" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/20">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Sinkronkan Cloud</span>
          </button>
          <button id="btn-clear-local-agenda" class="border px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} text-rose-500 hover:border-rose-500 shadow-sm" title="Bersihkan Riwayat Lokal">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Reset Cache</span>
          </button>
        </div>
      </div>

      <!-- NAVIGATION TABS -->
      <div class="flex border-b border-slate-700/60 gap-2 overflow-x-auto pb-1">
        <button id="tab-btn-surat" class="px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${currentTab === 'surat' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent'}">
          <i data-lucide="file-text" class="w-4 h-4"></i>
          <span>Surat Pemberitahuan (${agendaLogs.length})</span>
        </button>
        <button id="tab-btn-perjanjian" class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentTab === 'perjanjian' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-extrabold' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'}">
          <i data-lucide="file-signature" class="w-4 h-4"></i>
          <span>Surat Perjanjian Kontrak (${perjanjianLogs.length})</span>
        </button>
        <button id="tab-btn-kwitansi" class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${currentTab === 'kwitansi' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-extrabold' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent'}">
          <i data-lucide="receipt" class="w-4 h-4"></i>
          <span>Kwitansi Kas Desa (${kwitansiLogs.length})</span>
        </button>
      </div>

      <!-- SEARCH & FILTER BAR WITH SORTING OPTIONS -->
      <div class="${cardBg} border rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          <div class="relative w-full sm:w-64">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
            <input type="text" id="input-search-agenda" placeholder="Cari nomor, pedagang, atau blok..." class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
          </div>
          <div class="w-full sm:w-40">
            <select id="select-pasar-agenda" class="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}">
              <option value="ALL">Semua Pasar</option>
              <option value="SANDANG">Pasar Sandang</option>
              <option value="SAYUR">Pasar Sayur</option>
            </select>
          </div>
          <div class="w-full sm:w-64">
            <select id="select-sort-agenda" class="w-full px-3 py-2 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}">
              <option value="num_asc" ${currentSort === 'num_asc' ? 'selected' : ''}>🔢 Urutan No: 001 → 999 (Rapi)</option>
              <option value="num_desc" ${currentSort === 'num_desc' ? 'selected' : ''}>🔢 Urutan No: 999 → 001 (Terbesar)</option>
              <option value="raw" ${currentSort === 'raw' ? 'selected' : ''}>⏱️ Urut Waktu Pembuatan (Input)</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span id="tab-badge-info" class="inline-flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tersambung Google Sheets Database</span>
          </span>
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="${cardBg} border rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead id="agenda-table-head" class="${isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} font-bold uppercase tracking-wider text-[11px]">
              <!-- DYNAMIC THEAD -->
            </thead>
            <tbody id="agenda-table-body" class="divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}">
              <!-- DYNAMIC TBODY -->
            </tbody>
          </table>
        </div>

        <div id="agenda-empty-state" class="hidden p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="inbox" class="w-6 h-6"></i>
          </div>
          <p class="text-xs text-slate-400">Belum ada riwayat dokumen pada kategori ini.</p>
        </div>
      </div>
    </div>

    <!-- MODAL REVISI IDENTITAS PERJANJIAN -->
    <div id="modal-revise-perjanjian" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="${cardBg} border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}">
          <div class="flex items-center gap-2.5">
            <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <i data-lucide="edit-3" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm font-extrabold ${textPrimary}">Revisi Identitas Surat Perjanjian</h3>
              <p class="text-[10px] ${textSecondary}">Nomor surat tetap sama, PDF baru akan diterbitkan ulang di Google Drive.</p>
            </div>
          </div>
          <button type="button" id="btn-close-revise-modal" class="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-revise-perjanjian" class="p-4 space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="font-bold ${textSecondary} block mb-1">Nomor Perjanjian:</label>
              <input type="text" id="revise-input-no" readonly class="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold bg-slate-800/40 text-amber-400 border-slate-700 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label class="font-bold ${textSecondary} block mb-1">Objek Kios / Blok:</label>
              <input type="text" id="revise-input-blok" readonly class="w-full px-2.5 py-1.5 rounded-lg border font-bold bg-slate-800/40 ${textPrimary} border-slate-700 cursor-not-allowed outline-none" />
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold ${textPrimary} block">Nama Pedagang Baru (Pihak II): <span class="text-rose-400">*</span></label>
            <input type="text" id="revise-input-pedagang" required placeholder="Contoh: SUPARNO" class="w-full px-3 py-2 rounded-xl border font-bold uppercase focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
          </div>

          <div class="space-y-1">
            <label class="font-bold ${textSecondary} block">NIK Pedagang:</label>
            <input type="text" id="revise-input-nik" placeholder="16 digit NIK atau tanda -" class="w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
          </div>

          <div class="space-y-1">
            <label class="font-bold ${textSecondary} block">Alamat / Domisili:</label>
            <input type="text" id="revise-input-alamat" placeholder="Desa / Kecamatan" class="w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none ${inputBg}" />
          </div>

          <div class="pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-end gap-2">
            <button type="button" id="btn-cancel-revise" class="px-3 py-2 rounded-xl text-xs font-bold border text-slate-400 hover:text-slate-200">
              Batal
            </button>
            <button type="submit" id="btn-submit-revise" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md shadow-amber-900/30">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Simpan & Terbitkan PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const thead = container.querySelector('#agenda-table-head');
  const tbody = container.querySelector('#agenda-table-body');
  const emptyState = container.querySelector('#agenda-empty-state');
  const searchInput = container.querySelector('#input-search-agenda');
  const pasarSelect = container.querySelector('#select-pasar-agenda');
  const sortSelect = container.querySelector('#select-sort-agenda');
  const tabBtnSurat = container.querySelector('#tab-btn-surat');
  const tabBtnPerjanjian = container.querySelector('#tab-btn-perjanjian');
  const tabBtnKwitansi = container.querySelector('#tab-btn-kwitansi');
  const btnSync = container.querySelector('#btn-sync-cloud-agenda');
  const btnClear = container.querySelector('#btn-clear-local-agenda');

  // Helper untuk mengekstrak nomor urut dokumen (misal: "043 / KRPC / 2026" -> 43, "025 / KRPC / 2026" -> 25)
  function extractDocNumber(str) {
    if (!str) return 0;
    const clean = String(str).trim();
    const slashParts = clean.split('/');
    if (slashParts.length > 1) {
      const p0 = slashParts[0].trim();
      const p0Num = parseInt(p0.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(p0Num) && p0Num > 0 && p0Num < 1900) {
        return p0Num;
      }
      for (let i = 1; i < slashParts.length; i++) {
        const part = slashParts[i].trim();
        if (/^\d+$/.test(part)) {
          const val = parseInt(part, 10);
          if (val < 1900) return val;
        }
      }
    }
    const allNums = clean.match(/\d+/g);
    if (allNums) {
      for (const numStr of allNums) {
        const val = parseInt(numStr, 10);
        if (val < 1900 || val > 2099) {
          return val;
        }
      }
      return parseInt(allNums[0], 10);
    }
    return 0;
  }

  function sortLogItems(list, keyField, secondaryField = 'blok') {
    if (currentSort === 'raw') return list;
    return [...list].sort((a, b) => {
      const nA = extractDocNumber(a[keyField]);
      const nB = extractDocNumber(b[keyField]);
      if (nA !== nB) {
        return currentSort === 'num_desc' ? nB - nA : nA - nB;
      }
      return String(a[secondaryField] || '').localeCompare(String(b[secondaryField] || ''));
    });
  }

  function renderTable() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const selectedPasar = (pasarSelect?.value || 'ALL').toUpperCase();

    if (currentTab === 'surat') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">
            <button id="th-sort-btn" class="flex items-center gap-1.5 font-bold uppercase hover:text-emerald-400 transition-colors" title="Klik untuk balik urutan nomor">
              <span>Nomor Surat</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${currentSort === 'num_asc' ? 'bg-emerald-500/20 text-emerald-400' : (currentSort === 'num_desc' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400')}">
                ${currentSort === 'num_asc' ? '▲ 001→999' : (currentSort === 'num_desc' ? '▼ 999→001' : '⏱️ Input')}
              </span>
            </button>
          </th>
          <th class="px-4 py-3">Tanggal</th>
          <th class="px-4 py-3">Tujuan / Pedagang</th>
          <th class="px-4 py-3">Perihal</th>
          <th class="px-4 py-3">Keterangan / Link Drive</th>
          <th class="px-4 py-3 text-center w-20">Aksi</th>
        </tr>
      `;

      const filtered = agendaLogs.filter(item => {
        const str = `${item.nomorSurat || ''} ${item.tujuan || ''} ${item.ket || ''}`.toLowerCase();
        const matchesQuery = str.includes(q);
        const matchesPasar = selectedPasar === 'ALL' || str.toUpperCase().includes(selectedPasar);
        return matchesQuery && matchesPasar;
      });

      const sorted = sortLogItems(filtered, 'nomorSurat', 'tujuan');

      if (sorted.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = sorted.map((item, idx) => {
        const driveMatch = String(item.ket || '').match(/https:\/\/drive\.google\.com[^\s]+/);
        const driveUrl = driveMatch ? driveMatch[0] : (item.driveUrl || '');

        return `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 text-center font-mono text-slate-500">${idx + 1}</td>
            <td class="px-4 py-3 font-mono font-bold text-emerald-400">${escapeHTML(item.nomorSurat || '-')}</td>
            <td class="px-4 py-3 font-mono ${textSecondary}">${escapeHTML(item.tanggalSurat || item.tanggalKirim || '-')}</td>
            <td class="px-4 py-3 font-bold ${textPrimary}">${escapeHTML(item.tujuan || '-')}</td>
            <td class="px-4 py-3 ${textSecondary}">${escapeHTML(item.perihal || 'Pemberitahuan Sewa')}</td>
            <td class="px-4 py-3">
              ${driveUrl ? `
                <a href="${driveUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>Buka PDF Google Drive</span>
                </a>
              ` : `<span class="text-slate-500 text-[11px]">${escapeHTML(item.ket || 'Tercatat')}</span>`}
            </td>
            <td class="px-4 py-3 text-center">
              <button class="btn-delete-surat p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all" data-no="${escapeHTML(item.nomorSurat || '')}" data-url="${escapeHTML(driveUrl || '')}" title="Hapus / Batalkan Surat Pemberitahuan">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

    } else if (currentTab === 'perjanjian') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">
            <button id="th-sort-btn" class="flex items-center gap-1.5 font-bold uppercase hover:text-amber-400 transition-colors" title="Klik untuk balik urutan nomor">
              <span>Nomor Perjanjian</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${currentSort === 'num_asc' ? 'bg-amber-500/20 text-amber-400' : (currentSort === 'num_desc' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400')}">
                ${currentSort === 'num_asc' ? '▲ 001→999' : (currentSort === 'num_desc' ? '▼ 999→001' : '⏱️ Input')}
              </span>
            </button>
          </th>
          <th class="px-4 py-3">Tanggal Akad</th>
          <th class="px-4 py-3">Pihak II (Pedagang)</th>
          <th class="px-4 py-3">Blok & Kawasan</th>
          <th class="px-4 py-3">Biaya Sewa</th>
          <th class="px-4 py-3">Arsip Google Drive</th>
          <th class="px-4 py-3 text-center w-20">Aksi</th>
        </tr>
      `;

      const filtered = perjanjianLogs.filter(item => {
        const str = `${item.nomorPerjanjian || ''} ${item.namaPedagang || ''} ${item.blok || ''}`.toLowerCase();
        const matchesQuery = str.includes(q);
        const matchesPasar = selectedPasar === 'ALL' || String(item.pasar || '').toUpperCase().includes(selectedPasar);
        return matchesQuery && matchesPasar;
      });

      // URUTKAN SECARA OTOMATIS BERDASARKAN NOMOR PERJANJIAN (ASCENDING 001 -> 999)
      const sorted = sortLogItems(filtered, 'nomorPerjanjian', 'blok');

      if (sorted.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = sorted.map((item, idx) => {
        return `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 text-center font-mono text-slate-500">${idx + 1}</td>
            <td class="px-4 py-3 font-mono font-bold text-amber-400">${escapeHTML(item.nomorPerjanjian || '-')}</td>
            <td class="px-4 py-3 font-mono ${textSecondary}">${escapeHTML(item.tanggalAkad || '-')} (${escapeHTML(item.hari || 'Senin')})</td>
            <td class="px-4 py-3 font-bold ${textPrimary}">${escapeHTML(item.namaPedagang || '-')}</td>
            <td class="px-4 py-3 font-medium text-amber-300">${escapeHTML(item.blok || '-')} • Pasar ${escapeHTML(item.pasar || 'Sandang')}</td>
            <td class="px-4 py-3 font-mono font-bold text-emerald-400">Rp ${escapeHTML(item.biayaSewa || '250.000')}</td>
            <td class="px-4 py-3">
              ${item.driveUrl ? `
                <a href="${item.driveUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>Buka PDF Kontrak</span>
                </a>
              ` : `<span class="text-slate-500 text-[11px]">Tersimpan di Sheet</span>`}
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button class="btn-revise-perjanjian p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all" data-no="${escapeHTML(item.nomorPerjanjian || '')}" data-pedagang="${escapeHTML(item.namaPedagang || '')}" data-nik="${escapeHTML(item.nik || '')}" data-alamat="${escapeHTML(item.alamat || '')}" data-blok="${escapeHTML(item.blok || '')}" data-pasar="${escapeHTML(item.pasar || '')}" title="Revisi Naskah (Ganti Nama / Nomor Tetap)">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button class="btn-delete-perjanjian p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all" data-no="${escapeHTML(item.nomorPerjanjian || '')}" data-url="${escapeHTML(item.driveUrl || '')}" data-pedagang="${escapeHTML(item.namaPedagang || '')}" data-blok="${escapeHTML(item.blok || '')}" title="Hapus / Batalkan Surat Perjanjian">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } else if (currentTab === 'kwitansi') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">
            <button id="th-sort-btn" class="flex items-center gap-1.5 font-bold uppercase hover:text-sky-400 transition-colors" title="Klik untuk balik urutan nomor">
              <span>Nomor Kwitansi</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${currentSort === 'num_asc' ? 'bg-sky-500/20 text-sky-400' : (currentSort === 'num_desc' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400')}">
                ${currentSort === 'num_asc' ? '▲ 001→999' : (currentSort === 'num_desc' ? '▼ 999→001' : '⏱️ Input')}
              </span>
            </button>
          </th>
          <th class="px-4 py-3">Tanggal Bayar</th>
          <th class="px-4 py-3">Diterima Dari</th>
          <th class="px-4 py-3">Objek Kios</th>
          <th class="px-4 py-3">Jumlah Uang</th>
          <th class="px-4 py-3">Arsip Google Drive</th>
          <th class="px-4 py-3 text-center w-20">Aksi</th>
        </tr>
      `;

      const filtered = kwitansiLogs.filter(item => {
        const str = `${item.nomorKwitansi || ''} ${item.namaPedagang || ''} ${item.blok || ''}`.toLowerCase();
        const matchesQuery = str.includes(q);
        const matchesPasar = selectedPasar === 'ALL' || String(item.pasar || '').toUpperCase().includes(selectedPasar);
        return matchesQuery && matchesPasar;
      });

      // URUTKAN SECARA OTOMATIS BERDASARKAN NOMOR KWITANSI (ASCENDING 001 -> 999)
      const sorted = sortLogItems(filtered, 'nomorKwitansi', 'blok');

      if (sorted.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = sorted.map((item, idx) => {
        return `
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 text-center font-mono text-slate-500">${idx + 1}</td>
            <td class="px-4 py-3 font-mono font-bold text-sky-400">${escapeHTML(item.nomorKwitansi || '-')}</td>
            <td class="px-4 py-3 font-mono ${textSecondary}">${escapeHTML(item.tanggal || '-')}</td>
            <td class="px-4 py-3 font-bold ${textPrimary}">${escapeHTML(item.namaPedagang || '-')}</td>
            <td class="px-4 py-3 font-medium text-sky-300">${escapeHTML(item.blok || '-')} • Pasar ${escapeHTML(item.pasar || 'Sandang')}</td>
            <td class="px-4 py-3 font-mono font-bold text-sky-400">${escapeHTML(item.nominal || 'Rp 250.000')}</td>
            <td class="px-4 py-3">
              ${item.driveUrl ? `
                <a href="${item.driveUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                  <span>Buka PDF Kwitansi</span>
                </a>
              ` : `<span class="text-slate-500 text-[11px]">Tersimpan di Sheet</span>`}
            </td>
            <td class="px-4 py-3 text-center">
              <button class="btn-delete-kwitansi p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all" data-no="${escapeHTML(item.nomorKwitansi || '')}" data-url="${escapeHTML(item.driveUrl || '')}" data-blok="${escapeHTML(item.blok || '')}" title="Hapus / Batalkan Kwitansi">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Bind Column Header Sort Toggle
    const thSortBtn = thead.querySelector('#th-sort-btn');
    if (thSortBtn) {
      thSortBtn.addEventListener('click', () => {
        currentSort = currentSort === 'num_asc' ? 'num_desc' : 'num_asc';
        window._agendaCurrentSort = currentSort;
        if (sortSelect) sortSelect.value = currentSort;
        renderTable();
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function setTab(tab) {
    currentTab = tab;
    window._agendaCurrentTab = tab;
    tabBtnSurat.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'surat' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent'}`;
    tabBtnPerjanjian.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'perjanjian' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-extrabold' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'}`;
    tabBtnKwitansi.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'kwitansi' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-extrabold' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent'}`;
    renderTable();
  }

  tabBtnSurat.addEventListener('click', () => setTab('surat'));
  tabBtnPerjanjian.addEventListener('click', () => setTab('perjanjian'));
  tabBtnKwitansi.addEventListener('click', () => setTab('kwitansi'));
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (pasarSelect) pasarSelect.addEventListener('change', renderTable);
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      window._agendaCurrentSort = currentSort;
      renderTable();
    });
  }

  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 animate-spin"></i><span>Sinkronisasi...</span>`;
      if (window.lucide) window.lucide.createIcons();

      await Promise.all([
        spreadsheetService.fetchRemoteAgenda(),
        spreadsheetService.fetchRemotePerjanjian(),
        spreadsheetService.fetchRemoteHistori()
      ]);

      agendaLogs = spreadsheetService.getAgendaLogs() || [];
      perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
      kwitansiLogs = spreadsheetService.getKwitansiLogs() || [];

      tabBtnSurat.querySelector('span').innerText = `Surat Pemberitahuan (${agendaLogs.length})`;
      tabBtnPerjanjian.querySelector('span').innerText = `Surat Perjanjian Kontrak (${perjanjianLogs.length})`;
      tabBtnKwitansi.querySelector('span').innerText = `Kwitansi Kas Desa (${kwitansiLogs.length})`;

      renderTable();
      btnSync.disabled = false;
      btnSync.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Sinkron Selesai</span>`;
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        btnSync.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Sinkronkan Cloud</span>`;
        if (window.lucide) window.lucide.createIcons();
      }, 3000);
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Bersihkan seluruh riwayat naskah & kwitansi lokal di peramban ini?')) {
        spreadsheetService.clearLocalAgenda();
        agendaLogs = [];
        perjanjianLogs = [];
        kwitansiLogs = [];
        tabBtnSurat.querySelector('span').innerText = `Surat Pemberitahuan (0)`;
        tabBtnPerjanjian.querySelector('span').innerText = `Surat Perjanjian Kontrak (0)`;
        tabBtnKwitansi.querySelector('span').innerText = `Kwitansi Kas Desa (0)`;
        renderTable();
      }
    });
  }

  // Event Delegation for Delete & Revise Perjanjian, Kwitansi, Surat
  tbody.addEventListener('click', async (e) => {
    // 0. Revisi Perjanjian (Ganti Nama / Nomor Tetap)
    const btnRevise = e.target.closest('.btn-revise-perjanjian');
    if (btnRevise) {
      const no = btnRevise.getAttribute('data-no');
      const pedagang = btnRevise.getAttribute('data-pedagang') || '';
      const nik = btnRevise.getAttribute('data-nik') || '';
      const alamat = btnRevise.getAttribute('data-alamat') || '';
      const blok = btnRevise.getAttribute('data-blok') || '';
      const pasar = btnRevise.getAttribute('data-pasar') || '';

      const modal = container.querySelector('#modal-revise-perjanjian');
      if (modal) {
        modal.querySelector('#revise-input-no').value = no;
        modal.querySelector('#revise-input-blok').value = `${blok} (${pasar || 'Pasar'})`;
        modal.querySelector('#revise-input-pedagang').value = pedagang;
        modal.querySelector('#revise-input-nik').value = (nik && nik !== '-') ? nik : '';
        modal.querySelector('#revise-input-alamat').value = (alamat && alamat !== '-') ? alamat : '';
        modal.setAttribute('data-target-blok', blok);
        modal.setAttribute('data-target-pasar', pasar);

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => modal.querySelector('#revise-input-pedagang')?.focus(), 100);
      }
      return;
    }

    // 1. Delete Perjanjian
    const btnDelPerjanjian = e.target.closest('.btn-delete-perjanjian');
    if (btnDelPerjanjian) {
      const noPerjanjian = btnDelPerjanjian.getAttribute('data-no');
      const driveUrl = btnDelPerjanjian.getAttribute('data-url');
      const pedagang = btnDelPerjanjian.getAttribute('data-pedagang') || '';
      const blok = btnDelPerjanjian.getAttribute('data-blok') || '';
      if (!noPerjanjian) return;

      const confirmed = confirm(`Apakah Anda yakin ingin membatalkan & menghapus Surat Perjanjian:\n${noPerjanjian} (${pedagang} - ${blok})?\n\nFile di Google Drive dan catatan database Google Sheet akan dihapus.`);
      if (!confirmed) return;

      btnDelPerjanjian.disabled = true;
      btnDelPerjanjian.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-rose-500"></i>`;
      if (window.lucide) window.lucide.createIcons();

      await spreadsheetService.deleteRemotePerjanjianDoc(noPerjanjian, driveUrl, pedagang, blok);
      perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
      tabBtnPerjanjian.querySelector('span').innerText = `Surat Perjanjian Kontrak (${perjanjianLogs.length})`;
      renderTable();
      return;
    }

    // 2. Delete Kwitansi
    const btnDelKwitansi = e.target.closest('.btn-delete-kwitansi');
    if (btnDelKwitansi) {
      const noKwitansi = btnDelKwitansi.getAttribute('data-no');
      const driveUrl = btnDelKwitansi.getAttribute('data-url');
      const blok = btnDelKwitansi.getAttribute('data-blok') || '';
      if (!noKwitansi) return;

      const confirmed = confirm(`Apakah Anda yakin ingin membatalkan & menghapus Kwitansi:\n${noKwitansi}?\n\nFile di Google Drive dan catatan database Google Sheet akan dihapus.`);
      if (!confirmed) return;

      btnDelKwitansi.disabled = true;
      btnDelKwitansi.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-rose-500"></i>`;
      if (window.lucide) window.lucide.createIcons();

      await spreadsheetService.deleteRemoteKwitansiDoc(noKwitansi, driveUrl, '', blok);
      kwitansiLogs = spreadsheetService.getKwitansiLogs() || [];
      tabBtnKwitansi.querySelector('span').innerText = `Kwitansi Kas Desa (${kwitansiLogs.length})`;
      renderTable();
      return;
    }

    // 3. Delete Surat Pemberitahuan
    const btnDelSurat = e.target.closest('.btn-delete-surat');
    if (btnDelSurat) {
      const noSurat = btnDelSurat.getAttribute('data-no');
      const driveUrl = btnDelSurat.getAttribute('data-url');
      if (!noSurat) return;

      const confirmed = confirm(`Apakah Anda yakin ingin membatalkan & menghapus Surat Pemberitahuan:\n${noSurat}?\n\nFile di Google Drive dan catatan buku agenda akan dihapus.`);
      if (!confirmed) return;

      btnDelSurat.disabled = true;
      btnDelSurat.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-rose-500"></i>`;
      if (window.lucide) window.lucide.createIcons();

      await spreadsheetService.deleteRemoteSuratDoc(noSurat, driveUrl);
      agendaLogs = spreadsheetService.getAgendaLogs() || [];
      tabBtnSurat.querySelector('span').innerText = `Surat Pemberitahuan (${agendaLogs.length})`;
      renderTable();
      return;
    }
  });

  // Modal Revisi Perjanjian Event Listeners
  const reviseModal = container.querySelector('#modal-revise-perjanjian');
  const btnCloseRevise = container.querySelector('#btn-close-revise-modal');
  const btnCancelRevise = container.querySelector('#btn-cancel-revise');
  const formRevise = container.querySelector('#form-revise-perjanjian');

  const closeReviseModal = () => {
    if (reviseModal) reviseModal.classList.add('hidden');
  };

  if (btnCloseRevise) btnCloseRevise.addEventListener('click', closeReviseModal);
  if (btnCancelRevise) btnCancelRevise.addEventListener('click', closeReviseModal);

  if (formRevise) {
    formRevise.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btnSubmit = formRevise.querySelector('#btn-submit-revise');
      const no = reviseModal.querySelector('#revise-input-no').value.trim();
      const blok = reviseModal.getAttribute('data-target-blok') || '';
      const pasar = reviseModal.getAttribute('data-target-pasar') || '';
      const newPedagang = reviseModal.querySelector('#revise-input-pedagang').value.trim().toUpperCase();
      const newNik = reviseModal.querySelector('#revise-input-nik').value.trim();
      const newAlamat = reviseModal.querySelector('#revise-input-alamat').value.trim();

      if (!newPedagang) return;

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Menerbitkan Ulang Dokumen...</span>`;
      if (window.lucide) window.lucide.createIcons();

      try {
        const res = await spreadsheetService.reviseRemotePerjanjian({
          nomor_perjanjian: no,
          blok_kios: blok,
          nama_pedagang: newPedagang,
          nik: newNik,
          alamat: newAlamat,
          zona: pasar
        });

        if (res && res.status === 'success') {
          closeReviseModal();
          perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
          renderTable();
          alert(`Berhasil! Surat Perjanjian ${no} telah direvisi atas nama ${newPedagang}.\nFile PDF baru telah diperbarui di Google Drive.`);
        } else {
          alert('Gagal merevisi surat: ' + (res?.message || 'Terjadi kesalahan sistem'));
        }
      } catch (err) {
        alert('Gagal merevisi surat: ' + err.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Simpan & Terbitkan PDF</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  renderTable();

  // Subscribe to updates when active in DOM
  spreadsheetService.subscribe(() => {
    if (container && container.isConnected) {
      agendaLogs = spreadsheetService.getAgendaLogs() || [];
      perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
      kwitansiLogs = spreadsheetService.getKwitansiLogs() || [];

      if (tabBtnSurat) tabBtnSurat.querySelector('span').innerText = `Surat Pemberitahuan (${agendaLogs.length})`;
      if (tabBtnPerjanjian) tabBtnPerjanjian.querySelector('span').innerText = `Surat Perjanjian Kontrak (${perjanjianLogs.length})`;
      if (tabBtnKwitansi) tabBtnKwitansi.querySelector('span').innerText = `Kwitansi Kas Desa (${kwitansiLogs.length})`;
      renderTable();
    }
  });

  // Background Silent Auto-Sync on Mount
  spreadsheetService.silentAutoSync().then(() => {
    agendaLogs = spreadsheetService.getAgendaLogs() || [];
    perjanjianLogs = spreadsheetService.getPerjanjianLogs() || [];
    kwitansiLogs = spreadsheetService.getKwitansiLogs() || [];

    if (tabBtnSurat) tabBtnSurat.querySelector('span').innerText = `Surat Pemberitahuan (${agendaLogs.length})`;
    if (tabBtnPerjanjian) tabBtnPerjanjian.querySelector('span').innerText = `Surat Perjanjian Kontrak (${perjanjianLogs.length})`;
    if (tabBtnKwitansi) tabBtnKwitansi.querySelector('span').innerText = `Kwitansi Kas Desa (${kwitansiLogs.length})`;
    renderTable();
  });
}
