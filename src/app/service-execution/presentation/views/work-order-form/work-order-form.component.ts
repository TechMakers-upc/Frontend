import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-work-order-form',
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
    alert('¡Orden de trabajo creada con éxito!');
  }
}
