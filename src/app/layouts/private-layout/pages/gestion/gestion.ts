import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Management } from '../../../../core/models/Management';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion.html'
})
export class Gestion {
  constructor(private router: Router) {}
  vencimientos: Management[] = [
    {
      titular: 'Carlos Pérez',
      numeroPoliza: 'POL-001234',
      tipoPoliza: 'Auto',
      formaPagoRenovacion: 'Mensual',
      valorAnterior: 1250000,
      valorActual: 1325000
    },
    {
      titular: 'María Gómez',
      numeroPoliza: 'POL-004567',
      tipoPoliza: 'Vida',
      formaPagoRenovacion: 'Anual',
      valorAnterior: 2450000,
      valorActual: 2450000
    },
    {
      titular: 'Juan Rodríguez',
      numeroPoliza: 'POL-008901',
      tipoPoliza: 'Hogar',
      formaPagoRenovacion: 'Trimestral',
      valorAnterior: 980000,
      valorActual: 1050000
    },
    {
      titular: 'Ana Martínez',
      numeroPoliza: 'POL-002345',
      tipoPoliza: 'Salud',
      formaPagoRenovacion: 'Mensual',
      valorAnterior: 1590000,
      valorActual: 1620000
    },
    {
      titular: 'Luis Fernández',
      numeroPoliza: 'POL-003210',
      tipoPoliza: 'Auto',
      formaPagoRenovacion: 'Semestral',
      valorAnterior: 1100000,
      valorActual: 1180000
    }
  ];
  trackByNumero(index: number, item: Management) {
    return item.numeroPoliza;
  }

  openForm() {
    this.router.navigateByUrl('/gestion/nuevo');
  }
}
