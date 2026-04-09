import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Megaphone, UserCheck, Clock, History, AlertTriangle, Monitor, RotateCw, XCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-atendimento',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './atendimento.component.html',
  styleUrl: './atendimento.component.scss'
})
export class AtendimentoComponent implements OnInit, OnDestroy {
  // Configuração
  guiches: any[] = [];
  selectedGuicheId: number | null = null;
  
  // Estado do Atendimento
  senhaAtual: any | null = null;
  loading = false;
  statusAtendimento: 'IDLE' | 'CHAMANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO' = 'IDLE';
  
  // Cronômetro
  tempoAtendimento = 0; // em segundos
  private timerInterval: any;

  // Histórico local da sessão
  historicoSessao: any[] = [];

  readonly icons: any = { 
    megaphone: Megaphone, 
    check: UserCheck, 
    clock: Clock, 
    history: History, 
    alert: AlertTriangle, 
    monitor: Monitor, 
    retry: RotateCw, 
    cancel: XCircle, 
    success: CheckCircle 
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.carregarGuiches();
    // Recuperar último guichê salvo no navegador por conveniência
    const salvo = localStorage.getItem('ultimoGuiche');
    if (salvo) this.selectedGuicheId = Number(salvo);
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  carregarGuiches() {
    this.api.get<any[]>('/guiches').subscribe(res => {
      this.guiches = res.filter(g => g.ativo);
      if (!this.selectedGuicheId && this.guiches.length > 0) {
        this.selectedGuicheId = this.guiches[0].id;
      }
    });
  }

  salvarGuiche() {
    if (this.selectedGuicheId) {
      localStorage.setItem('ultimoGuiche', this.selectedGuicheId.toString());
    }
  }

  chamarProximo() {
    if (this.loading || !this.selectedGuicheId) return;

    this.loading = true;
    this.statusAtendimento = 'CHAMANDO';

    this.api.post<any>('/fila/chamar_proximo', { guiche: this.selectedGuicheId }).subscribe({
      next: (res) => {
        // Normaliza resposta do backend
        this.senhaAtual = res?.senha || res;
        this.statusAtendimento = 'EM_ATENDIMENTO';
        this.loading = false;
        
        // Inicia Cronômetro
        this.startTimer();
        
        // Adiciona ao início do histórico local
        this.historicoSessao.unshift({
          ...this.senhaAtual,
          horaChamada: new Date()
        });
        
        if (this.historicoSessao.length > 5) this.historicoSessao.pop();

        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404) {
          alert("A fila está vazia no momento! ☕");
        } else {
          alert("Erro ao chamar próximo ticket.");
        }
        this.statusAtendimento = 'IDLE';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  chamarNovamente() {
    if (!this.senhaAtual || this.loading) return;
    
    // Na prática, basta re-chamar o endpoint ou emitir via socket. 
    // Como o backend emite via socket no chamar_proximo, vamos re-chamar pra garantir que o painel mostre.
    this.api.post<any>('/fila/chamar_proximo', { guiche: this.selectedGuicheId, repetir: true }).subscribe();
  }

  finalizarAtendimento() {
    if (!this.senhaAtual) return;
    
    // Status local
    this.statusAtendimento = 'IDLE';
    this.senhaAtual = null;
    this.stopTimer();
    this.cdr.detectChanges();
  }

  // --- TIMER LOGIC ---
  private startTimer() {
    this.stopTimer();
    this.tempoAtendimento = 0;
    this.timerInterval = setInterval(() => {
      this.tempoAtendimento++;
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}