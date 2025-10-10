export interface Management {
  titular: string;
  numeroPoliza: string;
  tipoPoliza: string;
  formaPagoRenovacion: string;
  valorAnterior: number;
  valorActual: number;
  fechaVencimiento?: string;
  aseguradora?: string;
}
