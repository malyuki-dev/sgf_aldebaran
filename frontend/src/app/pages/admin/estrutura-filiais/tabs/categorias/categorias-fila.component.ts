import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Power, X, Layers, Truck, Zap, Package, Check } from 'lucide-angular';

@Component({
  selector: 'app-categorias-fila',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './categorias-fila.component.html',
  styleUrls: ['./categorias-fila.component.scss']
})
export class CategoriasFilaComponent implements OnInit {
  categorias: any[] = [];
  loading = false;
  
  // Modais State
  showCategoriaModal = false;
  editandoCategoria = false;
  showConfirmDelete = false;
  showSuccessModal = false;
  
  // Modal Form (Categoria)
  formCategoria: any = {
    id: null,
    nome: '',
    prefixo: '',
    tipo: '',
    cor: '#0099ab',
    ativo: true
  };

  categoriaParaExcluir: any = null;

  readonly icons = { 
    plus: Plus, edit: Edit2, trash: Trash2, power: Power, 
    x: X, layers: Layers, truck: Truck, zap: Zap, box: Package, check: Check
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.carregarCategorias();
  }

  carregarCategorias() {
    this.api.get<any[]>('/servicos').subscribe({
      next: (data) => {
        this.categorias = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  abrirModalCategoria(cat?: any) {
    if (cat) {
      this.editandoCategoria = true;
      this.formCategoria = { ...cat };
    } else {
      this.editandoCategoria = false;
      this.formCategoria = {
        id: null, nome: '', prefixo: '',
        tipo: '', cor: '#0099ab', ativo: true
      };
    }
    this.showCategoriaModal = true;
  }

  fecharModalCategoria() {
    this.showCategoriaModal = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: any) {
    if (this.showCategoriaModal) this.fecharModalCategoria();
    if (this.showConfirmDelete) this.fecharConfirmacao();
    if (this.showSuccessModal) this.fecharSucesso();
  }

  salvarCategoria() {
    if (!this.formCategoria.nome) return alert("O nome da categoria é obrigatório.");
    
    this.loading = true;
    const request = this.editandoCategoria
      ? this.api.patch(`/servicos/${this.formCategoria.id}`, this.formCategoria)
      : this.api.post('/servicos', this.formCategoria);

    request.subscribe({
      next: () => {
        this.fecharModalCategoria();
        this.carregarCategorias();
        this.showSuccessModal = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert("Erro: " + (err.error?.message || "Erro desconhecido"));
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharSucesso() {
    this.showSuccessModal = false;
  }

  toggleStatusCategoria(item: any) {
    this.api.patch(`/servicos/${item.id}`, { ativo: !item.ativo }).subscribe(() => {
      this.carregarCategorias();
      this.cdr.detectChanges();
    });
  }

  excluirCategoria(id: number) {
    this.categoriaParaExcluir = this.categorias.find(c => c.id === id);
    this.showConfirmDelete = true;
  }

  confirmarExclur() {
    if (this.categoriaParaExcluir) {
      this.api.delete(`/servicos/${this.categoriaParaExcluir.id}`).subscribe(() => {
        this.carregarCategorias();
        this.fecharConfirmacao();
        this.cdr.detectChanges();
      });
    }
  }

  fecharConfirmacao() {
    this.showConfirmDelete = false;
    this.categoriaParaExcluir = null;
  }
}
