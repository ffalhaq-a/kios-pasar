import { themeManager } from '../../../shell/ThemeManager.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { escapeHTML } from '../../../utils/security.js';

export function renderAgendaSuratView(container) {
  if (!container) return;

  const isDark = themeManager.isDark();
  let currentTab = 'surat'; // 'surat' | 'perjanjian' | 'kwitansi'

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
        <button id="tab-btn-surat" class="px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <i data-lucide="file-text" class="w-4 h-4"></i>
          <span>Surat Pemberitahuan (${agendaLogs.length})</span>
        </button>

        <button id="tab-btn-perjanjian" class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent">
          <i data-lucide="file-signature" class="w-4 h-4"></i>
          <span>Surat Perjanjian Kontrak (${perjanjianLogs.length})</span>
        </button>

        <button id="tab-btn-kwitansi" class="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent">
          <i data-lucide="receipt" class="w-4 h-4"></i>
          <span>Kwitansi Kas Desa (${kwitansiLogs.length})</span>
        </button>
      </div>

      <!-- SEARCH & FILTER BAR -->
      <div class="${cardBg} border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
          <input type="text" id="input-search-agenda" placeholder="Cari nomor, nama pedagang, atau blok..." class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
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
  `;

  const thead = container.querySelector('#agenda-table-head');
  const tbody = container.querySelector('#agenda-table-body');
  const emptyState = container.querySelector('#agenda-empty-state');
  const searchInput = container.querySelector('#input-search-agenda');
  const tabBtnSurat = container.querySelector('#tab-btn-surat');
  const tabBtnPerjanjian = container.querySelector('#tab-btn-perjanjian');
  const tabBtnKwitansi = container.querySelector('#tab-btn-kwitansi');
  const btnSync = container.querySelector('#btn-sync-cloud-agenda');
  const btnClear = container.querySelector('#btn-clear-local-agenda');

  function renderTable() {
    const q = (searchInput?.value || '').toLowerCase().trim();

    if (currentTab === 'surat') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">Nomor Surat</th>
          <th class="px-4 py-3">Tanggal</th>
          <th class="px-4 py-3">Tujuan / Pedagang</th>
          <th class="px-4 py-3">Perihal</th>
          <th class="px-4 py-3">Keterangan / Link Drive</th>
        </tr>
      `;

      const filtered = agendaLogs.filter(item => {
        const str = `${item.nomorSurat || ''} ${item.tujuan || ''} ${item.ket || ''}`.toLowerCase();
        return str.includes(q);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map((item, idx) => {
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
          </tr>
        `;
      }).join('');

    } else if (currentTab === 'perjanjian') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">Nomor Perjanjian</th>
          <th class="px-4 py-3">Tanggal Akad</th>
          <th class="px-4 py-3">Pihak II (Pedagang)</th>
          <th class="px-4 py-3">Blok & Kawasan</th>
          <th class="px-4 py-3">Biaya Sewa</th>
          <th class="px-4 py-3">Arsip Google Drive</th>
        </tr>
      `;

      const filtered = perjanjianLogs.filter(item => {
        const str = `${item.nomorPerjanjian || ''} ${item.namaPedagang || ''} ${item.blok || ''}`.toLowerCase();
        return str.includes(q);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map((item, idx) => {
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
          </tr>
        `;
      }).join('');

    } else if (currentTab === 'kwitansi') {
      thead.innerHTML = `
        <tr>
          <th class="px-4 py-3 text-center w-12">No</th>
          <th class="px-4 py-3">Nomor Kwitansi</th>
          <th class="px-4 py-3">Tanggal Bayar</th>
          <th class="px-4 py-3">Diterima Dari</th>
          <th class="px-4 py-3">Objek Kios</th>
          <th class="px-4 py-3">Jumlah Uang</th>
          <th class="px-4 py-3">Arsip Google Drive</th>
        </tr>
      `;

      const filtered = kwitansiLogs.filter(item => {
        const str = `${item.nomorKwitansi || ''} ${item.namaPedagang || ''} ${item.blok || ''}`.toLowerCase();
        return str.includes(q);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map((item, idx) => {
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
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function setTab(tab) {
    currentTab = tab;
    tabBtnSurat.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'surat' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent'}`;
    tabBtnPerjanjian.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'perjanjian' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-extrabold' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'}`;
    tabBtnKwitansi.className = `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${tab === 'kwitansi' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-extrabold' : 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent'}`;
    renderTable();
  }

  tabBtnSurat.addEventListener('click', () => setTab('surat'));
  tabBtnPerjanjian.addEventListener('click', () => setTab('perjanjian'));
  tabBtnKwitansi.addEventListener('click', () => setTab('kwitansi'));
  if (searchInput) searchInput.addEventListener('input', renderTable);

  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5 animate-spin"></i><span>Sinkronisasi...</span>`;
      if (window.lucide) window.lucide.createIcons();

      await Promise.all([
        spreadsheetService.fetchRemoteAgenda(),
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

  renderTable();
}
