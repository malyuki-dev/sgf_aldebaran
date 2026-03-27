import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuicheService {
  private guichesSubject = new BehaviorSubject<any[]>([
    { numero: 1, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 2, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 3, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 4, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 5, status: 'vazio', statusLabel: 'Vazio' },
    { numero: 6, status: 'vazio', statusLabel: 'Vazio' }
  ]);

  guiches$ = this.guichesSubject.asObservable();

  constructor() { }

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
        tempoOcupado: 0
      });
    }
  }

  encerrarAtendimento(numeroGuiche: number) {
    const guiche = this.getGuiches().find(g => g.numero === numeroGuiche);
    if (guiche && guiche.status === 'ocupado') {
      this.atualizarGuiche(numeroGuiche, {
        status: 'disponivel',
        statusLabel: 'Disponível',
        ticket: null,
        placa: null,
        progresso: 0,
        tempoOcupado: 0
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
}
