import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseAPI } from '../models/ResponseAPI';
import {GestionModel} from '../models/GestionModel';


@Injectable({ providedIn: 'root' })
export class GestionService {
  private url = environment.polizas;

  constructor(private http: HttpClient) {}

  crearVencimiento(payload: GestionModel): Observable<ResponseAPI<any>> {
    return this.http.post<ResponseAPI<any>>(this.url, payload);
  }

  obtenerVencimientos(params?: Record<string, string>): Observable<ResponseAPI<any[]>> {
    const query = {
      ...params,
      fields: '*,cliente_id.*'
    };

    return this.http.get<ResponseAPI<any[]>>(this.url, { params: query });
  }

  // Consulta ligera de pólizas, permitiendo especificar campos.
  obtenerPolizasRaw(params?: Record<string, string>): Observable<ResponseAPI<any[]>> {
    return this.http.get<ResponseAPI<any[]>>(this.url, { params });
  }

  actualizarVencimiento(id: string, payload: Partial<GestionModel>): Observable<ResponseAPI<any>> {
    return this.http.patch<ResponseAPI<any>>(`${this.url}/${id}`, payload);
  }

  eliminarVencimiento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

}
