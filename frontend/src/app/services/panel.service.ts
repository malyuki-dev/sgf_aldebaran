import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TicketCall {
  ticketId: string;
  category: string;
  guicheOrDoca: string;
  calledAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PanelService {
  private socket: Socket | null = null;
  
  // Usando Signals do Angular para reatividade ultra-eficiente
  public history = signal<TicketCall[]>([]);
  public isOnline = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  /**
   * Inicializa a conexão com Jitter e Sincronização.
   */
  public connect(panelType: 'DOCA' | 'SAGUAO', token: string) {
    if (this.socket) return;

    this.socket = io(environment.apiUrl, {
      auth: { token },
      query: { panelType },
      reconnectionDelay: 1000 + Math.random() * 2000, // Defesa: Jitter
      reconnectionAttempts: Infinity,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      this.isOnline.set(true);
      this.fetchReconciliationState(panelType, token);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.warn(`[WSS] Desconectado: ${reason}`);
      this.isOnline.set(false);
    });

    this.socket.on('ticket_called', (payload: TicketCall) => {
      this.handleNewTicket(payload, true);
    });
  }

  /**
   * Processa novo ticket com Idempotência.
   */
  private handleNewTicket(payload: TicketCall, playSound: boolean) {
    const current = this.history();
    
    // Evita duplicatas (Idempotência)
    if (current.some(t => t.ticketId === payload.ticketId)) return;

    const next = [payload, ...current].slice(0, 5);
    this.history.set(next);

    if (playSound) {
      this.playChime();
    }
  }

  /**
   * Sincronização Ativa (Reconciliation).
   */
  private fetchReconciliationState(panelType: string, token: string) {
    const url = `${environment.apiUrl}/api/tickets/history?sala=${panelType}`;
    
    this.http.get<TicketCall[]>(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        // Injeta o histórico silenciosamente
        data.reverse().forEach(t => this.handleNewTicket(t, false));
      },
      error: (err) => console.error('[PanelService] Erro na reconciliação', err)
    });
  }

  private playChime() {
    const audio = new Audio('assets/sounds/chime.mp3');
    audio.play().catch(e => console.error('Erro de áudio no navegador', e));
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
