import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  rota: string;
  icon: string;
  iconClass: string;
  criadoEm: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket: Socket;
  private notificationsSubject = new BehaviorSubject<Notificacao[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private api: ApiService,
    private ngZone: NgZone
  ) {
    this.socket = io('http://localhost:3000'); // Ajustar para URL do ambiente se necessário

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        console.log('Conectado ao WebSocket de notificações');
      });
    });

    this.socket.on('nova_notificacao', (notificacao: Notificacao) => {
      this.ngZone.run(() => {
        console.log('Nova notificação recebida:', notificacao);
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([notificacao, ...current]);
      });
    });
  }

  fetchNotifications(usuario_id?: number) {
    const params = usuario_id ? { usuario_id } : {};
    this.api.get<Notificacao[]>('/notificacoes', params).subscribe(notifications => {
      this.notificationsSubject.next(notifications);
    });
  }

  markAsRead(id: number) {
    // Atualização otimista
    const current = this.notificationsSubject.value;
    const updated = current.map(n => n.id === id ? { ...n, lida: true } : n);
    this.notificationsSubject.next(updated);

    this.api.post(`/notificacoes/${id}/lida`, {}).subscribe({
      error: (err) => {
        console.error('Erro ao marcar como lida:', err);
        this.notificationsSubject.next(current);
      }
    });
  }

  markAllAsRead(usuario_id?: number) {
    // Atualização otimista no frontend
    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, lida: true }));
    this.notificationsSubject.next(updated);

    this.api.post('/notificacoes/todas-lidas', { usuario_id }).subscribe({
      error: (err) => {
        console.error('Erro ao marcar todas como lidas:', err);
        // Rollback opcional se necessário
        this.notificationsSubject.next(current);
      }
    });
  }
}
