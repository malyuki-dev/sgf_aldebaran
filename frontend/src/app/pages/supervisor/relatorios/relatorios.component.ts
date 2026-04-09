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
  totalAtendidos = 0;
  tempoMedioEsperaGeral = 0;

  // Período ativo para os filtros
  periodoAtivo: 'hoje' | 'semana' | 'mes' = 'hoje';

  // Tempo médio calculado a partir do backend (snapshots + ao vivo)
  tempoMedioAtendimentoStr = '0 min';

  private updateTimer: any;
  private readonly apiUrl = 'http://localhost:3000/dashboard';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private guicheService: GuicheService
  ) {
    this.justificativaForm = this.fb.group({
      motivo: ['', Validators.required],
      observacoes: ['']
    });
  }

  atendimentosMock = [
    {
      senha: 'RP-A045', originIcon: this.icons.calendar,
      clienteNome: 'João Silva', clienteSub: 'Transp. ABC',
      categoria: 'Retirada Pesada', categoriaClass: 'cat-orange',
      operador: 'Maria S.',
      espera: '5 min', esperaAlerta: false, atendimento: '12 min',
      avaliacao: 'Excelente', avaliacaoEmoji: '😁', avaliacaoClass: 'eval-green',
      status: 'CONCLUÍDO', statusBoxClass: 'status-green', statusType: '',
      acaoTipo: 'view', acaoClass: 'btn-blue-light'
    },
    {
      senha: 'C-035', originIcon: this.icons.fileText,
      clienteNome: 'Roberto Almeida', clienteSub: 'Avulso',
      categoria: 'Caminhão', categoriaClass: 'cat-green',
      operador: 'Ana Costa',
      espera: '84 min', esperaAlerta: true, atendimento: '7 min',
      avaliacao: 'Péssimo', avaliacaoEmoji: '😡', avaliacaoClass: 'eval-red',
      status: 'CONCLUÍDO', statusBoxClass: 'status-green', statusType: 'alert-row',
      acaoTipo: 'view', acaoClass: 'btn-teal'
    },
    {
      senha: 'CR-036', originIcon: this.icons.calendar,
      clienteNome: 'Lucas Ferreira', clienteSub: '',
      categoria: 'Cliente Rápido', categoriaClass: 'cat-gray',
      operador: '-',
      espera: '15 min', esperaAlerta: false, atendimento: '-',
      avaliacao: '-', avaliacaoEmoji: '', avaliacaoClass: '',
      status: 'NÃO COMPARECEU', statusBoxClass: 'status-red-text', statusType: 'missed-row',
      acaoTipo: 'resgatar', acaoClass: ''
    }
  ];

  ngOnInit() {
    this.carregarDadosApi();
    this.carregarTempoMedio();

    // Atualização a cada 10 segundos
    this.updateTimer = setInterval(() => {
      this.carregarDadosApi();
      this.carregarTempoMedio();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  selecionarPeriodo(periodo: 'hoje' | 'semana' | 'mes') {
    this.periodoAtivo = periodo;

    // Mapa para o campo "periodo" da API de gráficos (usa nomenclatura diferente)
    const periodoApiMap: Record<string, string> = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    this.carregarDadosApi(periodoApiMap[periodo]);
    this.carregarTempoMedio();
  }

  /**
   * Busca o tempo médio no backend passando os dados ao vivo da sessão corrente.
   * O backend agrega snapshots persistidos + dados ao vivo (apenas para "hoje").
   */
  carregarTempoMedio() {
    const somaVivo = this.guicheService.somaSegundosVivo;
    const qtdVivo = this.guicheService.qtdVivo;

    const params = new URLSearchParams({
      periodo: this.periodoAtivo,
      somaVivo: String(somaVivo),
      qtdVivo: String(qtdVivo)
    });

    const token = localStorage.getItem('token') || '';
    this.http.get<any>(`${this.apiUrl}/snapshots?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.tempoMedioAtendimentoStr = res.tempoFormatado || '0 min';
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar tempo médio:', err)
    });
  }

  carregarDadosApi(periodo = 'dia') {
    const token = localStorage.getItem('token') || '';
    this.http.get<any>(`${this.apiUrl}/relatorios?periodo=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (dados) => {
        if (dados.graficosPorHora) {
          this.graficosPorHora = dados.graficosPorHora;
          this.totalAtendidos = dados.totalAtendimentos || 0;
          this.tempoMedioEsperaGeral = dados.tempoMedioEspera || 0;

          this.maxHistoricoFila = Math.max(...this.graficosPorHora.map(g => g.historicoFila), 1);
          this.maxTempoEspera = Math.max(...this.graficosPorHora.map(g => g.tempoEsperaMedio), 1);
          this.maxTempoAtendimento = Math.max(...this.graficosPorHora.map(g => g.tempoAtendimentoMedio), 1);

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
