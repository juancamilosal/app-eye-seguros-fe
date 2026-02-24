import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-card.html'
})
export class UsuarioCard {
  @Input() nombre: string = '';
  @Input() email: string = '';
}
