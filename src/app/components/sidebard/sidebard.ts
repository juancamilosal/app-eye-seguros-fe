import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebard.html',
  styleUrls: ['./sidebard.css']
})
export class Sidebard {
  @Output() select = new EventEmitter<void>();
  constructor(private router: Router, private auth: AuthService) {}

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login'], { replaceUrl: true }),
      error: () => this.router.navigate(['/login'], { replaceUrl: true })
    });
  }
  onSelect() {
    this.select.emit();
  }
}
