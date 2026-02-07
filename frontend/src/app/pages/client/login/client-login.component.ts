import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, Lock } from 'lucide-angular';
// Importe o Service que conecta no Backend
import { ClientAuthService } from '../../../services/client-auth.service';

@Component({
  selector: 'app-client-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './client-login.component.html',
  styleUrls: ['./client-login.component.scss']
})
export class ClientLoginComponent {
  email: string = '';
  senha: string = '';
  carregando: boolean = false;
  readonly icons = { mail: Mail, lock: Lock };

  constructor(
    private router: Router,
    private authService: ClientAuthService, // Injeção do Service
    private cd: ChangeDetectorRef // Para atualizar a tela se precisar
  ) {}

  fazerLogin() {
    // Validação básica
    if (!this.email || !this.senha) {
      alert('Preencha e-mail e senha.');
      return;
    }

    this.carregando = true;

    // Chamada REAL ao Backend
    this.authService.login(this.email, this.senha).subscribe({
      next: (res: any) => {
        this.carregando = false;
        
        // Salva o token
        if (res.access_token) {
           localStorage.setItem('client_token', res.access_token);
           if(res.user) localStorage.setItem('client_user', JSON.stringify(res.user));
        }

        // Redireciona para a Home (conforme criamos no passo anterior)
        this.router.navigate(['/client/home']);
        
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro no Login:', err);
        this.carregando = false;
        alert(err.error?.message || 'Erro ao entrar. Verifique seus dados.');
        this.cd.detectChanges();
      }
    });
  }
}