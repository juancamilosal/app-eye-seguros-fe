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
}
