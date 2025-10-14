import {Component, EventEmitter, OnInit, Output, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Management } from '../../../../../core/models/Management';
import { ClienteService } from '../../../../../core/services/cliente.service';
import { combineLatest, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith, filter as rxFilter } from 'rxjs/operators';
import { AseguradoraService, AseguradoraItem } from '../../../../../core/services/aseguradora.service';
import {TIPO_DOCUMENTO} from '../../../../../core/const/TipoDocumentoConst';
import {FORMA_PAGO} from '../../../../../core/const/FormaPagoConst';

@Component({
  selector: 'app-gestion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-form.html'
})
export class GestionForm implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Management & { titularId?: string }>();
  @Input() isSubmitting = false;
  tiposDocumento = TIPO_DOCUMENTO;
  formaPago = FORMA_PAGO;
  gestionForm: FormGroup;
  private clienteIdEncontrado: string | null = null;
  submitted = false;

  constructor(private fb: FormBuilder, private clienteService: ClienteService, private aseguradoraService: AseguradoraService) {
  }

  ngOnInit(): void {
    this.gestionForm = this.fb.group({
      tipoDocumento: [null, Validators.required],
      numeroDocumento: [null, [Validators.required, Validators.maxLength(10), Validators.pattern(/^\d+$/)]],
      nombre: [{ value: null, disabled: true }, Validators.required],
      apellido: [{ value: null, disabled: true }, Validators.required],
      numeroPoliza: [null, Validators.required],
      tipoPoliza: [null, Validators.required],
      formaPagoRenovacion: [null, Validators.required],
      valorAnterior: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      valorActual: [null, [Validators.required, Validators.pattern(/^\d+$/)]],
      fechaVencimiento: [null, Validators.required],
      aseguradora: [null, Validators.required],
      esVehiculo: [false],
      prenda: [{ value: false, disabled: true }],
      placa: [{ value: null, disabled: true }],
      entidadPrendaria: [{ value: null, disabled: true }]
    });

    this.setupAutoFill();

    // Autocomplete aseguradora
    const aseguradoraCtrl = this.gestionForm.get('aseguradora');
    aseguradoraCtrl?.valueChanges.subscribe((value: string) => {
      const term = (value || '').trim();
      this.aseguradoraIdSeleccionada = null; // Reset ID si el usuario edita manual
      if (term.length < 2) {
        this.asegOptions = [];
        this.asegNoResults = false;
        this.asegLoading = false;
        return;
      }
      this.asegLoading = true;
      this.asegSearch$.next(term);
    });
    this.asegSearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.aseguradoraService.buscarPorNombre(term, 7))
      )
      .subscribe({
        next: (resp) => {
          const list = (resp?.data ?? []) as AseguradoraItem[];
          this.asegOptions = list;
          this.asegLoading = false;
          const inputVal = String(this.gestionForm.get('aseguradora')?.value || '').trim();
          this.asegNoResults = inputVal.length >= 2 && list.length === 0;
        },
        error: () => {
          this.asegOptions = [];
          this.asegLoading = false;
          this.asegNoResults = false;
        }
      });

    // Toggle Prenda and Placa based on esVehiculo
    const esVehiculoCtrl = this.gestionForm.get('esVehiculo');
    const prendaCtrl = this.gestionForm.get('prenda');
    const entidadCtrl = this.gestionForm.get('entidadPrendaria');
    const placaCtrl = this.gestionForm.get('placa');
    esVehiculoCtrl?.valueChanges.subscribe((isVehiculo: boolean) => {
      if (isVehiculo) {
        prendaCtrl?.enable({ emitEvent: false });
        placaCtrl?.enable({ emitEvent: false });
        placaCtrl?.addValidators([Validators.required]);
        // Entidad prendaria depende de prenda
        if (prendaCtrl?.value) {
          entidadCtrl?.enable({ emitEvent: false });
          entidadCtrl?.addValidators([Validators.required]);
        }
      } else {
        prendaCtrl?.disable({ emitEvent: false });
        prendaCtrl?.setValue(false, { emitEvent: false });
        placaCtrl?.clearValidators();
        placaCtrl?.setValue(null, { emitEvent: false });
        placaCtrl?.disable({ emitEvent: false });
        entidadCtrl?.clearValidators();
        entidadCtrl?.setValue(null, { emitEvent: false });
        entidadCtrl?.disable({ emitEvent: false });
      }
      placaCtrl?.updateValueAndValidity({ emitEvent: false });
      entidadCtrl?.updateValueAndValidity({ emitEvent: false });
    });

    // Reaccionar a cambios de prenda para habilitar/validar entidad prendaria
    prendaCtrl?.valueChanges.subscribe((hasPrenda: boolean) => {
      if (hasPrenda) {
        entidadCtrl?.enable({ emitEvent: false });
        entidadCtrl?.addValidators([Validators.required]);
      } else {
        entidadCtrl?.clearValidators();
        entidadCtrl?.setValue(null, { emitEvent: false });
        entidadCtrl?.disable({ emitEvent: false });
      }
      entidadCtrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  get isNitSelected(): boolean {
    const val = this.gestionForm?.get('tipoDocumento')?.value;
    return String(val || '').toUpperCase() === 'NIT';
  }

  private setupAutoFill() {
    const tipoDocCtrl = this.gestionForm.get('tipoDocumento');
    const numeroDocCtrl = this.gestionForm.get('numeroDocumento');
    if (!tipoDocCtrl || !numeroDocCtrl) return;

    combineLatest([
      tipoDocCtrl.valueChanges.pipe(startWith(tipoDocCtrl.value ?? ''), distinctUntilChanged()),
      numeroDocCtrl.valueChanges.pipe(startWith(numeroDocCtrl.value ?? ''), distinctUntilChanged())
    ])
      .pipe(
        debounceTime(300),
        rxFilter(([tipo, numero]) => !!tipo && !!numero && String(numero).trim().length > 0),
        switchMap(([tipo, numero]) => {
          const params: Record<string, string> = {
            'filter[tipo_documento][_eq]': String(tipo),
            'filter[numero_documento][_eq]': String(numero).trim(),
            'limit': '1'
          };
          return this.clienteService.obtenerClientes(params).pipe(
            catchError(() => of({ data: [] }))
          );
        })
      )
      .subscribe((resp: any) => {
        const c = Array.isArray(resp?.data) ? resp.data[0] : null;
        const nombre = c?.nombre ?? '';
        const apellido = c?.apellido ?? '';
        this.clienteIdEncontrado = c?.id ?? null;
        this.gestionForm.patchValue({ nombre, apellido });
      });
  }
  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.submitted = true;
    if (this.gestionForm.invalid) {
      this.gestionForm.markAllAsTouched();
      return;
    }

    const v = this.gestionForm.getRawValue() as {
      tipoDocumento: string;
      numeroDocumento: string;
      nombre: string;
      apellido: string;
      numeroPoliza: string;
      tipoPoliza: string;
      formaPagoRenovacion: string;
      valorAnterior: number | string;
      valorActual: number | string;
      fechaVencimiento?: string;
      aseguradora?: string;
      esVehiculo?: boolean;
      prenda?: boolean;
      placa?: string;
      entidadPrendaria?: string;
    };

    const data: Management & { titularId?: string; aseguradoraId?: string } = {
      titular: `${(v.nombre || '').trim()} ${(v.apellido || '').trim()}`.trim(),
      numeroPoliza: v.numeroPoliza,
      tipoPoliza: v.tipoPoliza,
      formaPagoRenovacion: v.formaPagoRenovacion,
      valorAnterior: Number(v.valorAnterior ?? 0),
      valorActual: Number(v.valorActual ?? 0),
      fechaVencimiento: v.fechaVencimiento || undefined,
      aseguradora: v.aseguradora || undefined,
      aseguradoraId: this.aseguradoraIdSeleccionada ?? undefined,
      prenda: !!v.prenda,
      // Campos vehículo
      esVehiculo: !!v.esVehiculo,
      placa: v.esVehiculo ? (v.placa || '').trim() : undefined,
      entidadPrendaria: v.prenda ? this.toTitleCaseSpanish((v.entidadPrendaria || '').trim()) : undefined,
      titularId: this.clienteIdEncontrado ?? undefined,
    };
    this.save.emit(data);
  }

  isInvalid(name: string): boolean {
    const c = this.gestionForm.get(name);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  getError(name: string): string | null {
    const c = this.gestionForm.get(name);
    if (!c || !c.errors) return null;
    if (c.errors['required']) {
      const requiredMessages: Record<string, string> = {
        tipoDocumento: 'El Tipo de Documento es Obligatorio',
        numeroDocumento: 'El Número de Documento es Obligatorio',
        nombre: 'El Nombre es Obligatorio',
        apellido: 'El Apellido es Obligatorio',
        numeroPoliza: 'El Número de Póliza es Obligatorio',
        tipoPoliza: 'El Tipo de Póliza es Obligatorio',
        formaPagoRenovacion: 'La Forma de Pago es Obligatoria',
        valorAnterior: 'El Valor Póliza Año Anterior es Obligatorio',
        valorActual: 'El Valor Póliza Año Actual es Obligatorio',
        fechaVencimiento: 'La Fecha de Vencimiento es Obligatoria',
        aseguradora: 'La Aseguradora es Obligatoria',
      };
      return requiredMessages[name] ?? 'Este campo es obligatorio';
    }
    if (c.errors['maxlength']) {
      const req = c.errors['maxlength']?.requiredLength;
      return name === 'numeroDocumento' ? `Debe tener máximo ${req} dígitos` : `Debe tener máximo ${req} caracteres`;
    }
    if (c.errors['pattern']) {
      if (name === 'numeroDocumento' || name === 'valorAnterior' || name === 'valorActual') return 'Solo números';
      return 'Formato inválido';
    }
    return 'Valor inválido';
  }

  // --- Autocomplete de aseguradora ---
  aseguradoraIdSeleccionada: string | null = null;
  asegOptions: AseguradoraItem[] = [];
  asegLoading = false;
  asegNoResults = false;
  private asegSearch$ = new Subject<string>();

  onAseguradoraSelect(item: AseguradoraItem): void {
    if (!item) return;
    this.aseguradoraIdSeleccionada = item.id;
    this.gestionForm.get('aseguradora')?.setValue(item.nombre, { emitEvent: false });
    this.asegOptions = [];
    this.asegNoResults = false;
  }

  clearAsegOptions(): void {
    this.asegOptions = [];
    this.asegNoResults = false;
  }

  onNumericInput(event: Event, controlName: keyof Management | 'numeroDocumento' | 'valorAnterior' | 'valorActual', maxLen?: number) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    let onlyDigits = (target.value || '').replace(/\D+/g, '');
    if (typeof maxLen === 'number') {
      onlyDigits = onlyDigits.slice(0, maxLen);
    }
    const ctrl = this.gestionForm.get(controlName as string);
    // Para mostrar puntos de miles en los campos de valor (vista) y guardar solo dígitos (modelo)
    if (controlName === 'valorAnterior' || controlName === 'valorActual') {
      const formatted = onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      // Primero actualizamos el control con solo dígitos
      ctrl?.setValue(onlyDigits, { emitEvent: false });
      // Luego actualizamos el input visible con el formato con puntos
      target.value = formatted;
    } else {
      ctrl?.setValue(onlyDigits, { emitEvent: false });
      target.value = onlyDigits;
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

  onCapitalizeInput(event: Event, controlName: keyof Management | 'tipoPoliza') {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const transformed = this.toTitleCaseSpanish(target.value || '');
    const ctrl = this.gestionForm.get(controlName as string);
    ctrl?.setValue(transformed, { emitEvent: false });
  }

  onUppercaseInput(event: Event, controlName: keyof Management | 'placa') {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const upper = (target.value || '').toLocaleUpperCase('es-ES');
    const ctrl = this.gestionForm.get(controlName as string);
    ctrl?.setValue(upper, { emitEvent: false });
    target.value = upper;
  }
}
