import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NotificationModalComponent } from '../../../../components/notification-modal/notification-modal';
import { NotificationData } from '../../../../core/models/NotificationData';
import { Router } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      const ok = this.form.valid;
      if (ok) {
        this.notification = {
          type: 'success',
          title: 'Inicio de sesión exitoso',
          message: 'Redirigiendo al dashboard... ',
          duration: 1200
        };
        this.isModalVisible = true;
        setTimeout(() => this.router.navigateByUrl('/dashboard'), 1200);
      } else {
        this.form.markAllAsTouched();
        this.notification = {
          type: 'error',
          title: 'Error al iniciar sesión',
          message: 'Verifica tu correo y contraseña.'
        };
        this.isModalVisible = true;
      }
    }, 800);
  }

  onModalClosed() {
    this.isModalVisible = false;
  }
}
