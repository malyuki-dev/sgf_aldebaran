import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Bell,
  Calendar,
  CheckCircle2,
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
  Ticket,
} from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { ClienteSuccessModalComponent } from '../components/cliente-success-modal/cliente-success-modal.component';
import {
  canManageAppointmentStatus,
  ClientAppointmentStatus,
  getAppointmentStatusInfo,
} from '../shared/appointment-status-map';

interface NextAppointmentView {
  id: number;
  categoriaNome: string;
  filialNome: string;
  data: string;
  horaInicio: string;
  horaFim?: string;
  status: string;
  statusKey?: ClientAppointmentStatus;
  statusLabel?: string;
  senha?: string | null;
  senhaStatus?: string | null;
  posicao?: number | null;
  estimativa?: number | null;
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
  statusKey?: ClientAppointmentStatus;
  statusLabel?: string;
  senha?: string | null;
  senhaStatus?: string | null;
  posicao?: number | null;
  estimativa?: number | null;
  checkinRealizado: boolean;
}

interface CheckinTicketView {
  id: number;
  numeroDisplay: string;
  status: string;
  statusLabel?: string;
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
  imports: [CommonModule, RouterLink, LucideAngularModule, ClienteSuccessModalComponent],
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
  successMessage: string | null = null;
  cancelError: string | null = null;
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
    statusKey: ClientAppointmentStatus;
    statusLabel: string;
    statusColorClass: string;
    actionLabel: string;
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

  private readonly statusAtivos = new Set<ClientAppointmentStatus>([
    'CONFIRMADO',
    'CHECKIN_REALIZADO',
    'AGUARDANDO_CHECKIN',
    'NA_FILA',
    'CHAMADO',
    'EM_ATENDIMENTO',
    'PENDENTE',
  ]);

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
    success: CheckCircle2,
    ticket: Ticket,
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
        const statusInfo = getAppointmentStatusInfo(voucher.status);
        this.voucher = {
          ...voucher,
          statusKey: statusInfo.status,
          statusLabel: statusInfo.label,
        };
        this.voucherLoading = false;
        if (voucher.checkinRealizado) {
          this.carregarTicketDoVoucher(voucher.id);
        }
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
          const voucherStatus = getAppointmentStatusInfo(
            response.agendamento.status,
          );
          const ticketStatus = getAppointmentStatusInfo(response.ticket.status);
          this.voucher = {
            ...response.agendamento,
            statusKey: voucherStatus.status,
            statusLabel: voucherStatus.label,
          };
          this.ticket = {
            ...response.ticket,
            statusLabel: ticketStatus.label,
          };
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

    this.cancelError = null;
    this.apiService
      .patch(`/agendamentos/${this.proximoAgendamento.id}/cancelar`, {})
      .subscribe({
        next: () => {
          this.showCancelModal = false;
          this.successMessage = 'Agendamento cancelado com sucesso.';
          this.carregarDados();
        },
        error: (err) => {
          this.cancelError =
            err.error?.message || 'Erro ao cancelar agendamento. Tente novamente.';
          this.cdr.detectChanges();
        },
      });
  }

  fecharSuccessModal() {
    this.successMessage = null;
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
          const proximo = (data || []).find((item) => {
            const statusInfo = getAppointmentStatusInfo(
              item.status,
              new Date(`${item.data}T${item.horaInicio}:00`),
            );
            return this.statusAtivos.has(statusInfo.status);
          });

          if (!proximo) {
            this.proximoAgendamento = null;
            this.cdr.detectChanges();
            return;
          }

          const dataObj = new Date(`${proximo.data}T12:00:00`);
          const statusInfo = getAppointmentStatusInfo(
            proximo.status,
            new Date(`${proximo.data}T${proximo.horaInicio}:00`),
          );
          this.proximoAgendamento = {
            titulo: proximo.categoriaNome || 'Atendimento',
            day: dataObj.getDate().toString().padStart(2, '0'),
            month: this.mesesAbrev[dataObj.getMonth()] || '',
            hora: proximo.horaInicio,
            local: proximo.filialNome || 'Filial não informada',
            id: proximo.id,
            podeCancelar:
              proximo.podeCancelar &&
              canManageAppointmentStatus(statusInfo.status),
            status: proximo.status,
            statusKey: statusInfo.status,
            statusLabel: statusInfo.label,
            statusColorClass: statusInfo.colorClass,
            actionLabel: canManageAppointmentStatus(statusInfo.status)
              ? 'Abrir Voucher / Check-in'
              : 'Ver check-in',
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

  private carregarTicketDoVoucher(agendamentoId: number) {
    this.apiService
      .get<NextAppointmentView[]>('/agendamentos', {
        meus: 'true',
        status: 'active',
      })
      .subscribe({
        next: (agendamentos) => {
          const agendamento = (agendamentos || []).find(
            (item) => item.id === agendamentoId,
          );
          if (!agendamento || !this.voucher) {
            this.cdr.detectChanges();
            return;
          }

          const statusInfo = getAppointmentStatusInfo(
            agendamento.status,
            new Date(`${agendamento.data}T${agendamento.horaInicio}:00`),
          );
          this.voucher = {
            ...this.voucher,
            status: agendamento.status,
            statusKey: statusInfo.status,
            statusLabel: statusInfo.label,
            senha: agendamento.senha,
            senhaStatus: agendamento.senhaStatus,
            posicao: agendamento.posicao,
            estimativa: agendamento.estimativa,
          };

          if (agendamento.senha) {
            this.ticket = {
              id: agendamento.id,
              numeroDisplay: agendamento.senha,
              status: agendamento.senhaStatus || agendamento.status,
              statusLabel: statusInfo.label,
              dataCriacao: '',
              posicao: agendamento.posicao || 0,
              estimativa: agendamento.estimativa || 0,
            };
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        },
      });
  }
}
