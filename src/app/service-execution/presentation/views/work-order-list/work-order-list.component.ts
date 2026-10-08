import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-work-order-list',
  imports: [CommonModule],
  templateUrl: './work-order-list.component.html',
  styleUrls: ['./work-order-list.component.css']
})
export class WorkOrderListComponent implements OnInit {
  workOrders = [
    { id: 'OT-101', machine: 'Inyectora 01', priority: 'HIGH', status: 'IN_PROGRESS', technician: 'Diego Rojas' },
    { id: 'OT-102', machine: 'Sopladora 03', priority: 'CRITICAL', status: 'PENDING', technician: 'Sin asignar' },
    { id: 'OT-103', machine: 'Faja Transportadora B', priority: 'MEDIUM', status: 'COMPLETED', technician: 'Diego Rojas' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  selectOrder(order: any): void {
    console.log('Orden seleccionada para ejecuciÃ³n/detalle:', order.id);
  }
}
