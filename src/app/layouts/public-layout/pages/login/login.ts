import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  isSubmitting = false;
  currentYear = new Date().getFullYear();
  isModalVisible = false;
  notification: NotificationData | null = null;

  submit() {
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      const ok = !!this.email && !!this.password && this.password.length >= 6;
      this.isModalVisible = true;
      if (ok) {
        this.notification = {
          type: 'success',
          title: 'Inicio de sesión exitoso',
          message: 'Has iniciado sesión correctamente.'
        };
      } else {
        this.notification = {
          type: 'error',
          title: 'Error al iniciar sesión',
          message: 'Verifica tu correo y contraseña.'
        };
      }
    }, 800);
  }

  onModalClosed() {
    this.isModalVisible = false;
  }
}
