import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, Monitor, LogOut, Menu, Users, Calendar, Truck, User, Bell, Search, ChevronDown, ChevronUp, FileText, Moon, Power } from 'lucide-angular';

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
  userInitials: string = 'CA';
  userName: string = 'Carlos Admin';

  showProfileMenu = false;
  showLogoutModal = false;
  isDarkMode = false;

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
    truck: Truck,
    bell: Bell,
    search: Search,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    fileText: FileText,
    moon: Moon,
    power: Power
  };

  menuGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' }
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        { path: '/admin/cadastros', label: 'Cadastros Gerais', icon: 'users' },
        { path: '/admin/servicos', label: 'Estrutura & Filas', icon: 'calendar' },
        { path: '/admin/logs', label: 'Logs e Auditoria', icon: 'fileText' }
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        { path: '/admin/configuracoes', label: 'Configurações', icon: 'settings' },
        { path: '/totem', label: 'Modo Totem', icon: 'monitor', external: true }
      ]
    }
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    const salvo = localStorage.getItem('usuario_sgf');
    if (!salvo) {
      this.router.navigate(['/login']);
    } else {
      this.usuario = JSON.parse(salvo);
      if (this.usuario && this.usuario.iniciais) {
        this.userInitials = this.usuario.iniciais;
      } else {
        const fallbackName = this.usuario?.nome || 'Administrador';
        this.userInitials = fallbackName.length >= 2 ? fallbackName.substring(0, 2).toUpperCase() : 'AD';
      }
    }

    // Check dark mode preference
    this.isDarkMode = localStorage.getItem('theme_sgf') === 'dark';
    this.applyTheme();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click')
  closeMenu() {
    this.showProfileMenu = false;
  }

  toggleDarkMode(event: Event) {
    event.stopPropagation();
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme_sgf', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  confirmLogout(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = false;
    this.showLogoutModal = true;
  }

  cancelLogout() {
    this.showLogoutModal = false;
  }

  logout() {
    this.showLogoutModal = false;
    localStorage.removeItem('usuario_sgf');
    this.router.navigate(['/login']);
  }
}