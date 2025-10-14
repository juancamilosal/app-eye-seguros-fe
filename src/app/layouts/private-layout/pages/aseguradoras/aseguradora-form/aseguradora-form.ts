import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Aseguradora } from '../../../../../core/models/Aseguradora';

@Component({
  selector: 'app-aseguradora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aseguradora-form.html'
})
export class AseguradoraForm {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Aseguradora>();
  @Input() isSubmitting = false;

  form: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: [null, [Validators.required, Validators.maxLength(120)]],
      telefono_bogota: [null, [Validators.maxLength(20)]],
      telefono_nacional: [null, [Validators.maxLength(20)]],
      telefono_celular: [null, [Validators.maxLength(20)]],
      web: [null, [Validators.maxLength(200)]],
      email: [null, [Validators.email, Validators.maxLength(120)]]
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c) return '';
    if (c.hasError('required')) return 'Este campo es obligatorio';
    if (c.hasError('email')) return 'Ingrese un correo válido';
    if (c.hasError('maxlength')) return 'Excede la longitud permitida';
    if (c.hasError('pattern')) return 'Formato inválido';
    return 'Campo inválido';
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue() as Partial<Aseguradora>;
    const data: Aseguradora = {
      id: '',
      nombre: (v.nombre || '').trim(),
      telefono_bogota: (v.telefono_bogota || '').trim(),
      telefono_nacional: (v.telefono_nacional || '').trim(),
      telefono_celular: (v.telefono_celular || '').trim(),
      web: (v.web || '').trim(),
      email: (v.email || '').trim()
    };
    this.save.emit(data);
  }

  onUppercaseInput(event: Event, controlName: keyof Aseguradora | string) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').toUpperCase();
    input.value = value;
    this.form.get(String(controlName))?.setValue(value, { emitEvent: false });
  }

  onLowercaseInput(event: Event, controlName: keyof Aseguradora | string) {
    const input = event.target as HTMLInputElement;
    const value = (input?.value || '').toLowerCase();
    input.value = value;
    this.form.get(String(controlName))?.setValue(value, { emitEvent: false });
  }
}