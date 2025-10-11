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
}
