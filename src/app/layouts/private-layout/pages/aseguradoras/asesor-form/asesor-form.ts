import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Asesor } from '../../../../../core/models/Asesor';

@Component({
  selector: 'app-asesor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asesor-form.html'
})
export class AsesorForm implements OnInit {
  @Input() aseguradoraId: string = '';
  @Output() formSubmit = new EventEmitter<Asesor>();
  @Output() formCancel = new EventEmitter<void>();

  asesorForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.asesorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      numero_contacto: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.asesorForm.valid) {
      const asesorData: Asesor = {
        ...this.asesorForm.value
      };
      this.formSubmit.emit(asesorData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.formCancel.emit();
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
