import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { ClienteForm, Cliente } from '../cliente-form/cliente-form';
import { ClienteService } from '../../../../../core/services/cliente.service';
import { Client } from '../../../../../core/models/Client';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';

@Component({
  selector: 'app-cliente-create',
  standalone: true,
  imports: [ClienteForm, NotificationModalComponent],
  templateUrl: './cliente-create.html'
})
export class ClienteCreate {
  isSubmitting = false;
  isModalVisible = false;
  notification: NotificationData | null = null;

  constructor(private router: Router, private clienteService: ClienteService) {}

  goBack() {
    this.router.navigateByUrl('/clientes');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Cliente) {
    // Mapear a Client (API) con snake_case para fecha_nacimiento
    const payload: Client = {
      tipo_documento: item.tipoDocumento,
      numero_documento: item.numeroDocumento,
      nombre: item.nombre,
      apellido: item.apellido,
      fecha_nacimiento: item.fechaNacimiento,
      direccion: item.direccion,
      numero_contacto: item.numeroContacto,
      email: item.email,
    };

    this.isSubmitting = true;
    this.clienteService.crearCliente(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = this.getErrorMessage(err);
        this.notification = {
          type: 'error',
          title: 'Error al crear cliente',
          message,
          confirmable: false
        };
        this.isModalVisible = true;
      }
    });
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
  }

  private getErrorMessage(err: any): string {
    try {
      if (!err) return 'Ocurrió un error al crear el cliente. Intenta nuevamente.';
      const e = err.error ?? err;
      if (typeof e === 'string') return e;
      if (Array.isArray(e?.errors) && e.errors.length > 0) {
        return e.errors[0]?.message || 'Error desconocido del servidor';
      }
      if (typeof e?.message === 'string') return e.message;
      return 'Ocurrió un error al crear el cliente. Intenta nuevamente.';
    } catch {
      return 'Ocurrió un error al crear el cliente. Intenta nuevamente.';
    }
  }
}