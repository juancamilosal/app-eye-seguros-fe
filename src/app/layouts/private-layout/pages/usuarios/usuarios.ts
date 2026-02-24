import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioCard } from './usuario-card/usuario-card';
import { Router } from '@angular/router';
 
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, UsuarioCard],
  templateUrl: './usuarios.html'
})
export class Usuarios {
  usuariosEjemplo = [
    { nombre: 'Usuario de Ejemplo', email: 'usuario@ejemplo.com' },
    { nombre: 'María Pérez', email: 'maria.perez@example.com' },
    { nombre: 'Carlos Gómez', email: 'carlos.gomez@example.com' }
  ];

  constructor(private router: Router) {}

  goToCreate() {
    this.router.navigateByUrl('/usuarios/nuevo');
  }
}
