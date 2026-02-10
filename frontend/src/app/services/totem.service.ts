import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  // PASSO 1: Guarda o TIPO (Preferencial/Convencional) e vai para Categorias
  escolherTipo(tipo: string) {
    console.log('1. Tipo selecionado:', tipo);
    this.tipoSelecionado = tipo;
    this.router.navigate(['/totem/categoria']);
  }

  // PASSO 2: Recebe a CATEGORIA, junta com o TIPO e gera a senha
  solicitarSenha(categoria: string) {
    if (!this.tipoSelecionado) {
      alert('Erro: Fluxo incorreto. Voltando ao início.');
      this.router.navigate(['/totem']);
      return;
    }

    const payload = {
      tipo: this.tipoSelecionado, 
      categoria: categoria 
    };

    console.log('2. Enviando para o Backend:', payload);

    this.http.post<any>(`${this.apiUrl}/totem/senha`, payload).subscribe({
      next: (resposta) => {
        const ticketFormatado: Ticket = {
          id: resposta.id,
          numeroDisplay: resposta.numeroDisplay,
          tipo: resposta.tipo,
          dataCriacao: resposta.dataCriacao,
          senha: resposta.numeroDisplay,
          categoria: resposta.servico?.nome || categoria,
          dataHora: resposta.dataCriacao
        };

        sessionStorage.setItem('senhaGerada', JSON.stringify(ticketFormatado));
        this.router.navigate(['/totem/senha']);
      },
      error: (erro) => {
        console.error('Erro:', erro);
        alert('Erro ao conectar com o servidor.');
      }
    });
  }

  getSenhaGerada(): Ticket | null {
    const dados = sessionStorage.getItem('senhaGerada');
    return dados ? JSON.parse(dados) : null;
  }
}