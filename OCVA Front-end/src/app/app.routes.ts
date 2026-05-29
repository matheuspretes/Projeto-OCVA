import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then( m => m.InicioPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'dados',
    loadComponent: () => import('./pages/dados/dados.page').then( m => m.DadosPage)
  },
  {
    path: 'ensaios',
    loadComponent: () => import('./pages/ensaios/ensaios.page').then( m => m.EnsaiosPage)
  },
  {
    path: 'criar-ensaio',
    loadComponent: () => import('./pages/criar-ensaio/criar-ensaio.page').then( m => m.CriarEnsaioPage)
  },
];
