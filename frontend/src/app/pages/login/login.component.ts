import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necessário para [(ngModel)]
import { ApiService } from '../../services/api.service';
import { LucideAngularModule, Droplets, User, Lock } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form = { login: '', senha: '' };
  erro = '';
  loading = false;

  readonly icons = {
    droplets: Droplets,
    user: User,
    lock: Lock
  };

  constructor(private api: ApiService, private router: Router) {}

  handleLogin() {
    this.loading = true;
    this.erro = '';

    this.api.post<any>('/usuario/login', this.form).subscribe({
      next: (res) => {
        // Salva o token/usuário
        localStorage.setItem('usuario_sgf', JSON.stringify(res));
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.erro = 'Usuário ou senha incorretos.';
        this.loading = false;
      }
    });
  }
}