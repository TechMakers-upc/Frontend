import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-work-order-detail',
  templateUrl: './work-order-detail.component.html',
  styleUrls: ['./work-order-detail.component.css']
})
export class WorkOrderDetailComponent implements OnInit {
  orderDetail = {
    id: 'OT-101',
    machine: 'Inyectora 01',
    description: 'Falla en la presión hidráulica principal del inyector.',
    status: 'IN_PROGRESS',
    executionNotes: ''
  };

  constructor() { }

  ngOnInit(): void {
  }

  startWork(): void {
    this.orderDetail.status = 'IN_PROGRESS';
    alert('Orden de trabajo iniciada (En Progreso).');
  }

  closeWorkOrder(): void {
    if (!this.executionNotes.trim()) {
      alert('Debe registrar el trabajo realizado antes de cerrar la OT.');
      return;
    }
    this.orderDetail.status = 'COMPLETED';
    alert('¡Orden de trabajo cerrada y completada con éxito!');
  }

  get executionNotes(): string {
    return this.orderDetail.executionNotes;
  }
  set executionNotes(val: string) {
    this.orderDetail.executionNotes = val;
  }
}
