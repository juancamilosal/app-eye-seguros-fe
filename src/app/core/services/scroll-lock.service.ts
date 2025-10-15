import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollLockService {
  private renderer: Renderer2;
  private scrollPosition = 0;
  private isLocked = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  lock(): void {
    if (this.isLocked) return;
    
    this.isLocked = true;
    this.scrollPosition = window.scrollY;
    
    this.renderer.addClass(document.body, 'overflow-hidden');
    this.renderer.setStyle(document.body, 'position', 'fixed');
    this.renderer.setStyle(document.body, 'top', `-${this.scrollPosition}px`);
    this.renderer.setStyle(document.body, 'width', '100%');
  }

  unlock(): void {
    if (!this.isLocked) return;
    
    this.isLocked = false;
    
    this.renderer.removeClass(document.body, 'overflow-hidden');
    this.renderer.removeStyle(document.body, 'position');
    this.renderer.removeStyle(document.body, 'top');
    this.renderer.removeStyle(document.body, 'width');
    
    window.scrollTo(0, this.scrollPosition);
  }
}