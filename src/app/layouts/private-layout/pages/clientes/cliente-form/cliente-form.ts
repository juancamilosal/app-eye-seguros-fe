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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.clienteForm = this.fb.group({
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: [null, [Validators.required, Validators.minLength(5)]],
      nombre: [null, [Validators.required, Validators.minLength(2)]],
      apellido: [null, [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: [null, [Validators.required]],
      direccion: [null, [Validators.required, Validators.minLength(5)]],
      numeroContacto: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      email: [null, [Validators.required, Validators.email]]
    });

    if (this._initialValue) {
      this.clienteForm.patchValue(this._initialValue);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const v = this.clienteForm.value as Cliente;
    this.save.emit(v);
  }
}