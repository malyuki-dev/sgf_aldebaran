import { Routes } from '@angular/router';

import { roleGuard } from './guards/role.guard';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout';
import { TotemLayoutComponent } from './layouts/totem-layout/totem-layout.component';
import { AgendamentosComponent } from './pages/admin/agendamentos/agendamentos.component';
import { AtendimentoComponent } from './pages/admin/atendimento/atendimento.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { QuadroStatusComponent } from './pages/admin/quadro-status/quadro-status.component';
import { AgendamentoComponent } from './pages/client/agendamento/agendamento.component';
import { ClientAppointmentsComponent } from './pages/client/client-appointments/client-appointments.component';
import { ClientHomeComponent } from './pages/client/home/client-home.component';
import { ClientPerfilComponent } from './pages/client/perfil/perfil.component';
import { SuporteComponent } from './pages/client/suporte/suporte';
import { LoginComponent } from './pages/login/login.component';
import { EscolhaGuiches } from './pages/operador/escolha-guiches/escolha-guiches';
import { RecoverComponent } from './pages/recover/recover.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SignupComponent } from './pages/signup/signup.component';
import { SupervisorDashboardComponent } from './pages/supervisor/dashboard/supervisor-dashboard.component';
import { TotemCategoriaComponent } from './pages/totem/totem-categoria/totem-categoria.component';
import { TotemCheckinComponent } from './pages/totem/totem-checkin/totem-checkin.component';
import { TotemInicialComponent } from './pages/totem/totem-inicial/totem-inicial.component';
import { TotemSenhaComponent } from './pages/totem/totem-senha/totem-senha.component';
import { TotemTipoAtendimentoComponent } from './pages/totem/totem-tipo-atendimento/totem-tipo-atendimento.component';
import { PainelTvComponent } from './pages/tv/painel-tv.component';
import { TicketComponent } from './pages/mobile/ticket/ticket.component';
import { ComprovanteComponent } from './pages/mobile/comprovante/comprovante.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'mobile/ticket/:id', component: TicketComponent },
  { path: 'mobile/comprovante/:id', component: ComprovanteComponent },

  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ClientHomeComponent },
      { path: 'agendar', component: AgendamentoComponent },
      { path: 'meus-agendamentos', component: ClientAppointmentsComponent },
      { path: 'perfil', component: ClientPerfilComponent },
      {
        path: 'perfil/editar',
        loadComponent: () =>
          import('./pages/client/perfil-editar/perfil-editar.component').then(
            (m) => m.PerfilEditarComponent,
          ),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/client/placeholder/client-placeholder.component').then(
            (m) => m.ClientPlaceholderComponent,
          ),
        data: {
          title: 'Configuracoes',
          description:
            'Espaco reservado para preferencias do cliente, notificacoes e demais opcoes da conta.',
        },
      },
      { path: 'suporte', component: SuporteComponent },
    ],
  },

  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'meu-perfil',
        loadComponent: () =>
          import('./pages/admin/meu-perfil/meu-perfil').then((m) => m.MeuPerfil),
      },
      { path: 'atendimento', component: AtendimentoComponent },
      { path: 'agendamentos', component: AgendamentosComponent },
      { path: 'quadro-tarefas', component: QuadroStatusComponent },
      {
        path: 'servicos',
        loadComponent: () =>
          import(
            './pages/admin/estrutura-filiais/estrutura-filiais.component'
          ).then((m) => m.EstruturaFiliaisComponent),
        children: [
          { path: '', redirectTo: 'filiais', pathMatch: 'full' },
          {
            path: 'filiais',
            loadComponent: () =>
              import(
                './pages/admin/estrutura-filiais/tabs/filiais/filiais.component'
              ).then((m) => m.FiliaisComponent),
          },
          {
            path: 'categorias',
            loadComponent: () =>
              import(
                './pages/admin/estrutura-filiais/tabs/categorias/categorias-fila.component'
              ).then((m) => m.CategoriasFilaComponent),
          },
          {
            path: 'guiches',
            loadComponent: () =>
              import(
                './pages/admin/estrutura-filiais/tabs/guiches/guiches.component'
              ).then((m) => m.GuichesComponent),
          },
          {
            path: 'regras',
            loadComponent: () =>
              import(
                './pages/admin/estrutura-filiais/tabs/regras/regras-fila.component'
              ).then((m) => m.RegrasFilaComponent),
          },
        ],
      },
      {
        path: 'cadastros',
        loadComponent: () =>
          import('./pages/admin/cadastros-gerais/cadastros-gerais').then(
            (m) => m.CadastrosGerais,
          ),
        children: [
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./pages/admin/usuarios/usuarios.component').then(
                (m) => m.UsuariosComponent,
              ),
          },
          {
            path: 'clientes',
            loadComponent: () =>
              import('./pages/admin/clientes/clientes.component').then(
                (m) => m.ClientesComponent,
              ),
          },
          {
            path: 'motoristas',
            loadComponent: () =>
              import('./pages/admin/motoristas/motoristas.component').then(
                (m) => m.MotoristasComponent,
              ),
          },
          {
            path: 'caminhoes',
            loadComponent: () =>
              import('./pages/admin/caminhoes/caminhoes.component').then(
                (m) => m.CaminhoesComponent,
              ),
          },
        ],
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/admin/configuracoes/configuracoes.component').then(
            (m) => m.ConfiguracoesComponent,
          ),
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./pages/admin/logs/logs').then((m) => m.Logs),
      },
    ],
  },

  {
    path: 'supervisor',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupervisorDashboardComponent },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./pages/supervisor/relatorios/relatorios.component').then(
            (m) => m.SupervisorRelatoriosComponent,
          ),
      },
      {
        path: 'gerenciar-fila',
        loadComponent: () =>
          import(
            './pages/supervisor/gerenciar-fila/gerenciar-fila.component'
          ).then((m) => m.SupervisorGerenciarFilaComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import(
            './pages/supervisor/configuracoes/configuracoes.component'
          ).then((m) => m.SupervisorConfiguracoesComponent),
      },
      {
        path: 'meu-perfil',
        loadComponent: () =>
          import('./pages/supervisor/perfil/perfil.component').then(
            (m) => m.SupervisorPerfilComponent,
          ),
      },
      {
        path: 'operadores/novo',
        loadComponent: () =>
          import('./pages/admin/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent,
          ),
      },
    ],
  },

  {
    path: 'totem',
    component: TotemLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicial', pathMatch: 'full' },
      {
        path: 'setup',
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./pages/totem/totem-setup/totem-setup.component').then(
            (m) => m.TotemSetupComponent,
          ),
      },
      {
        path: 'configtot',
        loadComponent: () =>
          import('./pages/totem/totem-login/totem-login.component').then(
            (m) => m.TotemLoginComponent,
          ),
      },
      { path: 'inicial', component: TotemInicialComponent },
      { path: 'categoria', component: TotemCategoriaComponent },
      { path: 'tipo-atendimento', component: TotemTipoAtendimentoComponent },
      { path: 'checkin', component: TotemCheckinComponent },
      { path: 'senha', component: TotemSenhaComponent },
    ],
  },

  { path: 'painel', component: PainelTvComponent },
  {
    path: 'operador/escolha-guiches',
    component: EscolhaGuiches,
    canActivate: [roleGuard],
  },
  {
    path: 'operador/painel',
    loadComponent: () =>
      import('./pages/operador/painel/painel.component').then(
        (m) => m.PainelOperadorComponent,
      ),
    canActivate: [roleGuard],
  },
];
