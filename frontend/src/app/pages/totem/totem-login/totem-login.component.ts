import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Lock, ArrowRight, X } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-totem-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="login-container">
      <div class="login-card animate-pop">
        <div class="login-header">
          <div class="icon-circle">
            <lucide-icon [img]="icons.lock" size="32" color="white"></lucide-icon>
          </div>
          <h2>Acesso Restrito</h2>
          <p>Identifique-se para configurar o Totem</p>
        </div>

        <form (ngSubmit)="login()" class="login-body">
          <div class="input-group">
            <label>Login Admin</label>
            <input type="text" [(ngModel)]="credentials.login" name="login" placeholder="Ex: admin" required>
          </div>

          <div class="input-group">
            <label>Senha</label>
            <input type="password" [(ngModel)]="credentials.password" name="password" placeholder="••••••" required>
          </div>

          <div *ngIf="error" class="error-msg">
            {{ error }}
          </div>

          <div class="login-footer">
            <button type="button" class="btn-cancel" (click)="voltar()">Cancelar</button>
            <button type="submit" class="btn-confirm" [disabled]="loading">
              {{ loading ? 'Autenticando...' : 'Entrar' }}
              <lucide-icon [img]="icons.arrow" size="18"></lucide-icon>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
    }
    .login-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .login-header {
      text-align: center;
      margin-bottom: 30px;
      .icon-circle {
        width: 64px;
        height: 64px;
        background: #0099CC;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
      }
      h2 { color: #1e293b; margin-bottom: 5px; }
      p { color: #64748b; font-size: 0.9rem; }
    }
    .input-group {
      margin-bottom: 15px;
      label { display: block; margin-bottom: 5px; color: #475569; font-size: 0.85rem; font-weight: 600; }
      input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        transition: all 0.2s;
        &:focus { border-color: #0099CC; outline: none; box-shadow: 0 0 0 3px rgba(0, 153, 204, 0.1); }
      }
    }
    .error-msg { color: #ef4444; font-size: 0.85rem; margin-top: 10px; text-align: center; }
    .login-footer {
      display: flex;
      gap: 10px;
      margin-top: 25px;
      button { flex: 1; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .btn-cancel { background: #f1f5f9; color: #475569; border: none; &:hover { background: #e2e8f0; } }
      .btn-confirm { background: #0099CC; color: white; border: none; &:hover { background: #0077A3; transform: translateY(-2px); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    }
    .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class TotemLoginComponent {
  credentials = { login: '', password: '' };
  loading = false;
  error = '';

  readonly icons = { lock: Lock, arrow: ArrowRight, x: X };

  constructor(
    private api: ApiService,
    private router: Router,
    private http: HttpClient
  ) {}

  login() {
    this.loading = true;
    this.error = '';

    // Chamamos o endpoint de login através do ApiService
    this.api.post<any>('/auth/login', {
      email: this.credentials.login,
      senha: this.credentials.password
    }).subscribe({
      next: (res) => {
        // O res contém { token, usuario, filialId }
        // Garantir que user logado defina o token e fique no sessionStorage/localStorage
        // Usar lógica padrão se necessário ou apenas setar o token e dados essenciais.
        if (res.usuario?.perfil === 'ADMIN' || res.usuario?.perfil === 'SUPERVISOR') {
          localStorage.setItem('token', res.access_token || res.token);
          localStorage.setItem('usuario_sgf', JSON.stringify(res.usuario));
          this.router.navigate(['/totem/setup']);
        } else {
          this.error = 'Apenas administradores ou supervisores podem configurar o Totem.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Credenciais inválidas ou erro de conexão.';
        this.loading = false;
      }
    });
  }


  voltar() {
    this.router.navigate(['/totem']);
  }
}
