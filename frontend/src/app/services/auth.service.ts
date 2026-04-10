import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthenticatedUser {
  id?: string | number;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  tipo?: string | null;
  perfil?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Ajuste a porta se o seu backend não for 3000
  private readonly baseUrl = 'http://localhost:3000';
  private apiUrl = `${this.baseUrl}/auth`;

  constructor(private http: HttpClient) { }

  // 1. LOGIN (Já estava pronto)
  login(credenciais: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciais);
  }

  // 2. CADASTRO (Novo) - Apontando para Clientes
  signup(dados: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clientes/autocadastro`, dados);
  }

  // 3. RECUPERAR SENHA (Novo)
  recover(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recover`, { email });
  }

  // 4. REDEFINIR SENHA (Novo)
  resetPassword(token: string, novaSenha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, novaSenha });
  }

  // 5. BUSCAR TOTAL DE FILIAIS ATIVAS (Novo)
  getPublicBranchCount(): Observable<any> {
    return this.http.get(`${this.baseUrl}/filiais/public/count`);
  }

  // Úteis
  getCurrentUser(): AuthenticatedUser | null {
    const rawUser =
      localStorage.getItem('usuario_sgf') ??
      localStorage.getItem('client_user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: AuthenticatedUser): void {
    localStorage.setItem('usuario_sgf', JSON.stringify(user));
    localStorage.setItem('usuario_nome', user.nome || 'Cliente');

    if (user.id !== undefined && user.id !== null) {
      localStorage.setItem('usuario_id', String(user.id));
    }

    if (localStorage.getItem('client_user')) {
      localStorage.setItem('client_user', JSON.stringify(user));
    }
  }

  getToken() { return localStorage.getItem('token'); }
  isLoggedIn() { return !!localStorage.getItem('token'); }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_sgf');
    localStorage.removeItem('guicheAtual');
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
  }

  logout() {
    this.clearSession();
  }
}
