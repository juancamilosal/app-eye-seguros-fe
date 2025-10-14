import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseAPI } from '../models/ResponseAPI';

@Injectable({ providedIn: 'root' })
export class ListaTareaService {
  private url = environment.lista_tarea;

  constructor(private http: HttpClient) {}

  crearTarea(payload: { tarea: string; usuario_id: string; completada?: boolean }): Observable<ResponseAPI<any>> {
    return this.http.post<ResponseAPI<any>>(this.url, payload);
  }

  obtenerTareas(params?: Record<string, string>): Observable<ResponseAPI<any[]>> {
    return this.http.get<ResponseAPI<any[]>>(this.url, { params });
  }

  actualizarTarea(id: string | number, payload: Partial<{ tarea: string; usuario_id: string; completada: boolean }>): Observable<ResponseAPI<any>> {
    return this.http.patch<ResponseAPI<any>>(`${this.url}/${id}`, payload);
  }

  eliminarTarea(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}