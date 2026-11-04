import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/scanner/scanner.component').then((m) => m.ScannerComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/event-list/event-list.component').then(
            (m) => m.EventListComponent,
          ),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./features/admin/event-detail/event-detail.component').then(
            (m) => m.EventDetailComponent,
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/admin/history/history.component').then(
            (m) => m.HistoryComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'admin' },
];
