import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TotemService } from '../../../services/totem.service';

interface Categoria {
  nome: string;
  icone: string;
  descricao: string;
}

@Component({
  selector: 'app-totem-categoria',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './totem-categoria.component.html',
  styleUrls: ['./totem-categoria.component.scss']
})
export class TotemCategoriaComponent implements OnInit {
  
  categorias: Categoria[] = [];

  constructor(private totemService: TotemService) {}

  ngOnInit(): void {
    this.categorias = [
      { 
        nome: 'Caminhão', 
        icone: 'truck', 
        descricao: 'Carga pesada e grandes volumes'
      },
      { 
        nome: 'Retirada Pesada', 
        icone: 'box', 
        descricao: 'Garrafões e vasilhames em quantidade' 
      },
      { 
        nome: 'Cliente Rápido', 
        icone: 'zap', 
        descricao: 'Atendimento expresso e dúvidas rápidas' 
      }
    ];
  }

  selecionarCategoria(cat: Categoria) {
    // Agora sim chamamos solicitarSenha, pois temos o Tipo + Categoria
    this.totemService.solicitarSenha(cat.nome);
  }
}