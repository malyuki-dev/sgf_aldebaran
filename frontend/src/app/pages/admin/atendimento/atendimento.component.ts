import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { FilialService } from '../../../services/filial.service';
import { LucideAngularModule, Megaphone, UserCheck, Clock, History, AlertTriangle, Monitor, RotateCw, XCircle, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-atendimento',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './atendimento.component.html',
  styleUrl: './atendimento.component.scss'
})
export class AtendimentoComponent implements OnInit, OnDestroy {
  guiches: any[] = [];
  selectedGuicheId: number | null = null;
  
  senhaAtual: any | null = null;
  loading = false;
  statusAtendimento: 'IDLE' | 'CHAMANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO' = 'IDLE';
  
  tempoAtendimento = 0;
  private timerInterval: any;

  historicoSessao: any[] = [];
  selectedFilialId: number | null = null;

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
  private filialSub?: any;

  constructor(
    private api: ApiService,
    private filialService: FilialService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.filialSub = this.filialService.selectedFilial$.subscribe(id => {
      this.selectedFilialId = id;
      this.carregarGuiches();
    });

    const saved = localStorage.getItem('ultimoGuiche');
    if (saved) this.selectedGuicheId = Number(saved);
  }

  ngOnDestroy() {
    this.stopTimer();
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  carregarGuiches() {
    const params = this.selectedFilialId ? { filialId: this.selectedFilialId } : {};
    this.api.get<any[]>('/guiches', params).subscribe(res => {
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
        this.senhaAtual = res?.senha || res;
        this.statusAtendimento = 'EM_ATENDIMENTO';
        this.loading = false;
        
        this.startTimer();
        
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

  // --- Internal Session Timer ---
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