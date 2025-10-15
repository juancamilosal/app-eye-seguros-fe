import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListaTareaService } from '../../core/services/lista-tarea.service';
import { StorageServices } from '../../core/services/storage.services';

@Component({
  selector: 'app-lista-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-tareas.html',
  styleUrls: ['./lista-tareas.css']
})
export class ListaTareasComponent implements OnInit {
  tasks: Array<{ id: string | number; text: string; completed: boolean }> = [];
  newTaskText = '';

  constructor(private listaTareaService: ListaTareaService) {}

  ngOnInit(): void {
    this.fetchTasks();
  }

  addTask(): void {
    const text = (this.newTaskText || '').trim();
    if (!text) return;
    
    const currentUser = StorageServices.getCurrentUser();
    const usuario_id: string = currentUser?.id ?? '';
    if (!usuario_id) {
      // Si no hay usuario, no crear en backend; opcionalmente se podría mostrar una notificación
      return;
    }
    
    this.listaTareaService
      .crearTarea({ tarea: text, usuario_id, completada: false })
      .subscribe({
        next: (resp) => {
          const created = resp?.data ?? {};
          const id = created?.id ?? Date.now();
          this.tasks = [{ id, text, completed: !!created?.completada }, ...this.tasks];
          this.newTaskText = '';
        },
        error: (error) => {
          // fallback: añadir localmente si falla
          const id = Date.now();
          this.tasks = [{ id, text, completed: false }, ...this.tasks];
          this.newTaskText = '';
        }
      });
  }

  toggleTaskCompleted(taskId: string | number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCompleted = !task.completed;
    const idStr = String(taskId);
    this.listaTareaService
      .actualizarTarea(idStr, { completada: newCompleted })
      .subscribe({
        next: () => {
          this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t);
        },
        error: () => {
          // si falla, aún reflejar el cambio localmente
          this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t);
        }
      });
  }

  removeTask(taskId: string | number): void {
    const idStr = String(taskId);
    this.listaTareaService.eliminarTarea(idStr).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
      },
      error: () => {
        // también eliminar localmente en caso de error para una UI ágil
        this.tasks = this.tasks.filter(t => t.id !== taskId);
      }
    });
  }

  private fetchTasks(): void {
    const currentUser = StorageServices.getCurrentUser();
    const usuario_id: string = currentUser?.id ?? '';
    const params = usuario_id ? { 'filter[usuario_id][_eq]': usuario_id } : undefined;
    this.listaTareaService.obtenerTareas(params).subscribe({
      next: (resp) => {
        const raw = resp?.data ?? [];
        this.tasks = raw.map((r: any) => ({
          id: r?.id ?? Date.now(),
          text: r?.tarea ?? '',
          completed: !!r?.completada,
        }));
      },
      error: () => {
        this.tasks = [];
      }
    });
  }
}