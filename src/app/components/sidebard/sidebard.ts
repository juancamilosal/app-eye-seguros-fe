import { Component } from '@angular/core';
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
  constructor(private router: Router) {}

  logout() {
    this.router.navigateByUrl('/login');
  }
}
