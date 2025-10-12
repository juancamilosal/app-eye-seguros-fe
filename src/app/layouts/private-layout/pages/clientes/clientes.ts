import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

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

  constructor(private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.loading = true;
          const params = this.buildFilterParams(term);
          return this.clienteService.obtenerClientes(params).pipe(
            catchError(() => of({ data: [] }))
          );
        })
      )
      .subscribe((resp: any) => {
        this.clientes = resp?.data ?? [];
        this.loading = false;
      });

    // Carga inicial sin filtros
    this.search$.next('');
  }

  onSearchChange(value: string) {
    this.search$.next(value?.trim() ?? '');
  }

  private buildFilterParams(term: string | undefined): Record<string, string> | undefined {
    const q = (term ?? '').trim();
    if (!q) return undefined;
    // Directus filter with OR on nombre, apellido, numero_documento (case-insensitive contains)
    return {
      'filter[_or][0][nombre][_icontains]': q,
      'filter[_or][1][apellido][_icontains]': q,
      'filter[_or][2][numero_documento][_icontains]': q,
      // Opcional: ordenar por nombre
      'sort': 'nombre'
    };
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
