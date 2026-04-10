import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, NavigationEnd } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, LogOut, Menu, User, Bell, ChevronDown, ChevronUp, Moon, Power, Home, CalendarPlus, History, HelpCircle, ChevronRight } from 'lucide-angular';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

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
    return this.notificacoes.filter(n => !n.lida);
  }

  readonly icons: Record<string, any> = {
    home: Home,
    calendarPlus: CalendarPlus,
    history: History,
    help: HelpCircle,
    settings: Settings,
    logout: LogOut,
    menu: Menu,
    user: User,
    bell: Bell,
    chevronDown: ChevronDown,
    chevronUp: ChevronUp,
    moon: Moon,
    power: Power,
    chevronRight: ChevronRight
  };

  menuGroups = [
    {
      title: '',
      items: [
        { path: '/client/home', label: 'Início', icon: 'home' },
        { path: '/client/agendar', label: 'Agendar', icon: 'calendarPlus' },
        { path: '/client/meus-agendamentos', label: 'Meus Agendamentos', icon: 'history' },
        { path: '/client/perfil', label: 'Perfil', icon: 'user' },
        { path: '/client/suporte', label: 'Ajuda e Suporte', icon: 'help', class: 'highlight-yellow', divided: true }
      ]
    }
  ];

  constructor(
    private router: Router,
    private titleService: Title,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const salvo = localStorage.getItem('usuario_nome');
    const idSalvo = localStorage.getItem('usuario_id');
    
    if (salvo) {
      this.userName = salvo;
      this.userInitials = salvo.substring(0, 2).toUpperCase();
      this.usuario = { nome: salvo, id: idSalvo };
    }

    if (this.usuario && this.usuario.id) {
      this.notificationService.fetchNotifications(this.usuario.id);
      this.notificationService.notifications$.subscribe(notifs => {
        this.notificacoes = notifs;
        this.hasUnreadNotifications = notifs.some(n => !n.lida);
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
  marcarTodasLidas() { this.notificationService.markAllAsRead(this.usuario?.id); }
  
  onNotificationClick(n: any) {
    if (!n.lida) { this.notificationService.markAsRead(n.id); }
    this.showNotifications = false;
    if (n.rota) { this.router.navigate([n.rota]); }
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
    this.router.navigate(['/login']);
  }
}
