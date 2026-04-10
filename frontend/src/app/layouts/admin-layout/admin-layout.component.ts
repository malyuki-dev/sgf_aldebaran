import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Ticket, Settings, Monitor, LogOut, Menu, Users, Calendar, Truck, User, Bell, Search, ChevronDown, ChevronUp, FileText, Moon, Power, History, Clock, UserPlus, CheckCircle, X, Building2, ChevronRight, AlignLeft } from 'lucide-angular';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { NavigationEnd, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { FilialService, Filial } from '../../services/filial.service';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = true;
  usuario: any = null;
  userInitials: string = 'CA';
  userName: string = 'Carlos Admin';
  userRole: string = 'Administrador';
  
  filiais: Filial[] = [];
  selectedFilialId: number | null = null;
  loadingFiliais = false;

  showProfileMenu = false;
  showSupervisorProfileMenu = false;
  showNotifications = false;
  showLogoutModal = false;
  isDarkMode = false;
  activePageTitle = 'Dashboard';
  activePageGroup = 'Home';

  notificacoes: any[] = [];
  hasUnreadNotifications = false;

  // Contador para badges do Supervisor
  atendimentoCount = 0; 
  agendamentoCount = 0;

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
    private notificationService: NotificationService,
    private filialService: FilialService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit() {
    console.log('[HARD-DEBUG] AdminLayoutComponent Inicializado!');
    
    const salvo = localStorage.getItem('usuario_sgf');
    if (!salvo) {
      console.warn('[HARD-DEBUG] Nenhum usuário encontrado no localStorage. Redirecionando para login.');
      this.router.navigate(['/login']);
      return;
    }

    try {
      this.usuario = JSON.parse(salvo);
      console.log('[HARD-DEBUG] Usuário logado:', this.usuario.nome, 'ID Filial:', this.usuario.filial_id);
      
      this.notificationService.fetchNotifications(this.usuario.id);
      this.notificationService.notifications$.subscribe((notifs: any[]) => {
        this.notificacoes = notifs;
        this.hasUnreadNotifications = notifs.some(n => !n.lida);
      });

      if (this.usuario.iniciais) {
        this.userInitials = this.usuario.iniciais;
      } else {
        const fallbackName = this.usuario.nome || 'Administrador';
        this.userInitials = fallbackName.length >= 2 ? fallbackName.substring(0, 2).toUpperCase() : 'AD';
      }

      // Determinar Perfil e Role
      const p = (this.usuario.perfil || '').toUpperCase();
      const t = (this.usuario.tipo || '').toUpperCase();
      
      if (p === 'SUPERVISOR' || t === 'SUPERVISOR') {
        this.menuGroups = this.supervisorMenuGroups;
        this.userRole = 'Supervisor';
      } else if (p === 'ADMIN' || t === 'ADMIN') {
        this.menuGroups = this.adminMenuGroups;
        this.userRole = 'Administrador';
      } else {
        this.menuGroups = this.adminMenuGroups;
        this.userRole = this.usuario.perfil || 'Usuário';
      }

      console.log('[HARD-DEBUG] Role determinada:', this.userRole);

      // Sincronização de Filiais (Global)
      this.filialService.selectedFilial$.subscribe((id: number | null) => {
        this.selectedFilialId = id;
        this.carregarContadores();
      });

      this.isDarkMode = localStorage.getItem('theme_sgf') === 'dark';
      this.applyTheme();

      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.updateActivePageTitle();
      });

      this.updateActivePageTitle();
      this.carregarFiliais();

    } catch (e) {
      console.error('[HARD-DEBUG] Erro ao processar dados do usuário:', e);
      this.router.navigate(['/login']);
    }
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

  carregarFiliais() {
    this.loadingFiliais = true;
    this.filialService.getFiliais().subscribe({
      next: (data: Filial[]) => {
        this.filiais = data;
        this.loadingFiliais = false;
        
        const currentId = this.filialService.getSelectedFilialId();
        
        if (this.userRole === 'SUPERVISOR' && !currentId && this.usuario?.filial_id) {
          this.filialService.setSelectedFilial(this.usuario.filial_id);
          this.selectedFilialId = this.usuario.filial_id;
        } else {
          this.selectedFilialId = currentId;
        }
      },
      error: (err) => {
        this.loadingFiliais = false;
        this.selectedFilialId = this.filialService.getSelectedFilialId();
      }
    });
  }

  onFilialChange() {
    console.log('Filial alterada para ID:', this.selectedFilialId);
    this.filialService.setSelectedFilial(this.selectedFilialId);
    this.carregarContadores();
    
    // Opcional: Feedback visual ou recarregar dados da página atual se necessário
    if (this.selectedFilialId) {
      const filial = this.filiais.find(f => f.id === this.selectedFilialId);
      console.log('Nome da filial selecionada:', filial?.nome);
    }
  }

  carregarContadores() {
    // Apenas para Supervisor
    if (this.userRole !== 'Supervisor') return;

    this.dashboardService.getSupervisorOverview(this.selectedFilialId || undefined).subscribe({
      next: (res) => {
        this.atendimentoCount = res.atendimentos.length;
        this.agendamentoCount = res.agendamentos.length;
      },
      error: (err) => console.error('Erro ao carregar contadores:', err)
    });
  }

  logout() {
    this.showLogoutModal = false;
    localStorage.removeItem('usuario_sgf');
    this.router.navigate(['/login']);
  }
}