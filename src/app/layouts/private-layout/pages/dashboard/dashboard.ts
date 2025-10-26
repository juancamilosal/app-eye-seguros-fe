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
  
  // Vencimientos agrupados por aseguradora para el acordeón
  vencimientosPorAseguradora: Array<{
    aseguradora: string;
    vencimientos: Array<{
      titular: string;
      numeroPoliza: string;
      fechaVencimiento?: string;
    }>;
    expanded: boolean;
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

  // Estado de modales de detalle
  showVencimientosModal = false;
  showVencimientosAccordionModal = false;
  showCumpleanosModal = false;
  showAseguradorasModal = false;

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
      limit: '-1', // Obtener todos los vencimientos para agrupar
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
            aseguradora: (r?.aseguradora ?? r?.aseguradora_id?.nombre ?? 'Sin aseguradora'),
            numeroPoliza: r?.numero_poliza ?? '',
            fechaVencimiento: r?.fecha_vencimiento ?? undefined,
          };
        });
        
        // Agrupar por aseguradora
        this.groupVencimientosByAseguradora();
        this.loadingVencimientos = false;
      },
      error: () => {
        this.proximosVencimientos = [];
        this.vencimientosPorAseguradora = [];
        this.loadingVencimientos = false;
      }
    });
  }

  private groupVencimientosByAseguradora(): void {
    const groups = new Map<string, Array<{titular: string; numeroPoliza: string; fechaVencimiento?: string}>>();
    
    this.proximosVencimientos.forEach(vencimiento => {
      const aseguradora = vencimiento.aseguradora || 'Sin aseguradora';
      if (!groups.has(aseguradora)) {
        groups.set(aseguradora, []);
      }
      groups.get(aseguradora)!.push({
        titular: vencimiento.titular,
        numeroPoliza: vencimiento.numeroPoliza,
        fechaVencimiento: vencimiento.fechaVencimiento
      });
    });

    // Orden de prioridad para las aseguradoras
    const prioridadAseguradoras = [
      'ALLIANZ SEGUROS DE SALUD Y VIDA',
      'ALLIANZ SEGUROS S.A.',
      'SEGUROS GENERALES SURAMERICANA S.A',
      'HDI SEGUROS COLOMBIA S.A.'
    ];

    // Convertir a array y ordenar por prioridad
    const allGroups = Array.from(groups.entries()).map(([aseguradora, vencimientos]) => ({
      aseguradora,
      vencimientos,
      expanded: false
    }));

    // Separar aseguradoras prioritarias de las demás
    const prioritarias: Array<{aseguradora: string; vencimientos: Array<{titular: string; numeroPoliza: string; fechaVencimiento?: string}>; expanded: boolean; prioridad: number}> = [];
    const otras: typeof allGroups = [];

    allGroups.forEach(grupo => {
      const index = prioridadAseguradoras.findIndex(p => 
        grupo.aseguradora.toUpperCase().includes(p.toUpperCase()) || 
        p.toUpperCase().includes(grupo.aseguradora.toUpperCase())
      );
      
      if (index !== -1) {
        prioritarias.push({ ...grupo, prioridad: index });
      } else {
        otras.push(grupo);
      }
    });

    // Ordenar prioritarias por su índice de prioridad
    prioritarias.sort((a, b) => a.prioridad - b.prioridad);
    
    // Ordenar las otras alfabéticamente
    otras.sort((a, b) => a.aseguradora.localeCompare(b.aseguradora));

    // Combinar: primero las prioritarias, luego las otras (sin la propiedad prioridad)
    const prioritariasSinPrioridad = prioritarias.map(({ prioridad, ...resto }) => resto);
    this.vencimientosPorAseguradora = [...prioritariasSinPrioridad, ...otras];
  }

  // Vencimientos agrupados por aseguradora para el acordeón con estado modal
  vencimientosPorAseguradoraModal: Array<{
    aseguradora: string;
    vencimientos: Array<{
      titular: string;
      numeroPoliza: string;
      fechaVencimiento?: string;
    }>;
    expanded: boolean;
  }> = [];

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
    const params: Record<string, string> = { limit: '-1', fields: 'aseguradora_id.nombre' };
    // Consulta básica para minimizar payload
    this.gestionService.obtenerPolizasRaw(params).subscribe({
      next: (resp) => {
        const data = (resp?.data ?? []) as any[];
        const counts = new Map<string, number>();
        for (const item of data) {
          const key = (item?.aseguradora ?? item?.aseguradora_id?.nombre ?? '').trim();
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

  toggleAseguradora(index: number): void {
    this.vencimientosPorAseguradora[index].expanded = !this.vencimientosPorAseguradora[index].expanded;
  }

  toggleAseguradoraModal(index: number): void {
    this.vencimientosPorAseguradoraModal[index].expanded = !this.vencimientosPorAseguradoraModal[index].expanded;
  }

  // Abrir/cerrar modales y helpers de preview
  openVencimientosModal(): void { this.showVencimientosModal = true; }
  closeVencimientosModal(): void { this.showVencimientosModal = false; }
  
  openVencimientosAccordionModal(): void { 
    // Crear una copia independiente para el modal
    this.vencimientosPorAseguradoraModal = this.vencimientosPorAseguradora.map(grupo => ({
      ...grupo,
      vencimientos: [...grupo.vencimientos],
      expanded: false // Inicialmente cerrados en el modal
    }));
    this.showVencimientosAccordionModal = true; 
  }
  closeVencimientosAccordionModal(): void { this.showVencimientosAccordionModal = false; }
  
  get proximosVencimientosPreview() { return (this.proximosVencimientos ?? []).slice(0, 3); }
  get vencimientosPorAseguradoraPreview() { return (this.vencimientosPorAseguradora ?? []).slice(0, 5); }

  openCumpleanosModal(): void { this.showCumpleanosModal = true; }
  closeCumpleanosModal(): void { this.showCumpleanosModal = false; }
  get cumpleanerosHoyPreview() { return (this.cumpleanerosHoy ?? []).slice(0, 3); }

  openAseguradorasModal(): void { this.showAseguradorasModal = true; }
  closeAseguradorasModal(): void { this.showAseguradorasModal = false; }
  get polizasPorAseguradoraPreview() { return (this.polizasPorAseguradora ?? []).slice(0, 3); }

}