import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    canActivate: [authGuard],
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
        path: 'aseguradoras',
        title: 'Euyenid & Edder | Aseguradoras',
        loadComponent: () => import('./layouts/private-layout/pages/aseguradoras/aseguradoras').then(m => m.Aseguradoras)
      },
      {
        path: 'aseguradoras/nuevo',
        title: 'Euyenid & Edder | Nueva Aseguradora',
        loadComponent: () => import('./layouts/private-layout/pages/aseguradoras/aseguradora-create/aseguradora-create').then(m => m.AseguradoraCreate)
      },
      {
        path: 'gestion',
        title: 'Euyenid & Edder | Gestión',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/gestion').then(m => m.Gestion)
      }
      ,
      {
        path: 'vencimientos',
        title: 'Euyenid & Edder | Vencimientos',
        loadComponent: () => import('./layouts/private-layout/pages/vencimientos/vencimientos').then(m => m.Vencimientos)
      }
      ,
      {
        path: 'gestion/nuevo',
        title: 'Euyenid & Edder | Nuevo Vencimiento',
        loadComponent: () => import('./layouts/private-layout/pages/gestion/gestion-create/gestion-create').then(m => m.GestionCreate)
      }
      ,
      {
        path: 'clientes/nuevo',
        title: 'Euyenid & Edder | Nuevo Cliente',
        loadComponent: () => import('./layouts/private-layout/pages/clientes/cliente-create/cliente-create').then(m => m.ClienteCreate)
      }
      ,
      {
        path: 'usuarios',
        title: 'Euyenid & Edder | Usuarios',
        loadComponent: () => import('./layouts/private-layout/pages/usuarios/usuarios').then(m => m.Usuarios)
      }
      ,
      {
        path: 'usuarios/nuevo',
        title: 'Euyenid & Edder | Nuevo Usuario',
        loadComponent: () => import('./layouts/private-layout/pages/usuarios/usuario-create/usuario-create').then(m => m.UsuarioCreate)
      }
      
    ]
  },
  { path: '**', redirectTo: 'login' }
];
