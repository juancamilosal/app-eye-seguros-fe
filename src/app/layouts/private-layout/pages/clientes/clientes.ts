import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.html'
})
export class Clientes implements OnInit {
  clientes: Client[] = [];

  constructor(private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clienteService.obtenerClientes().subscribe({
      next: (resp) => {
        this.clientes = resp.data ?? [];
      },
      error: () => {
        this.clientes = [];
      }
    });
  }

  goToCreate() {
    this.router.navigateByUrl('/clientes/nuevo');
  }

  editCliente(cliente: Client) {
    if (!cliente.id) return;
    this.router.navigateByUrl(`/clientes/${cliente.id}/editar`);
  }

  eliminarCliente(cliente: Client) {
    if (!cliente.id) return;
    const confirmado = window.confirm(`¿Deseas eliminar al cliente ${cliente.nombre} ${cliente.apellido}?`);
    if (!confirmado) return;
    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter(c => c.id !== cliente.id);
      },
      error: () => {
        // Podrías agregar notificación de error
      }
    });
  }
}
