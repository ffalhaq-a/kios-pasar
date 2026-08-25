import { renderDashboardView } from './view.js';

export const DashboardModule = {
  id: 'dashboard',
  title: 'Dashboard',
  icon: 'layout-dashboard',
  menus: [
    {
      label: 'Dashboard',
      icon: 'layout-dashboard',
      path: '/dashboard'
    }
  ],
  views: {
    '/dashboard': renderDashboardView
  }
};
