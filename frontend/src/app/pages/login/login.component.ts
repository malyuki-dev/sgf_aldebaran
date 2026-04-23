import { Component, ChangeDetectorRef, OnInit } from '@angular/core'; // <--- 1. Importe o ChangeDetectorRef e OnInit
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
export class LoginComponent implements OnInit {

  credenciais = {
    email: '',
    senha: ''
  };

  erroLogin: boolean = false;
  carregando: boolean = false;
  quantidadeFiliais: number = 0;

  readonly icons = {
    mail: Mail,
    lock: Lock,
    alert: AlertCircle
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef // <--- 2. Injete o detector aqui
  ) { }

  ngOnInit() {
    this.carregarContagemFiliais();
  }

  carregarContagemFiliais() {
    this.authService.getPublicBranchCount().subscribe({
      next: (res: any) => {
        this.quantidadeFiliais = res.count;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar contagem de filiais:', err);
        this.quantidadeFiliais = 3; // Valor padrão em caso de erro
      }
    });
  }

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
          localStorage.setItem('usuario_sgf', JSON.stringify(resposta.usuario));
        }

        // Redirecionamento rápido por papéis (RBAC)
        console.log('--- DEBUG LOGIN RESPONSE ---', resposta);
        const tipoUsuario = resposta.usuario?.tipo;
        console.log('Tipo de usuário interpretado:', tipoUsuario);
        switch (tipoUsuario) {
          case 'ADMIN':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'SUPERVISOR':
            this.router.navigate(['/supervisor/dashboard']);
            break;
          case 'OPERADOR':
            this.router.navigate(['/operador/painel']);
            this.router.navigate(['/operador/escolha-guiches']);
            break;
          case 'CLIENTE':
            this.router.navigate(['/client/home']);
            break;
          default:
            this.router.navigate(['/client/home']);
        }

        this.carregando = false;
        this.cd.detectChanges();
      },
      error: (erro: any) => {
        this.carregando = false;
        this.erroLogin = true;

        if (erro.status === 401) {
          alert('Senha incorreta! Verifique suas credenciais.');
        } else {
          alert('Erro ao conectar. Tente novamente.');
        }

        this.cd.detectChanges();
      }
    });
  }
}