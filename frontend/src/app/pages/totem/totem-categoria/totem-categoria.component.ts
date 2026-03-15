import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TotemService } from '../../../services/totem.service';
import { ApiService } from '../../../services/api.service';

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

  constructor(
    private totemService: TotemService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.api.get<any[]>('/servicos').subscribe({
      next: (dados) => {
        // Filter only active services and map to the Totem layout
        this.categorias = dados
          .filter(s => s.ativo)
          .map(s => {
            let icone = 'zap'; // default icon
            let descricao = 'Atendimento geral';

            if (s.nome.toLowerCase().includes('caminhão') || s.nome.toLowerCase().includes('caminhao')) {
              icone = 'truck';
              descricao = 'Carga pesada e grandes volumes';
            } else if (s.nome.toLowerCase().includes('retirada pesada')) {
              icone = 'box';
              descricao = 'Garrafões e vasilhames em quantidade';
            } else if (s.nome.toLowerCase().includes('cliente rápido') || s.nome.toLowerCase().includes('cliente rapido')) {
              icone = 'zap';
              descricao = 'Atendimento expresso e dúvidas rápidas';
            } else {
              descricao = s.sigla ? `Fila: ${s.sigla}` : descricao;
            }

            return {
              nome: s.nome,
              icone: icone,
              descricao: descricao
            };
          });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar categorias do totem:', err)
    });
  }

  selecionarCategoria(cat: Categoria) {
    // Agora sim chamamos solicitarSenha, pois temos o Tipo + Categoria
    this.totemService.solicitarSenha(cat.nome);
  }
}