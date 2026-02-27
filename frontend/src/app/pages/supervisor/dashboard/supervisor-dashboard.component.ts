import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, AlertTriangle, ChevronRight, TrendingUp,
  Clock, Activity, Users, Truck, UserPlus, User, Settings, BarChart2,
  Bell, History, Calendar
} from 'lucide-angular';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent {
  // Ícones
  readonly icons = {
    alert: AlertTriangle, right: ChevronRight, trendUp: TrendingUp,
    clock: Clock, activity: Activity, users: Users,
    truck: Truck, opPlus: UserPlus, user: User,
    settings: Settings, chart: BarChart2, bell: Bell,
    history: History, calendar: Calendar
  };

  // Visão Geral (KPIs)
  visaoGeral = [
    { titulo: 'Total Hoje', valor: '147', info: '+12%', corInfo: 'green', icon: this.icons.trendUp, bgIcon: '#e0f2fe', colorIcon: '#0284c7' },
    { titulo: 'Tempo Médio', valor: '8 min', info: '+3 min', corInfo: 'red', icon: this.icons.clock, bgIcon: '#ecfdf5', colorIcon: '#059669' },
    { titulo: 'Guichês Ativos', valor: '5/6', info: '75%', corInfo: 'green', icon: this.icons.activity, bgIcon: '#f0fdf4', colorIcon: '#16a34a' },
    { titulo: 'Fila Atual', valor: '12', info: 'Normal', corInfo: 'gray', icon: this.icons.users, bgIcon: '#f3e8ff', colorIcon: '#9333ea' }
  ];

  // Status dos Guichês
  guiches = [
    { numero: 1, operador: 'João Santos', status: 'ATENDENDO', ticket: 'RP043', tempo: '12:30' },
    { numero: 2, operador: 'Ana Costa', status: 'ATENDENDO', ticket: 'C041', tempo: '14:30' },
    { numero: 3, operador: 'Maria Silva', status: 'DISPONIVEL', tempo: '0:10' },
    { numero: 4, operador: 'Pedro Lima', status: 'ATENDENDO', ticket: 'CR038', tempo: '5:00' },
    { numero: 5, operador: 'Gustavo Campos', status: 'ATENDENDO', ticket: 'C042', tempo: '17:15' },
    { numero: 6, operador: '', status: 'FECHADO' }
  ];

  // Ações de Gerenciamento
  acoes = [
    { nome: 'Cadastrar Caminhão', icon: this.icons.truck, link: '/supervisor/caminhoes/novo' },
    { nome: 'Cadastrar Operador', icon: this.icons.opPlus, link: '/supervisor/operadores/novo' },
    { nome: 'Cadastrar Cliente', icon: this.icons.user, link: '/supervisor/clientes/novo' },
    { nome: 'Gerenciar Fila', icon: this.icons.settings, link: '/supervisor/filas' },
    { nome: 'Relatórios Gerenciais', icon: this.icons.chart, link: '/supervisor/relatorios' }
  ];
}