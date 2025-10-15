import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Sidebard } from '../../components/sidebard/sidebard';
import { ScrollLockService } from '../../core/services/scroll-lock.service';

@Component({
  selector: 'app-private-layout',
  standalone: true,
  imports: [CommonModule, Sidebard, RouterOutlet],
  templateUrl: './private-layout.html'
})
export class PrivateLayout {
  isSidebarOpen = false;

  constructor(private router: Router, private scrollLockService: ScrollLockService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isSidebarOpen = false;
        this.scrollLockService.unlock();
      }
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    if (this.isSidebarOpen) {
      this.scrollLockService.lock();
    } else {
      this.scrollLockService.unlock();
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.scrollLockService.unlock();
  }
}
