import { renderFieldCollectorView } from './views/fieldCollector.js';

export const FieldModule = {
  id: 'field',
  title: 'Pendataan Lapangan',
  icon: 'smartphone',
  menus: [
    {
      label: 'Pendataan Lapangan (PWA)',
      icon: 'smartphone',
      path: '/field'
    }
  ],
  views: {
    '/field': renderFieldCollectorView
  }
};
