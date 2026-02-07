import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientAuthService {
  private apiUrl = 'http://localhost:3000/auth/client'; 

  constructor(private http: HttpClient) {}

  signup(dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, dados);
  }

  login(email: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, senha });
  }
}