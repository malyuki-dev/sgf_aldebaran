import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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

  constructor(private http: HttpClient) {
    this.iniciarTimer();
  }

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

  private guichesSubject = new BehaviorSubject<any[]>([
    { numero: 1, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 2, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 3, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 4, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 5, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 6, status: 'vazio', statusLabel: 'Vazio' }
  ]);

  guiches$ = this.guichesSubject.asObservable();

  private historicoTemposSegundos: number[] = [];
  private _tempoTolerancia: number = 15; // in minutos
  private timer: any;



  get tempoTolerancia(): number {
    return this._tempoTolerancia;
  }

  set tempoTolerancia(valor: number) {
    this._tempoTolerancia = valor;
  }

  private iniciarTimer() {
    this.timer = setInterval(() => {
      let needsUpdate = false;
      const guiches = this.guichesSubject.value.map(g => {
        if (g.status === 'ocupado' && g.startTime) {
          const now = new Date().getTime();
          const tempoDecorridoSegundos = Math.floor((now - g.startTime) / 1000);

          const minutos = Math.floor(tempoDecorridoSegundos / 60);
          const segundos = tempoDecorridoSegundos % 60;
          const tempoOcupadoFormatado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

          const toleranciaSegundos = this._tempoTolerancia * 60;
          const progressoBruto = (tempoDecorridoSegundos / toleranciaSegundos) * 100;
          const atrasado = progressoBruto >= 100;
          const progresso = Math.min(progressoBruto, 100);

          if (g.tempoOcupadoFormatado !== tempoOcupadoFormatado || g.progresso !== progresso || g.atrasado !== atrasado) {
            needsUpdate = true;
          }
          return {
            ...g,
            tempoOcupado: minutos, // Compatibilidade com outras telas que usavam minutos
            tempoOcupadoSegundos: tempoDecorridoSegundos,
            tempoOcupadoFormatado,
            progresso,
            atrasado
          };
        }
        return g;
      });
      if (needsUpdate) {
        this.guichesSubject.next(guiches);
      }
    }, 1000);
  }

  getGuiches(): any[] {
    return this.guichesSubject.value;
  }

  atualizarGuiche(numeroGuiche: number, novosDados: any) {
    const guiches = this.guichesSubject.value;
    const index = guiches.findIndex(g => g.numero === numeroGuiche);
    if (index !== -1) {
      guiches[index] = { ...guiches[index], ...novosDados };
      this.guichesSubject.next([...guiches]);
    }
  }

  atribuirOperador(numeroGuiche: number, operador: string) {
    this.atualizarGuiche(numeroGuiche, {
      status: 'disponivel',
      statusLabel: 'Disponível',
      operador: operador
    });
  }

  chamarProximo(numeroGuiche: number) {
    const guiche = this.getGuiches().find(g => g.numero === numeroGuiche);
    if (guiche && guiche.status === 'disponivel') {
      this.atualizarGuiche(numeroGuiche, {
        status: 'ocupado',
        statusLabel: 'Ocupado',
        ticket: 'RP' + Math.floor(Math.random() * 1000),
        placa: 'ABC-' + Math.floor(Math.random() * 9999),
        progresso: 0,
        tempoOcupado: 0,
        tempoOcupadoFormatado: '00:00',
        tempoOcupadoSegundos: 0,
        atrasado: false,
        startTime: new Date().getTime()
      });
    }
  }

  encerrarAtendimento(numeroGuiche: number) {
    const guiche = this.getGuiches().find(g => g.numero === numeroGuiche);
    if (guiche && guiche.status === 'ocupado') {
      if (guiche.tempoOcupadoSegundos) {
        this.historicoTemposSegundos.push(guiche.tempoOcupadoSegundos);
      }
      this.atualizarGuiche(numeroGuiche, {
        status: 'disponivel',
        statusLabel: 'Disponível',
        ticket: null,
        placa: null,
        progresso: 0,
        tempoOcupado: 0,
        tempoOcupadoFormatado: null,
        tempoOcupadoSegundos: 0,
        atrasado: false,
        startTime: null
      });
    }
  }

  liberarGuiche(numeroGuiche: number) {
    this.atualizarGuiche(numeroGuiche, {
      status: 'vazio',
      statusLabel: 'Vazio',
      operador: null,
      ticket: null,
      placa: null
    });
  }

  getGuichesAtivos(): number {
    return this.guichesSubject.value.filter(g => g.status !== 'vazio' && g.status !== 'manutencao').length;
  }

  get tempoMedioGlobalFormatado(): string {
    const ocupados = this.getGuiches().filter(g => g.status === 'ocupado' && g.tempoOcupadoSegundos !== undefined);

    let somaSegundos = this.historicoTemposSegundos.reduce((a, b) => a + b, 0);
    let qtd = this.historicoTemposSegundos.length;

    ocupados.forEach(g => {
      somaSegundos += g.tempoOcupadoSegundos;
      qtd++;
    });

    if (qtd === 0) return '0 min';

    const mediaSegundos = Math.floor(somaSegundos / qtd);
    const mediaMinutos = Math.floor(mediaSegundos / 60);
    const restoSegundos = mediaSegundos % 60;

    if (mediaMinutos === 0) {
      return `${restoSegundos} seg`;
    }
    return `${mediaMinutos}m ${restoSegundos}s`;
  }

  resetarHistoricoTempoMedio() {
    this.historicoTemposSegundos = [];
  }
}
