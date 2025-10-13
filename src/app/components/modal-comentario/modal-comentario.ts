import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-comentario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-comentario.html'
})
export class ModalComentarioComponent {
  @Input() isVisible = false;
  @Input() initialComentario: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  comentario: string = '';

  ngOnChanges() {
    this.comentario = this.initialComentario ?? '';
  }

  onClose() {
    this.isVisible = false;
    this.close.emit();
  }

  onSave() {
    this.isVisible = false;
    this.save.emit(this.comentario ?? '');
  }
}