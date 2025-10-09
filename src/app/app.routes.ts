import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./layouts/public-layout/pages/login/login').then(m => m.Login)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/private-layout/private-layout').then(m => m.PrivateLayout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./layouts/private-layout/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'clients',
        loadComponent: () => import('./layouts/private-layout/pages/clients/clients').then(m => m.Clients)
      },
      {
        path: 'gestion',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/gestion').then(m => m.Gestion)
      }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
