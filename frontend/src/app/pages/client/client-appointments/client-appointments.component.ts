import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { LucideAngularModule, Menu, Bell, FileText, ChevronRight, HelpCircle, Plus, Calendar, MapPin, Clock, X, QrCode, ArrowRight, Star } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { ClientMenuComponent } from '../components/client-menu/client-menu.component';

@Component({
  selector: 'app-client-appointments',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ClientMenuComponent, RouterLink],
  templateUrl: './client-appointments.component.html',
  styleUrls: ['./client-appointments.component.scss']
})
export class ClientAppointmentsComponent implements OnInit {
  menuAberto: boolean = false;
  activeTab: 'proximos' | 'historico' = 'proximos';
  loading = false;
  
  proximos: any[] = [];
  historico: any[] = [];

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
    star: Star
  };

  mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarAgendamentos();
  }

  carregarAgendamentos() {
    console.log('Iniciando carregarAgendamentos...');
    this.loading = true;
    
    // Failsafe timeout
    setTimeout(() => {
      if (this.loading) {
        console.warn('Timeout ao carregar agendamentos. Forçando parada do loading.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    }, 8000);

    const userJson = localStorage.getItem('usuario_sgf');
    if (!userJson) {
      console.log('Nenhum usuário logado encontrado em localStorage.');
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userJson);
    console.log('Usuário logado:', user);

    this.apiService.get<any[]>('/fila/agendamento').subscribe({
      next: (data) => {
        console.log('Dados brutos recebidos da API:', data);
        const agora = new Date();
        const meusAgendamentos = (data || []).filter(a => 
          a.documento === user.email || a.nomeCliente === user.nome
        );
        console.log('Agendamentos filtrados para o usuário:', meusAgendamentos);

        // Mapeia e Formata
        const formatado = meusAgendamentos.map(a => {
          const dataObj = new Date(a.data + 'T12:00:00');
          return {
            ...a,
            dia: dataObj.getDate().toString().padStart(2, '0'),
            mes: this.mesesAbrev[dataObj.getMonth()],
            servicoNome: a.servico?.nome || 'Serviço',
            filialNome: 'Matriz - Centro', 
            horarioFim: this.calcularHorarioFim(a.hora)
          };
        });

        // Próximos: PENDENTE/CONFIRMADO e Data >= Hoje
        this.proximos = formatado.filter(a => 
          (a.status === 'PENDENTE' || a.status === 'CONFIRMADO') && 
          new Date(a.data + 'T23:59:59') >= agora
        ).sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

        // Histórico: Restante
        this.historico = formatado.filter(a => 
          a.status === 'CANCELADO' || a.status === 'REALIZADO' || a.status === 'CONCLUIDO' ||
          new Date(a.data + 'T23:59:59') < agora
        ).sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));

        console.log('Próximos:', this.proximos);
        console.log('Histórico:', this.historico);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro na requisição à API:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleTab(tab: 'proximos' | 'historico') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  calcularHorarioFim(horaInicio: string): string {
    if (!horaInicio) return '';
    const [h, m] = horaInicio.split(':').map(Number);
    let totalMin = h * 60 + m + 30;
    const fh = Math.floor(totalMin / 60);
    const fm = totalMin % 60;
    return `${fh.toString().padStart(2, '0')}:${fm.toString().padStart(2, '0')}`;
  }

  cancelarAgendamento(id: number) {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      this.apiService.delete(`/fila/agendamento/${id}`).subscribe(() => {
        this.carregarAgendamentos();
      });
    }
  }

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }
}