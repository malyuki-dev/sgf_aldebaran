import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StatusItem, TaskItem } from '../models/task-management.model';

@Injectable({
  providedIn: 'root'
})
export class TaskManagementService {
  private statusUrl = `${environment.apiUrl}/status-items`;
  private taskUrl = `${environment.apiUrl}/task-items`;

  constructor(private http: HttpClient) {}

  // STATUS
  getStatusItems(): Observable<StatusItem[]> {
    return this.http.get<StatusItem[]>(this.statusUrl);
  }

  createStatus(data: Partial<StatusItem>): Observable<StatusItem> {
    return this.http.post<StatusItem>(this.statusUrl, data);
  }

  updateStatus(id: number, data: Partial<StatusItem>): Observable<StatusItem> {
    return this.http.patch<StatusItem>(`${this.statusUrl}/${id}`, data);
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.statusUrl}/${id}`);
  }

  reorderStatus(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.statusUrl}/reorder`, ids);
  }

  // TASKS
  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(this.taskUrl);
  }

  createTask(data: any): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.taskUrl, data);
  }

  updateTask(id: number, data: any): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.taskUrl}/${id}`, data);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.taskUrl}/${id}`);
  }

  moveTask(taskId: number, newStatusId: number, newOrder: number): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.taskUrl}/${taskId}/move`, { newStatusId, newOrder });
  }
}
