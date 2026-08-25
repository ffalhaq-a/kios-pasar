import { renderLoginView } from './loginView.js';

export const AuthModule = {
  id: 'auth',
  title: 'Autentikasi',
  icon: 'lock',
  menus: [
    {
      id: 'login',
      label: 'Login',
      path: '/login',
      render: (container) => renderLoginView(container)
    }
  ]
};
