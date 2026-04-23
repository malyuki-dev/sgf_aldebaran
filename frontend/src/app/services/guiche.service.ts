import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GuicheOperador {
  id: number;
  numero: string;
  ocupado: boolean;
  status: 'DISPONIVEL' | 'OCUPADO';
  operador: string | null;
  logado: string | null;
  codigoAtendimento: string | null;
  situacaoAtendimento?: 'CHAMANDO' | 'ATENDENDO' | null;
}

@Injectable({
  providedIn: 'root',
})
export class GuicheService {
  private readonly apiUrl = `${environment.apiUrl}/guiches`;
  private readonly dashboardApiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {
    this.refreshGuiches();
    this.iniciarTimer();
  }

  listOperatorGuiches(filialId?: number): Observable<GuicheOperador[]> {
    const params = filialId ? `?filialId=${filialId}` : '';
    return this.http
      .get<any[]>(`${this.apiUrl}/operador${params}`, {
        headers: this.authHeaders(),
      })
      .pipe(map((lista) => lista.map((item) => this.mapToOperadorGuiche(item))));
  }

  getCurrentOperatorGuiche(): Observable<GuicheOperador | null> {
    return this.http
      .get<any | null>(`${this.apiUrl}/operador/atual`, {
        headers: this.authHeaders(),
      })
      .pipe(map((item) => (item ? this.mapToOperadorGuiche(item) : null)));
  }

