import { renderPengaturanView } from './view.js';

export const pengaturanModule = {
  id: 'pengaturan',
  title: 'Pengaturan Sistem',
  icon: 'settings',
  menus: [
    {
      label: 'Pengaturan Sistem',
      icon: 'settings',
      path: '/pengaturan'
    }
  ],
  views: {
    '/pengaturan': renderPengaturanView
  }
};
