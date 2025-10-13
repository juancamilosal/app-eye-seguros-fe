import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseAPI } from '../models/ResponseAPI';

export interface VencimientoPayload {
  cliente_id: string;
  numero_poliza: string;
  tipo_poliza: string;
  forma_pago: string;
  valor_poliza_anterior?: number;
  valor_poliza_actual?: number;
  fecha_vencimiento?: string;
  aseguradora?: string;
  estado?: string;
  comentarios?: string;
  prenda?: boolean;
  es_vehiculo?: boolean;
  placa?: string;
  entidad_prendaria?: string | null;
}

@Injectable({ providedIn: 'root' })
export class VencimientoService {
  private url = environment.vencimientos;

  constructor(private http: HttpClient) {}

  crearVencimiento(payload: VencimientoPayload): Observable<ResponseAPI<any>> {
    return this.http.post<ResponseAPI<any>>(this.url, payload);
  }

  obtenerVencimientos(params?: Record<string, string>): Observable<ResponseAPI<any[]>> {
    const query = {
      ...params,
      fields: '*,cliente_id.*'
    };

    return this.http.get<ResponseAPI<any[]>>(this.url, { params: query });
  }

  actualizarVencimiento(id: string, payload: Partial<VencimientoPayload>): Observable<ResponseAPI<any>> {
    return this.http.patch<ResponseAPI<any>>(`${this.url}/${id}`, payload);
  }

  eliminarVencimiento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

}