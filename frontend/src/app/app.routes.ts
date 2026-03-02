import { Routes } from '@angular/router';

// --- COMPONENTES PÚBLICOS (Gerais) ---
import { LoginComponent } from './pages/login/login.component';
import { RecoverComponent } from './pages/recover/recover.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

// Layouts
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { TotemLayoutComponent } from './layouts/totem-layout/totem-layout.component';

// Cliente (Área Logada)
import { ClientHomeComponent } from './pages/client/home/client-home.component';
import { AgendamentoComponent } from './pages/client/agendamento/agendamento.component';
import { ClientAppointmentsComponent } from './pages/client/client-appointments/client-appointments.component';
// Nota: Removi o Login/Signup antigos da pasta client para não confundir

// Admin e Supervisor
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ServicosComponent } from './pages/admin/servicos/servicos.component';
import { AgendamentosComponent } from './pages/admin/agendamentos/agendamentos.component';
import { AtendimentoComponent } from './pages/admin/atendimento/atendimento.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component';
import { SupervisorDashboardComponent } from './pages/supervisor/dashboard/supervisor-dashboard.component';

// Totem
import { TotemInicialComponent } from './pages/totem/totem-inicial/totem-inicial.component';
import { TotemCategoriaComponent } from './pages/totem/totem-categoria/totem-categoria.component';
import { TotemTipoAtendimentoComponent } from './pages/totem/totem-tipo-atendimento/totem-tipo-atendimento.component';
import { TotemSenhaComponent } from './pages/totem/totem-senha/totem-senha.component';
import { TotemCheckinComponent } from './pages/totem/totem-checkin/totem-checkin.component';

// TV
import { PainelTvComponent } from './pages/tv/painel-tv.component';

// Operador
import { EscolhaGuiches } from './pages/operador/escolha-guiches/escolha-guiches';

export const routes: Routes = [
  // 1. Rota Raiz -> Login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 2. ROTAS PÚBLICAS (Acesso sem estar logado)
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // 3. ÁREA DO CLIENTE (Protegida futuramente)
  { path: 'client/home', component: ClientHomeComponent },
  { path: 'client/agendar', component: AgendamentoComponent },
  { path: 'client/meus-agendamentos', component: ClientAppointmentsComponent },

  // 4. ÁREA DO ADMIN
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'meu-perfil', loadComponent: () => import('./pages/admin/meu-perfil/meu-perfil').then(m => m.MeuPerfil) },
      { path: 'atendimento', component: AtendimentoComponent },
      { path: 'agendamentos', component: AgendamentosComponent },
      { path: 'servicos', component: ServicosComponent },
      {
        path: 'cadastros',
        loadComponent: () => import('./pages/admin/cadastros-gerais/cadastros-gerais').then(m => m.CadastrosGerais),
        children: [
          { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
          { path: 'usuarios', loadComponent: () => import('./pages/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
          { path: 'clientes', loadComponent: () => import('./pages/admin/clientes/clientes.component').then(m => m.ClientesComponent) },
          { path: 'motoristas', loadComponent: () => import('./pages/admin/motoristas/motoristas.component').then(m => m.MotoristasComponent) },
          { path: 'caminhoes', loadComponent: () => import('./pages/admin/caminhoes/caminhoes.component').then(m => m.CaminhoesComponent) },
        ]
      },
      { path: 'configuracoes', loadComponent: () => import('./pages/admin/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent) },
      { path: 'logs', loadComponent: () => import('./pages/admin/logs/logs').then(m => m.Logs) },
    ]
  },

  // 4.5. ÁREA DO SUPERVISOR
  {
    path: 'supervisor',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupervisorDashboardComponent },
      // O Supervisor precisa interagir com a tela administrativa de cadastro de Funcionários (Operador)
      { path: 'operadores/novo', loadComponent: () => import('./pages/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) }
    ]
  },

  // 5. ÁREA DO TOTEM
  {
    path: 'totem',
    component: TotemLayoutComponent,
    children: [
      { path: '', component: TotemInicialComponent },
      { path: 'categoria', component: TotemCategoriaComponent },
      { path: 'tipo-atendimento', component: TotemTipoAtendimentoComponent },
      { path: 'checkin', component: TotemCheckinComponent },
      { path: 'senha', component: TotemSenhaComponent },
    ]
  },

  // 6. PAINEL TV
  { path: 'painel', component: PainelTvComponent },

  // 7. ÁREA DO OPERADOR
  { path: 'operador/escolha-guiches', component: EscolhaGuiches },
  { path: 'operador/painel', loadComponent: () => import('./pages/operador/painel/painel.component').then(m => m.PainelOperadorComponent) },
];