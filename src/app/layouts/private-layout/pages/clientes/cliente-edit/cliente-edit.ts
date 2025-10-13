import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { ClienteForm } from '../cliente-form/cliente-form';
import { ClienteService } from '../../../../../core/services/cliente.service';
import { Client } from '../../../../../core/models/Client';

@Component({
  selector: 'app-cliente-edit',
  standalone: true,
  imports: [ClienteForm],
  templateUrl: './cliente-edit.html'
})
export class ClienteEdit implements OnInit {
  isSubmitting = false;
  id!: string;
  initialValue: Client | null = null;

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
          tipo_documento: c.tipo_documento,
          numero_documento: c.numero_documento,
          nombre: c.nombre,
          apellido: c.apellido,
          fecha_nacimiento: c.fecha_nacimiento,
          direccion: c.direccion,
          numero_contacto: c.numero_contacto,
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

  onSave(item: Client) {
    const payload: Client = {
      tipo_documento: item.tipo_documento,
      numero_documento: item.numero_documento,
      nombre: item.nombre,
      apellido: item.apellido,
      fecha_nacimiento: item.fecha_nacimiento,
      direccion: item.direccion,
      numero_contacto: item.numero_contacto,
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
