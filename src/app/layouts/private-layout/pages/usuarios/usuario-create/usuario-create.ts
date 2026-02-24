import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioForm } from '../usuario-form/usuario-form';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { Usuario } from '../../../../../core/models/Usuario';
import { Roles } from '../../../../../core/const/Roles';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';

@Component({
  selector: 'app-usuario-create',
  standalone: true,
  imports: [UsuarioForm, NotificationModalComponent],
  templateUrl: './usuario-create.html'
})
export class UsuarioCreate {
  isSubmitting = false;
  isModalVisible = false;
  notification: NotificationData | null = null;

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  goBack() {
    this.router.navigateByUrl('/usuarios');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Usuario) {
    const payload: Usuario = {
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      telefono: item.telefono,
      password: item.password,
      role: Roles.ADMINISTRADOR
    };

    this.isSubmitting = true;
    this.usuarioService.crearUsuario(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goBack();
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = this.getErrorMessage(err);
        this.notification = {
          type: 'error',
          title: 'Error al crear usuario',
          message,
          confirmable: false
        };
        this.isModalVisible = true;
      }
    });
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
  }

  private getErrorMessage(err: any): string {
    try {
      if (!err) return 'Ocurrió un error al crear el usuario. Intenta nuevamente.';
      const e = err.error ?? err;
      if (typeof e === 'string') return e;
      if (Array.isArray(e?.errors) && e.errors.length > 0) {
        return e.errors[0]?.message || 'Error desconocido del servidor';
      }
      if (typeof e?.message === 'string') return e.message;
      return 'Ocurrió un error al crear el usuario. Intenta nuevamente.';
    } catch {
      return 'Ocurrió un error al crear el usuario. Intenta nuevamente.';
    }
  }
}
