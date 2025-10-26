import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Asesor } from '../models/Asesor';
import { AsesorAseguradora } from '../models/AsesorAseguradora';
import { ResponseAPI } from '../models/ResponseAPI';

@Injectable({ providedIn: 'root' })
export class AsesorService {
  private url = environment.asesores;
  private asesorAseguradoraUrl = environment.asesores_aseguradoras;

  constructor(private http: HttpClient) {}

  crearAsesor(asesor: Asesor): Observable<ResponseAPI<Asesor>> {
    return this.http.post<ResponseAPI<Asesor>>(this.url, asesor);
  }

  obtenerAsesores(params?: Record<string, string>): Observable<ResponseAPI<Asesor[]>> {
    return this.http.get<ResponseAPI<Asesor[]>>(this.url, { params });
  }

  obtenerAsesor(id: string): Observable<ResponseAPI<Asesor>> {
    return this.http.get<ResponseAPI<Asesor>>(`${this.url}/${id}`);
  }

  actualizarAsesor(id: string, asesor: Partial<Asesor>): Observable<ResponseAPI<Asesor>> {
    return this.http.patch<ResponseAPI<Asesor>>(`${this.url}/${id}`, asesor);
  }

  eliminarAsesor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // Métodos para manejar la relación muchos a muchos
  crearRelacionAsesorAseguradora(relacion: AsesorAseguradora): Observable<ResponseAPI<AsesorAseguradora>> {
    return this.http.post<ResponseAPI<AsesorAseguradora>>(this.asesorAseguradoraUrl, relacion);
  }

  obtenerRelacionesAsesorAseguradora(params?: Record<string, string>): Observable<ResponseAPI<AsesorAseguradora[]>> {
    return this.http.get<ResponseAPI<AsesorAseguradora[]>>(this.asesorAseguradoraUrl, { params });
  }

  eliminarRelacionAsesorAseguradora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.asesorAseguradoraUrl}/${id}`);
  }
}