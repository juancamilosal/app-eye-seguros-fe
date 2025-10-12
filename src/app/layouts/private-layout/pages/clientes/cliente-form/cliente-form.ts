import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TipoDocumentoConst } from '../../../../../core/const/TipoDocumentoConst';

export interface Cliente {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  direccion: string;
  numeroContacto: string;
  email: string;
}

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form.html'
})
export class ClienteForm implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Cliente>();
  private _initialValue: Cliente | null = null;
  @Input() set initialValue(value: Cliente | null) {
    this._initialValue = value;
    if (value && this.clienteForm) {
      this.clienteForm.patchValue(value);
    }
  }

  clienteForm!: FormGroup;
  tiposDocumento = TipoDocumentoConst;
  submitted = false;
  isNitSelected = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.clienteForm = this.fb.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(10), Validators.pattern(/^\d+$/)]],
      nombre: [null, [Validators.required, Validators.minLength(2)]],
      apellido: [null, [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: [null, [Validators.required]],
      direccion: [null, [Validators.required, Validators.minLength(5)]],
      numeroContacto: [null, [Validators.required, Validators.maxLength(10), Validators.pattern(/^\d+$/)]],
      email: [null, [Validators.required, Validators.email]]
    });

    if (this._initialValue) {
      this.clienteForm.patchValue(this._initialValue);
    }

    const tipoCtrl = this.clienteForm.get('tipoDocumento');
    tipoCtrl?.valueChanges.subscribe((val) => {
      this.applyNitMode(val === 'NIT');
    });
    this.applyNitMode(tipoCtrl?.value === 'NIT');
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.submitted = true;
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const v = this.clienteForm.value as Cliente;
    this.save.emit(v);
  }

  onNumericInput(event: Event, controlName: keyof Cliente, maxLen = 10) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const onlyDigits = (target.value || '').replace(/\D+/g, '').slice(0, maxLen);
    const ctrl = this.clienteForm.get(controlName as string);
    ctrl?.setValue(onlyDigits, { emitEvent: false });
  }

  private toTitleCaseSpanish(value: string): string {
    const raw = value || '';
    const trailingMatch = raw.match(/\s+$/);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const words = raw.trim()
      .toLocaleLowerCase('es-ES')
      .split(/\s+/)
      .filter(w => w.length > 0);
    const transformed = words
      .map(w => w.charAt(0).toLocaleUpperCase('es-ES') + w.slice(1))
      .join(' ');
    return transformed + trailing;
  }

  onCapitalizeInput(event: Event, controlName: keyof Cliente) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const transformed = this.toTitleCaseSpanish(target.value || '');
    const ctrl = this.clienteForm.get(controlName as string);
    ctrl?.setValue(transformed, { emitEvent: false });
  }

  onLowercaseInput(event: Event, controlName: keyof Cliente) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const lowered = (target.value || '').toLocaleLowerCase('es-ES');
    const ctrl = this.clienteForm.get(controlName as string);
    ctrl?.setValue(lowered, { emitEvent: false });
  }

  isInvalid(name: string): boolean {
    const c = this.clienteForm.get(name);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  getError(name: string): string | null {
    const c = this.clienteForm.get(name);
    if (!c || !c.errors) return null;
    if (c.errors['required']) {
      const requiredMessages: Record<string, string> = {
        tipoDocumento: 'El Tipo de Documento es Obligatorio',
        numeroDocumento: 'El Número de Documento es Obligatorio',
        nombre: 'El Nombre es Obligatorio',
        apellido: 'El Apellido es Obligatorio',
        fechaNacimiento: 'La Fecha de Nacimiento es Obligatoria',
        direccion: 'La Dirección es Obligatoria',
        numeroContacto: 'El Número de Contacto es Obligatorio',
        email: 'El Email es Obligatorio',
      };
      return requiredMessages[name] ?? 'Este campo es obligatorio';
    }
    if (c.errors['minlength']) {
      const req = c.errors['minlength']?.requiredLength;
      return `Debe tener al menos ${req} caracteres`;
    }
    if (c.errors['maxlength']) {
      const req = c.errors['maxlength']?.requiredLength;
      const isDigits = name === 'numeroDocumento' || name === 'numeroContacto';
      return isDigits ? `Debe tener máximo ${req} dígitos` : `Debe tener máximo ${req} caracteres`;
    }
    if (c.errors['email']) return 'Email inválido';
    if (c.errors['pattern']) {
      // Caso específico para número solo dígitos
      if (name === 'numeroContacto' || name === 'numeroDocumento') return 'Solo números';
      return 'Formato inválido';
    }
    return 'Valor inválido';
  }

  private applyNitMode(isNit: boolean) {
    this.isNitSelected = isNit;
    const apellidoCtrl = this.clienteForm.get('apellido');
    const fechaCtrl = this.clienteForm.get('fechaNacimiento');
    if (!apellidoCtrl) return;
    if (isNit) {
      // Hacer opcional y evitar validaciones cuando es NIT
      apellidoCtrl.clearValidators();
      apellidoCtrl.updateValueAndValidity({ emitEvent: false });
      fechaCtrl?.clearValidators();
      fechaCtrl?.updateValueAndValidity({ emitEvent: false });
    } else {
      // Restaurar validaciones cuando no es NIT
      apellidoCtrl.setValidators([Validators.required, Validators.minLength(2)]);
      apellidoCtrl.updateValueAndValidity({ emitEvent: false });
      fechaCtrl?.setValidators([Validators.required]);
      fechaCtrl?.updateValueAndValidity({ emitEvent: false });
    }
  }
}