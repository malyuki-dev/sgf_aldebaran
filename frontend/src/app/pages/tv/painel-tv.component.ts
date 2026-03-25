import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

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
  readonly categoriasServico = ['Caminhão', 'Retirada Pesada', 'Cliente Rápido'];

  private subs: Subscription[] = [];

  // Propriedades para controle de alerta de nova chamada
  private ultimoIdChamado: string | null = null;
  exibirAlerta = false;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.atualizarDataHora();
    this.subs.push(
      interval(1000).subscribe(() => this.atualizarDataHora()),
      interval(3000).subscribe(() => this.atualizar()) // Polling mais rápido para melhor responsividade
    );
    this.atualizar();
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  atualizar() {
    this.apiService.get<any[]>('/fila/painel').subscribe({
      next: (dados) => {
        if (dados && dados.length > 0) {
          const novaSenha = dados[0];
          this.ultimasChamadas = dados.slice(1, 6);

          // Usa id ou numero para verificar nova chamada
          const novoId = novaSenha.id || novaSenha.numero || novaSenha.senha;

          if (this.ultimoIdChamado && this.ultimoIdChamado !== novoId) {
            // Nova chamada detectada
            this.senhaAtual = novaSenha;
            this.dispararAlertaNovaChamada();
          } else {
            this.senhaAtual = novaSenha;
            if (!this.ultimoIdChamado) {
              this.ultimoIdChamado = novoId; // Primeira carga, não dispara alerta
            }
          }
        }
      }
    });
  }

  dispararAlertaNovaChamada() {
    this.ultimoIdChamado = this.senhaAtual.id || this.senhaAtual.numero || this.senhaAtual.senha;
    this.exibirAlerta = true;

    // Tocar API de fone para ler a senha
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Separa os caracteres se for "C041" para a fala ficar "C, zero, quatro, um"
      const numeroRaw = this.getSenhaNumero(this.senhaAtual);
      const numeroBase = numeroRaw.replace(/[^A-Za-z0-9]/g, ''); // limpa espaços
      const numero = numeroBase.split('').join(', ');

      const guiche = this.getGuiche(this.senhaAtual);

      const mensagem = new SpeechSynthesisUtterance(`Senha. ${numero}, Dirija-se ao guichê. ${guiche}.`);
      mensagem.lang = 'pt-BR';
      mensagem.rate = 0.85;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(mensagem);
    }

    // Esconde o alerta de piscar após 8 segundos
    setTimeout(() => {
      this.exibirAlerta = false;
    }, 8000);
  }

  getSenhaNumero(item: any): string {
    return item?.numero || item?.senha || '---';
  }

  getServicoNome(item: any): string {
    return item?.servico || item?.categoria || 'Retirada Pesada';
  }

  getServicoClass(item: any): string {
    const servico = (this.getServicoNome(item) || '').toLowerCase();
    if (servico.includes('caminh')) return 'servico-caminhao';
    if (servico.includes('cliente')) return 'servico-cliente';
    return 'servico-retirada';
  }

  getGuiche(item: any): string {
    return String(item?.guiche || item?.guicheNumero || '--');
  }

  getTempo(item: any): string {
    return item?.tempo || item?.tempoEspera || '8 min';
  }

  getPosicao(item: any): number {
    return item?.posicao || item?.filaPosicao || 0;
  }
}