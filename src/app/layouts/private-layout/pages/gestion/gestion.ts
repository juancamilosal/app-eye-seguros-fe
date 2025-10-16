import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Management } from '../../../../core/models/Management';
import { Router } from '@angular/router';
import { GestionService } from '../../../../core/services/gestion.service';
import { FORMA_PAGO } from '../../../../core/const/FormaPagoConst';
import { Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith } from 'rxjs/operators';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { ModalComentarioComponent } from '../../../../components/modal-comentario/modal-comentario';
import { NotificationData } from '../../../../core/models/NotificationData';
import {GestionModel} from '../../../../core/models/GestionModel';
import {Filtro} from '../../../../core/models/Filter';
import { AseguradoraService } from '../../../../core/services/aseguradora.service';
import {Aseguradora} from '../../../../core/models/Aseguradora';
import { TIPOS_VEHICULO } from '../../../../core/const/TiposVehiculoConst';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent, ModalComentarioComponent],
  templateUrl: './gestion.html'
})
export class Gestion implements OnInit {

  vencimientos: Array<Management & { id?: string }> = [];
  polizas: Array<Management & { id?: string }> = [];
  formaPago = FORMA_PAGO;
  tiposVehiculo = TIPOS_VEHICULO;
  loading = true;
  isModalVisible = false;
  notification: NotificationData | null = null;
  // Modal de comentario
  isComentarioVisible = false;
  comentarioBuffer: { id: string | null; value: string } = { id: null, value: '' };
  vencimientoToDelete: { id: string; numeroPoliza?: string; titular?: string } | null = null;
  editingRowId: string | null = null;
  // Buffer para edición en línea por fila
  editBuffer: Record<string, Partial<Management> & { aseguradoraId?: string; cliente_nombre?: string; cliente_apellido?: string }> = {};
  // Autocomplete aseguradora en edición inline
  aseguradorasSug: Record<string, Aseguradora[]> = {};
  asegLoadingRow: Record<string, boolean> = {};
  asegNoResultsRow: Record<string, boolean> = {};
  // Visibilidad de filtros avanzados
  showAdvancedFilters = false;
  // Autocomplete para filtro de aseguradora
  aseguradorasSuggestions: Aseguradora[] = [];
  aseguradoraFilterLoading = false;
  private aseguradoraFilterSearch$ = new Subject<string>();
  // Constante para formas de pago
  FORMA_PAGO = FORMA_PAGO;
  // Búsqueda
  private search$ = new Subject<string>();
  // Filtros avanzados
  filters: Filtro = {
    aseguradora: '',
    tipoPoliza: '',
    numeroPoliza: '',
    formaPago: '',
    mesVencimiento: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoVehiculo: ''
  };
  private filters$ = new BehaviorSubject<Filtro>(this.filters);
  // Filtro de Aseguradora (sin autocomplete)
  // Nota: se filtra por nombre vía relación aseguradora_id.nombre
  // Paginación
  page = 1;
  limit = 10;
  total = 0;
  private page$ = new BehaviorSubject<number>(1);
  private limit$ = new BehaviorSubject<number>(10);

