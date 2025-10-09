import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  isSubmitting = false;
  currentYear = new Date().getFullYear();

  submit() {
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      alert('Inicio de sesión simulado');
    }, 800);
  }
}
