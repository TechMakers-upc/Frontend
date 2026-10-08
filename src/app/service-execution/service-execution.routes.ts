import { Routes } from '@angular/router';

import { roleGuard } from '../shared/presentation/session/session.guards';

const managers = roleGuard('plant-manager', 'operations-manager');

export const serviceExecutionRoutes: Routes = [
  {
    path: 'today',
    canActivate: [roleGuard('technician')],
    title: 'nav.today',
    loadComponent: () =>
      import('./presentation/views/technician-today/technician-today').then((m) => m.TechnicianToday),
  },
  {
    path: 'failures',
    canActivate: [managers],
    title: 'nav.failures',
    loadComponent: () => import('./presentation/views/failure-list/failure-list').then((m) => m.FailureList),
  },
  {
    path: 'failures/report',
    canActivate: [roleGuard('technician', 'plant-manager')],
    title: 'report.title',
    loadComponent: () => import('./presentation/views/failure-report/failure-report').then((m) => m.FailureReport),
  },
  {
    path: 'failures/:id',
    canActivate: [managers],
    title: 'nav.failures',
    loadComponent: () => import('./presentation/views/failure-detail/failure-detail').then((m) => m.FailureDetail),
  },
  {
    path: 'work-orders',
    title: 'nav.workOrders',
    loadComponent: () => import('./presentation/views/work-order-list/work-order-list').then((m) => m.WorkOrderList),
  },
  {
    path: 'work-orders/new',
    canActivate: [managers],
    title: 'workOrders.newTitle',
    loadComponent: () => import('./presentation/views/work-order-form/work-order-form').then((m) => m.WorkOrderForm),
  },
  {
    path: 'work-orders/:id',
    title: 'nav.workOrders',
    loadComponent: () =>
      import('./presentation/views/work-order-detail/work-order-detail').then((m) => m.WorkOrderDetail),
  },
  {
    path: 'work-orders/:id/edit',
    canActivate: [managers],
    title: 'nav.workOrders',
    loadComponent: () => import('./presentation/views/work-order-form/work-order-form').then((m) => m.WorkOrderForm),
  },
];
