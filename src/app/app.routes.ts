import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    title: 'Euyenid & Edder | Login',
    loadComponent: () => import('./layouts/public-layout/pages/login/login').then(m => m.Login)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/private-layout/private-layout').then(m => m.PrivateLayout),
    children: [
      {
        path: 'dashboard',
        title: 'Euyenid & Edder | Dashboard',
        loadComponent: () => import('./layouts/private-layout/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'clients',
        title: 'Euyenid & Edder | Clientes',
        loadComponent: () => import('./layouts/private-layout/pages/clients/clients').then(m => m.Clients)
      },
      {
        path: 'gestion',
        title: 'Euyenid & Edder | Gestión',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/gestion').then(m => m.Gestion)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
