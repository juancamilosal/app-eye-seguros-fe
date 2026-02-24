import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuario-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-card.html'
})
export class UsuarioCard {
  @Input() id: string | undefined;
  @Input() nombre: string = '';
  @Input() email: string = '';

  constructor(private router: Router) {}

  onEdit() {
    if (!this.id) return;
    this.router.navigate(['/usuarios', 'editar', this.id]);
  }
}
