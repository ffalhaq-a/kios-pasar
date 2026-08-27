import { renderPengaturanView } from './view.js';

export const pengaturanModule = {
  id: 'pengaturan',
  name: 'Pengaturan Sistem',
  icon: 'settings',
  menus: [
    {
      label: 'Pengaturan Sistem',
      path: '/pengaturan',
      icon: 'settings'
    }
  ],
  routes: {
    '/pengaturan': (container) => renderPengaturanView(container)
  }
};
