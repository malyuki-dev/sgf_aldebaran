import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LucideAngularModule, Plus, MoreVertical, Calendar, User, AlertCircle } from 'lucide-angular';
import { TaskManagementService } from '../../../services/task-management.service';
import { StatusItem, TaskItem } from '../../../models/task-management.model';
import { TaskModalComponent } from './task-modal.component';

@Component({
  selector: 'app-quadro-status',
  standalone: true,
  imports: [CommonModule, DragDropModule, LucideAngularModule, TaskModalComponent],
  templateUrl: './quadro-status.component.html',
  styleUrls: ['./quadro-status.component.scss']
})
export class QuadroStatusComponent implements OnInit {
  statusList: StatusItem[] = [];
  loading = true;
  
  // Modal state
  showModal = false;
  currentTask?: TaskItem;
  currentStatusId?: number;

  readonly icons = {
    plus: Plus,
    more: MoreVertical,
    calendar: Calendar,
    user: User,
    alert: AlertCircle
  };

  constructor(private taskService: TaskManagementService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.taskService.getStatusItems().subscribe({
      next: (data) => {
        this.statusList = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar quadro:', err);
        this.loading = false;
      }
    });
  }

  onTaskDrop(event: CdkDragDrop<TaskItem[]>, statusId: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      // Aqui poderíamos atualizar a ordem no backend se necessário
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Atualizar status no backend
      this.taskService.moveTask(task.id, statusId, event.currentIndex).subscribe();
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'ALTA': return 'priority-high';
      case 'MEDIA': return 'priority-medium';
      case 'BAIXA': return 'priority-low';
      default: return '';
    }
  }

  openNewTaskModal(statusId: number) {
    this.currentTask = undefined;
    this.currentStatusId = statusId;
    this.showModal = true;
  }

  openTaskDetail(task: TaskItem) {
    this.currentTask = task;
    this.currentStatusId = task.statusId;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentTask = undefined;
    this.currentStatusId = undefined;
  }

  onTaskSaved() {
    this.loadData();
  }
}
