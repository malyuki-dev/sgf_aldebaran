import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, ChevronRight, Languages, LogOut, Mail, Phone, Settings, SquarePen, HelpCircle } from 'lucide-angular';
import { AuthService, AuthenticatedUser } from '../../../services/auth.service';

interface ClientProfile {
  nome: string;
  email: string;
  telefone: string;
  avatarUrl?: string | null;
}

interface ProfileActionItem {
  id: 'edit' | 'settings' | 'support' | 'logout';
  titulo: string;
  descricao: string;
  icon: typeof SquarePen;
  route?: string;
}

@Component({
  selector: 'app-client-perfil',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPerfilComponent implements OnInit {
  protected readonly icons = {
    email: Mail,
    phone: Phone,
    edit: SquarePen,
    settings: Settings,
    support: HelpCircle,
    logout: LogOut,
    chevron: ChevronRight,
    languages: Languages,
  };

  protected profile: ClientProfile = {
    nome: 'Cliente',
    email: 'E-mail não informado',
    telefone: 'Telefone não informado',
    avatarUrl: null,
  };

  protected readonly primaryActions: ProfileActionItem[] = [
    {
      id: 'edit',
      titulo: 'Editar Dados',
      descricao: 'Atualize nome, e-mail e telefone do cadastro.',
      icon: SquarePen,
      route: '/client/perfil/editar',
    },
    {
      id: 'settings',
      titulo: 'Configurações',
      descricao: 'Preferências da conta e futuras opções do portal.',
      icon: Settings,
      route: '/client/configuracoes',
    },
    {
      id: 'support',
      titulo: 'Ajuda e Suporte',
      descricao: 'Acesse os canais de atendimento e dúvidas frequentes.',
      icon: HelpCircle,
      route: '/client/suporte',
    },
  ];

  protected readonly logoutAction: ProfileActionItem = {
    id: 'logout',
    titulo: 'Sair da Conta',
    descricao: 'Encerre a sessão atual com segurança.',
    icon: LogOut,
  };

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  protected get initials(): string {
    const names = this.profile.nome.trim().split(/\s+/).filter(Boolean);
    if (names.length === 0) {
      return 'CL';
    }
    if (names.length === 1) {
      return names[0].slice(0, 2).toUpperCase();
    }
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }

  protected onActionClick(action: ProfileActionItem): void {
    if (action.id === 'logout') {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    if (action.route) {
      this.router.navigate([action.route]);
    }
  }

  private loadProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    this.profile = this.mapUserToProfile(currentUser);
  }

  private mapUserToProfile(user: AuthenticatedUser | null): ClientProfile {
    return {
      nome: user?.nome?.trim() || 'Cliente',
      email: user?.email?.trim() || 'E-mail não informado',
      telefone: user?.telefone?.trim() || 'Telefone não informado',
      avatarUrl: null,
    };
  }
}
