import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Usuario } from '../../../../../core/models/Usuario';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.html'
})
export class UsuarioForm implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Usuario>();
  @Input() isSubmitting = false;

  usuarioForm!: FormGroup;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.usuarioForm = this.fb.group(
      {
        first_name: ['', [Validators.required, Validators.minLength(2)]],
        last_name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(/^\d+$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.submitted = true;
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }
    const value = this.usuarioForm.value as Usuario & { confirmPassword?: string };
    const payload: Usuario = {
      first_name: value.first_name,
      last_name: value.last_name,
      email: value.email,
      telefono: value.telefono,
      password: value.password
    };
    this.save.emit(payload);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onNumericInput(event: Event, controlName: keyof Usuario, maxLen = 15) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const onlyDigits = (target.value || '').replace(/\D+/g, '').slice(0, maxLen);
    const ctrl = this.usuarioForm.get(controlName as string);
    ctrl?.setValue(onlyDigits, { emitEvent: false });
  }

  private toTitleCaseSpanish(value: string): string {
    const raw = value || '';
    const trailingMatch = raw.match(/\s+$/);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const words = raw
      .trim()
      .toLocaleLowerCase('es-ES')
      .split(/\s+/)
      .filter(w => w.length > 0);
    const transformed = words
      .map(w => w.charAt(0).toLocaleUpperCase('es-ES') + w.slice(1))
      .join(' ');
    return transformed + trailing;
  }

  onCapitalizeInput(event: Event, controlName: 'first_name' | 'last_name') {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const transformed = this.toTitleCaseSpanish(target.value || '');
    const ctrl = this.usuarioForm.get(controlName);
    ctrl?.setValue(transformed, { emitEvent: false });
  }

  onLowercaseInput(event: Event, controlName: 'email') {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const lowered = (target.value || '').toLocaleLowerCase('es-ES');
    const ctrl = this.usuarioForm.get(controlName);
    ctrl?.setValue(lowered, { emitEvent: false });
  }

  isInvalid(name: string): boolean {
    const c = this.usuarioForm.get(name);
    const hasGroupError = name === 'confirmPassword' && this.usuarioForm.errors?.['passwordMismatch'];
    return !!((c && c.invalid && (c.touched || this.submitted)) || hasGroupError);
  }

  getError(name: string): string | null {
    const c = this.usuarioForm.get(name);
    if (name === 'confirmPassword' && this.usuarioForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    if (!c || !c.errors) return null;
    if (c.errors['required']) {
      const requiredMessages: Record<string, string> = {
        first_name: 'El Nombre es obligatorio',
        last_name: 'El Apellido es obligatorio',
        email: 'El Correo Electrónico es obligatorio',
        telefono: 'El Teléfono es obligatorio',
        password: 'La Contraseña es obligatoria',
        confirmPassword: 'Confirma la Contraseña'
      };
      return requiredMessages[name] ?? 'Este campo es obligatorio';
    }
    if (c.errors['minlength']) {
      const req = c.errors['minlength']?.requiredLength;
      return `Debe tener al menos ${req} caracteres`;
    }
    if (c.errors['maxlength']) {
      const req = c.errors['maxlength']?.requiredLength;
      return `Debe tener máximo ${req} caracteres`;
    }
    if (c.errors['email']) return 'Email inválido';
    if (c.errors['pattern']) {
      if (name === 'telefono') return 'Solo números';
      return 'Formato inválido';
    }
    return 'Valor inválido';
  }
}
