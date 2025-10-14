import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AseguradoraItem {
  id: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AseguradoraService {
  private url = environment.aseguradoras;

  constructor(private http: HttpClient) {}

  buscarPorNombre(term: string, limit: number = 7): Observable<{ data: AseguradoraItem[] }> {
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
    return this.http.get<{ data: AseguradoraItem[] }>(this.url, { params });
  }

  obtenerPorId(id: string): Observable<{ data: AseguradoraItem | null }> {
    if (!id) return of({ data: null });
    return this.http.get<{ data: AseguradoraItem }>(`${this.url}/${id}`, { params: { fields: 'id,nombre' } });
  }
}