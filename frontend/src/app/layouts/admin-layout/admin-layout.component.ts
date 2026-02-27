import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, Monitor, LogOut, Menu, Users, Calendar, Truck, User } from 'lucide-angular';

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

  readonly icons: Record<string, any> = {
    dashboard: LayoutDashboard,
    ticket: Ticket,
    settings: Settings,
    monitor: Monitor,
    logout: LogOut,
    menu: Menu,
    user: User,
    users: Users,
    calendar: Calendar,
    truck: Truck
  };

  // Configuração do Menu Lateral (Ordem da Imagem)
  menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/usuarios', label: 'Usuários', icon: 'users' },
    { path: '/admin/clientes', label: 'Clientes', icon: 'user' },
    { path: '/admin/motoristas', label: 'Motoristas', icon: 'users' },
    { path: '/admin/caminhoes', label: 'Caminhões', icon: 'truck' },
    { path: '/admin/servicos', label: 'Serviços', icon: 'settings' },
    { path: '/admin/agendamentos', label: 'Agendamentos', icon: 'calendar' },
    // A tela de configurações ainda pode não existir, mandamos para dashboard temporariamente
    { path: '/admin/dashboard', label: 'Configurações', icon: 'settings' },
    { path: '/totem', label: 'Modo Totem', icon: 'monitor', external: true },
  ];

  constructor(private router: Router) { }

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