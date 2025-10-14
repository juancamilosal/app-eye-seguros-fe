import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AseguradoraService } from '../../core/services/aseguradora.service';
import { Aseguradora } from '../../core/models/Aseguradora';
import { NotificationModalComponent } from '../notification-modal/notification-modal';
import { NotificationData } from '../../core/models/NotificationData';

@Component({
  selector: 'app-aseguradora-card',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent],
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

  constructor(private aseguradoraService: AseguradoraService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aseguradora']) {
      const obj = this.aseguradora ?? {};
      const keys = Object.keys(obj);
      this.displayedEntries = keys
        .filter((k) => !['id', 'nombre', 'polizas_id'].includes(k) && obj[k] !== null && obj[k] !== undefined && obj[k] !== '')
        .map((k) => ({ key: k, label: this.prettyLabel(k), value: obj[k] }));
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
    return String(val ?? '');
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
    const buffer: Partial<Aseguradora> = {};
    this.displayedEntries.forEach(e => { buffer[e.key as keyof Aseguradora] = this.aseguradora[e.key]; });
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
}