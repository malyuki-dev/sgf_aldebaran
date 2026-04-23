import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Truck, Package, Zap, Box, Clock, User, Building } from 'lucide-angular';
import { TotemService } from '../../../services/totem.service';
import { ApiService } from '../../../services/api.service';
import { TotemConfigService } from '../../../services/totem-config.service';

interface Categoria {
  nome: string;
  icone: any; // MUDANÇA: Agora recebe o objeto do ícone
  descricao: string;
}

@Component({
  selector: 'app-totem-categoria',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './totem-categoria.component.html',
  styleUrls: ['./totem-categoria.component.scss']
})
export class TotemCategoriaComponent implements OnInit {

  categorias: Categoria[] = [];
  
  readonly icons: any = { Truck, Package, Zap, Box, Clock, User, Building };

  constructor(
    private totemService: TotemService,
    private api: ApiService,
    private configService: TotemConfigService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias() {
    const filialId = this.configService.getFilialId();
    const tipo = this.totemService.getTipoSelecionado();
    
    let query = filialId ? `?filialId=${filialId}` : '';
    if (tipo) {
      query += query ? `&tipo=${tipo}` : `?tipo=${tipo}`;
    }
    
    this.api.get<any[]>(`/servicos/public/list${query}`).subscribe({

      next: (dados) => {
        // Filter only active services and map to the Totem layout
        this.categorias = dados
          .filter(s => s.ativo)
          .map(s => {
            let icone = s.icone || 'zap'; 
            let descricao = 'Atendimento geral';

            if (s.nome.toLowerCase().includes('caminhão') || s.nome.toLowerCase().includes('caminhao')) {
              if (!s.icone) icone = 'truck';
              descricao = 'Carga pesada e grandes volumes';
            } else if (s.nome.toLowerCase().includes('retirada pesada')) {
              if (!s.icone) icone = 'box';
              descricao = 'Garrafões e vasilhames em quantidade';
            } else if (s.nome.toLowerCase().includes('cliente rápido') || s.nome.toLowerCase().includes('cliente rapido')) {
              if (!s.icone) icone = 'zap';
              descricao = 'Atendimento expresso e dúvidas rápidas';
            } else {
              descricao = s.sigla ? `Fila: ${s.sigla}` : descricao;
            }

            // Mapeamento de ícone string -> objeto lucide
            let iconeObjeto = this.icons.Zap;
            const iconeLower = icone.toLowerCase();
            
            if (iconeLower === 'truck') iconeObjeto = this.icons.Truck;
            else if (iconeLower === 'package' || iconeLower === 'box') iconeObjeto = this.icons.Box;
            else if (iconeLower === 'zap') iconeObjeto = this.icons.Zap;
            else if (iconeLower === 'clock') iconeObjeto = this.icons.Clock;
            else if (iconeLower === 'user') iconeObjeto = this.icons.User;
            else if (iconeLower === 'building') iconeObjeto = this.icons.Building;

            return {
              nome: s.nome || 'Sem Nome',
              icone: iconeObjeto,
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