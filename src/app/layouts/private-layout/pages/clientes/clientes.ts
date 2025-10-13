import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent],
  templateUrl: './clientes.html'
})
export class Clientes implements OnInit {
  clientes: Client[] = [];
  loading = true;
  isModalVisible = false;
  notification: NotificationData | null = null;
  clienteToDelete: Client | null = null;
  private search$ = new Subject<string>();
  // Paginación
  page = 1;
  limit = 10;
  total = 0;
  private page$ = new BehaviorSubject<number>(1);
  private limit$ = new BehaviorSubject<number>(10);

  constructor(private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    // Búsqueda con debounce + combinación con paginación (page, limit)
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
          return this.clienteService.obtenerClientes(params).pipe(
            catchError(() => of({ data: [], meta: { filter_count: 0, page, limit } }))
          );
        })
      )
      .subscribe((resp: any) => {
        this.clientes = resp?.data ?? [];
        const meta = resp?.meta ?? {};
        this.total = (meta?.filter_count ?? meta?.total_count ?? 0) as number;
        this.page = (meta?.page ?? this.page$.getValue()) as number;
        this.limit = (meta?.limit ?? this.limit$.getValue()) as number;
        this.loading = false;
      });
  }

  onSearchChange(value: string) {
    this.search$.next(value?.trim() ?? '');
  }

  private buildFilterParams(term: string | undefined, page?: number, limit?: number): Record<string, string> {
    const q = (term ?? '').trim();
    const params: Record<string, string> = {
      page: String(page ?? this.page),
      limit: String(limit ?? this.limit),
      meta: 'filter_count',
      sort: 'nombre'
    };
    if (q) {
      params['filter[_or][0][nombre][_icontains]'] = q;
      params['filter[_or][1][apellido][_icontains]'] = q;
      params['filter[_or][2][numero_documento][_icontains]'] = q;
    }
    return params;
  }

  // Paginación UI handlers
  onLimitChange(value: string) {
    const n = Number(value) || 10;
    this.limit$.next(n);
    // Resetear a primera página cuando cambia el tamaño
    this.page$.next(1);
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

  goToCreate() {
    this.router.navigateByUrl('/clientes/nuevo');
  }

  editCliente(cliente: Client) {
    if (!cliente.id) return;
    this.router.navigateByUrl(`/clientes/${cliente.id}/editar`);
  }

  eliminarCliente(cliente: Client) {
    if (!cliente.id) return;
    this.clienteToDelete = cliente;
    this.notification = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Deseas eliminar la información del cliente ${cliente.nombre} ${cliente.apellido} (${cliente.tipo_documento}: ${cliente.numero_documento})?`,
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
    this.clienteToDelete = null;
  }

  onModalConfirm() {
    const cliente = this.clienteToDelete;
    if (!cliente?.id) {
      this.onModalClosed();
      return;
    }
    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter(c => c.id !== cliente.id);
        this.onModalClosed();
      },
      error: () => {
        this.onModalClosed();
      }
    });
  }
}
