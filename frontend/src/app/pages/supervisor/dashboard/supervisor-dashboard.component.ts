import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  LucideAngularModule, AlertTriangle, ChevronRight, TrendingUp,
  Clock, Activity, Users, Truck, UserPlus, User, Settings, BarChart2,
  Bell, History, Calendar, X, CheckCircle, FileText, ChevronDown, LogOut,
  Hash, Building, Package, Key, Lock, Phone, Mail, Eye, AlertCircle
} from 'lucide-angular';
import { GuicheService } from '../../../services/guiche.service';
import { DashboardService } from '../../../services/dashboard.service';
import { FilialService } from '../../../services/filial.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {
  // Ícones
  readonly icons: any = {
    alert: AlertTriangle, right: ChevronRight, trendingUp: TrendingUp,
    clock: Clock, activity: Activity, users: Users,
    truck: Truck, userPlus: UserPlus, user: User,
    settings: Settings, barChart: BarChart2, bell: Bell,
    history: History, calendar: Calendar, x: X, check: CheckCircle, fileText: FileText,
    chevronDown: ChevronDown, logOut: LogOut,
    hash: Hash, building: Building, package: Package, key: Key, lock: Lock, phone: Phone, mail: Mail,
    eye: Eye, alertCircle: AlertCircle
  };

  visaoGeral = [
    { titulo: 'Total Hoje', valor: '0', info: '-', corInfo: 'gray', icon: this.icons.trendingUp, bgIcon: '#e0f2fe', colorIcon: '#0284c7' },
    { titulo: 'Tempo Médio Diário', valor: '00:00', info: '-', corInfo: 'gray', icon: this.icons.clock, bgIcon: '#ecfdf5', colorIcon: '#059669' },
    { titulo: 'Atendimento Diário', valor: '0', info: '-', corInfo: 'gray', icon: this.icons.activity, bgIcon: '#fef9c3', colorIcon: '#ca8a04' },
    { titulo: 'Fila Atual', valor: '0', info: '-', corInfo: 'gray', icon: this.icons.users, bgIcon: '#f3e8ff', colorIcon: '#9333ea' }
  ];

  guiches: any[] = [];
  agendamentos: any[] = [];
  atendimentosList: any[] = [];
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  filialId?: number;
  
  private filialSub?: Subscription;

  atendimentoSelecionado: any = null;
  showJustificativaModal = false;
  justificativaForm!: FormGroup;

  acoes = [
    { id: 'truck', nome: 'Cadastrar Caminhão', icon: this.icons.truck },
    { id: 'operator', nome: 'Cadastrar Operador', icon: this.icons.userPlus },
    { id: 'client', nome: 'Cadastrar Cliente', icon: this.icons.user },
    { id: 'manage_queue', nome: 'Gerenciar Fila', icon: this.icons.settings },
    { id: 'reports', nome: 'Relatórios Gerenciais', icon: this.icons.barChart }
  ];

  activeModal: string | null = null;
  successModal: string | null = null;
  showAlertBanner = false; // Set to true when high demand is detected

  caminhaoForm: FormGroup;
  operadorForm: FormGroup;
  clienteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private guicheService: GuicheService,
    private dashboardService: DashboardService,
    private filialService: FilialService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.justificativaForm = this.fb.group({
      motivo: ['', Validators.required],
      observacoes: ['']
    });

    this.caminhaoForm = this.fb.group({
      placa: ['', Validators.required],
      modelo: ['', Validators.required],
      transportadora: ['', Validators.required],
      capacidade: ['', Validators.required],
      observacao: ['']
    });

    this.operadorForm = this.fb.group({
      nome: ['', Validators.required],
      nomeUsuario: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', Validators.required],
      filial: ['', Validators.required],
      telefone: [''],
      email: ['', [Validators.required, Validators.email]],
      funcao: ['Operador']
    });

    this.clienteForm = this.fb.group({
      tipoPessoa: ['Fisica', Validators.required],
      nome: ['', Validators.required],
      cpfCnpj: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['modal']) {
        this.activeModal = params['modal'];
        // Limpa o query param da URL sem navegar de novo
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    });

    const initialId = this.filialService.getSelectedFilialId();
    this.guicheService.carregarGuichesDaApi(initialId || undefined);

    // Inscrever aos dados de guichês do serviço
    this.guicheService.guiches$.subscribe(guiches => {
      this.guiches = guiches;
      this.cdr.detectChanges();
    });

    this.detectFilial();
    
    this.filialSub = this.filialService.selectedFilial$.subscribe(id => {
      this.selectedFilialId = id;
      this.loadData();
    });
    
    // Refresh data every 5 seconds
    setInterval(() => this.loadData(), 5000);

    // Tick real-time seconds for waiting lists
    setInterval(() => {
      this.tickWaitTimes();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  detectFilial() {
    const userStr = localStorage.getItem('usuario_sgf');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.filialId = user.filial_id;
        // Se for a primeira vez e tiver filial no user, seleciona ela
        if (this.selectedFilialId === null) {
          this.selectedFilialId = this.filialId || null;
        }
      } catch (e) {}
    }
  }

  carregarFiliais() {
    this.http.get<any[]>(`${environment.apiUrl}/filiais`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`)
    }).subscribe({
      next: (data) => {
        const usuarioRaw = localStorage.getItem('usuario_sgf');
        let usuarioFilialId: number | null = null;
        if (usuarioRaw) {
          try {
            const usuario = JSON.parse(usuarioRaw);
            usuarioFilialId = usuario.filial_id || null;
          } catch {}
        }

        if (usuarioFilialId) {
          this.filiais = data.filter((f: any) => f.id === usuarioFilialId);
        } else {
          this.filiais = data;
        }
      },
      error: (err) => console.error('Erro ao carregar filiais:', err)
    });
  }

  onFilialChange() {
    this.loadData();
  }

  loadData() {
    this.dashboardService.getSupervisorOverview(this.selectedFilialId || undefined).subscribe({
      next: (res) => {
        // Update KPIs
        this.visaoGeral[0].valor = res.kpis.totalHoje;
        this.visaoGeral[1].valor = res.kpis.tempoMedio;
        this.visaoGeral[2].valor = res.kpis.totalHoje; // Usando totalHoje em vez de atendimentosDiarios
        this.visaoGeral[3].valor = res.kpis.filaAtual;

        // Update Lists
        this.agendamentos = res.agendamentos;
        this.atendimentosList = res.atendimentos;

        this.showAlertBanner = res.kpis.alertaSla;
        
        // Sincroniza os guichês
        this.guicheService.refreshGuiches(this.selectedFilialId || undefined);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar dashboard:', err)
    });
  }

  abrirModal(id: string) {
    this.activeModal = id; // truck, operator, client
  }

  fecharModal() {
    this.activeModal = null;
    this.successModal = null;
    this.caminhaoForm.reset({ tipoPessoa: 'Fisica', funcao: 'Operador' });
    this.operadorForm.reset({ tipoPessoa: 'Fisica', funcao: 'Operador' });
    this.clienteForm.reset({ tipoPessoa: 'Fisica', funcao: 'Operador' });
  }

  salvarCadastro() {
    if (this.activeModal === 'truck' && this.caminhaoForm.invalid) {
      alert('Preencha os campos obrigatórios corretamente.');
      return;
    }
    if (this.activeModal === 'operator') {
      if (this.operadorForm.invalid) {
        alert('Preencha os campos obrigatórios corretamente.');
        return;
      }
      const formValue = this.operadorForm.value;
      if (formValue.senha !== formValue.confirmarSenha) {
        alert('As senhas não conferem.');
        return;
      }

      const payload = {
        nome: formValue.nome,
        email: formValue.email,
        login: formValue.nomeUsuario,
        senha: formValue.senha,
        perfil: 'OPERADOR'
      };

      const token = localStorage.getItem('token') || '';
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post(`${environment.apiUrl}/usuarios`, payload, { headers }).subscribe({
        next: () => {
          this.activeModal = null;
          this.successModal = 'operator';
          
          setTimeout(() => {
            if (this.successModal === 'operator') {
              this.fecharModal();
            }
          }, 5000);
        },
        error: (err) => {
          alert('Erro ao cadastrar operador: ' + (err.error?.message || 'Erro desconhecido'));
        }
      });
      
      return; // Exit here since it's async
    }
    if (this.activeModal === 'client' && this.clienteForm.invalid) {
      alert('Preencha os campos obrigatórios corretamente.');
      return;
    }

    const tipo = this.activeModal;
    this.activeModal = null;
    this.successModal = tipo;

    setTimeout(() => {
      if (this.successModal === tipo) {
        this.fecharModal();
      }
    }, 5000); // 5 segundos auto-return
  }

  verAtendimento(atendimento: any) {
    this.atendimentoSelecionado = atendimento;
  }

  fecharAtendimentoDetalhe() {
    this.atendimentoSelecionado = null;
    this.showJustificativaModal = false;
    this.justificativaForm.reset();
  }

  abrirJustificativa() {
    this.showJustificativaModal = true;
  }

  salvarJustificativa() {
    if (this.justificativaForm.invalid) return;
    this.showJustificativaModal = false;
    this.atendimentoSelecionado = null;
    this.justificativaForm.reset();
  }

  getGuichesAtivosInfo() {
    if (!this.guiches || this.guiches.length === 0) {
      return { valor: '0/6', percentual: '0%' };
    }
    const ativos = this.guiches.filter(g => g.status !== 'vazio').length;
    const total = this.guiches.length;
    const percentual = Math.round((ativos / total) * 100);
    return { valor: `${ativos}/${total}`, percentual: `${percentual}%` };
  }

  getGuichesFormatted(): any[] {
    return this.guiches.map(guiche => {
      let status = 'FECHADO';
      let tempo = '00:00';

      if (guiche.status === 'vazio') {
        status = 'FECHADO';
      } else if (guiche.status === 'disponivel') {
        status = 'DISPONIVEL';
        tempo = guiche.tempoOcupadoFormatado || '00:00';
      } else if (guiche.status === 'ocupado') {
        status = 'ATENDENDO';
        tempo = guiche.tempoOcupadoFormatado || '00:00';
      }

      return {
        numero: guiche.displayLabel || guiche.nome || guiche.numero,
        operador: guiche.operador || '',
        status: status,
        ticket: guiche.ticket || '',
        tempo: tempo,
        atrasado: guiche.atrasado || false
      };
    });
  }

  get tempoMedio(): string {
    return this.visaoGeral[1].valor;
  }

  get atendimentosDiarios(): string {
    return this.visaoGeral[2].valor;
  }

  tickWaitTimes() {
    if (!this.atendimentosList || this.atendimentosList.length === 0) return;
    let needsUpdate = false;
    const now = new Date().getTime();

    this.atendimentosList.forEach(a => {
      if (a.dataCriacao && (a.status === 'Aguardando' || a.status === 'Em Atendimento')) {
        const diffMs = now - new Date(a.dataCriacao).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        const formatado = `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
        
        if (a.tempoEspera !== formatado) {
          a.tempoEspera = formatado;
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      this.cdr.detectChanges();
    }
  }
}