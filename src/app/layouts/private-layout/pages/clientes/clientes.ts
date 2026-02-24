import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith } from 'rxjs/operators';
import { TIPO_DOCUMENTO } from '../../../../core/const/TipoDocumentoConst';

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
  isAddressModalVisible = false;
  addressModalTitle = '';
  addressModalContent = '';
  editingRowId: string | null = null;
  editBuffer: Record<string, Partial<Client>> = {};
  tiposDocumento = TIPO_DOCUMENTO;
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
      const words = q.split(/\s+/).filter(w => w.length > 0);
      let orIndex = 0;

      if (words.length === 1) {
        // Búsqueda simple: una sola palabra
        const word = words[0];
        params[`filter[_or][${orIndex++}][nombre][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][apellido][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][numero_documento][_icontains]`] = word;
      } else {
        // Búsqueda del término completo primero
        params[`filter[_or][${orIndex++}][nombre][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][apellido][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][numero_documento][_icontains]`] = q;

        // Dividir en diferentes combinaciones para nombres completos
        const firstWord = words[0];
        const restWords = words.slice(1).join(' ');

        // Opción 1: Primera palabra en nombre, resto en apellido
        params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = firstWord;
        params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = restWords;
        orIndex++;

        // Opción 2: Resto en nombre, primera palabra en apellido
        params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = restWords;
        params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = firstWord;
        orIndex++;

        // Para 3 o más palabras, probar divisiones adicionales
        if (words.length >= 3) {
          // Primeras dos palabras en nombre, resto en apellido
          const firstTwoWords = words.slice(0, 2).join(' ');
          const lastWords = words.slice(2).join(' ');

          params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = firstTwoWords;
          params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = lastWords;
          orIndex++;

          // Primera palabra en nombre, resto en apellido
          const firstWordOnly = words[0];
          const restFromSecond = words.slice(1).join(' ');

          params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = firstWordOnly;
          params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = restFromSecond;
          orIndex++;
        }

        // Para exactamente 2 palabras, agregar combinaciones cruzadas
        if (words.length === 2) {
          const word1 = words[0];
          const word2 = words[1];

          // Nombre contiene word1 Y apellido contiene word2
          params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = word1;
          params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = word2;
          orIndex++;

          // Nombre contiene word2 Y apellido contiene word1
          params[`filter[_or][${orIndex}][_and][0][nombre][_icontains]`] = word2;
          params[`filter[_or][${orIndex}][_and][1][apellido][_icontains]`] = word1;
          orIndex++;
        }

        params[`filter[_or][${orIndex}][_and][0][_or][0][nombre][_icontains]`] = words[0];
        params[`filter[_or][${orIndex}][_and][0][_or][1][apellido][_icontains]`] = words[0];
        for (let i = 1; i < words.length; i++) {
          params[`filter[_or][${orIndex}][_and][${i}][_or][0][nombre][_icontains]`] = words[i];
          params[`filter[_or][${orIndex}][_and][${i}][_or][1][apellido][_icontains]`] = words[i];
        }
        orIndex++;
      }
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
    // Cambiar a edición en línea en lugar de navegar
    if (!cliente.id) return;
    this.startInlineEdit(cliente);
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

  // --- Edición en línea ---
  startInlineEdit(cliente: Client) {
    if (!cliente?.id) return;
    this.editingRowId = cliente.id!;
    this.editBuffer[cliente.id!] = {
      tipo_documento: cliente.tipo_documento,
      numero_documento: cliente.numero_documento,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fecha_nacimiento: cliente.fecha_nacimiento,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad,
      email: cliente.email,
      numero_contacto: cliente.numero_contacto,
    };
  }

  onInlineFieldChange(id: string, field: keyof Client, value: any) {
    if (!this.editBuffer[id]) this.editBuffer[id] = {};
    if (field === 'numero_contacto' || field === 'numero_documento') {
      const onlyDigits = String(value || '').replace(/\D+/g, '').slice(0, 10);
      this.editBuffer[id][field] = onlyDigits;
    } else if (field === 'email') {
      const lowered = String(value ?? '').toLocaleLowerCase('es-ES');
      this.editBuffer[id][field] = lowered;
    } else if (field === 'nombre' || field === 'apellido' || field === 'direccion' || field === 'ciudad') {
      const transformed = this.toTitleCaseSpanish(String(value ?? ''));
      this.editBuffer[id][field] = transformed;
    } else {
      this.editBuffer[id][field] = value;
    }
  }

  confirmInlineUpdate(id: string) {
    const data = this.editBuffer[id];
    if (!id || !data) return;
    const payload: Partial<Client> = {
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      nombre: data.nombre,
      apellido: data.apellido,
      fecha_nacimiento: data.fecha_nacimiento,
      direccion: data.direccion,
      ciudad: data.ciudad,
      email: data.email,
      numero_contacto: data.numero_contacto,
    };
    this.clienteService.actualizarCliente(id, payload as Client).subscribe({
      next: () => {
        this.clientes = this.clientes.map(c => c.id === id ? { ...c, ...data } as Client : c);
        this.editingRowId = null;
        delete this.editBuffer[id];
      },
      error: () => {
        this.editingRowId = null;
        delete this.editBuffer[id];
      }
    });
  }

  cancelInlineEdit(id: string) {
    this.editingRowId = null;
    if (id) {
      delete this.editBuffer[id];
    }
  }

  private toTitleCaseSpanish(value: string): string {
    const raw = value || '';
    const trailingMatch = raw.match(/\s+$/);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const words = raw.trim()
      .toLocaleLowerCase('es-ES')
      .split(/\s+/)
      .filter(w => w.length > 0);
    const transformed = words
      .map(w => w.charAt(0).toLocaleUpperCase('es-ES') + w.slice(1))
      .join(' ');
    return transformed + trailing;
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

  // Métodos para el modal de direcciones
  truncateText(text: string, maxLength: number = 20): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  showAddressModal(address: string, title: string) {
    this.addressModalTitle = title;
    this.addressModalContent = address;
    this.isAddressModalVisible = true;
  }

  closeAddressModal() {
    this.isAddressModalVisible = false;
    this.addressModalTitle = '';
    this.addressModalContent = '';
  }
}
