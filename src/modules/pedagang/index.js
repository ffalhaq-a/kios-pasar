import { renderDaftarPedagangView } from './views/daftar.js';
import { renderKategoriPedagangView } from './views/kategori.js';

export const PedagangModule = {
  id: 'pedagang',
  title: 'Manajemen Pedagang',
  icon: 'users',
  menus: [
    {
      label: 'Kelola Pedagang',
      icon: 'users',
      submenus: [
        {
          label: 'Daftar Pedagang',
          icon: 'list',
          path: '/pedagang/daftar'
        },
        {
          label: 'Kategori Usaha',
          icon: 'tag',
          path: '/pedagang/kategori'
        }
      ]
    }
  ],
  views: {
    '/pedagang': renderDaftarPedagangView,
    '/pedagang/daftar': renderDaftarPedagangView,
    '/pedagang/kategori': renderKategoriPedagangView
  }
};
