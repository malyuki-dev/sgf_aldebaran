import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { FilialService } from '../../../services/filial.service';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Calendar, Clock, User, MapPin, Phone, FileText, Search, Plus, Filter, X, CheckCircle, Trash2, AlertCircle, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-agendamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './agendamentos.component.html',
  styleUrl: './agendamentos.component.scss'
})
export class AgendamentosComponent implements OnInit, OnDestroy {
  agendamentos: any[] = [];
  agendamentosFiltrados: any[] = [];
  servicos: any[] = [];
  loading = true;
  loadingHorarios = false;

  filtroBusca = '';
  filtroStatus = 'TODOS';
  filtroData = '';
  selectedFilialId: number | null = null;

  showModal = false;
  isEditing = false;
  horariosDisponiveis: any[] = [];

  form = {
    id: null as number | null,
    nome: '',
    documento: '',
    servico_id: '' as string | number,
    data: '',
    hora: '',
    filial_id: null as number | null,
    codigo: ''
  };

  readonly icons = { 
    calendar: Calendar, clock: Clock, user: User, map: MapPin, phone: Phone, 
    file: FileText, search: Search, plus: Plus, filter: Filter, x: X, 
    check: CheckCircle, trash: Trash2, alert: AlertCircle, chevron: ChevronRight 
  };
  private filialSub?: any;

  constructor(
    private api: ApiService,
    private filialService: FilialService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.filialSub = this.filialService.selectedFilial$.subscribe(id => {
      this.selectedFilialId = id;
      this.carregar();
      this.carregarServicos();
    });

    this.route.queryParams.subscribe(params => {
      if (params['filialId']) {
        this.selectedFilialId = Number(params['filialId']);
        this.carregar();
        this.carregarServicos();
      }
    });
  }

  ngOnDestroy() {
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  carregar() {
    this.loading = true;
    const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
    this.api.get<any[]>(`/fila/agendamento${filialQuery}`).subscribe({
      next: (res) => { 
        this.agendamentos = res; 
        this.aplicarFiltros();
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error(err); 
        this.loading = false; 
      }
    });
  }

  carregarServicos() {
    const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
    this.api.get<any[]>(`/servicos${filialQuery}`).subscribe(res => {
      this.servicos = res.filter(s => s.ativo);
    });
  }

  aplicarFiltros() {
    let result = [...this.agendamentos];

    if (this.filtroBusca) {
      const termo = this.filtroBusca.toLowerCase();
      result = result.filter(a => 
        a.nomeCliente.toLowerCase().includes(termo) || 
        (a.documento && a.documento.includes(termo))
      );
    }

    if (this.filtroStatus !== 'TODOS') {
      result = result.filter(a => a.status === this.filtroStatus);
    }

    if (this.filtroData) {
      result = result.filter(a => a.data === this.filtroData);
    }

    this.agendamentosFiltrados = result;
  }

  abrirModal() {
    this.isEditing = false;
    this.form = {
      id: null,
      nome: '',
      documento: '',
      servico_id: '',
      data: new Date().toISOString().split('T')[0],
      hora: '',
      filial_id: this.selectedFilialId,
      codigo: this.gerarCodigo()
    };
    this.horariosDisponiveis = [];
    this.showModal = true;
    this.buscarHorarios();
  }

  buscarHorarios() {
    if (!this.form.data) return;
    
    this.loadingHorarios = true;
    this.api.get<any[]>(`/fila/agendamento/horarios`, { data: this.form.data }).subscribe({
      next: (res) => {
        this.horariosDisponiveis = res;
        this.loadingHorarios = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingHorarios = false;
      }
    });
  }

  selecionarHora(hora: string) {
    this.form.hora = hora;
  }

  gerarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  salvar() {
    if (!this.form.nome || !this.form.servico_id || !this.form.data || !this.form.hora) {
      return alert("Preencha todos os campos obrigatórios!");
    }

    this.api.post('/fila/agendamento', this.form).subscribe({
      next: () => {
        this.showModal = false;
        this.carregar();
      },
      error: (err) => alert(err.error?.message || "Erro ao salvar agendamento.")
    });
  }

  cancelar(id: number) {
    if (confirm("Deseja realmente cancelar este agendamento?")) {
      this.api.delete(`/fila/agendamento/${id}`).subscribe(() => {
        this.carregar();
      });
    }
  }

  formatarData(dataStr: string) {
    if (!dataStr) return "-";
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'CONFIRMADO': return 'badge-confirmado';
      case 'REALIZADO': return 'badge-realizado';
      case 'CANCELADO': return 'badge-cancelado';
      default: return 'badge-pendente';
    }
  }
}