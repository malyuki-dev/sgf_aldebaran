import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, X, Save, Trash2, Calendar, User, Info, AlertTriangle } from 'lucide-angular';
import { TaskManagementService } from '../../../services/task-management.service';
import { StatusItem, TaskItem, Priority } from '../../../models/task-management.model';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss']
})
export class TaskModalComponent implements OnInit {
  @Input() task?: TaskItem;
  @Input() statusId?: number;
  @Input() statusList: StatusItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  taskForm: FormGroup;
  loading = false;
  
  readonly icons = {
    x: X,
    save: Save,
    trash: Trash2,
    calendar: Calendar,
    user: User,
    info: Info,
    alert: AlertTriangle
  };

  priorities: { label: string; value: Priority }[] = [
    { label: 'Baixa', value: 'BAIXA' },
    { label: 'Média', value: 'MEDIA' },
    { label: 'Alta', value: 'ALTA' }
  ];

  constructor(
    private fb: FormBuilder,
    private taskService: TaskManagementService
  ) {
    this.taskForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(200)]],
      descricao: [''],
      prioridade: ['MEDIA', Validators.required],
      status_id: [null, Validators.required],
      responsavel_id: [null],
      dataEntrega: [null]
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        titulo: this.task.titulo,
        descricao: this.task.descricao,
        prioridade: this.task.prioridade,
        status_id: this.task.statusId,
        responsavel_id: this.task.responsavelId,
        dataEntrega: this.task.dataEntrega ? new Date(this.task.dataEntrega).toISOString().split('T')[0] : null
      });
    } else if (this.statusId) {
      this.taskForm.get('status_id')?.setValue(this.statusId);
    }
  }

  onSubmit() {
    if (this.taskForm.invalid) return;

    this.loading = true;
    const data = this.taskForm.value;

    if (this.task) {
      this.taskService.updateTask(this.task.id, data).subscribe({
        next: () => {
          this.saved.emit();
          this.close.emit();
        },
        error: (err: any) => {
          console.error('Erro ao atualizar tarefa:', err);
          this.loading = false;
        }
      });
    } else {
      this.taskService.createTask(data).subscribe({
        next: () => {
          this.saved.emit();
          this.close.emit();
        },
        error: (err: any) => {
          console.error('Erro ao criar tarefa:', err);
          this.loading = false;
        }
      });
    }
  }

  deleteTask() {
    if (!this.task || !confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    this.loading = true;
    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.saved.emit();
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Erro ao excluir tarefa:', err);
        this.loading = false;
      }
    });
  }
}
