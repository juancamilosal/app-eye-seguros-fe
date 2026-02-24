import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Management } from '../../../../core/models/Management';
import { Router } from '@angular/router';
import { GestionService } from '../../../../core/services/gestion.service';
import { ExcelService } from '../../../../core/services/excel.service';
import { FORMA_PAGO } from '../../../../core/const/FormaPagoConst';
import { Subject, BehaviorSubject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith } from 'rxjs/operators';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { ModalComentarioComponent } from '../../../../components/modal-comentario/modal-comentario';
import { NotificationData } from '../../../../core/models/NotificationData';
import {GestionModel} from '../../../../core/models/GestionModel';
import {Filtro} from '../../../../core/models/Filter';
import {MESES} from '../../../../core/const/MesesConst';

@Component({
  selector: 'app-vencimientos',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent, ModalComentarioComponent],
  templateUrl: './vencimientos.html'
})
export class Vencimientos implements OnInit {

  vencimientos: Array<Management & { id?: string }> = [];
  formaPago = FORMA_PAGO;
  loading = true;
  isModalVisible = false;
  notification: NotificationData | null = null;
  isComentarioVisible = false;
  comentarioBuffer: { id: string | null; value: string } = { id: null, value: '' };
  vencimientoToDelete: { id: string; numeroPoliza?: string; titular?: string } | null = null;
  editingRowId: string | null = null;
  editBuffer: Record<string, Partial<Management>> = {};
  showAdvancedFilters = false;
  private search$ = new Subject<string>();
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
  // Paginación
  page = 1;
  limit = 10;
  total = 0;
  private page$ = new BehaviorSubject<number>(1);
  private limit$ = new BehaviorSubject<number>(10);
  meses = MESES;


  constructor(
    private router: Router,
    private vencimientoService: GestionService,
    private excelService: ExcelService
  ) {}
  exportExcel(): void {
    const dataToExport = this.vencimientos.map((p: any) => ({
      'Número Póliza': p.numeroPoliza,
      'Tipo Póliza': p.tipoPoliza,
      'Aseguradora': p.aseguradora,
      'Titular': p.titular,
      'Documento': p.numeroDocumento,
      'Placa': p.placa,
      'Valor Actual': p.valorActual,
      'Fecha Vencimiento': p.fechaVencimiento,
      'Estado': p.estado,
      'Forma Pago': p.formaPagoRenovacion,
      'Comentarios': p.comentarios
    }));
    this.excelService.exportAsExcelFile(dataToExport, 'Vencimientos');
  }

  ngOnInit(): void {
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
        // Mapear a Management
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
            estado: r?.estado ?? undefined,
            comentarios: r?.comentarios ?? undefined,
            // Campos de vehículo
            prenda: !!(r?.prenda ?? r?.prenda),
            esVehiculo: !!(r?.es_vehiculo ?? r?.esVehiculo),
            tipo_vehiculo: r?.tipo_vehiculo ?? undefined,
            placa: (r?.es_vehiculo ?? r?.esVehiculo) ? (r?.placa ?? r?.placa ?? '') : undefined,
            entidadPrendaria: r?.entidad_prendaria ?? r?.entidadPrendaria ?? undefined,
          } as Management;
        });

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
      // Filtrar por nombre de la relación aseguradora_id
      params['filter[aseguradora_id][nombre][_icontains]'] = f.aseguradora.trim();
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
    // Filtro por mes de vencimiento
    const mes = (f.mesVencimiento ?? '').trim();
    const desde = (f.fechaDesde ?? '').trim();
    const hasta = (f.fechaHasta ?? '').trim();
    if (mes) {
      const now = new Date();
      const year = now.getFullYear();
      const monthIndex = Number(mes) - 1; // mes en 1..12
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      params['filter[fecha_vencimiento][_gte]'] = fmt(monthStart);
      params['filter[fecha_vencimiento][_lte]'] = fmt(monthEnd);
    } else if (desde || hasta) {
      if (desde) params['filter[fecha_vencimiento][_gte]'] = desde;
      if (hasta) params['filter[fecha_vencimiento][_lte]'] = hasta;
    } else {
      // Por defecto: próximo mes completo
      const now = new Date();
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      params['filter[fecha_vencimiento][_gte]'] = fmt(nextMonthStart);
      params['filter[fecha_vencimiento][_lte]'] = fmt(nextMonthEnd);
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

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
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

  startInlineEdit(item: { id?: string } & Management) {
    if (!item?.id) return;
    this.editingRowId = item.id!;
    this.editBuffer[item.id!] = {
      numeroPoliza: item.numeroPoliza,
      tipoPoliza: item.tipoPoliza,
      formaPagoRenovacion: item.formaPagoRenovacion,
      valorAnterior: item.valorAnterior,
      valorActual: item.valorActual,
      fechaVencimiento: item.fechaVencimiento,
      aseguradora: item.aseguradora,
      estado: item.estado,
      comentarios: item.comentarios,
      titular: item.titular,
      tipoDocumento: item.tipoDocumento,
      numeroDocumento: item.numeroDocumento,
      prenda: item.prenda,
      placa: item.placa ?? '',
      entidadPrendaria: item.entidadPrendaria ?? '',
    };
  }

  onInlineFieldChange(id: string, field: keyof Management, value: any) {
    if (!this.editBuffer[id]) this.editBuffer[id] = {};
    // Normalización básica: números para valorAnterior/valorActual
    if (field === 'valorAnterior' || field === 'valorActual') {
      const onlyDigits = String(value || '').replace(/\D+/g, '');
      this.editBuffer[id][field] = Number(onlyDigits || 0);
    } else if (field === 'placa') {
      const upper = String(value ?? '').toLocaleUpperCase('es-ES');
      this.editBuffer[id][field] = upper;
    } else if (field === 'entidadPrendaria') {
      const transformed = this.toTitleCaseSpanish(String(value ?? ''));
      this.editBuffer[id][field] = transformed;
    } else {
      this.editBuffer[id][field] = value;
    }
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
}
