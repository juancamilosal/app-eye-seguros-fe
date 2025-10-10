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
        path: 'clientes',
        title: 'Euyenid & Edder | Clientes',
        loadComponent: () => import('./layouts/private-layout/pages/clientes/clientes').then(m => m.Clientes)
      },
      {
        path: 'gestion',
        title: 'Euyenid & Edder | Gestión',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/gestion').then(m => m.Gestion)
      }
      ,
      {
        path: 'gestion/nuevo',
        title: 'Euyenid & Edder | Nuevo Vencimiento',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/vencimiento-create/vencimiento-create').then(m => m.VencimientoCreate)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
