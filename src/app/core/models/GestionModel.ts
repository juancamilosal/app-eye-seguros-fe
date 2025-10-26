export class GestionModel {
  cliente_id: string;
  numero_poliza: string;
  tipo_poliza: string;
  forma_pago: string;
  valor_poliza_anterior?: number;
  valor_poliza_actual?: number;
  fecha_vencimiento?: string;
  aseguradora?: string;
  aseguradora_id?: string;
  estado?: string;
  comentarios?: string;
  prenda?: boolean;
  es_vehiculo?: boolean;
  tipo_vehiculo?: string;
  placa?: string;
  entidad_prendaria?: string | null;
}
