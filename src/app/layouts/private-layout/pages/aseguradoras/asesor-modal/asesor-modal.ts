import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsesorForm } from '../asesor-form/asesor-form';
import { Asesor } from '../../../../../core/models/Asesor';

@Component({
  selector: 'app-asesor-modal',
  standalone: true,
  imports: [CommonModule, AsesorForm],
  templateUrl: './asesor-modal.html'
})
export class AsesorModal {
  @Input() isVisible: boolean = false;
  @Input() aseguradoraId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() asesorCreated = new EventEmitter<Asesor>();

  onFormSubmit(asesor: Asesor): void {
    this.asesorCreated.emit(asesor);
  }

  onFormCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
