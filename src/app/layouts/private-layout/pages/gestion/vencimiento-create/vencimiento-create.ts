import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VencimientoForm } from '../vencimiento-form/vencimiento-form';
import { Management } from '../../../../../core/models/Management';

@Component({
  selector: 'app-vencimiento-create',
  standalone: true,
  imports: [CommonModule, VencimientoForm],
  templateUrl: './vencimiento-create.html'
})
export class VencimientoCreate {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigateByUrl('/gestion');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Management) {
    // Navega de regreso y podría pasarse estado si fuera necesario;
    // por ahora, solo regresamos a la lista.
    this.goBack();
  }
}