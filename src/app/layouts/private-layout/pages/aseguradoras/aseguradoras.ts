import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AseguradoraService } from '../../../../core/services/aseguradora.service';
import { AseguradoraCard } from './aseguradora-card/aseguradora-card';

@Component({
  selector: 'app-aseguradoras',
  standalone: true,
  imports: [CommonModule, RouterLink, AseguradoraCard],
  templateUrl: './aseguradoras.html'
})
export class Aseguradoras implements OnInit {
  aseguradoras: any[] = [];
  loading = true;
  searchTerm = '';

  constructor(private aseguradoraService: AseguradoraService) {}

  ngOnInit(): void { this.loadAll(); }

  onSearchChange(term: string): void {
    this.searchTerm = (term || '').trim();
    if (!this.searchTerm) {
      this.loadAll();
      return;
    }
    this.loading = true;
    this.aseguradoraService.obtenerAseguradoras({
      'filter[nombre][_icontains]': this.searchTerm,
      'fields': '*,asesores_id.*, asesores_id.asesores_id.*'
    }).subscribe({
      next: (resp) => {
        this.aseguradoras = resp?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.aseguradoras = [];
        this.loading = false;
      }
    });
  }

  onCardUpdated(item: any): void {
    if (!item?.id) return;
    // Recargar los datos completos de la aseguradora para obtener los asesores actualizados
    this.aseguradoraService.obtenerAseguradoras({
      'filter[id][_eq]': item.id,
      'fields': '*,asesores_id.*, asesores_id.asesores_id.*'
    }).subscribe({
      next: (resp) => {
        const updatedAseguradora = resp?.data?.[0];
        if (updatedAseguradora) {
          this.aseguradoras = this.aseguradoras.map(a =>
            a.id === item.id ? updatedAseguradora : a
          );
        }
      },
      error: () => {
        // Fallback: usar los datos proporcionados
        this.aseguradoras = this.aseguradoras.map(a => (a.id === item.id ? { ...a, ...item } : a));
      }
    });
  }

  onCardDeleted(id: string): void {
    this.aseguradoras = this.aseguradoras.filter(a => String(a.id) !== String(id));
  }

  private loadAll(): void {
    this.loading = true;
    this.aseguradoraService.obtenerAseguradoras({
      fields: '*,asesores_id.*, asesores_id.asesores_id.*'
    }).subscribe({
      next: (resp) => {
        this.aseguradoras = resp?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.aseguradoras = [];
        this.loading = false;
      }
    });
  }
}
