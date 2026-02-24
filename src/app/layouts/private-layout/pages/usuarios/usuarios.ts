import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioCard } from './usuario-card/usuario-card';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Usuario } from '../../../../core/models/Usuario';
 
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, UsuarioCard],
  templateUrl: './usuarios.html'
})
export class Usuarios implements OnInit {
  usuarios: Usuario[] = [];
  isLoading = false;

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  private loadUsuarios() {
    this.isLoading = true;
    this.usuarioService.obtenerUsuarios().subscribe({
      next: response => {
        this.usuarios = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.usuarios = [];
        this.isLoading = false;
      }
    });
  }

  goToCreate() {
    this.router.navigateByUrl('/usuarios/nuevo');
  }
}
