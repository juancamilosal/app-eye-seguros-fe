import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/Usuario';
import { ResponseAPI } from '../models/ResponseAPI';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private url = environment.usuarios;

  constructor(private http: HttpClient) {}

  crearUsuario(usuario: Usuario): Observable<ResponseAPI<Usuario>> {
    return this.http.post<ResponseAPI<Usuario>>(this.url, usuario);
  }

  obtenerUsuarios(params?: Record<string, string>): Observable<ResponseAPI<Usuario[]>> {
    return this.http.get<ResponseAPI<Usuario[]>>(this.url, { params });
  }

  obtenerUsuario(id: string): Observable<ResponseAPI<Usuario>> {
    return this.http.get<ResponseAPI<Usuario>>(`${this.url}/${id}`);
  }

  actualizarUsuario(id: string, usuario: Partial<Usuario>): Observable<ResponseAPI<Usuario>> {
    return this.http.patch<ResponseAPI<Usuario>>(`${this.url}/${id}`, usuario);
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
