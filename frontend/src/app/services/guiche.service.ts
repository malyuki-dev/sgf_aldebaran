import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GuicheOperador {
  id: number;
  numero: string;
  ocupado: boolean;
  status: 'DISPONIVEL' | 'OCUPADO';
  operador: string | null;
  logado: string | null;
  codigoAtendimento: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class GuicheService {
  private readonly apiUrl = 'http://localhost:3000/guiches';

  constructor(private http: HttpClient) {}

  listOperatorGuiches(): Observable<GuicheOperador[]> {
    return this.http.get<GuicheOperador[]>(`${this.apiUrl}/operador`, {
      headers: this.authHeaders(),
    });
  }

  getCurrentOperatorGuiche(): Observable<GuicheOperador | null> {
    return this.http.get<GuicheOperador | null>(`${this.apiUrl}/operador/atual`, {
      headers: this.authHeaders(),
    });
  }

  selectGuiche(guicheId: number): Observable<GuicheOperador> {
    return this.http.post<GuicheOperador>(
      `${this.apiUrl}/operador/selecionar`,
      { guicheId },
      { headers: this.authHeaders() },
    );
  }

  releaseCurrentGuiche(): Observable<{ message: string; guiche: { id: number; numero: number } | null }> {
    return this.http.post<{ message: string; guiche: { id: number; numero: number } | null }>(
      `${this.apiUrl}/operador/liberar`,
      {},
      { headers: this.authHeaders() },
    );
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
