import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteForm, Cliente } from '../cliente-form/cliente-form';
import { ClienteService } from '../../../../../core/services/cliente.service';
import { Client } from '../../../../../core/models/Client';

@Component({
  selector: 'app-cliente-edit',
  standalone: true,
  imports: [CommonModule, ClienteForm],
  templateUrl: './cliente-edit.html'
})
export class ClienteEdit implements OnInit {
  isSubmitting = false;
  id!: string;
  initialValue: Cliente | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) {
      this.goBack();
      return;
    }
    this.clienteService.obtenerCliente(this.id).subscribe({
      next: (resp) => {
        const c = resp.data;
        if (!c) return;
        this.initialValue = {
          tipoDocumento: c.tipo_documento,
          numeroDocumento: c.numero_documento,
          nombre: c.nombre,
          apellido: c.apellido,
          fechaNacimiento: c.fecha_nacimiento,
          direccion: c.direccion,
          numeroContacto: c.numero_contacto,
          email: c.email,
        };
      },
      error: () => {
        // Podrías mostrar notificación
      }
    });
  }

  goBack() {
    this.router.navigateByUrl('/clientes');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Cliente) {
    const payload: Client = {
      tipo_documento: item.tipoDocumento,
      numero_documento: item.numeroDocumento,
      nombre: item.nombre,
      apellido: item.apellido,
      fecha_nacimiento: item.fechaNacimiento,
      direccion: item.direccion,
      numero_contacto: item.numeroContacto,
      email: item.email,
    };

    this.isSubmitting = true;
    this.clienteService.actualizarCliente(this.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}