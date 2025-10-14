import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-tareas.html',
  styleUrls: ['./lista-tareas.css']
})
export class ListaTareasComponent implements OnInit {
  tasks: Array<{ id: number; text: string; completed: boolean }> = [];
  newTaskText = '';

  ngOnInit(): void {
    this.restoreTasks();
  }

  addTask(): void {
    const text = (this.newTaskText || '').trim();
    if (!text) return;
    const task = { id: Date.now(), text, completed: false };
    this.tasks = [task, ...this.tasks];
    this.newTaskText = '';
    this.persistTasks();
  }

  toggleTaskCompleted(taskId: number): void {
    this.tasks = this.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    this.persistTasks();
  }

  removeTask(taskId: number): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.persistTasks();
  }

  private persistTasks(): void {
    try {
      localStorage.setItem('dashboard_tasks', JSON.stringify(this.tasks));
    } catch {
      // ignore storage errors
    }
  }

  private restoreTasks(): void {
    try {
      const raw = localStorage.getItem('dashboard_tasks');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.tasks = parsed.map((t: any) => ({
            id: Number(t.id) || Date.now(),
            text: String(t.text || ''),
            completed: !!t.completed,
          }));
        }
      }
    } catch {
      this.tasks = [];
    }
  }
}