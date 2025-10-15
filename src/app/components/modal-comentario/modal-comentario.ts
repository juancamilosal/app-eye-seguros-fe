import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollLockService } from '../../core/services/scroll-lock.service';

@Component({
  selector: 'app-modal-comentario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-comentario.html'
})
export class ModalComentarioComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() initialComentario = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  comentario = '';

  constructor(private scrollLockService: ScrollLockService) {}

  ngOnChanges() {
    if (this.isVisible) {
      this.comentario = this.initialComentario || '';
      this.scrollLockService.lock();
    } else {
      this.scrollLockService.unlock();
    }
  }

  onClose() {
    this.isVisible = false;
    this.scrollLockService.unlock();
    this.close.emit();
  }

  onSave() {
    this.save.emit(this.comentario);
    this.isVisible = false;
    this.scrollLockService.unlock();
  }
}