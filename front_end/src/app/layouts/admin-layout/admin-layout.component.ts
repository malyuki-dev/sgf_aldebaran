import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, Monitor, LogOut, Menu, Users, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = true;
  usuario: any = null;

  readonly icons = {
    dashboard: LayoutDashboard,
    ticket: Ticket,
    settings: Settings,
    monitor: Monitor,
    logout: LogOut,
    menu: Menu,
    user: Users,
    calendar: Calendar
  };

  // Configuração do Menu Lateral
  menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: this.icons.dashboard },
    { path: '/admin/agenda', label: 'Agenda', icon: this.icons.calendar },
    { path: '/admin/clientes', label: 'Clientes', icon: this.icons.user }, // <--- NOVO ITEM
    { path: '/admin/atendimento', label: 'Atendimento', icon: this.icons.ticket },
    { path: '/admin/servicos', label: 'Serviços', icon: this.icons.settings },
    { path: '/totem', label: 'Modo Totem', icon: this.icons.monitor, external: true },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    const salvo = localStorage.getItem('usuario_sgf');
    if (!salvo) {
      this.router.navigate(['/login']);
    } else {
      this.usuario = JSON.parse(salvo);
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.removeItem('usuario_sgf');
    this.router.navigate(['/login']);
  }
}