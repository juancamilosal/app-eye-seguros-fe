import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client } from '../../core/models/Client';
import {ResponseAPI} from '../models/ResponseAPI';

@Injectable({ providedIn: 'root' })

export class ClienteService {
  constructor(private http: HttpClient) {}

  urlClientes = environment.clientes;

  crearCliente(cliente: Client): Observable<ResponseAPI<Client>> {
    return this.http.post<ResponseAPI<Client>>(this.urlClientes, cliente);
  }

  obtenerClientes(params?: Record<string, string>): Observable<ResponseAPI<Client[] >> {
    return this.http.get<ResponseAPI<Client[]>>(this.urlClientes, { params });
  }

  obtenerCliente(id: string): Observable<ResponseAPI<Client>> {
    return this.http.get<ResponseAPI<Client>>(`${this.urlClientes}/${id}`);
  }

  actualizarCliente(id: string, cliente: Client): Observable<ResponseAPI<Client>> {
    return this.http.patch<ResponseAPI<Client>>(`${this.urlClientes}/${id}` , cliente);
  }

  eliminarCliente(id: string): Observable<void> {
    return this.http.delete<void>(`${this.urlClientes}/${id}`);
  }

}
