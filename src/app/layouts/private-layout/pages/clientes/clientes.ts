import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.html'
})
export class Clientes {
  clientes = [
    {
      nombre: 'María',
      apellido: 'González',
      fecha_nacimiento: new Date(1990, 4, 12),
      direccion: 'Av. Principal 123, Caracas',
      email: 'maria.gonzalez@example.com'
    },
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      fecha_nacimiento: new Date(1985, 10, 3),
      direccion: 'Calle 45 #67-89, Bogotá',
      email: 'juan.perez@example.com'
    }
  ];
}
