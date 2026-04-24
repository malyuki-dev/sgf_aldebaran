import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TotemConfigService } from './totem-config.service';

export interface Ticket {
  id?: number;
  numeroDisplay: string;
  tipo: string;
  dataCriacao: string;
  servico?: { nome: string; };
  senha?: string;
  categoria?: string;
  dataHora?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TotemService {
  private apiUrl = 'http://localhost:3000/fila';

  // MUDANÇA: Agora guardamos o TIPO, não a categoria
  private tipoSelecionado: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: TotemConfigService
  ) { }

  // PASSO 1: Guarda o TIPO (Preferencial/Convencional) e vai para Categorias
  escolherTipo(tipo: string) {
    console.log('1. Tipo selecionado:', tipo);
    this.tipoSelecionado = tipo;
    this.router.navigate(['/totem/categoria']);
  }

  // PASSO 2: Recebe a CATEGORIA, junta com o TIPO e gera a senha
  solicitarSenha(categoria: string, categoriaId?: number, qtdeGarrafoes: number = 0) {
    if (!this.tipoSelecionado) {
      alert('Erro: Fluxo incorreto. Voltando ao inÃcio.');
      this.router.navigate(['/totem']);
      return;
    }

    const payload = {
      tipo: this.tipoSelecionado,
      categoria: categoria,
      categoriaId: categoriaId,
      filialId: this.configService.getFilialId(),
      qtdeGarrafoes: qtdeGarrafoes
    };

    console.log('2. Enviando para o Backend:', payload);

    this.http.post<any>(`${this.apiUrl}/totem/senha`, payload).subscribe({
      next: (resposta) => {
        this.finalizarProcesso(resposta, categoria);
      },
      error: (erro) => {
        console.error('Erro:', erro);
        const mensagem = erro?.error?.message;
        if (Array.isArray(mensagem) && mensagem.length) {
          alert(mensagem.join('\n'));
          return;
        }
        if (typeof mensagem === 'string' && mensagem.trim() !== '') {
          alert(mensagem);
          return;
        }
        alert('Erro ao conectar com o servidor.');
      }
    });
  }

  validarCheckin(codigo: string) {
    const codigoNormalizado = this.normalizarCodigoCheckin(codigo);
    if (!codigoNormalizado) {
      alert('Informe um codigo valido.');
      return;
    }

    const payload = {
      codigo: codigoNormalizado,
      filialId: this.configService.getFilialId()
    };

    return this.http.post<any>(`${this.apiUrl}/checkin/validar`, payload).subscribe({
      next: (resposta) => {
        if (resposta.valido) {
          this.finalizarProcesso(resposta.ticket, 'Agendamento');
        } else {
          alert(resposta.mensagem || 'Código inválido.');
        }
      },
      error: (erro) => {
        console.error('Erro Checkin:', erro);
        alert('Erro ao validar código.');
      }
    });
  }

  private normalizarCodigoCheckin(codigo: string): string {
    const normalizado = String(codigo || '').trim().toUpperCase();
    if (!normalizado) return '';
    return normalizado.startsWith('#') ? normalizado.substring(1) : normalizado;
  }

  private finalizarProcesso(resposta: any, categoriaFallback: string) {
    const ticketFormatado: Ticket = {
      id: resposta.id,
      numeroDisplay: resposta.numeroDisplay,
      tipo: resposta.tipo,
      dataCriacao: resposta.dataCriacao,
      senha: resposta.numeroDisplay,
      categoria: resposta.servico?.nome || categoriaFallback,
      dataHora: resposta.dataCriacao
    };

    sessionStorage.setItem('senhaGerada', JSON.stringify(ticketFormatado));
    this.router.navigate(['/totem/senha']);
  }

  getSenhaGerada(): Ticket | null {
    const dados = sessionStorage.getItem('senhaGerada');
    return dados ? JSON.parse(dados) : null;
  }

  getTipoSelecionado(): string {
    return this.tipoSelecionado;
  }
}