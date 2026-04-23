import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  HelpCircle,
  LayoutGrid,
  List,
  LucideAngularModule,
  MapPin,
  Menu,
  Plus,
  QrCode,
} from 'lucide-angular';
import { ApiService } from '../../../services/api.service';

interface NextAppointmentView {
  id: number;
  categoriaNome: string;
  filialNome: string;
  data: string;
  horaInicio: string;
  status: string;
  podeCancelar: boolean;
}

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss'],
})
export class ClientHomeComponent implements OnInit {
  usuario = { nome: 'Cliente' };
  hoje = Date.now();
  showCancelModal = false;

  proximoAgendamento: {
    titulo: string;
    day: string;
    month: string;
    hora: string;
    local: string;
    id: number;
    podeCancelar: boolean;
  } | null = null;

  private readonly mesesAbrev = [
    'JAN',
    'FEV',
    'MAR',
    'ABR',
    'MAI',
    'JUN',
    'JUL',
    'AGO',
    'SET',
    'OUT',
    'NOV',
    'DEZ',
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  readonly icons = {
    menu: Menu,
    bell: Bell,
    calendar: Calendar,
    plus: Plus,
    list: List,
    help: HelpCircle,
    chevron: ChevronRight,
    grid: LayoutGrid,
    qrcode: QrCode,
    map: MapPin,
    clock: Clock,
  };

  cancelarAgendamento() {
    this.showCancelModal = true;
  }

  fecharCancelModal() {
    this.showCancelModal = false;
  }

  confirmarCancelamento() {
    if (!this.proximoAgendamento?.id) return;

    this.apiService
      .patch(`/agendamentos/${this.proximoAgendamento.id}/cancelar`, {})
      .subscribe({
        next: () => {
          this.showCancelModal = false;
          this.carregarDados();
        },
        error: (err) => {
          const message =
            err.error?.message || 'Erro ao cancelar agendamento. Tente novamente.';
          alert(message);
        },
      });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    const userJson = localStorage.getItem('usuario_sgf');
    if (!userJson) {
      this.proximoAgendamento = null;
      return;
    }

    const user = JSON.parse(userJson);
    this.usuario.nome = user.nome || 'Cliente';

    this.apiService
      .get<NextAppointmentView[]>('/agendamentos', {
        meus: 'true',
        status: 'active',
      })
      .subscribe({
        next: (data) => {
          const proximo = (data || [])[0];

          if (!proximo) {
            this.proximoAgendamento = null;
            this.cdr.detectChanges();
            return;
          }

          const dataObj = new Date(`${proximo.data}T12:00:00`);
          this.proximoAgendamento = {
            titulo: proximo.categoriaNome || 'Atendimento',
            day: dataObj.getDate().toString().padStart(2, '0'),
            month: this.mesesAbrev[dataObj.getMonth()] || '',
            hora: proximo.horaInicio,
            local: proximo.filialNome || 'Filial não informada',
            id: proximo.id,
            podeCancelar: proximo.podeCancelar,
          };

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar próximo agendamento:', err);
          this.proximoAgendamento = null;
          this.cdr.detectChanges();
        },
      });
  }
}
