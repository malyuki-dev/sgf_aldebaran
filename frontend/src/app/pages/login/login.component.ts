import { Component, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importe o ChangeDetectorRef
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
    private router: Router,
    private cd: ChangeDetectorRef // <--- 2. Injete o detector aqui
  ) {}

  fazerLogin() {
    if (!this.credenciais.email || !this.credenciais.senha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    this.carregando = true;
    this.erroLogin = false;

    this.authService.login(this.credenciais).subscribe({
      next: (resposta: any) => {
        // Sucesso: Salva o token e redireciona
        localStorage.setItem('token', resposta.token);
        
        // Se tiver o nome do usuário, pode salvar também
        if (resposta.usuario) {
          localStorage.setItem('usuario_nome', resposta.usuario.nome);
        }

        // Redirecionamento rápido
        const tipoUsuario = resposta.usuario?.tipo; 
        switch (tipoUsuario) {
          case 'ADMIN': this.router.navigate(['/admin/dashboard']); break;
          case 'OPERADOR': this.router.navigate(['/operador/painel']); break;
          // Agora redirecionamos para a tela nova que criamos!
          case 'CLIENTE': this.router.navigate(['/client/home']); break; 
          default: this.router.navigate(['/client/home']);
        }
        
        this.carregando = false;
        this.cd.detectChanges();
      },
      error: (erro: any) => {
        // --- AQUI ESTÁ A CORREÇÃO DE VELOCIDADE ---
        
        this.carregando = false; // 1. Destrava o botão imediatamente
        this.erroLogin = true;   // 2. Ativa a mensagem vermelha na tela
        
        // 3. Mostra o Prompt que você pediu se for erro de senha (401)
        if (erro.status === 401) {
          alert('Senha incorreta! Verifique suas credenciais.');
        } else {
          alert('Erro ao conectar. Tente novamente.');
        }

        // 4. Força o Angular a atualizar a tela AGORA (sem delay)
        this.cd.detectChanges(); 
      }
    });
  }
}