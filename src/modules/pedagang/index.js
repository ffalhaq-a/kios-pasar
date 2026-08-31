import { renderDaftarPedagangView } from './views/daftar.js';

export const PedagangModule = {
  id: 'pedagang',
  title: 'Manajemen Pedagang',
  icon: 'users',
  menus: [
    {
      id: 'daftar-pedagang',
      label: 'Daftar Pedagang',
      icon: 'users',
      path: '/pedagang/daftar'
    }
  ],
  views: {
    '/pedagang/daftar': (container) => renderDaftarPedagangView(container),
    '/pedagang': (container) => renderDaftarPedagangView(container)
  }
};
