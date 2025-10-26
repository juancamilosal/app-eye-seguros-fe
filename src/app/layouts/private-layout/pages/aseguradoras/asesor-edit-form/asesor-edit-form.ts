import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Asesor } from '../../../../../core/models/Asesor';
import { AsesorService } from '../../../../../core/services/asesor.service';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';

@Component({
  selector: 'app-asesor-edit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationModalComponent],
  templateUrl: './asesor-edit-form.html'
})
export class AsesorEditForm implements OnInit {
  @Input() asesor: Asesor | null = null;
  @Input() aseguradoraId: string = '';
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() asesorDeleted = new EventEmitter<void>();

  asesorForm!: FormGroup;
  isSubmitting = false;
  isDeleting = false;
  notification: NotificationData | null = null;
  isModalVisible = false;

  constructor(
    private fb: FormBuilder,
    private asesorService: AsesorService
  ) {}

  ngOnInit(): void {
    this.asesorForm = this.fb.group({
      nombre: [this.asesor?.nombre || '', [Validators.required, Validators.minLength(2)]],
      apellido: [this.asesor?.apellido || '', [Validators.required, Validators.minLength(2)]],
      numero_contacto: [this.asesor?.numero_contacto || '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: [this.asesor?.email || '', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.asesorForm.valid && this.asesor?.id) {
      this.isSubmitting = true;
      const asesorData: Partial<Asesor> = {
        ...this.asesorForm.value
      };

      this.asesorService.actualizarAsesor(this.asesor.id, asesorData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notification = {
            title: 'Éxito',
            message: 'Asesor actualizado correctamente',
            type: 'success'
          };
          this.isModalVisible = true;
          setTimeout(() => {
            this.formSubmit.emit();
          }, 1500);
        },
        error: () => {
          this.isSubmitting = false;
          this.notification = {
            title: 'Error',
            message: 'No se pudo actualizar el asesor',
            type: 'error'
          };
          this.isModalVisible = true;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onDelete(): void {
    if (!this.asesor?.id) return;

    this.notification = {
      title: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar al asesor ${this.asesor.nombre} ${this.asesor.apellido}?`,
      type: 'warning',
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onConfirmDelete(): void {
    if (!this.asesor?.id) return;

    this.isDeleting = true;
    this.asesorService.eliminarAsesor(this.asesor.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.notification = {
          title: 'Éxito',
          message: 'Asesor eliminado correctamente',
          type: 'success'
        };
        this.isModalVisible = true;
        setTimeout(() => {
          this.asesorDeleted.emit();
        }, 1500);
      },
      error: () => {
        this.isDeleting = false;
        this.notification = {
          title: 'Error',
          message: 'No se pudo eliminar el asesor',
          type: 'error'
        };
        this.isModalVisible = true;
      }
    });
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  onModalClose(): void {
    this.isModalVisible = false;
    this.notification = null;
  }

  onModalConfirm(): void {
    if (this.notification?.confirmable) {
      this.onConfirmDelete();
    }
    this.onModalClose();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.asesorForm.controls).forEach(key => {
      const control = this.asesorForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.asesorForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['email']) return 'Email debe tener un formato válido';
      if (field.errors['pattern']) return 'Número de contacto debe tener 10 dígitos';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      nombre: 'Nombre',
      apellido: 'Apellido',
      numero_contacto: 'Número de Contacto',
      email: 'Email'
    };
    return labels[fieldName] || fieldName;
  }
}
