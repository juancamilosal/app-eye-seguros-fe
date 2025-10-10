import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Management } from '../../../../../core/models/Management';

@Component({
  selector: 'app-vencimiento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vencimiento-form.html'
})
export class VencimientoForm implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Management>();

  vencimientoForm: FormGroup;

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.vencimientoForm = this.fb.group({
      titular: [null, Validators.required],
      numeroPoliza: [null, Validators.required],
      tipoPoliza: [null, Validators.required],
      formaPagoRenovacion: [null, Validators.required],
      valorAnterior: [null, [Validators.min(0)]],
      valorActual: [null, [Validators.min(0)]],
      fechaVencimiento: [null],
      aseguradora: [null]
    });
  }
  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    if (this.vencimientoForm.invalid) {
      this.vencimientoForm.markAllAsTouched();
      return;
    }

    const v = this.vencimientoForm.value as {
      titular: string;
      numeroPoliza: string;
      tipoPoliza: string;
      formaPagoRenovacion: string;
      valorAnterior: number | string;
      valorActual: number | string;
      fechaVencimiento?: string;
      aseguradora?: string;
    };

    const data: Management = {
      titular: v.titular,
      numeroPoliza: v.numeroPoliza,
      tipoPoliza: v.tipoPoliza,
      formaPagoRenovacion: v.formaPagoRenovacion,
      valorAnterior: Number(v.valorAnterior ?? 0),
      valorActual: Number(v.valorActual ?? 0),
      fechaVencimiento: v.fechaVencimiento || undefined,
      aseguradora: v.aseguradora || undefined,
    };
    this.save.emit(data);
  }
}
