import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  X, ChevronDown, Calendar, FileText, Eye, CheckCircle, Clock, Star,
  ArrowLeft, Download, AlertTriangle, User, TrendingUp, TrendingDown,
  MoreVertical
} from 'lucide-angular';
import { GuicheService } from '../../../services/guiche.service';
import { FilialService } from '../../../services/filial.service';
import { environment } from '../../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface GraficoHora {
  horaLabel: string;     // e.g. "08:00"
  historicoFila: number; // contagem de atendimentos
  tempoEsperaMedio: number;      // minutos
  tempoAtendimentoMedio: number; // minutos
}

export interface OperadorDesempenho {
  id: number;
  nome: string;
  iniciais: string;
  avatarColor: string;
  totalAtendidos: number;
  avgServiceTimeStr: string; // "MM:SS"
  efficiency: number;        // 0–100
}

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
    trendingDown: TrendingDown,
    moreVertical: MoreVertical
  };

  activeModal: string | null = null;
  successModal: boolean = false;
  justificativaForm: FormGroup;
  selectedTicket: any = null;

  // Dados dos gráficos por hora — preenchidos pela API
  graficosPorHora: GraficoHora[] = [];
  maxHistoricoFila = 0;
  maxTempoEspera = 0;
  maxTempoAtendimento = 0;

  // Horário de pico calculado a partir dos dados
  horarioPico = '—';

  // KPIs
  totalAtendidos = 0;
  tempoMedioEsperaGeral = 0;
  mediaAtendimentoMinutos = 0;
  historicoAtendimentoMinutos = 0;
  
  filaAtual = 0;
  guichesAtivos = 0;
  
  private callsPending = 0;

  // Período ativo para os filtros (pode ser 'hoje', 'semana', 'mes', ou 'YYYY-MM')
  periodoAtivo: string = 'hoje';

  // Tempo médio calculado a partir do backend
  tempoMedioAtendimentoStr = '0 min';

  selectedFilialId: number | null = null;
  selectedFilialNome: string = 'Carregando...';

  operadores: OperadorDesempenho[] = [];
  carregandoOperadores = false;
  categorias: any[] = []; // Variável para armazenar as categorias

  insights: any[] = [];

  dropdownMesesAberto = false;
  mesesDisponiveis: string[] = [];

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
      this.carregarMesesDisponiveis();
      this.carregarTudo();
    });

    // Atualização a cada 5 segundos (constante)
    this.updateTimer = setInterval(() => {
      this.carregarTudo();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  private atualizarNomeFilial() {
    this.filialService.getFiliais().subscribe((filiais: any[]) => {
      const f = filiais.find((f: any) => f.id === this.selectedFilialId);
      this.selectedFilialNome = f ? f.nome : 'Todas as Unidades';
    });
  }

  selecionarPeriodo(periodo: string) {
    this.periodoAtivo = periodo;
    this.dropdownMesesAberto = false;
    this.carregarTudo();
  }

  toggleDropdownMeses() {
    this.dropdownMesesAberto = !this.dropdownMesesAberto;
  }

  formatarMes(periodo: string): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (/^\d{4}-\d{2}$/.test(periodo)) {
      const [ano, mes] = periodo.split('-');
      return `${meses[parseInt(mes, 10) - 1]} ${ano}`;
    }
    return periodo;
  }

  carregarMesesDisponiveis() {
    const filialParam = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
    const token = localStorage.getItem('token') || '';

    this.http.get<string[]>(`${this.apiUrl}/meses-disponiveis${filialParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.mesesDisponiveis = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar meses disponíveis', err)
    });
  }

  /** Dispara todas as chamadas de API em paralelo */
  carregarTudo() {
    this.carregarMesesDisponiveis();
    
    // Total of 4 async methods that affect insights
    this.callsPending = 4;
    this.carregarDadosApi();
    this.carregarGraficosPorHora();
    this.carregarOperadores();
    this.carregarMetricasFila();
  }

  private checkInsights() {
    this.callsPending--;
    if (this.callsPending <= 0) {
      this.calcularInsights();
    }
  }

  carregarMetricasFila() {
    const filialParam = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
    const token = localStorage.getItem('token') || '';

    // Chamada dupla para filaAtual e guichesAtivos
    this.http.get<any>(`${this.apiUrl}/supervisor-overview${filialParam}`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (res) => {
        if (res && res.kpis) {
          this.filaAtual = parseInt(res.kpis.filaAtual, 10) || 0;
        }
        
        this.http.get<any>(`${this.apiUrl}/metrics${filialParam}`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
          next: (res2) => {
            if (res2 && res2.cards) {
              this.guichesAtivos = res2.cards.guichesAtivos || 0;
            }
            this.checkInsights();
          },
          error: () => this.checkInsights()
        });
      },
      error: () => this.checkInsights()
    });
  }

  calcularInsights() {
    const novosInsights: any[] = [];

    // 7. Dia/período sem movimento
    if (this.totalAtendidos === 0) {
      novosInsights.push({ text: 'ℹ️ Nenhum atendimento registrado no período selecionado.', type: 'gray', severidade: 5 });
    } else {

      // 1. Alta demanda por horário
      if (this.graficosPorHora.length > 0) {
        const mediaHoraria = this.totalAtendidos / this.graficosPorHora.length;
        const pico = this.graficosPorHora.reduce((acc, cur) => cur.historicoFila > acc.historicoFila ? cur : acc);
        if (pico.historicoFila > mediaHoraria * 1.5 && pico.historicoFila > 0) {
           const hora = parseInt(pico.horaLabel.split(':')[0], 10);
           const horaFim = (hora + 1).toString().padStart(2, '0');
           novosInsights.push({ text: `⚠️ Alta demanda detectada entre ${pico.horaLabel}-${horaFim}:00. Considere alocar mais operadores nesse horário.`, type: 'red', severidade: 1 });
        }

        // 8. Pico fora do horário comercial
        const horaPico = parseInt(this.horarioPico.split(':')[0], 10);
        if (!isNaN(horaPico) && (horaPico < 8 || horaPico >= 18)) {
           novosInsights.push({ text: `⚠️ Pico de atendimentos fora do horário comercial (${this.horarioPico}). Revisar escala.`, type: 'yellow', severidade: 2 });
        }
      }

      // 2. Operadores com baixa eficiência
      const opsBaixaEficiencia = this.operadores.filter(op => op.efficiency < 90);
      if (opsBaixaEficiencia.length > 0) {
        novosInsights.push({ text: `⚠️ ${opsBaixaEficiencia.length} operador(es) com eficiência abaixo de 90%. Revisar processos.`, type: 'yellow', severidade: 2 });
      }

      // 6. Operador destaque
      const opDestaque = this.operadores.filter(op => op.efficiency >= 95).sort((a, b) => b.totalAtendidos - a.totalAtendidos)[0];
      if (opDestaque && opDestaque.totalAtendidos > 0) {
        novosInsights.push({ text: `⭐ Operador ${opDestaque.nome} se destacou com ${opDestaque.totalAtendidos} atendimentos e ${opDestaque.efficiency}% de eficiência.`, type: 'green', severidade: 4 });
      }

      // 3. Fila crescendo sem operadores disponíveis
      if (this.filaAtual > 10 && this.guichesAtivos > 0) {
        novosInsights.push({ text: `⚠️ Fila elevada com todos os guichês ocupados. Considere abrir mais guichês.`, type: 'red', severidade: 1 });
      }

      // 4. Tempo médio de atendimento acima do normal
      if (this.mediaAtendimentoMinutos > this.historicoAtendimentoMinutos * 1.3 && this.historicoAtendimentoMinutos > 0) {
        novosInsights.push({ text: `📈 Tempo médio de atendimento acima do histórico. Verifique gargalos operacionais.`, type: 'yellow', severidade: 2 });
      }

      // 5. Categoria com maior tempo de espera
      if (this.categorias.length > 0) {
         const piorCat = this.categorias.reduce((acc, cur) => cur.avgEsperaMins > acc.avgEsperaMins ? cur : acc);
         if (piorCat.avgEsperaMins > 0) {
            novosInsights.push({ text: `🕐 Categoria "${piorCat.nome}" com maior tempo de espera: ${Math.floor(piorCat.avgEsperaMins)} min. Avaliar prioridade.`, type: 'blue', severidade: 3 });
         }
      }
    }

    if (novosInsights.length === 0) {
      novosInsights.push({ text: '✅ Nenhum alerta para o período selecionado.', type: 'green', severidade: 4 });
    }

    // Ordenar por severidade (1 = max, 5 = min)
    novosInsights.sort((a, b) => a.severidade - b.severidade);
    this.insights = novosInsights;
    this.cdr.detectChanges();
  }

  carregarDadosApi() {
    const periodMap: Record<string, string> = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    const p = periodMap[this.periodoAtivo] || this.periodoAtivo; // Se não estiver no map, envia a string crua ('YYYY-MM')
    const filialParam = this.selectedFilialId ? `&filialId=${this.selectedFilialId}` : '';
    const token = localStorage.getItem('token') || '';

    this.http.get<any>(`${this.apiUrl}/relatorios?periodo=${p}${filialParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        if (res.kpis) {
          this.totalAtendidos = res.kpis.total || 0;
          this.tempoMedioEsperaGeral = res.kpis.tempoMedioEspera || '00:00';
          this.tempoMedioAtendimentoStr = res.kpis.tempoMedioAtendimento || '00:00';
          this.mediaAtendimentoMinutos = res.kpis.mediaAtendimentoMinutos || 0;
          this.historicoAtendimentoMinutos = res.kpis.historicoAtendimentoMinutos || 0;
          this.atendimentosList = res.atendimentos || [];
          this.categorias = res.categorias || [];
          this.cdr.detectChanges();
        }
        this.checkInsights();
      },
      error: (err) => {
        console.error('Erro ao carregar relatórios', err);
        this.checkInsights();
      }
    });
  }

  carregarGraficosPorHora() {
    const periodMap: Record<string, string> = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    const p = periodMap[this.periodoAtivo] || this.periodoAtivo;
    const filialParam = this.selectedFilialId ? `&filialId=${this.selectedFilialId}` : '';
    const token = localStorage.getItem('token') || '';

    this.http.get<{ graficos: GraficoHora[] }>(
      `${this.apiUrl}/graficos-por-hora?periodo=${p}${filialParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res) => {
        this.graficosPorHora = res.graficos || [];

        // Calcula os máximos para normalizar as alturas das barras
        this.maxHistoricoFila = Math.max(1, ...this.graficosPorHora.map(g => g.historicoFila));
        this.maxTempoEspera = Math.max(1, ...this.graficosPorHora.map(g => g.tempoEsperaMedio));
        this.maxTempoAtendimento = Math.max(1, ...this.graficosPorHora.map(g => g.tempoAtendimentoMedio));

        // Horário de pico = hora com mais atendimentos
        if (this.graficosPorHora.length > 0) {
          const pico = this.graficosPorHora.reduce((acc, cur) =>
            cur.historicoFila > acc.historicoFila ? cur : acc
          );
          this.horarioPico = pico.horaLabel;
        } else {
          this.horarioPico = '—';
        }

        this.cdr.detectChanges();
        this.checkInsights();
      },
      error: (err) => {
        console.error('Erro ao carregar gráficos por hora:', err);
        this.checkInsights();
      }
    });
  }

  carregarOperadores() {
    const periodMap: Record<string, string> = { hoje: 'dia', semana: 'semana', mes: 'mes' };
    const p = periodMap[this.periodoAtivo] || this.periodoAtivo;
    const filialParam = this.selectedFilialId ? `&filialId=${this.selectedFilialId}` : '';
    const token = localStorage.getItem('token') || '';

    this.carregandoOperadores = true;

    this.http.get<{ operadores: OperadorDesempenho[] }>(
      `${this.apiUrl}/operadores?periodo=${p}${filialParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).subscribe({
      next: (res) => {
        console.log('OPERADORES RESPONSE:', res);
        this.operadores = res.operadores || [];
        this.carregandoOperadores = false;
        this.cdr.detectChanges();
        this.checkInsights();
      },
      error: (err) => {
        console.error('Erro ao carregar operadores:', err);
        this.carregandoOperadores = false;
        this.checkInsights();
      }
    });
  }

  /** Retorna a altura percentual de uma barra para CSS */
  getAlturaBarra(valor: number, max: number): string {
    if (!max || max === 0 || !valor) return '4px'; // mínimo visual 4px
    const percent = Math.max(4, Math.floor((valor / max) * 100));
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

  gerarPDF() {
    const doc = new jsPDF();
    
    const today = new Date();
    const dataGeracao = today.toLocaleDateString('pt-BR');
    const horaGeracao = today.toLocaleTimeString('pt-BR');
    
    // Título dinâmico
    let tituloStr = '';
    let nomeArquivo = `relatorio_`;
    
    if (this.periodoAtivo === 'hoje') {
      tituloStr = `Relatorio de Atendimentos - Hoje, ${dataGeracao}`;
      nomeArquivo += `hoje_${dataGeracao.replace(/\//g, '-')}.pdf`;
    } else if (this.periodoAtivo === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(today.getDate() - 7);
      tituloStr = `Relatorio de Atendimentos - Semana ${umaSemanaAtras.toLocaleDateString('pt-BR')} a ${dataGeracao}`;
      nomeArquivo += `semana_${dataGeracao.replace(/\//g, '-')}.pdf`;
    } else if (this.periodoAtivo === 'mes') {
      const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      tituloStr = `Relatorio de Atendimentos - Mes de ${meses[today.getMonth()]} ${today.getFullYear()}`;
      nomeArquivo += `mes_${today.getMonth()+1}-${today.getFullYear()}.pdf`;
    } else {
      tituloStr = `Relatorio de Atendimentos - ${this.formatarMes(this.periodoAtivo)}`;
      nomeArquivo += `${this.periodoAtivo}_${dataGeracao.replace(/\//g, '-')}.pdf`;
    }
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Aldebaran - Sistema de Gestao de Filas', 14, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Filial: ${this.selectedFilialNome}`, 14, 28);
    doc.text(`Periodo: ${tituloStr}`, 14, 34);
    doc.text(`Gerado em: ${dataGeracao} as ${horaGeracao}`, 14, 40);
    
    // 2. Resumo Geral
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text('Resumo Geral', 14, 52);
    
    autoTable(doc, {
      startY: 56,
      head: [['Total Atendidos', 'T. Medio Espera', 'T. Medio Atendimento', 'Horario de Pico']],
      body: [[
        this.totalAtendidos.toString(),
        this.tempoMedioEsperaGeral.toString(),
        this.tempoMedioAtendimentoStr,
        this.horarioPico
      ]],
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] } // teal-600
    });
    
    // 3. Desempenho por Categoria
    let finalY = (doc as any).lastAutoTable.finalY || 56;
    
    doc.setFontSize(13);
    doc.text('Desempenho por Categoria', 14, finalY + 12);
    
    const catBody = this.categorias.map(c => [
      c.nome,
      c.totalAtendidos.toString(),
      c.avgEsperaStr,
      c.avgAtendimentoStr
    ]);
    
    autoTable(doc, {
      startY: finalY + 16,
      head: [['Categoria', 'Atendidos', 'Tempo Medio Espera', 'Tempo Medio Atendimento']],
      body: catBody.length ? catBody : [['Sem dados', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }
    });
    
    finalY = (doc as any).lastAutoTable.finalY;
    
    // 4. Desempenho dos Operadores
    doc.text('Desempenho dos Operadores', 14, finalY + 12);
    
    const opBody = this.operadores.map(op => [
      op.nome,
      op.totalAtendidos.toString(),
      op.avgServiceTimeStr,
      `${op.efficiency}%`
    ]);
    
    autoTable(doc, {
      startY: finalY + 16,
      head: [['Operador', 'Atendimentos', 'Tempo Medio', 'Eficiencia']],
      body: opBody.length ? opBody : [['Sem dados', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }
    });
    
    doc.save(nomeArquivo);
  }
}
