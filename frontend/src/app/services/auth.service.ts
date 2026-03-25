import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  getToken() { return localStorage.getItem('token'); }
  isLoggedIn() { return !!localStorage.getItem('token'); }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_sgf');
    localStorage.removeItem('guicheAtual');
  }

  logout() {
    this.clearSession();
  }
}