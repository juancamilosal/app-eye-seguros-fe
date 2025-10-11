import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteForm, Cliente } from '../cliente-form/cliente-form';
import {ClienteService} from "../../../../../core/services/cliente.service";

@Component({
  selector: 'app-cliente-create',
  standalone: true,
  imports: [CommonModule, ClienteForm],
  templateUrl: './cliente-create.html'
})
export class ClienteCreate {
  isSubmitting = false;

  constructor(private router: Router, private clienteService: ClienteService) {}

  goBack() {
    this.router.navigateByUrl('/clientes');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Cliente) {
    // Mapear a Client (API) con snake_case para fecha_nacimiento
    const payload = {
      tipo_documento: item.tipoDocumento,
      numero_documento: item.numeroDocumento,
      nombre: item.nombre,
      apellido: item.apellido,
      fecha_nacimiento: item.fechaNacimiento,
      direccion: item.direccion,
      email: item.email,
    } as any;

    this.isSubmitting = true;
    this.clienteService.crearCliente(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: () => {
        this.isSubmitting = false;
        // Podrías mostrar notificación de error aquí
      }
    });
  }
}