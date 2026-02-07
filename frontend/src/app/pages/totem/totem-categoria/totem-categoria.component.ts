import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
// Importe o serviço do Totem para gerar a senha real
import { TotemService } from '../../../services/totem.service';

@Component({
  selector: 'app-totem-categoria',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './totem-categoria.component.html',
  styleUrls: ['./totem-categoria.component.scss']
})
export class TotemCategoriaComponent {

  tipoAtendimentoAnterior: string = '';

  // Lista FIXA para garantir que seu design (ícones e descrições) funcione perfeitamente
  categorias = [
    { 
      id: 1, 
      nome: 'Caminhão', 
      descricao: 'Carga pesada e grandes volumes', 
      icone: 'truck' 
    },
    { 
      id: 2, 
      nome: 'Retirada Pesada', 
      descricao: 'Garrafões e vasilhames em quantidade', 
      icone: 'box' 
    },
    { 
      id: 3, 
      nome: 'Cliente Rápido', 
      descricao: 'Atendimento expresso e dúvidas rápidas', 
      icone: 'zap' 
    }
  ];

  constructor(
    private router: Router,
    private totemService: TotemService // Injeção do serviço
  ) {
    const state = history.state;
    // Recupera se é Preferencial ou Convencional
    if (state && state.tipoAtendimento) {
      this.tipoAtendimentoAnterior = state.tipoAtendimento;
    } else {
      this.tipoAtendimentoAnterior = 'convencional'; 
    }
  }

  selecionarCategoria(categoriaSelecionada: any) {
    console.log('Gerando senha para:', categoriaSelecionada.nome);

    // 1. Chama o Backend para criar a senha sequencial (P-C001)
    this.totemService.criarSenha(this.tipoAtendimentoAnterior, categoriaSelecionada.nome)
      .subscribe({
        next: (ticket) => {
          
          // 2. Navega para a rota configurada (senha/ID/SENHA)
          this.router.navigate(['/totem/senha', ticket.id, ticket.senha], { 
            state: { ticket: ticket } 
          });

        },
        error: (err) => {
          console.error(err);
          // Mensagem amigável caso o backend esteja desligado ou o serviço não exista no banco
          alert('Erro ao gerar senha. Verifique se o serviço "' + categoriaSelecionada.nome + '" existe no Banco de Dados.');
        }
      });
  }
}