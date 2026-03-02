import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Building2, Monitor, UserCheck, Clock } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = {
    filiais: 0,
    guiches: 0,
    atendimentos: 0,
    esperaMedio: 0
  };

  atividadesRecentes: any[] = [];
  loading = true;

  private intervalId: any;

  readonly icons = {
    building: Building2,
    monitor: Monitor,
    userCheck: UserCheck,
    clock: Clock
  };

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.fetchData();
    this.intervalId = setInterval(() => this.fetchData(), 15000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  fetchData() {
    this.api.get<any>('/dashboard/metrics').subscribe({
      next: (res) => {
        this.stats = {
          filiais: res.cards.filiaisAtivas,
          guiches: res.cards.guichesAtivos,
          atendimentos: res.cards.atendimentosHoje,
          esperaMedio: res.cards.tempoMedioEspera
        };
        this.atividadesRecentes = res.atividadeRecente;
        this.loading = false;
      },
      error: (err) => {
        console.error("Erro ao buscar métricas:", err);
        this.loading = false;
      }
    });
  }
}