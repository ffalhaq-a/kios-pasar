import { themeManager } from '../../../shell/ThemeManager.js';
import { spreadsheetService } from '../../../services/SpreadsheetService.js';
import { escapeHTML } from '../../../utils/security.js';

export function renderAgendaSuratView(container) {
  if (!container) return;

  const isDark = themeManager.isDark();
  let agendaLogs = [];
  try {
    agendaLogs = spreadsheetService.getAgendaLogs() || [];
  } catch (e) {
    console.warn('Error reading agenda logs:', e);
    agendaLogs = [];
  }

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
            <span>${agendaLogs.length} Surat Teragenda</span>
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
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tersambung Google Sheets (Buku_Agenda_Surat)</span>
          </span>
        </div>
      </div>

      <!-- TABEL 8 KOLOM RESMI BUKU AGENDA SURAT -->
      <div class="${cardBg} border rounded-2xl overflow-hidden shadow-sm">
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
                  <td colspan="8" class="p-12 text-center text-slate-500">
                    <div class="flex flex-col items-center justify-center space-y-3">
                      <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <i data-lucide="book-open" class="w-6 h-6"></i>
                      </div>
                      <div class="space-y-1">
                        <p class="text-sm font-bold ${textPrimary}">Belum Ada Catatan Agenda Surat</p>
                        <p class="text-xs ${textSecondary} max-w-md mx-auto">
                          Setiap surat yang Anda unduh di menu <b>Surat Pemberitahuan</b> akan otomatis dicatat nomornya di sini dan diarsipkan ke Google Drive / Google Sheets.
                        </p>
                      </div>
                      <button id="btn-goto-surat-from-agenda" class="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all">
                        <i data-lucide="file-plus" class="w-4 h-4"></i>
                        <span>Buka Surat Pemberitahuan</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ` : agendaLogs.map((item, idx) => `
                <tr class="hover:bg-slate-800/10 transition-colors">
                  <td class="px-3 py-2.5 text-center font-bold border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}">
                    ${item.no || (idx + 1)}
                  </td>
                  <td class="px-3.5 py-2.5 font-mono font-bold text-emerald-500 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'} whitespace-nowrap">
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

  if (window.lucide) window.lucide.createIcons();

  // Button Navigate to Surat
  container.querySelector('#btn-goto-surat-from-agenda')?.addEventListener('click', () => {
    if (window._navigate) window._navigate('/surat/pemberitahuan');
  });

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
