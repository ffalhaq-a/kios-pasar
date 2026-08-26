import { renderSuratView } from './view.js';
import { renderTemplateEditorView } from './views/template.js';

export const SuratModule = {
  id: 'surat',
  title: 'Surat & Perjanjian',
  icon: 'file-text',
  menus: [
    {
      id: 'surat-parent',
      label: 'Surat & Perjanjian',
      icon: 'file-text',
      submenus: [
        {
          id: 'surat-pemberitahuan',
          label: 'Surat Pemberitahuan',
          icon: 'file-text',
          path: '/surat/pemberitahuan'
        },
        {
          id: 'surat-template',
          label: 'Pengaturan Template',
          icon: 'sliders',
          path: '/surat/template'
        },
        {
          id: 'surat-perjanjian',
          label: 'Surat Perjanjian',
          icon: 'file-signature',
          path: '/surat/perjanjian'
        }
      ]
    }
  ],
  views: {
    '/surat': (container) => renderSuratView(container),
    '/surat/pemberitahuan': (container) => {
      const urlParams = new URLSearchParams(window.location.search);
      const initialKiosId = urlParams.get('kiosId') || window._selectedKiosIdForSurat || null;
      window._selectedKiosIdForSurat = null;
      renderSuratView(container, initialKiosId);
    },
    '/surat/template': (container) => {
      renderTemplateEditorView(container);
    },
    '/surat/perjanjian': (container) => {
      container.innerHTML = `
        <div class="p-8 text-center space-y-4 max-w-lg mx-auto my-auto flex flex-col items-center justify-center h-full">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <i data-lucide="file-signature" class="w-8 h-8"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-100">Surat Perjanjian Sewa Kios</h2>
            <p class="text-xs text-slate-400 mt-1">Modul Surat Perjanjian sedang disiapkan dan akan segera aktif.</p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
};
