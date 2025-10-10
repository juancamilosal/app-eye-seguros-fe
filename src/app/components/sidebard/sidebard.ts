import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-sidebard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebard.html',
  styleUrls: ['./sidebard.css']
})
export class Sidebard {
  @Output() select = new EventEmitter<void>();
  constructor(private router: Router) {}

  logout() {
    this.router.navigateByUrl('/login');
  }
  onSelect() {
    this.select.emit();
  }
}
