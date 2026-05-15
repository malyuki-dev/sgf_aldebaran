import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  LucideAngularModule,
  MapPin,
  Menu,
  Plus,
  QrCode,
  Star,
  X,
} from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { ClientMenuComponent } from '../components/client-menu/client-menu.component';
import { ClienteSuccessModalComponent } from '../components/cliente-success-modal/cliente-success-modal.component';
import {
  canManageAppointmentStatus,
  ClientAppointmentStatus,
  getAppointmentStatusInfo,
} from '../shared/appointment-status-map';

interface ClientAppointmentView {
  id: number;
  categoriaNome: string;
  filialNome: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  statusKey: ClientAppointmentStatus;
  statusLabel: string;
  statusColorClass: string;
  podeCancelar: boolean;
  podeReagendar: boolean;
  senha?: string | null;
  senhaStatus?: string | null;
  posicao?: number | null;
  estimativa?: number | null;
  dia: string;
  mes: string;
}

@Component({
  selector: 'app-client-appointments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ClientMenuComponent, RouterLink, ClienteSuccessModalComponent],
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss'],
})
export class ClientAppointmentsComponent implements OnInit {
  menuAberto = false;
  activeTab: 'proximos' | 'historico' = 'proximos';
  loading = false;
  cancelandoId: number | null = null;

  proximos: ClientAppointmentView[] = [];
  historico: ClientAppointmentView[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;

  readonly icons = {
    menu: Menu,
    bell: Bell,
    file: FileText,
    chevron: ChevronRight,
    help: HelpCircle,
    plus: Plus,
    calendar: Calendar,
    map: MapPin,
    clock: Clock,
    x: X,
    qrcode: QrCode,
    arrowRight: ArrowRight,
    star: Star,
  };

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

  private readonly statusProximos = new Set<ClientAppointmentStatus>([
    'CONFIRMADO',
    'CHECKIN_REALIZADO',
    'AGUARDANDO_CHECKIN',
    'NA_FILA',
    'CHAMADO',
    'EM_ATENDIMENTO',
    'PENDENTE',
  ]);

  private readonly statusHistorico = new Set<ClientAppointmentStatus>([
    'CONCLUIDO',
    'CANCELADO',
    'NAO_COMPARECEU',
    'EXPIRADO',
  ]);

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.carregarAgendamentos();
  }

  carregarAgendamentos() {
    this.loading = true;

    this.apiService
      .get<ClientAppointmentView[]>('/agendamentos', {
        meus: 'true',
        status: 'active',
      })
      .subscribe({
        next: (proximos) => {
          this.proximos = this.formatarAgendamentos(proximos || []).filter(
            (item) => this.statusProximos.has(item.statusKey),
          );

          this.apiService
            .get<ClientAppointmentView[]>('/agendamentos', {
              meus: 'true',
              status: 'history',
            })
            .subscribe({
              next: (historico) => {
                this.historico = this.formatarAgendamentos(
                  historico || [],
                ).filter((item) => this.statusHistorico.has(item.statusKey));
                this.loading = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Erro ao carregar histórico:', err);
                this.loading = false;
                if (err.status === 401) {
                  this.router.navigate(['/login']);
                }
                this.cdr.detectChanges();
              },
            });
        },
        error: (err) => {
          console.error('Erro ao carregar próximos agendamentos:', err);
          this.loading = false;
          if (err.status === 401) {
            this.router.navigate(['/login']);
          }
          this.cdr.detectChanges();
        },
      });
  }

  toggleTab(tab: 'proximos' | 'historico') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  cancelarAgendamento(id: number) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    this.cancelandoId = id;
    this.errorMessage = null;
    this.apiService.patch(`/agendamentos/${id}/cancelar`, {}).subscribe({
      next: () => {
        this.cancelandoId = null;
        this.successMessage = 'Agendamento cancelado com sucesso.';
        this.carregarAgendamentos();
      },
      error: (err) => {
        this.cancelandoId = null;
        this.errorMessage =
          err.error?.message || 'Não foi possível cancelar este agendamento.';
        this.cdr.detectChanges();
      },
    });
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  closeSuccessModal() {
    this.successMessage = null;
  }

  private formatarAgendamentos(
    agendamentos: ClientAppointmentView[],
  ): ClientAppointmentView[] {
    return agendamentos.map((agendamento) => {
      const dataObj = new Date(`${agendamento.data}T12:00:00`);
      const inicio = new Date(`${agendamento.data}T${agendamento.horaInicio}:00`);
      const statusInfo = getAppointmentStatusInfo(agendamento.status, inicio);
      const permiteAcao = canManageAppointmentStatus(statusInfo.status);

      return {
        ...agendamento,
        statusKey: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColorClass: statusInfo.colorClass,
        podeCancelar: agendamento.podeCancelar && permiteAcao,
        podeReagendar: agendamento.podeReagendar && permiteAcao,
        dia: dataObj.getDate().toString().padStart(2, '0'),
        mes: this.mesesAbrev[dataObj.getMonth()] || '',
      };
    });
  }
}
