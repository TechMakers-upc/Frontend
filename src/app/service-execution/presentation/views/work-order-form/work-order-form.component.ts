import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-work-order-form',
  imports: [FormsModule],
  templateUrl: './work-order-form.component.html',
  styleUrls: ['./work-order-form.component.css']
})
export class WorkOrderFormComponent implements OnInit {
  workOrder = {
    machineId: '',
    description: '',
    priority: 'HIGH',
    assignedTechnician: ''
  };

  constructor() { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    console.log('Orden de trabajo correctiva creada y asignada:', this.workOrder);
    alert('Â¡Orden de trabajo creada con Ã©xito!');
  }
}
