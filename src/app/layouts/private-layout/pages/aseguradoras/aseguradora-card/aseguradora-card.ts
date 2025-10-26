import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AseguradoraService } from '../../../../../core/services/aseguradora.service';
import { AsesorService } from '../../../../../core/services/asesor.service';
import { Aseguradora } from '../../../../../core/models/Aseguradora';
import { Asesor } from '../../../../../core/models/Asesor';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { AsesorModal } from '../asesor-modal/asesor-modal';
import { AsesoresList } from '../../../../../components/asesores-list/asesores-list';
import { NotificationData } from '../../../../../core/models/NotificationData';

@Component({
  selector: 'app-aseguradora-card',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent, AsesorModal, AsesoresList],
  templateUrl: './aseguradora-card.html'
})
export class AseguradoraCard implements OnChanges {
  @Input() aseguradora: any = {};
  @Output() updated = new EventEmitter<Aseguradora>();
  @Output() deleted = new EventEmitter<string>();

  displayedEntries: Array<{ key: string; label: string; value: any }> = [];
  editMode = false;
  editBuffer: Record<string, string> = {};
  isModalVisible = false;
  notification: NotificationData | null = null;

  // Modal de asesor
  isAsesorModalVisible = false;

  constructor(private aseguradoraService: AseguradoraService, private asesorService: AsesorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aseguradora']) {
      const obj = this.aseguradora ?? {};

      // Campos obligatorios que siempre deben aparecer
      const requiredFields = ['telefono_bogota', 'telefono_nacional', 'telefono_celular', 'web', 'email'];

      // Crear entradas para campos obligatorios
      const requiredEntries = requiredFields.map(key => ({
        key,
        label: this.prettyLabel(key),
        value: obj[key] || ''
      }));

      // Obtener otros campos que tienen valores y no están en la lista de obligatorios
      const otherKeys = Object.keys(obj).filter(k =>
        !['id', 'nombre', 'polizas_id', 'asesores_id', ...requiredFields].includes(k) &&
        obj[k] !== null && obj[k] !== undefined && obj[k] !== ''
      );

      const otherEntries = otherKeys.map(k => ({
        key: k,
        label: this.prettyLabel(k),
        value: obj[k]
      }));

      // Combinar campos obligatorios con otros campos
      this.displayedEntries = [...requiredEntries, ...otherEntries];
    }
  }

  toValue(val: any): string {
    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    }
    if (val && typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    const result = String(val ?? '');
    return result || 'Sin información';
  }

  private prettyLabel(k: string): string {
    const map: Record<string, string> = {
      telefono_bogota: 'Teléfono Bogotá',
      telefono_nacional: 'Teléfono Nacional',
      telefono_celular: 'Teléfono Celular',
      web: 'Sitio Web',
      email: 'Email',
      nit: 'NIT',
      direccion: 'Dirección',
      ciudad: 'Ciudad'
    };
    if (map[k]) return map[k];
    const spaced = k.replace(/[_-]+/g, ' ').trim();
    const titled = spaced
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return titled.replace(/Telefono/g, 'Teléfono');
  }

  startEdit(): void {
    this.editMode = true;
    const buffer: Record<string, string> = {};

    // Incluir todos los campos mostrados en el buffer de edición
    this.displayedEntries.forEach(e => {
      // Solo incluir propiedades que sean strings
      if (typeof this.aseguradora[e.key] === 'string') {
        buffer[e.key] = this.aseguradora[e.key] || '';
      }
    });

    this.editBuffer = buffer;
  }

  onEditChange(key: string, value: string): void {
    this.editBuffer[key] = value ?? '';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editBuffer = {};
  }

  confirmUpdate(): void {
    const id = this.aseguradora?.id;
    if (!id) { this.cancelEdit(); return; }
    const payload: Partial<Aseguradora> = {};
    Object.keys(this.editBuffer).forEach(k => {
      const val = (this.editBuffer as any)[k];
      (payload as any)[k] = typeof val === 'string' ? val.trim() : val;
    });
    this.aseguradoraService.actualizarAseguradora(id, payload).subscribe({
      next: () => {
        // Actualiza localmente y emite
        this.aseguradora = { ...this.aseguradora, ...payload };
        this.updated.emit(this.aseguradora);
        // Recalcular entradas mostradas
        this.ngOnChanges({ aseguradora: { currentValue: this.aseguradora, previousValue: null, firstChange: false, isFirstChange: () => false } });
        this.cancelEdit();
      },
      error: () => {
        // En caso de error, salir de edición sin cambios
        this.cancelEdit();
      }
    });
  }

  eliminar(): void {
    const id = this.aseguradora?.id;
    if (!id) return;
    const nombre = this.aseguradora?.nombre ?? '—';
    this.notification = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Desea eliminar la aseguradora ${nombre}?`,
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onModalClosed(): void {
    this.isModalVisible = false;
    this.notification = null;
  }

  onModalConfirm(): void {
    const id = this.aseguradora?.id;
    if (!id) { this.onModalClosed(); return; }
    this.aseguradoraService.eliminarAseguradora(id).subscribe({
      next: () => {
        this.deleted.emit(String(id));
        this.onModalClosed();
      },
      error: () => {
        this.onModalClosed();
      }
    });
  }

  // Métodos para el modal de asesor
  openAsesorModal(): void {
    this.isAsesorModalVisible = true;
  }

  closeAsesorModal(): void {
    this.isAsesorModalVisible = false;
  }

  onAsesorCreated(asesor: Asesor): void {
    // Primero crear el asesor en Directus
    this.asesorService.crearAsesor(asesor).subscribe({
      next: (response) => {
        const asesorCreado = response.data;

        // Verificar que el asesor creado tenga ID
        if (!asesorCreado.id) {
          this.closeAsesorModal();
          this.notification = {
            title: 'Error',
            message: 'Error: No se pudo obtener el ID del asesor creado',
            type: 'error'
          };
          this.isModalVisible = true;
          return;
        }

        // Crear la relación en la tabla intermedia
        const relacion = {
          asesores_id: asesorCreado.id,
          aseguradoras_id: this.aseguradora.id
        };

        this.asesorService.crearRelacionAsesorAseguradora(relacion).subscribe({
          next: () => {
            this.closeAsesorModal();
            // Mostrar notificación de éxito
            this.notification = {
              title: 'Éxito',
              message: 'Asesor creado y agregado correctamente a la aseguradora',
              type: 'success'
            };
            this.isModalVisible = true;
            // Recargar la información de la aseguradora para mostrar el nuevo asesor
            this.updated.emit(this.aseguradora);
          },
          error: () => {
            this.closeAsesorModal();
            // Mostrar notificación de error
            this.notification = {
              title: 'Error',
              message: 'Asesor creado pero no se pudo agregar a la aseguradora',
              type: 'error'
            };
            this.isModalVisible = true;
          }
        });
      },
      error: () => {
        this.closeAsesorModal();
        // Mostrar notificación de error
        this.notification = {
          title: 'Error',
          message: 'No se pudo crear el asesor',
          type: 'error'
        };
        this.isModalVisible = true;
      }
    });
  }

  getAsesoresFromRelations(relations: any[]): Asesor[] {
    if (!relations || !Array.isArray(relations)) {
      return [];
    }

    return relations
      .map(relation => relation.asesores_id)
      .filter(asesor => asesor && typeof asesor === 'object');
  }

  onAsesorUpdated(): void {
    // Recargar la información de la aseguradora para mostrar los cambios
    this.updated.emit(this.aseguradora);
  }
}
