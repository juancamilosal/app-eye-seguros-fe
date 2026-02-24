import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioForm } from '../usuario-form/usuario-form';
import { UsuarioService } from '../../../../../core/services/usuario.service';
import { Usuario } from '../../../../../core/models/Usuario';
import { NotificationModalComponent } from '../../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../../core/models/NotificationData';

@Component({
  selector: 'app-usuario-edit',
  standalone: true,
  imports: [UsuarioForm, NotificationModalComponent],
  templateUrl: './usuario-edit.html'
})
export class UsuarioEdit implements OnInit {
  isLoading = false;
  isSubmitting = false;
  isModalVisible = false;
  notification: NotificationData | null = null;
  usuario: Usuario | null = null;
  private usuarioId: string | null = null;
  private navigateAfterClose = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    if (!this.usuarioId) {
      this.goBack();
      return;
    }
    this.loadUsuario(this.usuarioId);
  }

  private loadUsuario(id: string) {
    this.isLoading = true;
    this.usuarioService.obtenerUsuario(id).subscribe({
      next: response => {
        this.usuario = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notification = {
          type: 'error',
          title: 'Error al cargar usuario',
          message: 'No fue posible cargar la información del usuario.',
          confirmable: false
        };
        this.isModalVisible = true;
        this.navigateAfterClose = true;
      }
    });
  }

  goBack() {
    this.router.navigateByUrl('/usuarios');
  }

  onCancel() {
    this.goBack();
  }

  onSave(item: Usuario) {
    if (!this.usuarioId) {
      return;
    }

    const payload: Partial<Usuario> = {
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      telefono: item.telefono
    };

    if (item.password) {
      payload.password = item.password;
    }

    this.isSubmitting = true;
    this.usuarioService.actualizarUsuario(this.usuarioId, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notification = {
          type: 'success',
          title: 'Usuario actualizado',
          message: 'La información del usuario se actualizó correctamente.',
          confirmable: false
        };
        this.isModalVisible = true;
        this.navigateAfterClose = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        const message = this.getErrorMessage(err);
        this.notification = {
          type: 'error',
          title: 'Error al actualizar usuario',
          message,
          confirmable: false
        };
        this.isModalVisible = true;
        this.navigateAfterClose = false;
      }
    });
  }

  onDeletePrompt() {
    if (!this.usuarioId || !this.usuario) return;
    this.notification = {
      type: 'warning',
      title: 'Confirmar eliminación',
      message: `¿Deseas eliminar al usuario ${this.usuario.first_name} ${this.usuario.last_name}?`,
      confirmable: true,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    };
    this.isModalVisible = true;
  }

  onModalClosed() {
    this.isModalVisible = false;
    this.notification = null;
    if (this.navigateAfterClose) {
      this.navigateAfterClose = false;
      this.goBack();
    }
  }

  onModalConfirm() {
    if (this.notification?.confirmable) {
      this.confirmDelete();
      return;
    }
    this.onModalClosed();
  }

  private confirmDelete() {
    if (!this.usuarioId) {
      this.onModalClosed();
      return;
    }
    this.isSubmitting = true;
    this.isModalVisible = false;
    this.usuarioService.eliminarUsuario(this.usuarioId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notification = {
          type: 'success',
          title: 'Usuario Eliminado Correctamente',
          message: 'Usuario Eliminado Correctamente',
          confirmable: false,
          duration: 2000
        };
        this.navigateAfterClose = true;
        this.isModalVisible = true;
      },
      error: () => {
        this.isSubmitting = false;
        this.notification = {
          type: 'error',
          title: 'Error al eliminar usuario',
          message: 'No fue posible eliminar el usuario. Intenta nuevamente.',
          confirmable: false
        };
        this.isModalVisible = true;
      }
    });
  }

  private getErrorMessage(err: any): string {
    try {
      if (!err) return 'Ocurrió un error al actualizar el usuario. Intenta nuevamente.';
      const e = err.error ?? err;
      if (typeof e === 'string') return e;
      if (Array.isArray(e?.errors) && e.errors.length > 0) {
        return e.errors[0]?.message || 'Error desconocido del servidor';
      }
      if (typeof e?.message === 'string') return e.message;
      return 'Ocurrió un error al actualizar el usuario. Intenta nuevamente.';
    } catch {
      return 'Ocurrió un error al actualizar el usuario. Intenta nuevamente.';
    }
  }
}
