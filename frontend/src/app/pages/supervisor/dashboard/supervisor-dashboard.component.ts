import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  LucideAngularModule, AlertTriangle, ChevronRight, TrendingUp,
  Clock, Activity, Users, Truck, UserPlus, User, Settings, BarChart2,
  Bell, History, Calendar, X, CheckCircle, FileText, ChevronDown, LogOut,
  Hash, Building, Package, Key, Lock, Phone, Mail, Eye, AlertCircle
} from 'lucide-angular';
import { GuicheService } from '../../../services/guiche.service';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, ReactiveFormsModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {
  // Ícones
  readonly icons = {
    alert: AlertTriangle, right: ChevronRight, trendingUp: TrendingUp,
    clock: Clock, activity: Activity, users: Users,
    truck: Truck, userPlus: UserPlus, user: User,
    settings: Settings, barChart: BarChart2, bell: Bell,
    history: History, calendar: Calendar, x: X, check: CheckCircle, fileText: FileText,
    chevronDown: ChevronDown, logOut: LogOut,
    hash: Hash, building: Building, package: Package, key: Key, lock: Lock, phone: Phone, mail: Mail,
    eye: Eye, alertCircle: AlertCircle
  };

  // Visão Geral (KPIs)
  visaoGeral = [
    { titulo: 'Total Hoje', valor: '147', info: '+12%', corInfo: 'green', icon: this.icons.trendingUp, bgIcon: '#e0f2fe', colorIcon: '#0284c7' },
    { titulo: 'Tempo Médio', valor: '8 min', info: '+3 min', corInfo: 'red', icon: this.icons.clock, bgIcon: '#ecfdf5', colorIcon: '#059669' },
    { titulo: 'Fila Atual', valor: '12', info: 'Normal', corInfo: 'gray', icon: this.icons.users, bgIcon: '#f3e8ff', colorIcon: '#9333ea' }
  ];

  // Status dos Guichês - carregar do serviço
  guiches: any[] = [];

  // Senhas Agendadas (Mock para Modal de Agendamentos)
  agendamentos = [
    { senha: 'A045', transportadora: 'TransXYZ', horario: '14:30', status: 'Aguardando' },
    { senha: 'A046', transportadora: 'LogisticaBR', horario: '15:00', status: 'Atrasado' },
    { senha: 'A047', transportadora: 'CargasRapid', horario: '15:15', status: 'Confirmado' },
    { senha: 'A048', transportadora: 'NorteSul', horario: '16:00', status: 'Aguardando' }
  ];

  // Lista de Atendimentos (Mock)
  atendimentosList = [
    { ticket: 'RP043', cliente: 'Carlos Silva', categoria: 'Retirada Pesada', operador: 'João Santos', tempoEspera: '12:30', status: 'Em Atendimento' },
    { ticket: 'C041', cliente: 'Mariana Costa', categoria: 'Carga Comum', operador: 'Ana Costa', tempoEspera: '14:30', status: 'Em Atendimento' },
    { ticket: 'CR038', cliente: 'Pedro Alves', categoria: 'Carga Refrigerada', operador: 'Pedro Lima', tempoEspera: '25:00', status: 'Atrasado' },
    { ticket: 'C042', cliente: 'Sandra Vieira', categoria: 'Carga Comum', operador: 'Gustavo Campos', tempoEspera: '17:15', status: 'Em Atendimento' },
    { ticket: 'A049', cliente: 'José Ferreira', categoria: 'Agendado', operador: '-', tempoEspera: '30:00', status: 'Aguardando' },
  ];

  atendimentoSelecionado: any = null;
  showJustificativaModal = false;
  justificativaForm: FormGroup;

  // Ações de Gerenciamento
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

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private guicheService: GuicheService, private http: HttpClient) {
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

    // Inscrever aos dados de guichês do serviço
    this.guicheService.guiches$.subscribe(guiches => {
      this.guiches = guiches;
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

      this.http.post('http://localhost:3000/usuarios', payload, { headers }).subscribe({
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

  // Mapear dados do guiche service para o formato do dashboard
  getGuichesFormatted(): any[] {
    return this.guiches.map(guiche => {
      let status = 'FECHADO';
      let tempo = '0:00';

      if (guiche.status === 'vazio') {
        status = 'FECHADO';
      } else if (guiche.status === 'disponivel') {
        status = 'DISPONIVEL';
        tempo = '0:10';
      } else if (guiche.status === 'ocupado') {
        status = 'ATENDENDO';
        tempo = guiche.tempoOcupado ? `${guiche.tempoOcupado}:00` : '0:00';
      }

      return {
        numero: guiche.numero,
        operador: guiche.operador || '',
        status: status,
        ticket: guiche.ticket || '',
        tempo: tempo
      };
    });
  }

}