import { Routes } from '@angular/router';

// Layouts
import { TotemLayoutComponent } from './layouts/totem-layout/totem-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

// Páginas Públicas
import { LoginComponent } from './pages/login/login.component';
import { AgendamentoComponent } from './pages/agendamento/agendamento.component';

// Páginas do Totem
import { TotemInicialComponent } from './pages/totem/totem-inicial/totem-inicial.component';
import { TotemCategoriaComponent } from './pages/totem/totem-categoria/totem-categoria.component';
import { TotemSenhaComponent } from './pages/totem/totem-senha/totem-senha.component';


// Páginas do Admin
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ServicosComponent } from './pages/admin/servicos/servicos.component';
import { AgendamentosComponent } from './pages/admin/agendamentos/agendamentos.component';
import { AtendimentoComponent } from './pages/admin/atendimento/atendimento.component';
import { ClientesComponent } from './pages/admin/clientes/clientes.component'; // <--- IMPORTANTE
import { ClientesFormComponent } from './pages/admin/clientes-form/clientes-form.component';

// Outros (TV e Mobile)
import { TicketComponent } from './pages/mobile/ticket/ticket.component';
import { ComprovanteComponent } from './pages/mobile/comprovante/comprovante.component';
import { PainelTvComponent } from './pages/tv/painel-tv.component';

export const routes: Routes = [
  // Rota Padrão: Redireciona para o Totem se acessar a raiz
  { path: '', redirectTo: 'totem', pathMatch: 'full' },

  // --- FLUXO DO TOTEM (Público) ---
  {
    path: 'totem',
    component: TotemLayoutComponent,
    children: [
      { path: '', component: TotemInicialComponent },
      { path: 'categoria', component: TotemCategoriaComponent },
      { path: 'senha/:id/:numero', component: TotemSenhaComponent }
    ]
  },

  // --- ACESSOS PÚBLICOS (Login e Agendamento) ---
  { path: 'login', component: LoginComponent },
  { path: 'agendamento', component: AgendamentoComponent },
  { path: 'comprovante/:id', component: ComprovanteComponent },

  // --- ÁREA ADMINISTRATIVA (Protegida com Sidebar) ---
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'agenda', component: AgendamentosComponent },
      { path: 'clientes', component: ClientesComponent }, 
      { path: 'clientes/novo', component: ClientesFormComponent },
      { path: 'clientes/:id', component: ClientesFormComponent },
      { path: 'servicos', component: ServicosComponent },
      { path: 'atendimento', component: AtendimentoComponent }
    ]
  },

  // --- TELAS INDEPENDENTES (Sem layout) ---
  { path: 'tv', component: PainelTvComponent },
  { path: 'mobile/:id', component: TicketComponent }
];