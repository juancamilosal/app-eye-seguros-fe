import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsesorEditForm } from '../asesor-edit-form/asesor-edit-form';
import { Asesor } from '../../../../../core/models/Asesor';

@Component({
  selector: 'app-asesor-edit-modal',
  standalone: true,
  imports: [CommonModule, AsesorEditForm],
  templateUrl: './asesor-edit-modal.html'
})
export class AsesorEditModal {
  @Input() isVisible: boolean = false;
  @Input() asesor: Asesor | null = null;
  @Input() aseguradoraId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() asesorUpdated = new EventEmitter<void>();

  onFormSubmit(): void {
    this.asesorUpdated.emit();
  }

  onFormCancel(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onAsesorDeleted(): void {
    this.asesorUpdated.emit();
  }
}
