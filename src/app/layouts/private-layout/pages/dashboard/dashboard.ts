import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionService } from '../../../../core/services/gestion.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';
import { MESES } from '../../../../core/const/MesesConst';
import { ListaTareasComponent } from '../../../../components/lista-tareas/lista-tareas';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ListaTareasComponent],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  // Sección: Vencimientos próximo mes
  proximosVencimientos: Array<{
    titular: string;
    aseguradora?: string;
    numeroPoliza: string;
    fechaVencimiento?: string;
  }> = [];
  loadingVencimientos = true;

  // Sección: Cumpleaños hoy
  cumpleanerosHoy: Client[] = [];
  loadingCumpleanos = true;

  // Sección: Pólizas por aseguradora
  polizasPorAseguradora: Array<{ aseguradora: string; total: number }> = [];
  loadingAseguradoras = true;

  // Mes siguiente (nombre)
  nextMonthName = '';

  // Sección: Tablero de Tareas ahora se maneja en el componente ListaTareasComponent

  constructor(private gestionService: GestionService, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.nextMonthName = this.computeNextMonthName();
    this.loadVencimientosProximoMes();
    this.loadCumpleanerosHoy();
    this.loadPolizasPorAseguradora();
  }

  private computeNextMonthName(): string {
    try {
      const now = new Date();
      const nextValue = ((now.getMonth() + 1) % 12) + 1; // 1..12
      const found = MESES.find(m => Number(m.value) === nextValue);
      return found?.name ?? '';
    } catch {
      return '';
    }
  }

  private loadVencimientosProximoMes(): void {
    const now = new Date();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const params: Record<string, string> = {
      page: '1',
      limit: '5',
      meta: 'filter_count',
      sort: 'fecha_vencimiento',
      'filter[fecha_vencimiento][_gte]': fmt(nextMonthStart),
      'filter[fecha_vencimiento][_lte]': fmt(nextMonthEnd),
    };
    this.loadingVencimientos = true;
    this.gestionService.obtenerVencimientos(params).subscribe({
      next: (resp) => {
        const data = (resp?.data ?? []) as any[];
        this.proximosVencimientos = data.map((r) => {
          const nombre = r?.cliente_id?.nombre ?? '';
          const apellido = r?.cliente_id?.apellido ?? '';
          const titular = `${nombre} ${apellido}`.trim();
          return {
            titular,
            aseguradora: r?.aseguradora ?? undefined,
            numeroPoliza: r?.numero_poliza ?? '',
            fechaVencimiento: r?.fecha_vencimiento ?? undefined,
          };
        });
        this.loadingVencimientos = false;
      },
      error: () => {
        this.proximosVencimientos = [];
        this.loadingVencimientos = false;
      }
    });
  }

  private loadCumpleanerosHoy(): void {
    this.loadingCumpleanos = true;
    const params: Record<string, string> = { limit: '-1' };
    this.clienteService.obtenerClientes(params).subscribe({
      next: (resp) => {
        const list = (resp?.data ?? []) as Client[];
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todaySuffix = `-${mm}-${dd}`; // YYYY-MM-DD -> match suffix
        this.cumpleanerosHoy = list.filter((c) => {
          const fn = (c?.fecha_nacimiento ?? '').trim();
          return fn.length >= 10 && fn.slice(4, 10) === todaySuffix;
        });
        this.loadingCumpleanos = false;
      },
      error: () => {
        this.cumpleanerosHoy = [];
        this.loadingCumpleanos = false;
      }
    });
  }

  private loadPolizasPorAseguradora(): void {
    this.loadingAseguradoras = true;
    const params: Record<string, string> = { limit: '-1', fields: 'aseguradora' };
    // Consulta básica para minimizar payload
    this.gestionService.obtenerPolizasRaw(params).subscribe({
      next: (resp) => {
        const data = (resp?.data ?? []) as Array<{ aseguradora?: string }>;
        const counts = new Map<string, number>();
        for (const item of data) {
          const key = (item?.aseguradora ?? '').trim();
          if (!key) continue;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        this.polizasPorAseguradora = Array.from(counts.entries())
          .map(([aseguradora, total]) => ({ aseguradora, total }))
          .sort((a, b) => b.total - a.total);
        this.loadingAseguradoras = false;
      },
      error: () => {
        this.polizasPorAseguradora = [];
        this.loadingAseguradoras = false;
      }
    });
  }

}