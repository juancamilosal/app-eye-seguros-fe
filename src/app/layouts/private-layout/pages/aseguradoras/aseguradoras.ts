import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AseguradoraService } from '../../../../core/services/aseguradora.service';
import { AseguradoraCard } from '../../../../components/aseguradora-card/aseguradora-card';

@Component({
  selector: 'app-aseguradoras',
  standalone: true,
  imports: [CommonModule, AseguradoraCard],
  templateUrl: './aseguradoras.html'
})
export class Aseguradoras implements OnInit {
  aseguradoras: any[] = [];
  loading = true;

  constructor(private aseguradoraService: AseguradoraService) {}

  ngOnInit(): void {
    this.aseguradoraService.obtenerAseguradoras({ fields: '*' }).subscribe({
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