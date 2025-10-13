import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { VencimientoForm } from '../vencimiento-form/vencimiento-form';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';
import { VencimientoService, VencimientoPayload } from '../../../../../core/services/vencimiento.service';
import { Management } from '../../../../../core/models/Management';

@Component({
  selector: 'app-vencimiento-create',
  standalone: true,
  imports: [VencimientoForm, NotificationModalComponent],
  templateUrl: './vencimiento-create.html'
})
export class VencimientoCreate {
  isSubmitting = false;
  isModalVisible = false;
  notification: NotificationData | null = null;

  constructor(private router: Router, private vencimientoService: VencimientoService) {}

  goBack() {
    this.router.navigateByUrl('/gestion');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Management & { titularId?: string }) {
    // Se espera que el formulario provea el ID del titular (cliente) en item.titularId
    const payload: VencimientoPayload = {
      cliente_id: item.titularId || '',
      numero_poliza: item.numeroPoliza,
      tipo_poliza: item.tipoPoliza,
      forma_pago: item.formaPagoRenovacion,
      valor_poliza_anterior: item.valorAnterior,
      valor_poliza_actual: item.valorActual,
      fecha_vencimiento: item.fechaVencimiento,
      aseguradora: item.aseguradora,
      estado: item.estado,
      prenda: !!item.prenda,
      es_vehiculo: !!item.esVehiculo,
      placa: item.esVehiculo ? (item.placa || '') : undefined,
      entidad_prendaria: item.prenda ? (item.entidadPrendaria || '') : undefined,
    };

    this.isSubmitting = true;
    this.vencimientoService.crearVencimiento(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = this.getErrorMessage(err);
        this.notification = {
          type: 'error',
          title: 'Error al crear vencimiento',
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
      if (!err) return 'Ocurrió un error al crear el vencimiento. Intenta nuevamente.';
      const e = err.error ?? err;
      if (typeof e === 'string') return e;
      if (Array.isArray(e?.errors) && e.errors.length > 0) {
        return e.errors[0]?.message || 'Error desconocido del servidor';
      }
      if (typeof e?.message === 'string') return e.message;
      return 'Ocurrió un error al crear el vencimiento. Intenta nuevamente.';
    } catch {
      return 'Ocurrió un error al crear el vencimiento. Intenta nuevamente.';
    }
  }
}