  constructor(private router: Router, private vencimientoService: GestionService, private aseguradoraService: AseguradoraService) {}
  ngOnInit(): void {
    // Configurar autocompletado de aseguradoras para filtros
    this.aseguradoraFilterSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || term.length < 2) {
            return of({ data: [] });
          }
          return this.aseguradoraService.buscarPorNombre(term, 10).pipe(
            catchError(() => of({ data: [] }))
          );
        })
      )
      .subscribe((resp) => {
        this.aseguradorasSuggestions = resp?.data ?? [];
        this.aseguradoraFilterLoading = false;
      });

    const term$ = this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith('')
    );

    combineLatest([term$, this.page$, this.limit$, this.filters$])
      .pipe(
        switchMap(([term, page, limit, filters]) => {
          this.loading = true;
          const params = this.buildFilterParams(term, page, limit, filters);
          return this.vencimientoService.obtenerVencimientos(params).pipe(
            catchError(() => of({ data: [], meta: { filter_count: 0, page, limit } }))
          );
        })
      )
      .subscribe((resp: any) => {
        const raw = resp?.data ?? [];
        this.vencimientos = raw.map((r: any) => {
          const nombre = (r?.cliente_id?.nombre ?? r?.nombre ?? '').trim();
          const apellido = (r?.cliente_id?.apellido ?? r?.apellido ?? '').trim();
          const tipoDocumento = r?.cliente_id?.tipo_documento ?? r?.tipo_documento ?? undefined;
          const numeroDocumento = r?.cliente_id?.numero_documento ?? r?.numero_documento ?? undefined;
          return {
            id: r?.id,
            titular: `${nombre} ${apellido}`.trim() || (r?.titular ?? ''),
            tipoDocumento,
            numeroDocumento,
            numeroPoliza: r?.numero_poliza ?? r?.numeroPoliza ?? '',
            tipoPoliza: r?.tipo_poliza ?? r?.tipoPoliza ?? '',
            formaPagoRenovacion: r?.forma_pago ?? r?.formaPagoRenovacion ?? '',
            valorAnterior: Number(r?.valor_poliza_anterior ?? r?.valorAnterior ?? 0),
            valorActual: Number(r?.valor_poliza_actual ?? r?.valorActual ?? 0),
            fechaVencimiento: r?.fecha_vencimiento ?? r?.fechaVencimiento ?? undefined,
            aseguradora: (r?.aseguradora ?? r?.aseguradora_id?.nombre ?? undefined),
            aseguradoraId: r?.aseguradora_id ?? undefined,
            estado: r?.estado ?? undefined,
            comentarios: r?.comentarios ?? undefined,
            prenda: !!(r?.prenda ?? r?.prenda),
            esVehiculo: !!(r?.es_vehiculo ?? r?.esVehiculo),
            tipo_vehiculo: r?.tipo_vehiculo ?? undefined,
            placa: (r?.es_vehiculo ?? r?.esVehiculo) ? (r?.placa ?? r?.placa ?? '') : undefined,
            entidadPrendaria: r?.entidad_prendaria ?? r?.entidadPrendaria ?? undefined,
          } as Management;
        });

        // Asignar también a polizas para compatibilidad con el template
        this.polizas = this.vencimientos;

        const meta = resp?.meta ?? {};
        this.total = (meta?.filter_count ?? meta?.total_count ?? 0) as number;
        this.page = (meta?.page ?? this.page$.getValue()) as number;
        this.limit = (meta?.limit ?? this.limit$.getValue()) as number;
        this.loading = false;
      });
  }

  private buildFilterParams(term: string | undefined, page?: number, limit?: number, filters?: Filtro): Record<string, string> {
    const q = (term ?? '').trim();
    const params: Record<string, string> = {
      page: String(page ?? this.page),
      limit: String(limit ?? this.limit),
      meta: 'filter_count',
      sort: 'fecha_vencimiento'
    };
    
    if (q) {
      const words = q.split(/\s+/).filter(w => w.length > 0);
      let orIndex = 0;

      if (words.length === 1) {
        // Búsqueda simple: una sola palabra
        const word = words[0];
        params[`filter[_or][${orIndex++}][numero_poliza][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][tipo_poliza][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][aseguradora_id][nombre][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][cliente_id][nombre][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][cliente_id][apellido][_icontains]`] = word;
        params[`filter[_or][${orIndex++}][cliente_id][numero_documento][_icontains]`] = word;
      } else {
        // Búsqueda del término completo primero
        params[`filter[_or][${orIndex++}][numero_poliza][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][tipo_poliza][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][aseguradora_id][nombre][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][cliente_id][nombre][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][cliente_id][apellido][_icontains]`] = q;
        params[`filter[_or][${orIndex++}][cliente_id][numero_documento][_icontains]`] = q;

        // Dividir en diferentes combinaciones para nombres completos
        const firstWord = words[0];
        const restWords = words.slice(1).join(' ');

        // Opción 1: Primera palabra en nombre, resto en apellido
        params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = firstWord;
        params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = restWords;
        orIndex++;

        // Opción 2: Resto en nombre, primera palabra en apellido
        params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = restWords;
        params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = firstWord;
        orIndex++;

        // Para 3 o más palabras, probar divisiones adicionales
        if (words.length >= 3) {
          // Primeras dos palabras en nombre, resto en apellido
          const firstTwoWords = words.slice(0, 2).join(' ');
          const lastWords = words.slice(2).join(' ');

          params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = firstTwoWords;
          params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = lastWords;
          orIndex++;

          // Primera palabra en nombre, resto en apellido
          const firstWordOnly = words[0];
          const restFromSecond = words.slice(1).join(' ');

          params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = firstWordOnly;
          params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = restFromSecond;
          orIndex++;
        }

        // Para exactamente 2 palabras, agregar combinaciones cruzadas
        if (words.length === 2) {
          const word1 = words[0];
          const word2 = words[1];

          // Nombre contiene word1 Y apellido contiene word2
          params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = word1;
          params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = word2;
          orIndex++;

          // Nombre contiene word2 Y apellido contiene word1
          params[`filter[_or][${orIndex}][_and][0][cliente_id][nombre][_icontains]`] = word2;
          params[`filter[_or][${orIndex}][_and][1][cliente_id][apellido][_icontains]`] = word1;
          orIndex++;
        }
      }
    }
    const f = filters || this.filters;
    // Filtros avanzados (AND entre ellos)
    if (f.aseguradora?.trim()) {
      const v = f.aseguradora.trim();
      // Filtrar por nombre de la relación aseguradora_id
      params['filter[aseguradora_id][nombre][_icontains]'] = v;
    }
    if (f.tipoPoliza?.trim()) {
      params['filter[tipo_poliza][_icontains]'] = f.tipoPoliza.trim();
    }
    if (f.numeroPoliza?.trim()) {
      params['filter[numero_poliza][_icontains]'] = f.numeroPoliza.trim();
    }
    if (f.formaPago?.trim()) {
      params['filter[forma_pago][_eq]'] = f.formaPago.trim();
    }
    if (f.tipoVehiculo?.trim()) {
      params['filter[tipo_vehiculo][_eq]'] = f.tipoVehiculo.trim();
    }
    const desde = (f.fechaDesde ?? '').trim();
    const hasta = (f.fechaHasta ?? '').trim();
    if (desde) {
      params['filter[fecha_vencimiento][_gte]'] = desde;
    }
    if (hasta) {
      params['filter[fecha_vencimiento][_lte]'] = hasta;
    }
    return params;
  }

  onSearchChange(value: string) {
    this.search$.next(value?.trim() ?? '');
  }

  onFilterChange(field: keyof Filtro, value: string) {
    const v = (value ?? '').trim();
    this.filters = { ...this.filters, [field]: v };
    this.filters$.next(this.filters);
  }

  clearFilters() {
    this.filters = { aseguradora: '', tipoPoliza: '', numeroPoliza: '', formaPago: '', mesVencimiento: '', fechaDesde: '', fechaHasta: '', tipoVehiculo: '' };
    this.filters$.next(this.filters);
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
  // Autocomplete removido: el filtro de aseguradora funciona por texto
  trackByNumero(index: number, item: Management) {
    return item.numeroPoliza;
  }

  openForm() {
    this.router.navigateByUrl('/gestion/nuevo');
  }

  goToCreate() {
    this.router.navigateByUrl('/gestion/nuevo');
  }

  editPoliza(poliza: Management & { id?: string }) {
    this.startInlineEdit(poliza);
  }

  startInlineEdit(item: { id?: string } & Management) {
    if (!item?.id) return;
    this.editingRowId = item.id!;
    
    // Extraer nombre y apellido del cliente_id si existe
    const clienteNombre = (item as any).cliente_id?.nombre || '';
    const clienteApellido = (item as any).cliente_id?.apellido || '';
    
    this.editBuffer[item.id!] = {
      numeroPoliza: item.numeroPoliza || '',
      tipoPoliza: item.tipoPoliza || '',
      formaPagoRenovacion: item.formaPagoRenovacion || '',
      valorAnterior: item.valorAnterior || 0,
      valorActual: item.valorActual || 0,
      fechaVencimiento: item.fechaVencimiento || '',
      aseguradora: item.aseguradora || '',
      estado: item.estado || '',
      comentarios: item.comentarios || '',
      titular: item.titular || '',
      tipoDocumento: item.tipoDocumento || '',
      numeroDocumento: item.numeroDocumento || '',
      prenda: item.prenda || false,
      placa: item.placa || '',
      entidadPrendaria: item.entidadPrendaria || '',
      cliente_nombre: clienteNombre,
      cliente_apellido: clienteApellido,
    };
  }

  onInlineFieldChange(id: string, field: keyof Management | 'cliente_nombre' | 'cliente_apellido', value: any) {
    if (!this.editBuffer[id]) return;
    
    if (field === 'cliente_nombre' || field === 'cliente_apellido') {
      // Campos especiales para nombres de cliente
      this.editBuffer[id][field] = value;
    } else if (field === 'valorAnterior' || field === 'valorActual') {
      this.editBuffer[id][field] = parseFloat(value) || 0;
    } else if (field === 'placa') {
      this.editBuffer[id][field] = value?.toUpperCase();
    } else if (field === 'entidadPrendaria') {
      this.editBuffer[id][field] = this.toTitleCaseSpanish(value);
    } else {
      (this.editBuffer[id] as any)[field] = value;
    }
  }

  onInlineAseguradoraInput(id: string, value: string) {
    if (!id) return;
    const term = (value || '').trim();
    if (!this.editBuffer[id]) this.editBuffer[id] = {};
    this.editBuffer[id].aseguradora = term;
    this.editBuffer[id].aseguradoraId = undefined;
    if (term.length < 2) {
      this.aseguradorasSug[id] = [];
      this.asegNoResultsRow[id] = false;
      this.asegLoadingRow[id] = false;
      return;
    }
    this.asegLoadingRow[id] = true;
    this.aseguradoraService.buscarPorNombre(term, 7).subscribe({
      next: (resp) => {
        const list = (resp?.data ?? []) as Aseguradora[];
        this.aseguradorasSug[id] = list;
        this.asegLoadingRow[id] = false;
        this.asegNoResultsRow[id] = list.length === 0;
      },
      error: () => {
        this.aseguradorasSug[id] = [];
        this.asegLoadingRow[id] = false;
        this.asegNoResultsRow[id] = false;
      }
    });
  }

  onInlineAseguradoraSelect(id: string, item: Aseguradora) {
    if (!id || !item) return;
    if (!this.editBuffer[id]) this.editBuffer[id] = {};
    this.editBuffer[id].aseguradora = item.nombre;
    this.editBuffer[id].aseguradoraId = item.id;
    this.aseguradorasSug[id] = [];
    this.asegNoResultsRow[id] = false;
  }

  confirmInlineUpdate(id: string) {
    const data = this.editBuffer[id];
    if (!id || !data) return;
    const current = this.vencimientos.find(v => v.id === id);
    const esVehiculo = !!(current?.esVehiculo);
    const prenda = !!(data.prenda ?? current?.prenda ?? false);
    const placa = esVehiculo ? (String((data.placa ?? current?.placa ?? '')) || '') : undefined;
    let entidad = prenda ? (String((data.entidadPrendaria ?? current?.entidadPrendaria ?? ''))).trim() : '';
    entidad = prenda ? this.toTitleCaseSpanish(entidad) : '';
    // Validación: si prenda es true, entidad prendaria debe existir
    if (prenda && (!entidad || entidad.trim().length === 0)) {
      this.notification = {
        type: 'warning',
        title: 'Entidad prendaria requerida',
        message: 'Si Prenda está activo, debe diligenciar la Entidad prendaria para actualizar.',
        confirmable: false
      };
      this.isModalVisible = true;
      return;
    }
    const payload: Partial<GestionModel> = {
      numero_poliza: data.numeroPoliza,
      tipo_poliza: data.tipoPoliza,
      forma_pago: data.formaPagoRenovacion,
      valor_poliza_anterior: data.valorAnterior,
      valor_poliza_actual: data.valorActual,
      fecha_vencimiento: data.fechaVencimiento,
      aseguradora: data.aseguradora,
      aseguradora_id: data.aseguradoraId,
      estado: data.estado,
      comentarios: data.comentarios,
      // Nota: titular/cliente no se actualiza desde inline aquí
      prenda,
      es_vehiculo: esVehiculo,
      placa,
      entidad_prendaria: prenda ? entidad : null,
    };
    this.vencimientoService.actualizarVencimiento(id, payload).subscribe({
      next: () => {
        // Refleja cambios localmente
        this.vencimientos = this.vencimientos.map(v => {
          if (v.id === id) {
            return { ...v, ...data, prenda, esVehiculo, placa, entidadPrendaria: prenda ? entidad : undefined };
          }
          return v;
        });
        this.editingRowId = null;
        delete this.editBuffer[id];
      },
      error: () => {
        // Si falla, simplemente salimos del modo edición sin cambios
        this.editingRowId = null;
        delete this.editBuffer[id];
      }
    });
  }

  // Comentarios modal control
  openComentarios(item: { id?: string } & Management) {
    if (!item?.id) return;
    this.comentarioBuffer = { id: item.id!, value: item.comentarios ?? '' };
    this.isComentarioVisible = true;
  }

  onComentarioClose() {
    this.isComentarioVisible = false;
    this.comentarioBuffer = { id: null, value: '' };
  }

  onComentarioSave(value: string) {
    const id = this.comentarioBuffer.id;
    if (!id) {
      this.onComentarioClose();
      return;
    }
    const payload: Partial<GestionModel> = { comentarios: (value ?? '').trim() };
    this.vencimientoService.actualizarVencimiento(id, payload).subscribe({
      next: () => {
        this.vencimientos = this.vencimientos.map(v => v.id === id ? { ...v, comentarios: payload.comentarios } : v);
        this.onComentarioClose();
      },
      error: () => {
        this.onComentarioClose();
      }
    });
  }

  cancelInlineEdit(id: string) {
    this.editingRowId = null;
    if (id) {
      delete this.editBuffer[id];
    }
  }

  eliminarVencimientoPrompt(item: { id?: string; numeroPoliza?: string; titular?: string }) {
    if (!item?.id) return;
    this.vencimientoToDelete = { id: item.id!, numeroPoliza: item.numeroPoliza, titular: item.titular };
    this.notification = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Desea eliminar el registro de ${item.titular ?? '—'} (Póliza: ${item.numeroPoliza ?? '—'})?`,
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
    this.vencimientoToDelete = null;
  }

  onModalConfirm() {
    const v = this.vencimientoToDelete;
    if (!v?.id) {
      this.onModalClosed();
      return;
    }
    this.vencimientoService.eliminarVencimiento(v.id).subscribe({
      next: () => {
        this.vencimientos = this.vencimientos.filter(item => item.id !== v.id);
        this.onModalClosed();
      },
      error: () => {
        this.onModalClosed();
      }
    });
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

  // Métodos para filtros avanzados
  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    if (!this.showAdvancedFilters) {
      // Limpiar sugerencias cuando se cierra
      this.aseguradorasSuggestions = [];
    }
  }

  onAseguradoraFilterInput(value: string) {
    const term = (value || '').trim();
    this.onFilterChange('aseguradora', term);
    
    if (term.length >= 2) {
      this.aseguradoraFilterLoading = true;
      this.aseguradoraFilterSearch$.next(term);
    } else {
      this.aseguradorasSuggestions = [];
      this.aseguradoraFilterLoading = false;
    }
  }

  selectAseguradoraFilter(aseguradora: Aseguradora) {
    this.onFilterChange('aseguradora', aseguradora.nombre);
    this.aseguradorasSuggestions = [];
    this.aseguradoraFilterLoading = false;
  }

  clearAdvancedFilters() {
    this.filters = {
      aseguradora: '',
      tipoPoliza: '',
      numeroPoliza: '',
      formaPago: '',
      mesVencimiento: '',
      fechaDesde: '',
      fechaHasta: '',
      tipoVehiculo: ''
    };
    this.filters$.next(this.filters);
    this.aseguradorasSuggestions = [];
    this.aseguradoraFilterLoading = false;
  }
}
