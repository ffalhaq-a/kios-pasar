import { renderSuratView } from './view.js';

export const SuratModule = {
  id: 'surat',
  title: 'Surat & Dokumen',
  icon: 'file-text',
  menus: [
    {
      id: 'surat-pemberitahuan',
      label: 'Surat & Perjanjian',
      icon: 'file-text',
      path: '/surat'
    }
  ],
  views: {
    '/surat': (container) => {
      // Support query param /surat?kiosId=...
      const urlParams = new URLSearchParams(window.location.search);
      const initialKiosId = urlParams.get('kiosId') || window._selectedKiosIdForSurat || null;
      window._selectedKiosIdForSurat = null; // Clear
      renderSuratView(container, initialKiosId);
    }
  }
};
