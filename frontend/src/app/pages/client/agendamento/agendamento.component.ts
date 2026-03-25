import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, ChevronLeft, ChevronRight, Minus, Plus, Check, MapPin, Package } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';

type DiaCalendario = {
  numero: number | null;
  dataCompleta: string | null;
};

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.scss']
})
export class AgendamentoComponent implements OnInit {
  carregando = false;
  salvando = false;

  form = {
    filial_id: null as number | null,
    servico_id: null as number | null,
    quantidade: 25,
    data: '',
    hora: '',
    obs: ''
  };

  filiais: any[] = [];
  categorias: any[] = [];
  horarios: { hora: string; disponivel: boolean }[] = [];

  mesAtual = 0; // Janeiro
  anoAtual = 2025;
  diasCalendario: DiaCalendario[] = [];

  readonly nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  readonly icons = {
    menu: Menu, bell: Bell, left: ChevronLeft, right: ChevronRight,
    minus: Minus, plus: Plus, check: Check, map: MapPin, box: Package
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.gerarCalendario();
    this.carregarDadosIniciais();
  }

  get tituloMesAno(): string {
    return `${this.nomesMeses[this.mesAtual]} ${this.anoAtual}`;
  }

  get dataSelecionadaLabel(): string {
    if (!this.form.data) return '';

    const [ano, mes, dia] = this.form.data.split('-');
    const indiceMes = Number(mes) - 1;

    return `${dia} de ${this.nomesMeses[indiceMes]}, ${ano}`;
  }

  gerarCalendario() {
    const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1);
    const ultimoDia = new Date(this.anoAtual, this.mesAtual + 1, 0);

    const diaSemanaPrimeiro = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();

    const dias: DiaCalendario[] = [];

    for (let i = 0; i < diaSemanaPrimeiro; i++) {
      dias.push({ numero: null, dataCompleta: null });
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataCompleta =
        `${this.anoAtual}-` +
        `${String(this.mesAtual + 1).padStart(2, '0')}-` +
        `${String(dia).padStart(2, '0')}`;

      dias.push({
        numero: dia,
        dataCompleta
      });
    }

    this.diasCalendario = dias;
  }

  mesAnterior() {
    if (this.mesAtual === 0) {
      this.mesAtual = 11;
      this.anoAtual--;
    } else {
      this.mesAtual--;
    }

    this.form.data = '';
    this.form.hora = '';
    this.horarios = [];
    this.gerarCalendario();
  }

  proximoMes() {
    if (this.mesAtual === 11) {
      this.mesAtual = 0;
      this.anoAtual++;
    } else {
      this.mesAtual++;
    }

    this.form.data = '';
    this.form.hora = '';
    this.horarios = [];
    this.gerarCalendario();
  }

  carregarDadosIniciais() {
    this.carregando = true;

    this.api.get<any[]>('/fila/agendamento/filiais').subscribe({
      next: (filiais) => {
        this.filiais = filiais;

        if (filiais.length > 0) {
          this.form.filial_id = filiais[0].id;
        }

        this.api.get<any[]>('/fila/servicos').subscribe({
          next: (servicos) => {
            this.categorias = servicos;

            if (servicos.length > 0) {
              this.form.servico_id = servicos[0].id;
            }

            this.carregando = false;
          },
          error: (err) => {
            console.error('Erro ao carregar serviços:', err);
            this.carregando = false;
            alert('Erro ao carregar categorias.');
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar filiais:', err);
        this.carregando = false;
        alert('Erro ao carregar filiais.');
      }
    });
  }

  inc() {
    this.form.quantidade++;
  }

  dec() {
    if (this.form.quantidade > 1) {
      this.form.quantidade--;
    }
  }

  selecionarDia(dia: DiaCalendario) {
    if (!dia.dataCompleta) return;

    this.form.data = dia.dataCompleta;
    this.form.hora = '';
    this.onDataOuFiltroChange();
  }

  onDataOuFiltroChange() {
    if (!this.form.data || !this.form.filial_id || !this.form.servico_id) {
      this.horarios = [];
      this.form.hora = '';
      return;
    }

    const rota =
      `/fila/agendamento/horarios?data=${this.form.data}` +
      `&servico_id=${this.form.servico_id}` +
      `&filial_id=${this.form.filial_id}`;

    this.api.get<{ hora: string; disponivel: boolean }[]>(rota).subscribe({
      next: (res) => {
        this.horarios = res;
        this.form.hora = '';
      },
      error: (err) => {
        console.error('Erro ao carregar horários:', err);
        this.horarios = [];
        this.form.hora = '';
        alert(err?.error?.message || 'Erro ao carregar horários.');
      }
    });
  }

  selecionarHora(hora: string, disponivel: boolean) {
    if (!disponivel) return;
    this.form.hora = hora;
  }

  confirmar() {
    if (!this.form.filial_id || !this.form.servico_id || !this.form.data || !this.form.hora) {
      alert('Preencha filial, categoria, data e horário.');
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario_sgf') || '{}');

    const payload = {
      nome: usuario.nome || localStorage.getItem('usuario_nome') || 'Cliente',
      documento: usuario.documento || null,
      data: this.form.data,
      hora: this.form.hora,
      servico_id: this.form.servico_id,
      filial_id: this.form.filial_id,
      observacao: this.form.obs
    };

    this.salvando = true;

    this.api.post<any>('/fila/agendamento', payload).subscribe({
      next: (res) => {
        this.salvando = false;

        alert(
          `Agendamento confirmado!\n\n` +
          `Código: ${res.codigo}\n` +
          `Data: ${res.data}\n` +
          `Hora: ${res.hora}\n` +
          `Filial: ${res.filial?.nome ?? '-'}\n` +
          `Categoria: ${res.servico?.nome ?? '-'}`
        );

        this.form.hora = '';
        this.form.obs = '';
        this.onDataOuFiltroChange();
      },
      error: (err) => {
        console.error('Erro ao criar agendamento:', err);
        this.salvando = false;
        alert(err?.error?.message || 'Erro ao criar agendamento.');
      }
    });
  }
}