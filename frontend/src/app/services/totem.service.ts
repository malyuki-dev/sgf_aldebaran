import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Ticket {
  id?: number;
  senha: string;
  tipo: string;
  categoria: string;
  dataHora: string;
}

@Injectable({
  providedIn: 'root'
})
export class TotemService {
  private apiUrl = 'http://localhost:3000/fila';

  constructor(private http: HttpClient) { }

  criarSenha(tipo: string, categoria: string): Observable<Ticket> {
    return this.http.post<any>(`${this.apiUrl}/totem/senha`, { tipo, categoria }).pipe(
      map(res => ({
        id: res.id,
        senha: res.numeroDisplay, // Backend manda numeroDisplay
        tipo: res.tipo,
        categoria: categoria,
        dataHora: new Date(res.dataCriacao).toLocaleString('pt-BR')
      }))
    );
  }

  validarCheckin(codigo: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/checkin/validar`, { codigo })
      .pipe(map(res => res.valido));
  }
}