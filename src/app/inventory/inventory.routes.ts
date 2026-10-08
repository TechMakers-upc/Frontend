import { Routes } from '@angular/router';

import { roleGuard } from '../shared/presentation/session/session.guards';

export const inventoryRoutes: Routes = [
  {
    path: 'inventory',
    canActivate: [roleGuard('plant-manager', 'technician')],
    title: 'nav.inventory',
    loadComponent: () => import('./presentation/views/part-list/part-list').then((m) => m.PartList),
  },
  {
    path: 'inventory/new',
    canActivate: [roleGuard('plant-manager')],
    title: 'inventory.newTitle',
    loadComponent: () => import('./presentation/views/part-form/part-form').then((m) => m.PartForm),
  },
  {
    path: 'inventory/:id',
    canActivate: [roleGuard('plant-manager', 'technician')],
    title: 'nav.inventory',
    loadComponent: () =>
      import('./presentation/views/part-detail/part-detail').then((m) => m.PartDetail),
  },
  {
    path: 'inventory/:id/edit',
    canActivate: [roleGuard('plant-manager')],
    title: 'inventory.editTitle',
    loadComponent: () => import('./presentation/views/part-form/part-form').then((m) => m.PartForm),
  },
];
