import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SupervisorOverview {
  kpis: {
    totalHoje: string;
    tempoMedio: string;
    filaAtual: string;
    alertaSla: boolean;
  };
  agendamentos: any[];
  atendimentos: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getSupervisorOverview(filialId?: number): Observable<SupervisorOverview> {
    let params = new HttpParams();
    if (filialId) {
      params = params.set('filialId', filialId.toString());
    }
    return this.http.get<SupervisorOverview>(`${this.apiUrl}/supervisor`, {
      headers: this.getHeaders(),
      params: params
    });
  }
}
