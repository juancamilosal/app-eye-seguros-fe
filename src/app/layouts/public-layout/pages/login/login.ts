import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  isSubmitting = false;
  currentYear = new Date().getFullYear();
  isModalVisible = false;
  notification: NotificationData | null = null;
  form!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    this.isSubmitting = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSubmitting = false;
      this.notification = {
        type: 'error',
        title: 'Error al iniciar sesión',
        message: 'Verifica tu correo y contraseña.'
      };
      this.isModalVisible = true;
      return;
    }

    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => {
        // Validar usuario con permisos (opcional: llamar a me() y verificar role)
        this.auth.me().subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification = {
              type: 'success',
              title: 'Inicio de sesión exitoso',
              message: 'Redirigiendo al dashboard... ',
              duration: 1200
            };
            this.isModalVisible = true;
            setTimeout(() => this.router.navigateByUrl('/dashboard'), 1200);
          },
          error: () => {
            this.isSubmitting = false;
            this.notification = {
              type: 'error',
              title: 'Acceso denegado',
              message: 'No tienes permisos para ingresar.'
            };
            this.isModalVisible = true;
          }
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.notification = {
          type: 'error',
          title: 'Error al iniciar sesión',
          message: 'Credenciales inválidas.'
        };
        this.isModalVisible = true;
      }
    });
  }

  onModalClosed() {
    this.isModalVisible = false;
  }
}
