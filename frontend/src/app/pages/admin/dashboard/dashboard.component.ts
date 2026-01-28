import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Users, Clock, TrendingUp, Calendar, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  senhaAtual: string = '---';
  stats = { fila: 0, tempo: 0, atendidos: 0 };
  dadosFluxo: any[] = [];
  dataHoje = new Date();
  private intervalId: any;

  readonly icons = { users: Users, clock: Clock, trending: TrendingUp, calendar: Calendar, check: CheckCircle };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchData();
    this.intervalId = setInterval(() => this.fetchData(), 5000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  fetchData() {
    // 1. Busca Senha Atual
    this.api.get<any[]>('/fila/painel').subscribe(res => {
      if (res.length > 0) this.senhaAtual = res[0].numeroDisplay;
    });

    // 2. Busca Estatísticas (Backend)
    this.api.get<any>('/fila/dashboard-stats').subscribe(res => {
      this.stats = { fila: res.fila, tempo: res.tempo, atendidos: res.atendidos };
      this.dadosFluxo = res.graficoFluxo;
    });
  }
}