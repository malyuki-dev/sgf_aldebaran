import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-escolha-guiches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escolha-guiches.html',
  styleUrls: ['./escolha-guiches.scss']
})
export class EscolhaGuiches {
  operadorNome = 'Maria Silva';
  operadorPerfil = 'Operador';
  operadorAvatar = 'MS';

  // Configurações
  filialSelecionada = '';
  idiomaAtivo = 'PT';

  guiches = [
    {
      numero: '01',
      ocupado: true,
      operador: 'João Santos',
      logado: '08:00',
      codigoAtendimento: 'RP035'
    },
    {
      numero: '02',
      ocupado: true,
      operador: 'Ana Costa',
      logado: '12:30',
      codigoAtendimento: 'C041'
    },
    { numero: '03', ocupado: false },
    {
      numero: '04',
      ocupado: true,
      operador: 'Pedro Lima',
      logado: '08:15',
      codigoAtendimento: 'CR030'
    },
    {
      numero: '05',
      ocupado: true,
      operador: 'Gustavo Campos',
      logado: '12:30',
      codigoAtendimento: 'C042'
    },
    { numero: '06', ocupado: false },
  ];

  selecionar(guiche: any) {
    if (!guiche.ocupado) {
      console.log('Guichê selecionado:', guiche.numero);
      // Aqui iria a lógica de navegação ou API
    }
  }

  trocarIdioma(idioma: string) {
    this.idiomaAtivo = idioma;
    console.log('Idioma alterado para:', idioma);
  }

  logout() {
    console.log('Fazendo logout...');
    // Implementar lógica de logout
  }
}
