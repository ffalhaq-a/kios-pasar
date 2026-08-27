import { themeManager } from '../../../shell/ThemeManager.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { escapeHTML } from '../../../utils/security.js';

export function renderAgendaSuratView(container) {
  const isDark = themeManager.isDark();
  const agendaLogs = spreadsheetService.getAgendaLogs();

  const cardBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  container.innerHTML = `
    <div class="p-6 space-y-6 overflow-y-auto h-full ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}">
      
      <!-- HEADER -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold ${textPrimary} flex items-center gap-2">
            <i data-lucide="book-open" class="w-6 h-6 text-emerald-500"></i>
            <span>Buku Agenda Surat Keluar</span>
          </h1>
          <p class="text-xs ${textSecondary} mt-0.5">Rekapitulasi riwayat nomor naskah dinas & arsip cloud Google Drive (Sheet: Buku_Agenda_Surat)</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Total Terbit Badge -->
          <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
            <i data-lucide="file-check" class="w-3.5 h-3.5"></i>
            <span>${agendaLogs.length} Surat Keluar</span>
          </span>

          <button id="btn-export-agenda-csv" class="border px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${cardBg} ${textPrimary} hover:border-emerald-500 shadow-sm">
            <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-500"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- SEARCH & FILTER BAR -->
      <div class="${cardBg} border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
          <input type="text" id="input-search-agenda" placeholder="Cari nomor surat, tujuan, atau blok..." class="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none ${inputBg}" />
        </div>
        <p class="text-[11px] ${textSecondary}">
          Tersinkronisasi otomatis ke Google Spreadsheet Sheet <b>"Buku_Agenda_Surat"</b>
        </p>
      </div>

      <!-- TABEL 8 KOLOM RESMI BUKU AGENDA SURAT -->
      <div class="${cardBg} border rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse" id="table-agenda-surat">
            <thead class="text-[10px] uppercase tracking-wider font-extrabold ${isDark ? 'bg-slate-900 text-slate-300 border-b border-slate-800' : 'bg-slate-100 text-slate-700 border-b border-slate-200'}">
              <tr>
                <th class="px-3 py-3 text-center border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} w-12">NO</th>
                <th class="px-3.5 py-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">NOMOR SURAT</th>
                <th class="px-3.5 py-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">TANGGAL SURAT</th>
                <th class="px-3.5 py-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">PERIHAL</th>
                <th class="px-3 py-3 text-center border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} w-20">LAMPIRAN</th>
                <th class="px-3.5 py-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">TANGGAL KIRIM</th>
                <th class="px-3.5 py-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">TUJUAN</th>
                <th class="px-3.5 py-3">KET</th>
              </tr>
            </thead>
            <tbody id="tbody-agenda" class="divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}">
              ${agendaLogs.length === 0 ? `
                <tr>
                  <td colspan="8" class="p-8 text-center text-slate-500">
                    <div class="flex flex-col items-center justify-center space-y-2">
                      <i data-lucide="inbox" class="w-8 h-8 opacity-40"></i>
                      <p class="text-xs">Belum ada surat yang diterbitkan. Silakan generate surat di menu <b>Surat Pemberitahuan</b>.</p>
                    </div>
                  </td>
                </tr>
              ` : agendaLogs.map((item, idx) => `
                <tr class="hover:bg-slate-800/10 transition-colors">
                  <td class="px-3 py-2.5 text-center font-bold border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${item.no || (idx + 1)}
                  </td>
                  <td class="px-3.5 py-2.5 font-mono font-bold text-emerald-500 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${escapeHTML(item.nomorSurat)}
                  </td>
                  <td class="px-3.5 py-2.5 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} whitespace-nowrap">
                    ${escapeHTML(item.tanggalSurat)}
                  </td>
                  <td class="px-3.5 py-2.5 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${escapeHTML(item.perihal)}
                  </td>
                  <td class="px-3 py-2.5 text-center border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${escapeHTML(item.lampiran || '-')}
                  </td>
                  <td class="px-3.5 py-2.5 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} whitespace-nowrap">
                    ${escapeHTML(item.tanggalKirim)}
                  </td>
                  <td class="px-3.5 py-2.5 font-bold ${textPrimary} border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${escapeHTML(item.tujuan)}
                  </td>
                  <td class="px-3.5 py-2.5 text-[11px] ${textSecondary}">
                    <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
                      ${escapeHTML(item.ket || 'Tercatat')}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Search Filter Handler
  const searchInput = container.querySelector('#input-search-agenda');
  const tbody = container.querySelector('#tbody-agenda');

  if (searchInput && tbody) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Export CSV Handler
  const btnExport = container.querySelector('#btn-export-agenda-csv');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (agendaLogs.length === 0) {
        alert('Tidak ada data agenda surat untuk di-export!');
        return;
      }

      let csv = 'NO,NOMOR SURAT,TANGGAL SURAT,PERIHAL,LAMPIRAN,TANGGAL KIRIM,TUJUAN,KET\n';
      agendaLogs.forEach((item, idx) => {
        csv += `"${item.no || (idx + 1)}","${item.nomorSurat}","${item.tanggalSurat}","${item.perihal}","${item.lampiran || '-'}","${item.tanggalKirim}","${item.tujuan}","${item.ket || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Buku_Agenda_Surat_Keluar_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    });
  }
}
