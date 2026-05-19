import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, LogOut, Menu, User, Bell, ChevronDown, ChevronUp, Moon, Power, Home, CalendarPlus, History, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-angular';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

interface ClientMenuItem {
  path: string;
  label: string;
  icon: string;
  class?: string;
  divided?: boolean;
}

interface ClientMenuGroup {
  title: string;
  items: ClientMenuItem[];
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './client-layout.html',
  styleUrls: ['./client-layout.scss']
})
export class ClientLayoutComponent implements OnInit {
  sidebarOpen = true;
  usuario: any = null;
  userInitials: string = 'CL';
  userName: string = 'Cliente';

  showProfileMenu = false;
  showNotifications = false;
  showLogoutModal = false;
  isDarkMode = false;
  activePageTitle = 'Início';
  activePageGroup = 'Portal';

  notificacoes: any[] = [];
  hasUnreadNotifications = false;

  get notificacoesFiltradas() {
    return this.notificacoes;
  }

  get unreadNotificationsCount() {
    return this.notificacoes.filter(n => !n.lida).length;
  }

  readonly icons: Record<string, any> = {
    home: Home,
    calendarPlus: CalendarPlus,
    history: History,
    settings: Settings,
    logout: LogOut,
    menu: Menu,
    user: User,
    bell: Bell,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    moon: Moon,
    power: Power,
    chevronRight: ChevronRight,
    ticket: Ticket,
    checkCircle: CheckCircle,
    xCircle: XCircle,
    clock: Clock
  };

  menuGroups: ClientMenuGroup[] = [
    {
      title: '',
      items: [
        { path: '/client/home', label: 'Início', icon: 'home' },
        { path: '/client/agendar', label: 'Agendar', icon: 'calendarPlus' },
        { path: '/client/meus-agendamentos', label: 'Meus Agendamentos', icon: 'history' },
        { path: '/client/perfil', label: 'Perfil', icon: 'user' },
        { path: '/client/configuracoes', label: 'Configurações', icon: 'settings' }
      ]
    }
  ];

  getMenuLabel(path: string, label: string): string {
    return path === '/client/configuracoes' ? 'Configurações' : label;
  }

  shouldMatchExactly(path: string): boolean {
    return path !== '/client/perfil';
  }

  constructor(
    private router: Router,
    private titleService: Title,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.carregarUsuarioCliente();

    if (this.usuario && this.usuario.id) {
      this.notificationService.fetchNotifications(this.usuario.id);
      this.notificationService.notifications$.subscribe(notifs => {
        this.notificacoes = notifs;
        this.hasUnreadNotifications = this.unreadNotificationsCount > 0;
      });
    }

    this.isDarkMode = localStorage.getItem('theme_sgf') === 'dark';
    this.applyTheme();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActivePageTitle();
    });

    this.updateActivePageTitle();
  }

  private carregarUsuarioCliente() {
    const usuarioJson = localStorage.getItem('client_user') || localStorage.getItem('usuario_sgf');
    const nomeSalvo = localStorage.getItem('usuario_nome');
    const idSalvo = localStorage.getItem('usuario_id');

    if (usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson);
        const nome = usuario.nome || usuario.name || nomeSalvo || 'Cliente';

        this.usuario = usuario;
        this.userName = nome;
        this.userInitials = nome.substring(0, 2).toUpperCase();

        if (usuario.id) {
          localStorage.setItem('usuario_id', String(usuario.id));
        }
        localStorage.setItem('usuario_nome', nome);
        localStorage.setItem('usuario_sgf', JSON.stringify(usuario));
        return;
      } catch (error) {
        console.warn('Erro ao carregar dados do cliente:', error);
      }
    }

    if (nomeSalvo || idSalvo) {
      const nome = nomeSalvo || 'Cliente';
      this.userName = nome;
      this.userInitials = nome.substring(0, 2).toUpperCase();
      this.usuario = { nome, id: idSalvo };
    }
  }

  private updateActivePageTitle() {
    const url = this.router.url;
    this.activePageGroup = 'Portal';

    if (url.includes('/client/home')) {
      this.activePageTitle = 'Início';
    } else if (url.includes('/client/agendar')) {
      this.activePageTitle = 'Agendar Serviço';
    } else if (url.includes('/client/meus-agendamentos')) {
      this.activePageTitle = 'Meus Agendamentos';
    } else if (url.includes('/client/perfil/editar')) {
      this.activePageTitle = 'Editar Dados';
    } else if (url.includes('/client/configuracoes/termos-de-uso')) {
      this.activePageTitle = 'Termos de Uso';
    } else if (url.includes('/client/configuracoes/politica-de-privacidade')) {
      this.activePageTitle = 'Política de Privacidade';
    } else if (url.includes('/client/configuracoes')) {
      this.activePageTitle = 'Configurações';
    } else if (url.includes('/client/suporte')) {
      this.activePageTitle = 'Ajuda e Suporte';
    } else if (url.includes('/client/perfil')) {
      this.activePageTitle = 'Meu Perfil';
    } else {
      this.activePageTitle = 'Portal do Cliente';
    }
    
    this.titleService.setTitle(`Aldebaran - ${this.activePageTitle}`);
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  toggleProfileMenu(event: Event) { event.stopPropagation(); this.showProfileMenu = !this.showProfileMenu; this.showNotifications = false; }
  toggleNotifications(event: Event) { event.stopPropagation(); this.showNotifications = !this.showNotifications; this.showProfileMenu = false; }
  marcarTodasLidas() {
    if (!this.hasUnreadNotifications) return;
    this.notificationService.markAllAsRead(this.usuario?.id);
  }
  
  onNotificationClick(n: any) {
    if (!n.lida) { this.notificationService.markAsRead(n.id); }
    this.showNotifications = false;
    if (n.rota) { this.router.navigate([n.rota]); }
  }

  getNotificationTime(criadoEm?: string): string {
    if (!criadoEm) return '';

    const created = new Date(criadoEm);
    const diffMs = Date.now() - created.getTime();
    if (Number.isNaN(diffMs)) return '';

    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d`;

    return created.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  @HostListener('document:click')
  closeMenu() { this.showProfileMenu = false; this.showNotifications = false; }

  toggleDarkMode(event: Event) {
    event.stopPropagation();
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme_sgf', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkMode) { document.body.classList.add('dark-theme'); } 
    else { document.body.classList.remove('dark-theme'); }
  }

  confirmLogout(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = false;
    this.showLogoutModal = true;
  }

  cancelLogout() { this.showLogoutModal = false; }

  logout() {
    this.showLogoutModal = false;
    localStorage.removeItem('usuario_sgf');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('client_user');
    localStorage.removeItem('client_token');
    this.router.navigate(['/login']);
  }
}
