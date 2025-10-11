import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteForm, Cliente } from '../cliente-form/cliente-form';

@Component({
  selector: 'app-cliente-create',
  standalone: true,
  imports: [CommonModule, ClienteForm],
  templateUrl: './cliente-create.html'
})
export class ClienteCreate {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigateByUrl('/clientes');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Cliente) {
    // Aquí puedes integrar un servicio para persistir datos.
    // Por ahora, regresamos a la lista de clientes.
    this.goBack();
  }
}