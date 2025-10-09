import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Sidebard } from '../../components/sidebard/sidebard';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, Sidebard, RouterOutlet],
  templateUrl: './private-layout.html'
})
export class PrivateLayout {
  isSidebarOpen = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isSidebarOpen = false;
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

}
