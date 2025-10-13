export interface Management {
  titular: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  numeroPoliza: string;
  tipoPoliza: string;
  formaPagoRenovacion: string;
  valorAnterior: number;
  valorActual: number;
  fechaVencimiento?: string;
  aseguradora?: string;
  prenda?: boolean;
  esVehiculo?: boolean;
  placa?: string;
}
