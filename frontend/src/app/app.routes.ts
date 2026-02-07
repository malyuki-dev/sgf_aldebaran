import { Routes } from '@angular/router';

// Importação dos Componentes
import { ClientSignupComponent } from './pages/client/signup/client-signup.component';
import { ClientLoginComponent } from './pages/client/login/client-login.component';
import { ClientHomeComponent } from './pages/client/home/client-home.component';
import { ClientScheduleComponent } from './pages/client/schedule/client-schedule/client-schedule.component';

export const routes: Routes = [
  // Rota raiz: Redireciona para o Login
  { path: '', redirectTo: 'client/login', pathMatch: 'full' },
  
  // Rotas de Autenticação
  { path: 'client/signup', component: ClientSignupComponent },
  { path: 'client/login', component: ClientLoginComponent },
  
  // Rotas do Sistema (Logado)
  { path: 'client/home', component: ClientHomeComponent },
  { path: 'client/agendar', component: ClientScheduleComponent },
];