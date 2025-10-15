import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Router } from '@angular/router';
import { StorageServices } from '../../../../core/services/storage.services';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificationModalComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  isSubmitting = false;
  currentYear = new Date().getFullYear();
  isModalVisible = false;
  notification: NotificationData | null = null;
  showPassword = false;
  form!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
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
        // Validar usuario con permisos y guardar información de usuario en sessionStorage
        this.auth.me().subscribe({
          next: (meResp) => {
            try {
              StorageServices.saveObjectInSessionStorage(StorageServices.CURRENT_USER, meResp?.data);
            } catch {}
            this.isSubmitting = false;
            // Eliminamos la línea que activa el modal en caso de éxito
            this.router.navigateByUrl('/dashboard')
          },
          error: () => {
            this.isSubmitting = false;
            this.notification = {
              type: 'error',
              title: 'Acceso denegado',
              message: 'No tienes permisos para ingresar.'
            };
            this.isModalVisible = true; // Activamos el modal para mostrar el error
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
        this.isModalVisible = true; // Activamos el modal para mostrar el error
      }
    });
  }

  onModalClosed() {
    this.isModalVisible = false;
  }

  ngOnInit(): void {
    // Si el usuario ya está logueado, lo redirigimos al dashboard
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

}
