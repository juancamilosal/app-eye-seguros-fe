import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Management } from '../../../../core/models/Management';
import { Router } from '@angular/router';
import { VencimientoService } from '../../../../core/services/vencimiento.service';
import { Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion.html'
})
export class Gestion implements OnInit {
  constructor(private router: Router, private vencimientoService: VencimientoService) {}

  vencimientos: Management[] = [];
  loading = true;
  // Búsqueda
  private search$ = new Subject<string>();
  // Paginación
  page = 1;
  limit = 10;
  total = 0;
  private page$ = new BehaviorSubject<number>(1);
  private limit$ = new BehaviorSubject<number>(10);

  ngOnInit(): void {
    const term$ = this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith('')
    );

    combineLatest([term$, this.page$, this.limit$])
      .pipe(
        switchMap(([term, page, limit]) => {
          this.loading = true;
          const params = this.buildFilterParams(term, page, limit);
          return this.vencimientoService.obtenerVencimientos(params).pipe(
            catchError(() => of({ data: [], meta: { filter_count: 0, page, limit } }))
          );
        })
      )
      .subscribe((resp: any) => {
        const raw = resp?.data ?? [];
        // Mapear a Management
        this.vencimientos = raw.map((r: any) => {
          const nombre = (r?.cliente_id?.nombre ?? r?.nombre ?? '').trim();
          const apellido = (r?.cliente_id?.apellido ?? r?.apellido ?? '').trim();
          const tipoDocumento = r?.cliente_id?.tipo_documento ?? r?.tipo_documento ?? undefined;
          const numeroDocumento = r?.cliente_id?.numero_documento ?? r?.numero_documento ?? undefined;
          return {
            titular: `${nombre} ${apellido}`.trim() || (r?.titular ?? ''),
            tipoDocumento,
            numeroDocumento,
            numeroPoliza: r?.numero_poliza ?? r?.numeroPoliza ?? '',
            tipoPoliza: r?.tipo_poliza ?? r?.tipoPoliza ?? '',
            formaPagoRenovacion: r?.forma_pago ?? r?.formaPagoRenovacion ?? '',
            valorAnterior: Number(r?.valor_poliza_anterior ?? r?.valorAnterior ?? 0),
            valorActual: Number(r?.valor_poliza_actual ?? r?.valorActual ?? 0),
            fechaVencimiento: r?.fecha_vencimiento ?? r?.fechaVencimiento ?? undefined,
            aseguradora: r?.aseguradora ?? undefined,
          } as Management;
        });

        const meta = resp?.meta ?? {};
        this.total = (meta?.filter_count ?? meta?.total_count ?? 0) as number;
        this.page = (meta?.page ?? this.page$.getValue()) as number;
        this.limit = (meta?.limit ?? this.limit$.getValue()) as number;
        this.loading = false;
      });
  }

  private buildFilterParams(term: string | undefined, page?: number, limit?: number): Record<string, string> {
    const q = (term ?? '').trim();
    const params: Record<string, string> = {
      page: String(page ?? this.page),
      limit: String(limit ?? this.limit),
      meta: 'filter_count',
      sort: 'fecha_vencimiento'
    };
    if (q) {
      // Buscar por titular (nombre/apellido), o número de póliza
      params['filter[_or][0][numero_poliza][_icontains]'] = q;
      params['filter[_or][1][tipo_poliza][_icontains]'] = q;
      params['filter[_or][2][aseguradora][_icontains]'] = q;
      // Nombre y apellido vía relación cliente_id
      params['filter[_or][3][cliente_id][nombre][_icontains]'] = q;
      params['filter[_or][4][cliente_id][apellido][_icontains]'] = q;
      // Número de documento vía relación cliente_id
      params['filter[_or][5][cliente_id][numero_documento][_icontains]'] = q;
    }
    return params;
  }

  onSearchChange(value: string) {
    this.search$.next(value?.trim() ?? '');
  }

  onLimitChange(value: string) {
    const v = Math.max(1, Number(value) || 10);
    this.limit$.next(v);
  }

  prevPage() {
    const newPage = Math.max(1, this.page - 1);
    if (newPage !== this.page) {
      this.page$.next(newPage);
    }
  }

  nextPage() {
    const max = this.totalPages;
    const newPage = Math.min(max, this.page + 1);
    if (newPage !== this.page) {
      this.page$.next(newPage);
    }
  }

  goToPage(p: number) {
    const max = this.totalPages;
    const newPage = Math.max(1, Math.min(max, Math.floor(p)));
    if (newPage !== this.page) {
      this.page$.next(newPage);
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.total || 0) / (this.limit || 10)));
  }

  get startIndex(): number {
    const total = this.total || 0;
    if (total === 0) return 0;
    return (this.page - 1) * this.limit + 1;
  }

  get endIndex(): number {
    const total = this.total || 0;
    return Math.min(total, this.page * this.limit);
  }
  trackByNumero(index: number, item: Management) {
    return item.numeroPoliza;
  }

  openForm() {
    this.router.navigateByUrl('/gestion/nuevo');
  }
}
