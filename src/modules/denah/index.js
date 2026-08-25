import { renderFloorplanView } from './views/floorplan.js';

export const DenahModule = {
  id: 'denah',
  title: 'Denah Kios',
  icon: 'map-pin',
  menus: [
    {
      label: 'Denah Kios 2D',
      icon: 'map-pin',
      path: '/denah'
    }
  ],
  views: {
    '/denah': renderFloorplanView
  }
};
