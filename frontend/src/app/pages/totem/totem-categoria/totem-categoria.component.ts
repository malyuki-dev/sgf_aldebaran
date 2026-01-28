import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Truck, Package, Zap, ChevronLeft } from 'lucide-angular';

@Component({
  selector: 'app-totem-categoria',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './totem-categoria.component.html',
  styleUrl: './totem-categoria.component.scss'
})
export class TotemCategoriaComponent implements OnInit {
  servicos: any[] = [];
  carregando = true;
  
  readonly icons = {
    truck: Truck,
    package: Package,
    zap: Zap,
    back: ChevronLeft
  };

  // Injete o cdr no construtor
  constructor(
    private api: ApiService, 
    private router: Router,
    private cdr: ChangeDetectorRef // <--- Injeção aqui
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/fila/servicos').subscribe({
      next: (data) => {
        // Filtra e atualiza a variável
        this.servicos = data.filter(s => s.ativo !== false);
        this.carregando = false;
        
        // FORÇA O ANGULAR A ATUALIZAR A TELA AGORA
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Erro ao buscar serviços', err);
        this.carregando = false;
        this.cdr.detectChanges(); // Força atualização mesmo no erro
      }
    });
  }

  gerarSenha(servicoId: number) {
    this.api.post<any>('/fila/solicitar_senha', { servico_id: servicoId }).subscribe({
      next: (res) => {
        this.router.navigate(['/totem/senha', res.id, res.numeroDisplay]);
      },
      error: () => alert('Erro ao gerar senha.')
    });
  }

  voltar() {
    this.router.navigate(['/totem']);
  }

  getIcon(nome: string) {
    const n = (nome || '').toLowerCase();
    if (n.includes('caminhão')) return this.icons.truck;
    if (n.includes('rápido')) return this.icons.zap;
    return this.icons.package;
  }
}