import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Menu, Bell, ChevronLeft, ChevronRight, Minus, Plus, Check, MapPin, Package, Droplets, ChevronDown, Calendar, Truck, ArrowRight, Home } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.scss']
})
export class AgendamentoComponent implements OnInit {
  selectedLang: 'PT' | 'EN' = 'PT';
  showSuccessModal = false;
  hoje = new Date();
  erroData: string | null = null;

  form = {
    filialId: null as number | null,
    servicoId: null as number | null,
    quantidade: 1,
    data: null as number | null,
    hora: '08:00',
    obs: ''
  };

  filiais: any[] = [];
  categorias: any[] = [];

  mesAtual: number = new Date().getMonth();
  anoAtual: number = new Date().getFullYear();
  mesesLabels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  diasCalendario: (number | null)[] = [];

  horariosDisponiveis: any[] = [];
  diasHabilitados: number[] = [1, 2, 3, 4, 5]; // Padrão Seg-Sex
  configCarregada = false;
  loadingHorarios = false;


  readonly icons = {
    menu: Menu, 
    bell: Bell, 
    left: ChevronLeft, 
    right: ChevronRight,
    minus: Minus, 
    plus: Plus, 
    check: Check, 
    map: MapPin, 
    box: Package,
    drop: Droplets,
    chevronDown: ChevronDown,
    calendar: Calendar,
    truck: Truck,
    arrowRight: ArrowRight,
    home: Home
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.hoje = new Date();
    this.carregarDados();
    this.configurarCalendarioAtual();
    this.checkReschedule();
  }

  checkReschedule() {
    const reId = this.route.snapshot.queryParamMap.get('re');
    if (reId) {
      this.apiService.get<any[]>('/fila/agendamento').subscribe(data => {
        const ag = data.find(a => a.id === Number(reId));
        if (ag) {
          this.form.filialId = ag.filial_id || this.form.filialId;
          this.form.servicoId = ag.servico_id || this.form.servicoId;
          this.cdr.detectChanges();
        }
      });
    }
  }

  carregarDados() {
    this.apiService.get<any[]>('/filiais').pipe(
      catchError(err => {
        console.error('Erro ao carregar filiais', err);
        return of([]);
      })
    ).subscribe(data => {
      this.filiais = data || [];
      if (this.filiais.length > 0) {
        this.form.filialId = this.filiais[0].id;
        this.carregarConfiguracoes();
      }
      this.cdr.detectChanges();
    });

    this.apiService.get<any[]>('/servicos').pipe(
      catchError(err => {
        console.error('Erro ao carregar categorias', err);
        return of([]);
      })
    ).subscribe(data => {
      console.log('Categorias recebidas:', data);
      this.categorias = data || [];
      if (this.categorias.length > 0) this.form.servicoId = this.categorias[0].id;
      this.cdr.detectChanges();
    });
  }

  carregarConfiguracoes() {
    if (!this.form.filialId) return;
    this.configCarregada = false;

    this.apiService.get<any[]>(`/configuracoes/lista?filialId=${this.form.filialId}`).pipe(
      catchError(err => {
        console.error('Erro ao carregar configs', err);
        return of([]);
      })
    ).subscribe(data => {
      const configMap: any = {};
      if (data && Array.isArray(data)) {
        data.forEach(item => {
          configMap[item.chave] = item.valor;
        });
      }

      if (configMap.TOTEM_DIAS) {
        try {
          this.diasHabilitados = JSON.parse(configMap.TOTEM_DIAS);
        } catch {
          this.diasHabilitados = [1, 2, 3, 4, 5];
        }
      } else {
        this.diasHabilitados = [1, 2, 3, 4, 5];
      }
      
      this.configCarregada = true;

      // Validação inicial
      if (this.form.data && !this.isDiaHabilitado(this.form.data)) {
        this.erroData = 'Esta filial não atende no dia selecionado.';
      } else {
        this.erroData = null;
      }

      this.atualizarHorarios();
      this.cdr.detectChanges();
    });
  }

