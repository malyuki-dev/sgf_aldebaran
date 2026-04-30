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
  horaFim?: string;
  status: string;
  podeCancelar: boolean;
}

interface ClientVoucherView {
  id: number;
  codigo: string;
  categoriaNome: string;
  filialNome: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  checkinRealizado: boolean;
}

interface CheckinTicketView {
  id: number;
  numeroDisplay: string;
  status: string;
  dataCriacao: string;
  posicao: number;
  estimativa: number;
}

interface CheckinResponseView {
  message: string;
  agendamento: ClientVoucherView;
  ticket: CheckinTicketView;
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
  showVoucherModal = false;
  voucherLoading = false;
  checkinLoading = false;
  voucherError: string | null = null;
  checkinSuccess: string | null = null;
  voucher: ClientVoucherView | null = null;
  ticket: CheckinTicketView | null = null;

  proximoAgendamento: {
    titulo: string;
    day: string;
    month: string;
    hora: string;
    local: string;
    id: number;
    podeCancelar: boolean;
    status: string;
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

  abrirVoucher() {
    this.showVoucherModal = true;
    this.voucherLoading = true;
    this.voucherError = null;
    this.checkinSuccess = null;
    this.voucher = null;
    this.ticket = null;

    this.apiService.get<ClientVoucherView>('/agendamentos/voucher/ativo').subscribe({
      next: (voucher) => {
        this.voucher = voucher;
        this.voucherLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.voucherError =
          err.error?.message || 'Não foi possível carregar o voucher deste agendamento.';
        this.voucherLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fecharVoucher() {
    this.showVoucherModal = false;
    this.voucherError = null;
    this.checkinSuccess = null;
    this.voucher = null;
    this.ticket = null;
  }

  confirmarCheckin() {
    if (!this.voucher || this.voucher.checkinRealizado) return;

    this.checkinLoading = true;
    this.voucherError = null;

    this.apiService
      .post<CheckinResponseView>(`/agendamentos/${this.voucher.id}/checkin`, {})
      .subscribe({
        next: (response) => {
          this.voucher = response.agendamento;
          this.ticket = response.ticket;
          this.checkinSuccess = response.message || 'Check-in realizado com sucesso.';
          this.checkinLoading = false;
          this.carregarDados();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.voucherError =
            err.error?.message || 'Não foi possível realizar o check-in.';
          this.checkinLoading = false;
          this.cdr.detectChanges();
        },
      });
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
            status: proximo.status,
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
