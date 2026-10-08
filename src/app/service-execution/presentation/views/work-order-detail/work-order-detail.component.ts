import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-work-order-detail',
  imports: [FormsModule],
  templateUrl: './work-order-detail.component.html',
  styleUrls: ['./work-order-detail.component.css']
})
export class WorkOrderDetailComponent implements OnInit {
  orderDetail = {
    id: 'OT-101',
    machine: 'Inyectora 01',
    description: 'Falla en la presiÃ³n hidrÃ¡ulica principal del inyector.',
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
    alert('Â¡Orden de trabajo cerrada y completada con Ã©xito!');
  }

  get executionNotes(): string {
    return this.orderDetail.executionNotes;
  }
  set executionNotes(val: string) {
    this.orderDetail.executionNotes = val;
  }
}
