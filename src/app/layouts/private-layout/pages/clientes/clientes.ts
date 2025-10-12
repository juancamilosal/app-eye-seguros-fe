import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../core/services/cliente.service';
import { Client } from '../../../../core/models/Client';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, NotificationModalComponent],
  templateUrl: './clientes.html'
})
export class Clientes implements OnInit {
  clientes: Client[] = [];
  loading = true;
  isModalVisible = false;
  notification: NotificationData | null = null;
  clienteToDelete: Client | null = null;

  constructor(private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clienteService.obtenerClientes().subscribe({
      next: (resp) => {
        this.clientes = resp.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.clientes = [];
        this.loading = false;
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
    this.clienteToDelete = cliente;
    this.notification = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Deseas eliminar la información del cliente ${cliente.nombre} ${cliente.apellido} (${cliente.tipo_documento}: ${cliente.numero_documento})?`,
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
    this.clienteToDelete = null;
  }

  onModalConfirm() {
    const cliente = this.clienteToDelete;
    if (!cliente?.id) {
      this.onModalClosed();
      return;
    }
    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter(c => c.id !== cliente.id);
        this.onModalClosed();
      },
      error: () => {
        this.onModalClosed();
      }
    });
  }
}
