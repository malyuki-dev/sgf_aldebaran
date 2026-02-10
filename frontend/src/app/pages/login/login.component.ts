import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Mail, Lock, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  credenciais = {
    email: '',
    senha: ''
  };

  erroLogin: boolean = false;
  carregando: boolean = false;
  
  readonly icons = {
    mail: Mail,
    lock: Lock,
    alert: AlertCircle
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  fazerLogin() {
    if (!this.credenciais.email || !this.credenciais.senha) return;

    this.carregando = true;
    this.erroLogin = false;

    this.authService.login(this.credenciais).subscribe({
      next: (resposta: any) => {
        this.carregando = false;
        localStorage.setItem('token', resposta.token);
        
        const tipoUsuario = resposta.usuario?.tipo; 
        switch (tipoUsuario) {
          case 'ADMIN': this.router.navigate(['/admin/dashboard']); break;
          case 'OPERADOR': this.router.navigate(['/operador/painel']); break;
          case 'CLIENTE': this.router.navigate(['/client/home']); break;
          default: this.router.navigate(['/client/home']);
        }
      },
      error: (erro: any) => {
        console.error('Erro:', erro);
        this.carregando = false;
        this.erroLogin = true;
      }
    });
  }
}