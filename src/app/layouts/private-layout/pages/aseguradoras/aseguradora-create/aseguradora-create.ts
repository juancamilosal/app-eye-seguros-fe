import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AseguradoraForm } from '../aseguradora-form/aseguradora-form';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';
import { AseguradoraService } from '../../../../../core/services/aseguradora.service';
import { Aseguradora } from '../../../../../core/models/Aseguradora';

@Component({
  selector: 'app-aseguradora-create',
  standalone: true,
  imports: [AseguradoraForm, NotificationModalComponent],
  templateUrl: './aseguradora-create.html'
})
export class AseguradoraCreate {
  isSubmitting = false;
  isModalVisible = false;
  notification: NotificationData | null = null;

  constructor(private router: Router, private aseguradoraService: AseguradoraService) {}

  goBack() {
    this.router.navigateByUrl('/aseguradoras');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Aseguradora) {
    const payload = {
      nombre: item.nombre,
      telefono_bogota: item.telefono_bogota || undefined,
      telefono_nacional: item.telefono_nacional || undefined,
      telefono_celular: item.telefono_celular || undefined,
      web: item.web || undefined,
      email: item.email || undefined
    } as Partial<Aseguradora>;

    this.isSubmitting = true;
    this.aseguradoraService.crearAseguradora(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = this.getErrorMessage(err);
        this.notification = {
          type: 'error',
          title: 'Error al crear aseguradora',
          message,
          confirmable: false
        };
        this.isModalVisible = true;
      }
    });
  }

  getErrorMessage(err: any): string {
    if (!err) return 'Ocurrió un error inesperado';
    try {
      const msg = err?.error?.errors?.[0]?.message || err?.message || err?.statusText;
      return String(msg || '').trim() || 'Ocurrió un error inesperado';
    } catch {
      return 'Ocurrió un error inesperado';
    }
  }
}