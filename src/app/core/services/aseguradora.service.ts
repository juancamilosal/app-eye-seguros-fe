import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {Aseguradora} from '../models/Aseguradora';

@Injectable({ providedIn: 'root' })
export class AseguradoraService {
  private url = environment.aseguradoras;

  constructor(private http: HttpClient) {}

  buscarPorNombre(term: string, limit: number = 7): Observable<{ data: Aseguradora[] }> {
    const q = (term || '').trim();
    if (!q || q.length < 2) {
      return of({ data: [] });
    }
    const params: Record<string, string> = {
      limit: String(limit),
      sort: 'nombre',
      fields: 'id,nombre',
      'filter[nombre][_icontains]': q,
    };
    return this.http.get<{ data: Aseguradora[] }>(this.url, { params });
  }

  obtenerPorId(id: string): Observable<{ data: Aseguradora | null }> {
    if (!id) return of({ data: null });
    return this.http.get<{ data: Aseguradora }>(`${this.url}/${id}`, { params: { fields: 'id,nombre' } });
  }

  // Listar aseguradoras (todas o con parámetros opcionales)
  obtenerAseguradoras(params?: Record<string, string>): Observable<{ data: Aseguradora[] }> {
    const query = {
      sort: 'nombre',
      ...(params ?? {})
    } as Record<string, string>;
    return this.http.get<{ data: Aseguradora[] }>(this.url, { params: query });
  }

  crearAseguradora(data: Partial<Aseguradora>): Observable<any> {
    return this.http.post(this.url, data);
  }

  actualizarAseguradora(id: string | number, data: Partial<Aseguradora>): Observable<any> {
    return this.http.patch(`${this.url}/${id}`, data);
  }

  eliminarAseguradora(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}