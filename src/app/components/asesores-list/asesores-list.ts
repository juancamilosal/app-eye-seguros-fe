import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Asesor } from '../../core/models/Asesor';
import { AsesorEditModal } from '../../layouts/private-layout/pages/aseguradoras/asesor-edit-modal/asesor-edit-modal';

@Component({
  selector: 'app-asesores-list',
  standalone: true,
  imports: [CommonModule, AsesorEditModal],
  templateUrl: './asesores-list.html'
})
export class AsesoresList {
  @Input() asesores: Asesor[] = [];
  @Input() aseguradoraId: string = '';
  @Output() asesorUpdated = new EventEmitter<void>();

  selectedAsesor: Asesor | null = null;
  isEditModalVisible = false;

  openEditModal(asesor: Asesor): void {
    this.selectedAsesor = asesor;
    this.isEditModalVisible = true;
  }

  closeEditModal(): void {
    this.selectedAsesor = null;
    this.isEditModalVisible = false;
  }

  onAsesorUpdated(): void {
    this.closeEditModal();
    this.asesorUpdated.emit();
  }
}