  atualizarHorarios() {
    if (!this.form.data || !this.form.filialId || this.erroData) {
      this.horariosDisponiveis = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingHorarios = true;
    this.cdr.detectChanges();

    const dataObj = new Date(this.anoAtual, this.mesAtual, this.form.data, 12, 0, 0);
    const dataStr = dataObj.toISOString().split('T')[0];

    this.apiService.get<any[]>(`/fila/agendamento/horarios?data=${dataStr}&filialId=${this.form.filialId}`).pipe(
      catchError(err => {
        console.error('Erro ao carregar horários', err);
        return of([]);
      })
    ).subscribe(data => {
      this.horariosDisponiveis = data || [];
      this.loadingHorarios = false;
      
      const aindaDisponivel = this.horariosDisponiveis.find(h => h.hora === this.form.hora && h.disponivel);
      if (!aindaDisponivel && this.horariosDisponiveis.length > 0) {
        const primeiroLivre = this.horariosDisponiveis.find(h => h.disponivel);
        if (primeiroLivre) this.form.hora = primeiroLivre.hora;
      }
      
      this.cdr.detectChanges();
    });
  }

  configurarCalendarioAtual() {
    const hoje = new Date();
    this.mesAtual = hoje.getMonth();
    this.anoAtual = hoje.getFullYear();
    this.form.data = hoje.getDate();
    this.gerarCalendario();
  }

  gerarCalendario() {
    const primeiroDiaMes = new Date(this.anoAtual, this.mesAtual, 1).getDay();
    const ultimoDiaMes = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
    
    this.diasCalendario = [];
    
    // Espaços vazios no início
    for (let i = 0; i < primeiroDiaMes; i++) {
      this.diasCalendario.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= ultimoDiaMes; i++) {
      this.diasCalendario.push(i);
    }
  }

  inc() { this.form.quantidade++; }
  dec() { if (this.form.quantidade > 1) this.form.quantidade--; }

  selecionarDia(dia: any) { 
    if (!dia) return;
    this.erroData = null;

    if (this.isPassado(dia)) {
      this.erroData = 'Não é possível selecionar uma data passada.';
      return;
    }

    if (!this.isDiaHabilitado(dia)) {
      this.erroData = 'Esta filial não atende no dia selecionado.';
      return;
    }

    this.form.data = dia; 
    this.atualizarHorarios();
  }

  isDiaHabilitado(dia: number | null): boolean {
    if (!dia) return false;
    const dataObj = new Date(this.anoAtual, this.mesAtual, dia, 12, 0, 0);
    return this.diasHabilitados.includes(dataObj.getDay());
  }

  isPassado(dia: number | null): boolean {
    if (!dia) return false;
    
    // Para simplificar a lógica de comparação, usamos apenas as datas às 12:00
    const dataSelecionada = new Date(this.anoAtual, this.mesAtual, dia, 12, 0, 0);
    const hojeApenasData = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), this.hoje.getDate(), 12, 0, 0);
    
    return dataSelecionada < hojeApenasData;
  }
  
  selecionarHora(hora: string) { 
    this.form.hora = hora; 
  }

  toggleLang(lang: 'PT' | 'EN') {
    this.selectedLang = lang;
  }

  getFormattedDate(): string {
    if (!this.form.data) return '';
    const data = new Date(this.anoAtual, this.mesAtual, this.form.data);
    const options: any = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
    return data.toLocaleDateString('pt-BR', options);
  }

  getFilialNome(): string {
    const f = this.filiais.find(x => x.id === this.form.filialId);
    return f ? f.nome : 'Filial';
  }

  getCategoriaNome(): string {
    const c = this.categorias.find(x => x.id === this.form.servicoId);
    return c ? c.nome : 'Categoria';
  }

  confirmar() {
    // 1. Obter dados do usuário logado
    const userJson = localStorage.getItem('usuario_sgf');
    if (!userJson) {
      alert('Usuário não identificado. Por favor, faça login novamente.');
      this.router.navigate(['/login']);
      return;
    }
    const user = JSON.parse(userJson);

    // 2. Formatar a data para YYYY-MM-DD
    const dataObj = new Date(this.anoAtual, this.mesAtual, this.form.data || 1);
    const dataFormatada = dataObj.toISOString().split('T')[0];

    // 3. Gerar código único aleatório (Ex: AB1234)
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 4. Montar Payload para o Backend
    const payload = {
      nome: user.nome,
      documento: user.email, // Usando email como identificador (ou CPF se existir)
      data: dataFormatada,
      hora: this.form.hora,
      servico_id: this.form.servicoId,
      filial_id: this.form.filialId,
      codigo: codigo
    };

    console.log('Enviando agendamento:', payload);

    // 5. Enviar para o Backend
    this.apiService.post('/fila/agendamento', payload).subscribe({
      next: (res) => {
        console.log('Agendamento salvo com sucesso:', res);
        this.showSuccessModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao salvar agendamento:', err);
        const msg = err.error?.message || 'Erro ao realizar agendamento. Tente novamente mais tarde.';
        alert(msg);
      }
    });
  }

  verAgendamentos() {
    this.router.navigate(['/client/meus-agendamentos']);
  }

  voltarInicio() {
    this.router.navigate(['/client/home']);
  }

  fecharModal() {
    this.showSuccessModal = false;
  }
}