  private mapToOperadorGuiche(item: any): GuicheOperador {
    const statusTexto = (item?.status ?? '').toString().toUpperCase();
    const ocupado = Boolean(item?.operadorAtualId) || statusTexto === 'OCUPADO';

    const atendimentoAtual = Array.isArray(item?.atendimentos) ? item.atendimentos[0] : null;
    const statusSenha = (atendimentoAtual?.senha?.status ?? '').toString().toUpperCase();
    const situacaoAtendimento =
      statusSenha === 'CHAMADO'
        ? 'CHAMANDO'
        : statusSenha === 'EM_ATENDIMENTO'
          ? 'ATENDENDO'
          : null;

    const logado = item?.loginOperadorEm
      ? new Date(item.loginOperadorEm).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      : null;

    return {
      id: Number(item?.id),
      numero: String(item?.numero ?? item?.nome ?? item?.id ?? ''),
      ocupado,
      status: ocupado ? 'OCUPADO' : 'DISPONIVEL',
      operador: item?.operadorAtual?.nome ?? null,
      logado,
      codigoAtendimento: atendimentoAtual?.senha?.numeroDisplay ?? item?.atendimentoAtualCodigo ?? null,
      situacaoAtendimento,
    };
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

  private guichesSubject = new BehaviorSubject<any[]>([]);

  guiches$ = this.guichesSubject.asObservable();
  private lastFilialId?: number;
  carregarGuichesDaApi(filialId?: number) {
    this.lastFilialId = filialId;
    const params = filialId ? `?filialId=${filialId}` : '';
    this.http.get<any[]>(`${this.apiUrl}${params}`, { headers: this.authHeaders() }).subscribe({
      next: (guichesDb) => {
        const ativos = guichesDb.filter(g => g.ativo);
        const correntes = this.guichesSubject.value;

        const mapped = ativos.map(g => {
          const m = correntes.find(c => c.numero == (g.numero || g.nome) || c.id === g.id);
          if (m) {
            return { ...m, numero: g.numero || g.nome, nome: g.nome, id: g.id };
          }
          return {
            id: g.id,
            numero: g.numero || g.nome,
            nome: g.nome,
            status: 'vazio',
            statusLabel: 'Vazio',
            operador: null,
            ticket: null,
            placa: null,
            progresso: 0,
            tempoOcupado: 0,
            tempoOcupadoFormatado: '00:00',
            tempoOcupadoSegundos: 0,
            atrasado: false,
            startTime: null
          };
        });

        mapped.sort((a, b) => {
          const numA = (typeof a.numero === 'number' ? a.numero : parseInt(a.numero, 10)) || 0;
          const numB = (typeof b.numero === 'number' ? b.numero : parseInt(b.numero, 10)) || 0;
          return numA - numB;
        });

        this.guichesSubject.next(mapped);
      },
      error: (err) => console.error('Erro ao carregar guichês:', err)
    });
  }

  private historicoTemposSegundos: number[] = [];
  private _tempoTolerancia: number = 15; // in minutos
  private timer: any;

  refreshGuiches(filialId?: number) {
    this.lastFilialId = filialId;
    const params = filialId ? `?filialId=${filialId}` : '';
    this.http.get<any[]>(`${this.apiUrl}${params}`, { headers: this.authHeaders() }).subscribe({
      next: (data) => {
        const mapped = data.map(g => ({
          id: g.id,
          numero: parseInt(g.numero, 10) || g.id,
          status: (g.status.toLowerCase() === 'online' || g.status.toLowerCase() === 'ativo' || g.status.toLowerCase() === 'offline') ? 'disponivel' : (g.status.toLowerCase() === 'ocupado' ? 'ocupado' : 'vazio'),
          statusLabel: g.status,
          operador: g.operadorAtual?.nome || null,
          ticket: g.atendimentoAtualCodigo || null,
          startTime: g.loginOperadorEm ? new Date(g.loginOperadorEm).getTime() : null
        }));
        this.guichesSubject.next(mapped);
      },
      error: (err) => console.error('Erro ao buscar guichês:', err)
    });
  }

  get tempoTolerancia(): number {
    return this._tempoTolerancia;
  }

  set tempoTolerancia(valor: number) {
    this._tempoTolerancia = valor;
  }

  private iniciarTimer() {
    this.timer = setInterval(() => {
      // Sync with server every 10 seconds
      if (Math.floor(Date.now() / 1000) % 10 === 0) {
        this.refreshGuiches(this.lastFilialId);
      }

      // Smooth timer updates for the UI
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
            tempoOcupado: minutos,
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

  // --- Real-time metrics for Dashboard ---

  /**
   * Retorna a soma total de segundos da sessão atual (histórico + guichês ocupados).
   * Usado para enviar ao backend como "dados ao vivo" no filtro "Hoje".
   */
  get somaSegundosVivo(): number {
    const ocupados = this.getGuiches().filter(g => g.status === 'ocupado' && g.tempoOcupadoSegundos !== undefined);
    let soma = this.historicoTemposSegundos.reduce((a, b) => a + b, 0);
    ocupados.forEach(g => { soma += g.tempoOcupadoSegundos; });
    return soma;
  }

  /**
   * Retorna a quantidade de atendimentos da sessão atual (histórico + guichês ocupados).
   */
  get qtdVivo(): number {
    const ocupados = this.getGuiches().filter(g => g.status === 'ocupado' && g.tempoOcupadoSegundos !== undefined);
    return this.historicoTemposSegundos.length + ocupados.length;
  }

  /**
   * Tempo médio formatado em tempo real — fonte do card no Dashboard.
   */
  get tempoMedioGlobalFormatado(): string {
    const somaTotal = this.somaSegundosVivo;
    const qtd = this.qtdVivo;

    if (qtd === 0) return '0 min';

    const mediaSegundos = Math.floor(somaTotal / qtd);
    const mediaMinutos = Math.floor(mediaSegundos / 60);
    const restoSegundos = mediaSegundos % 60;

    if (mediaMinutos === 0) {
      return `${restoSegundos} seg`;
    }
    return `${mediaMinutos}m ${restoSegundos}s`;
  }

  /**
   * Salva snapshot no banco de dados e zera o histórico local.
   * Chamado ao pressionar "Resetar Visor".
   */
  resetarHistoricoTempoMedio(filialId?: number): void {
    const soma = this.historicoTemposSegundos.reduce((a, b) => a + b, 0);
    const qtd = this.historicoTemposSegundos.length;

    if (qtd > 0) {
      // Persiste snapshot no banco antes de limpar
      this.http.post(
        `${this.dashboardApiUrl}/snapshots`,
        { somaTotalSegundos: soma, quantidade: qtd, filialId },
        { headers: this.authHeaders() }
      ).subscribe({
        next: () => console.log('[GuicheService] Snapshot de tempo médio salvo no banco.'),
        error: (err) => console.error('[GuicheService] Erro ao salvar snapshot:', err)
      });
    }

    this.historicoTemposSegundos = [];
  }
}
