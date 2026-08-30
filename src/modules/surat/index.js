import { renderSuratView } from './view.js';
import { renderTemplateEditorView } from './views/template.js';
import { renderAgendaSuratView } from './views/agenda.js';
import { renderPerjanjianView } from './views/perjanjian.js';

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
          id: 'surat-perjanjian',
          label: 'Surat Perjanjian (Kontrak)',
          icon: 'file-signature',
          path: '/surat/perjanjian'
        },
        {
          id: 'surat-agenda',
          label: 'Buku Agenda Surat',
          icon: 'book-open',
          path: '/surat/agenda'
        },
        {
          id: 'surat-template',
          label: 'Pengaturan Template',
          icon: 'sliders',
          path: '/surat/template'
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
    '/surat/perjanjian': (container) => {
      const urlParams = new URLSearchParams(window.location.search);
      const initialKiosId = urlParams.get('kiosId') || window._selectedKiosIdForPerjanjian || null;
      window._selectedKiosIdForPerjanjian = null;
      renderPerjanjianView(container, initialKiosId);
    },
    '/surat/agenda': (container) => {
      renderAgendaSuratView(container);
    },
    '/surat/template': (container) => {
      renderTemplateEditorView(container);
    }
  }
};
