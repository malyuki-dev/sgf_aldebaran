import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, Monitor, LogOut, Menu, Users, Calendar, Truck, User, Bell, Search, ChevronDown, ChevronUp, FileText, Moon, Power, History, Clock, UserPlus, CheckCircle, X, Building2, ChevronRight, AlignLeft } from 'lucide-angular';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { NavigationEnd, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

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
  showSupervisorProfileMenu = false;
  showNotifications = false;
  showLogoutModal = false;
  isDarkMode = false;
  activePageTitle = 'Dashboard';
  activePageGroup = 'Home';

  notificacoes: any[] = [];
  hasUnreadNotifications = false;

  get notificacoesFiltradas() {
    return this.notificacoes.filter(n => !n.lida);
  }

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
    power: Power,
    history: History,
    clock: Clock,
    userPlus: UserPlus,
    checkCircle: CheckCircle,
    x: X,
    building: Building2,
    chevronRight: ChevronRight,
    alignLeft: AlignLeft
  };

  menuGroups: any[] = [];

  adminMenuGroups = [
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
        { path: '/admin/servicos', label: 'Estrutura & Filiais', icon: 'building' },
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

  supervisorMenuGroups = [
    {
      title: 'SISTEMA',
      items: [
        { path: '/supervisor/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/supervisor/relatorios', label: 'Ver Relatórios', icon: 'fileText' },
        { path: '/supervisor/gerenciar-fila', label: 'Gerenciar Fila', icon: 'monitor' },
        { path: '/supervisor/configuracoes', label: 'Configurações', icon: 'settings' }
      ]
    }
  ];

  constructor(
    private router: Router,
    private titleService: Title,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    const salvo = localStorage.getItem('usuario_sgf');
    if (!salvo) {
      this.router.navigate(['/login']);
    } else {
      this.usuario = JSON.parse(salvo);
      
      // Carregar notificações reais
      this.notificationService.fetchNotifications(this.usuario.id);
      this.notificationService.notifications$.subscribe(notifs => {
        this.notificacoes = notifs;
        this.hasUnreadNotifications = notifs.some(n => !n.lida);
      });

      if (this.usuario && this.usuario.iniciais) {
        this.userInitials = this.usuario.iniciais;
      } else {
        const fallbackName = this.usuario?.nome || 'Administrador';
        this.userInitials = fallbackName.length >= 2 ? fallbackName.substring(0, 2).toUpperCase() : 'AD';
      }

      if (this.usuario.perfil === 'SUPERVISOR' || this.usuario.tipo === 'SUPERVISOR') {
        this.menuGroups = this.supervisorMenuGroups;
      } else {
        this.menuGroups = this.adminMenuGroups;
      }
    }

    // Check dark mode preference
    this.isDarkMode = localStorage.getItem('theme_sgf') === 'dark';
    this.applyTheme();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActivePageTitle();
    });

    // Initial update
    this.updateActivePageTitle();
  }

  private updateActivePageTitle() {
    const url = this.router.url;
    
    // Default
    this.activePageGroup = '';

    if (url.includes('/admin/dashboard')) {
      this.activePageTitle = 'Dashboard';
      this.activePageGroup = ''; // Home > Dashboard removed
    } else if (url.includes('/admin/servicos')) {
      this.activePageTitle = 'Estrutura & Filiais';
      this.activePageGroup = ''; // Removed Gestão >
    } else if (url.includes('/admin/cadastros')) {
      if (url.includes('/usuarios')) {
        this.activePageTitle = 'Operadores';
        this.activePageGroup = '';
      } else if (url.includes('/clientes')) {
        this.activePageTitle = 'Clientes';
        this.activePageGroup = '';
      } else if (url.includes('/motoristas')) {
        this.activePageTitle = 'Motoristas';
        this.activePageGroup = '';
      } else if (url.includes('/caminhoes')) {
        this.activePageTitle = 'Caminhões';
        this.activePageGroup = '';
      } else {
        this.activePageTitle = 'Cadastros Gerais';
        this.activePageGroup = ''; 
      }
    } else if (url.includes('/admin/logs')) {
      this.activePageTitle = 'Logs e Auditoria';
      this.activePageGroup = ''; // Just "Logs e Auditoria"
    } else if (url.includes('/admin/configuracoes')) {
      this.activePageTitle = 'Configurações';
      this.activePageGroup = ''; // Just "Configurações"
    } else if (url.includes('/admin/meu-perfil')) {
      this.activePageTitle = 'Meu Perfil';
      this.activePageGroup = 'Conta';
    } else if (url.includes('/admin/atendimento')) {
      this.activePageTitle = 'Atendimento';
      this.activePageGroup = 'Operacional';
    }
    
    this.titleService.setTitle(`Aldebaran - ${this.activePageTitle}`);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    this.showSupervisorProfileMenu = false;
    this.showNotifications = false;
  }

  toggleSupervisorProfileMenu(event: Event) {
    event.stopPropagation();
    this.showSupervisorProfileMenu = !this.showSupervisorProfileMenu;
    this.showProfileMenu = false;
    this.showNotifications = false;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false;
    this.showSupervisorProfileMenu = false;
  }

  marcarTodasLidas() {
    this.notificationService.markAllAsRead(this.usuario?.id);
  }

  onNotificationClick(n: any) {
    if (!n.lida) {
      this.notificationService.markAsRead(n.id);
    }
    this.showNotifications = false;
    if (n.rota) {
      this.router.navigate([n.rota]);
    }
  }

  @HostListener('document:click')
  closeMenu() {
    this.showProfileMenu = false;
    this.showSupervisorProfileMenu = false;
    this.showNotifications = false;
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
    this.showSupervisorProfileMenu = false;
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