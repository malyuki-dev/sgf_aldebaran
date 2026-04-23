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

interface ClientAppointmentView {
  id: number;
  categoriaNome: string;
  filialNome: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  podeCancelar: boolean;
  podeReagendar: boolean;
  dia: string;
  mes: string;
}

@Component({
  selector: 'app-client-appointments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ClientMenuComponent, RouterLink],
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
          this.proximos = this.formatarAgendamentos(proximos || []);

          this.apiService
            .get<ClientAppointmentView[]>('/agendamentos', {
              meus: 'true',
              status: 'history',
            })
            .subscribe({
              next: (historico) => {
                this.historico = this.formatarAgendamentos(historico || []);
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
    this.apiService.patch(`/agendamentos/${id}/cancelar`, {}).subscribe({
      next: () => {
        this.cancelandoId = null;
        this.carregarAgendamentos();
      },
      error: (err) => {
        this.cancelandoId = null;
        const message =
          err.error?.message || 'Não foi possível cancelar este agendamento.';
        alert(message);
        this.cdr.detectChanges();
      },
    });
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  private formatarAgendamentos(
    agendamentos: ClientAppointmentView[],
  ): ClientAppointmentView[] {
    return agendamentos.map((agendamento) => {
      const dataObj = new Date(`${agendamento.data}T12:00:00`);
      return {
        ...agendamento,
        dia: dataObj.getDate().toString().padStart(2, '0'),
        mes: this.mesesAbrev[dataObj.getMonth()] || '',
      };
    });
  }
}
