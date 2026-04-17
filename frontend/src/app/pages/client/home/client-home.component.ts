import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Menu, Bell, Calendar, Plus, List, HelpCircle, ChevronRight, LayoutGrid, QrCode, MapPin, Clock } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss']
})
export class ClientHomeComponent implements OnInit {

  usuario = { nome: 'João Silva' };
  hoje: number = Date.now();
  showCancelModal = false;

  proximoAgendamento: any = null;

  mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  readonly icons = {
    menu: Menu, bell: Bell, calendar: Calendar, plus: Plus,
    list: List, help: HelpCircle, chevron: ChevronRight, grid: LayoutGrid,
    qrcode: QrCode, map: MapPin, clock: Clock
  };

  cancelarAgendamento() {
    this.showCancelModal = true;
  }

  fecharCancelModal() {
    this.showCancelModal = false;
  }

  confirmarCancelamento() {
    if (!this.proximoAgendamento?.id) return;

    this.apiService.delete(`/fila/agendamento/${this.proximoAgendamento.id}`).subscribe({
      next: () => {
        console.log('Agendamento cancelado com sucesso');
        this.showCancelModal = false;
        this.carregarDados();
      },
      error: (err) => {
        console.error('Erro ao cancelar agendamento:', err);
        alert('Erro ao cancelar agendamento. Tente novamente.');
      }
    });
  }

  ngOnInit() {
    this.carregarDados();
  }

  carregarDados() {
    const userJson = localStorage.getItem('usuario_sgf');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.usuario.nome = user.nome;

      this.apiService.get<any[]>('/fila/agendamento').subscribe(data => {
        console.log('Agendamentos recebidos:', data);

        // Filtra para o usuário logado e agendamentos futuros ou de hoje que não foram realizados
        const meusAgendamentos = (data || [])
          .filter(
            (a) =>
              (a.documento === user.email || a.nomeCliente === user.nome) &&
              (a.status === 'PENDENTE' || a.status === 'CONFIRMADO'),
          )
          .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

        if (meusAgendamentos.length > 0) {
          const prox = meusAgendamentos[0];
          const dataObj = new Date(prox.data + 'T12:00:00'); // Evita timezone issue

          this.proximoAgendamento = {
            titulo: prox.servico?.nome || 'Atendimento',
            day: dataObj.getDate().toString().padStart(2, '0'),
            month: this.mesesAbrev[dataObj.getMonth()],
            hora: prox.hora,
            local: 'Matriz - Centro',
            id: prox.id
          };
        } else {
          this.proximoAgendamento = null;
        }

        this.cdr.detectChanges();
      });
    }
  }
}