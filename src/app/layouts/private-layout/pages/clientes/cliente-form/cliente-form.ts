import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
      email: [null, [Validators.required, Validators.email]]
    });
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