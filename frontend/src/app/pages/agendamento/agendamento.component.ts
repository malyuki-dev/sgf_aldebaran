import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, Calendar, Clock, User, CheckCircle, ChevronLeft, ChevronRight, Ticket, Share2 } from 'lucide-angular';
import * as QRCode from 'qrcode'; // Biblioteca nativa

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './agendamento.component.html',
  styleUrl: './agendamento.component.scss'
})
export class AgendamentoComponent implements OnInit {
  passo = 1; // 1: Form, 2: Sucesso
  servicos: any[] = [];
  
  // Dados do formulário
  selecao = {
    servico_id: '',
    data: new Date().toISOString().split('T')[0], // Hoje
    hora: '',
    nome: '',
    documento: ''
  };

  horariosDisponiveis: any[] = [];
  loading = false;
  loadingHorarios = false;
  
  // Calendário
  mesAtual = new Date();
  diasCalendario: any[] = [];
  
  // Dados do Sucesso
  agendamentoId: number | null = null;
  linkComprovante: string = '';
  qrCodeImage: string = '';

  readonly icons = { calendar: Calendar, clock: Clock, user: User, check: CheckCircle, left: ChevronLeft, right: ChevronRight, ticket: Ticket, share: Share2 };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.carregarServicos();
    this.gerarCalendario();
    this.buscarHorarios();
  }

  carregarServicos() {
    this.api.get<any[]>('/fila/servicos').subscribe(data => {
      this.servicos = data.filter(s => s.ativo !== false);
      if (this.servicos.length > 0) this.selecao.servico_id = this.servicos[0].id;
    });
  }

  buscarHorarios() {
    if (!this.selecao.data) return;
    this.loadingHorarios = true;
    
    this.api.get<any[]>(`/fila/agendamento/horarios?data=${this.selecao.data}`).subscribe({
      next: (res) => this.horariosDisponiveis = res,
      error: () => console.error("Erro ao buscar horários"),
      complete: () => this.loadingHorarios = false
    });
  }

  confirmar() {
    if (!this.selecao.nome || !this.selecao.hora || !this.selecao.documento) {
      alert("Preencha todos os campos!");
      return;
    }
    
    // Converte ID para número para evitar erro no backend
    const payload = { ...this.selecao, servico_id: Number(this.selecao.servico_id) };

    this.api.post<any>('/fila/agendamento', payload).subscribe({
      next: (res) => {
        this.agendamentoId = res.id;
        this.linkComprovante = `http://${window.location.hostname}:4200/mobile/${res.id}`;
        this.gerarQR(this.linkComprovante);
        this.passo = 2;
      },
      error: (err) => alert(err.error?.message || "Erro ao agendar.")
    });
  }

  async gerarQR(texto: string) {
    try {
      this.qrCodeImage = await QRCode.toDataURL(texto, { width: 160, margin: 1 });
    } catch (err) { console.error(err); }
  }

  // --- Lógica do Calendário ---
  gerarCalendario() {
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    this.diasCalendario = [];
    for (let i = 0; i < primeiroDia; i++) this.diasCalendario.push(null);
    for (let i = 1; i <= diasNoMes; i++) this.diasCalendario.push(i);
  }

  mudarMes(delta: number) {
    this.mesAtual = new Date(this.mesAtual.setMonth(this.mesAtual.getMonth() + delta));
    this.gerarCalendario();
  }

  selecionarDia(dia: number) {
    if (!dia) return;
    const ano = this.mesAtual.getFullYear();
    const mes = this.mesAtual.getMonth() + 1;
    this.selecao.data = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    this.selecao.hora = ''; // Limpa hora ao mudar dia
    this.buscarHorarios();
  }

  // Verifica se o dia é o selecionado
  isDiaSelecionado(dia: number): boolean {
    if (!dia) return false;
    const d = new Date(this.selecao.data);
    return d.getDate() === dia && d.getMonth() === this.mesAtual.getMonth();
  }

  abrirLink() {
    window.open(this.linkComprovante, '_blank');
  }
  
  novo() {
    window.location.reload();
  }
}