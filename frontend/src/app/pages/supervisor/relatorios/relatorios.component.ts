import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  X, ChevronDown, Calendar, FileText, Eye, CheckCircle, Clock, Star,
  ArrowLeft, Download, AlertTriangle, User, TrendingUp, TrendingDown
} from 'lucide-angular';
import { GuicheService } from '../../../services/guiche.service';
import { FilialService } from '../../../services/filial.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-supervisor-relatorios',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ReactiveFormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.scss']
})
export class SupervisorRelatoriosComponent implements OnInit, OnDestroy {

  icons = {
    x: X,
    chevronDown: ChevronDown,
    calendar: Calendar,
    fileText: FileText,
    eye: Eye,
    check: CheckCircle,
    clock: Clock,
    star: Star,
    arrowLeft: ArrowLeft,
    download: Download,
    alert: AlertTriangle,
    user: User,
    trendingUp: TrendingUp,
    trendingDown: TrendingDown
  };

  activeModal: string | null = null;
  successModal: boolean = false;
  justificativaForm: FormGroup;
  selectedTicket: any = null;

  graficosPorHora: any[] = [];
  maxHistoricoFila = 0;
  maxTempoEspera = 0;
  maxTempoAtendimento = 0;

  // Dashboard KPIs
  // Dashboard KPIs
  totalAtendidos = 0;
  tempoMedioEsperaGeral = 0;

  // Período ativo para os filtros
  periodoAtivo: 'hoje' | 'semana' | 'mes' = 'hoje';

  // Tempo médio calculado a partir do backend (snapshots + ao vivo)
  tempoMedioAtendimentoStr = '0 min';

  selectedFilialId: number | null = null;
  selectedFilialNome: string = 'Carregando...';

  private updateTimer: any;
  private filialSub?: any;
  private readonly apiUrl = environment.apiUrl + '/dashboard';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private guicheService: GuicheService,
    private filialService: FilialService
  ) {
    this.justificativaForm = this.fb.group({
      motivo: ['', Validators.required],
      observacoes: ['']
    });
  }

  atendimentosList: any[] = [];

  ngOnInit() {
    this.filialSub = this.filialService.selectedFilial$.subscribe((id: number | null) => {
      this.selectedFilialId = id;
      this.atualizarNomeFilial();
      this.carregarDadosApi();
      this.carregarTempoMedio();
    });

    // Atualização a cada 30 segundos
    this.updateTimer = setInterval(() => {
      this.carregarDadosApi();
      this.carregarTempoMedio();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  private atualizarNomeFilial() {
    this.filialService.getFiliais().subscribe((filiais: any[]) => {
      const f = filiais.find((f: any) => f.id === this.selectedFilialId);
      if (f) this.selectedFilialNome = f.nome;
    });
  }

  selecionarPeriodo(periodo: 'hoje' | 'semana' | 'mes') {
    this.periodoAtivo = periodo;
    this.carregarDadosApi();
    this.carregarTempoMedio();
  }

  /**
   * Busca o tempo médio no backend.
   */
  carregarTempoMedio() {
    const periodMap = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    const p = periodMap[this.periodoAtivo] || 'dia';
    const filialParam = this.selectedFilialId ? `&filialId=${this.selectedFilialId}` : '';
    
    const token = localStorage.getItem('token') || '';
    this.http.get<any>(`${this.apiUrl}/relatorios?periodo=${p}${filialParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        // Assume relatorios returns kpis or use dedicated overview
        this.tempoMedioAtendimentoStr = res.kpis?.tempoMedio || '0 min';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar tempo médio:', err)
    });
  }

  carregarDadosApi() {
    const periodMap = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    const p = periodMap[this.periodoAtivo] || 'dia';
    const filialParam = this.selectedFilialId ? `&filialId=${this.selectedFilialId}` : '';
    
    const token = localStorage.getItem('token') || '';
    this.http.get<any>(`${this.apiUrl}/overview?filialId=${this.selectedFilialId || ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.kpis) {
          this.totalAtendidos = parseInt(res.kpis.totalHoje, 10) || 0;
          this.tempoMedioEsperaGeral = parseInt(res.kpis.tempoMedio, 10) || 0;
          this.tempoMedioAtendimentoStr = res.kpis.tempoMedio;

          // Replace mock list with real atendimentos from queue/history
          this.atendimentosList = res.atendimentos || [];
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erro ao carregar relatórios', err)
    });
  }

  getAlturaBarra(valor: number, max: number): string {
    if (!max || max === 0) return '0%';
    const percent = Math.floor((valor / max) * 100);
    return `${percent}%`;
  }

  abrirModal(tipo: string, ticket?: any) {
    this.activeModal = tipo;
    if (ticket) {
      this.selectedTicket = ticket;
    }
  }

  fecharModal() {
    this.activeModal = null;
    this.successModal = false;
    this.justificativaForm.reset({ motivo: '' });
  }

  salvarJustificativa() {
    if (this.justificativaForm.invalid) {
      alert('Selecione um motivo!');
      return;
    }
    this.activeModal = null;
    this.successModal = true;
    setTimeout(() => {
      this.fecharModal();
    }, 5000);
  }
}
