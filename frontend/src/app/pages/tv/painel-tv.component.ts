import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { PainelConfigService } from '../../services/painel-config.service';

@Component({
  selector: 'app-painel-tv',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './painel-tv.component.html',
  styleUrls: ['./painel-tv.component.scss']
})
export class PainelTvComponent implements OnInit, OnDestroy {
  dataAtual = new Date();
  dataAtualTexto = '';
  senhaAtual: any = null;
  ultimasChamadas: any[] = [];
  readonly idiomas = ['PT', 'EN'];
  categoriasServico: any[] = [];
  filialId: number | null = null;
  configurado = false;

  private subs: Subscription[] = [];
  private socket: Socket | null = null;
  private isInitialLoad = true;

  // Propriedades para controle de alerta de nova chamada
  private ultimoIdChamado: string | null = null;
  exibirAlerta = false;
  iniciado = false; // Add variable to track if user started the panel

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private configService: PainelConfigService,
  ) { }

  ngOnInit() {
    this.atualizarDataHora();
    this.subs.push(
      interval(1000).subscribe(() => {
        this.atualizarDataHora();
        this.cdr.detectChanges();
      }),
      // Fallback de resiliencia: evita painel congelado se o WS cair.
      interval(3000).subscribe(() => {
        if (this.iniciado && this.configurado) {
          this.atualizar();
        }
      })
    );
    this.route.queryParamMap.subscribe(params => {
      const fidParam = params.get('filialId');
      const fidConfig = this.configService.getFilialId();
      this.filialId = fidParam ? Number(fidParam) : fidConfig;
      this.configurado = !!this.filialId;

      if (!this.configurado) {
        this.router.navigate(['/painel/setup']);
        return;
      }

      if (this.configurado) {
        this.carregarCategorias();
        if (this.iniciado) {
          this.atualizar();
        }
      }
    });
    this.conectarWebSocket();
    // Do not fetch initial data until user clicks start
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && this.configurado && !this.iniciado) {
      this.iniciarPainel();
    }
  }

  iniciarPainel() {
    if (!this.configurado) return;
    this.iniciado = true;

    // Play a silent sound to unlock audio context in the browser
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        const audioCtx = new AudioContextCtor();
        audioCtx.resume();
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('');
        msg.volume = 0;
        window.speechSynthesis.speak(msg);
      }
    } catch (e) { }

    this.atualizar();
  }

  private conectarWebSocket() {
    this.socket = io(environment.apiUrl, {
      query: { panelType: 'GERAL' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[Painel-TV] WebSocket conectado!');
      if (this.iniciado && this.configurado) {
        this.atualizar();
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Painel-TV] Falha WebSocket:', err?.message || err);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Painel-TV] WebSocket desconectado:', reason);
    });

    this.socket.on('ticket_called', (payload: any) => {
      if (this.iniciado && this.configurado) {
        // Se houver um payload válido significa que alguém clicou em Chamar ou Rechamar.
        // Se o payload for null/undefined foi apenas uma atualização de fila (como um Finalizar Atendimento).
        const deveForcar = !!payload;
        this.atualizar(deveForcar, payload);
      }
    });
  }

  private carregarCategorias() {
    if (!this.filialId) {
      this.categoriasServico = [];
      return;
    }
    const query = this.filialId ? `?filialId=${this.filialId}` : '';
    this.apiService.get<any[]>(`/servicos/public/list${query}`).subscribe({
      next: (dados) => {
        if (dados) {
          this.categoriasServico = dados.filter(s => s.ativo);
        }
      },
      error: (err) => {
        console.error('[Painel-TV] Erro ao carregar categorias:', err);
      },
    });
  }

  private atualizarDataHora() {
    this.dataAtual = new Date();
    this.dataAtualTexto = this.dataAtual.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.socket) {
      this.socket.disconnect();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Alterado para aceitar o payload do web socket que contem o ticket recém chamado (ticketId, category, guicheOrDoca)
  atualizar(forceAlert = false, payload?: any) {
    if (!this.filialId) return;
    const query = this.filialId ? `?filialId=${this.filialId}` : '';
    this.apiService.get<any[]>(`/fila/painel${query}`).subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {

          if (forceAlert && payload && payload.ticketId) {
            const idxEncontrado = dados.findIndex(
              d => String(d.id) === String(payload.ticketId) || String(d.numero) === String(payload.ticketId)
            );

            if (idxEncontrado >= 0) {
              const novaSenha = dados[idxEncontrado];
              dados.splice(idxEncontrado, 1);
              this.senhaAtual = novaSenha;
              this.ultimasChamadas = dados.slice(0, 5);
              this.dispararAlertaNovaChamada();
              this.isInitialLoad = false;
              this.cdr.detectChanges();
              return;
            }
          }

          {
            // Atualização silenciosa.
            if (!this.senhaAtual) {
              this.senhaAtual = dados.shift();
            } else {
              // Mantém a senhaAtual no centro
              const idxEncontrado = dados.findIndex(
                d => String(d.id) === String(this.senhaAtual.id) || String(d.numero) === String(this.senhaAtual.numero)
              );
              if (idxEncontrado >= 0) {
                this.senhaAtual = dados[idxEncontrado];
                dados.splice(idxEncontrado, 1);
              } else {
                // Se a senha velha não estiver mais entre as 20 mais recentes (muito raro, mas possível)
                // Vamos assumir a mais recente global mesmo.
                this.senhaAtual = dados.shift();
              }
            }
            this.ultimasChamadas = dados.slice(0, 5);

            // Só muda/registra o ID mais recente se de fato a tela atualizou suavemente sem tocar o sino
            const novoId = this.senhaAtual.id || this.senhaAtual.numero || this.senhaAtual.senha;
            if (!!this.ultimoIdChamado && this.ultimoIdChamado !== novoId || !this.ultimoIdChamado) {
              this.ultimoIdChamado = novoId;
            }
          }
        } else {
          // Nao limpa imediatamente para evitar tela vazia em transicoes de status.
          if (this.isInitialLoad) {
            this.senhaAtual = null;
            this.ultimasChamadas = [];
          }
        }
        this.isInitialLoad = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Painel-TV] Erro ao atualizar painel:', err);
      },
    });
  }

  playAlertaSonoro() {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioCtx = new AudioContextCtor();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // Ding!
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3); // Dong!

      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  }

  dispararAlertaNovaChamada() {
    this.ultimoIdChamado = this.senhaAtual.id || this.senhaAtual.numero || this.senhaAtual.senha;
    this.exibirAlerta = true;

    // Tocar sinal sonoro antes de ler
    this.playAlertaSonoro();

    // Delay de 800ms para aguardar o ding-dong terminar
    setTimeout(() => {
      // Tocar API de fone para ler a senha
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Separa os caracteres se for "C041" para a fala ficar "C, zero, quatro, um"
        const numeroRaw = this.getSenhaNumero(this.senhaAtual);
        const numeroBase = numeroRaw.replace(/[^A-Za-z0-9]/g, ''); // limpa espaços
        const numero = numeroBase.split('').join(', ');

        const destinoTipo = this.getGuicheDestinoTipo(this.senhaAtual).toLowerCase();
        const destinoValor = this.getGuicheDestinoValor(this.senhaAtual);
        const destino = destinoValor && destinoValor !== '--'
          ? `${destinoTipo} ${destinoValor}`
          : destinoTipo;

        const mensagem = new SpeechSynthesisUtterance(`Senha. ${numero}, Dirija-se ao, ${destino}.`);
        mensagem.lang = 'pt-BR';
        mensagem.rate = 0.85;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(mensagem);
      }
    }, 800);

    // Esconde o alerta de piscar após 8 segundos
    setTimeout(() => {
      this.exibirAlerta = false;
    }, 8000);
  }

  getSenhaNumero(item: any): string {
    return item?.numero || item?.senha || '---';
  }

  getServicoNome(item: any): string {
    return item?.servico?.nome || item?.categoria || '---';
  }

  getServicoCor(item: any): string {
    return item?.servico?.cor || '#00838f'; // Cor padrão verde-azulado
  }

  getGuiche(item: any): string {
    // Agora o backend manda formatado "GUICHÊ X" ou "BAIA Y"
    return String(item?.guiche || item?.guicheNumero || '--');
  }

  getGuicheDestinoTipo(item: any): string {
    const g = this.getGuiche(item).trim();
    if (g === '--') return 'GUICHÊ';
    const parts = g.split(' ');
    return parts.length > 1 ? parts.slice(0, -1).join(' ').toUpperCase() : 'GUICHÊ';
  }

  getGuicheDestinoValor(item: any): string {
    const g = this.getGuiche(item).trim();
    if (g === '--') return '--';
    const parts = g.split(' ');
    // Retorna a última palavra/número como o valor (ex: "BAIA 2" -> "2", "SALA 5" -> "5")
    return parts.length > 1 ? parts[parts.length - 1] : g;
  }

  irParaConfiguracao() {
    this.router.navigate(['/painel/setup']);
  }
}