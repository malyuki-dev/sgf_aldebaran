import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Power, X, Building, Check, Layout } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guiches',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './guiches.component.html',
  styleUrls: ['./guiches.component.scss']
})
export class GuichesComponent implements OnInit {
  filiais: any[] = [];
  guichesRaw: any[] = [];
  filiaisAgrupadas: any[] = [];
  loading = false;
  selectedFilialId: number | null = null;
  
  // Modais State
  showModal = false;
  editando = false;
  showConfirmDelete = false;
  showSuccessModal = false;
  
  // Modal Form (Guiche)
  form: any = {
    id: null,
    nome: '',
    filial_id: null,
    status: 'Ativo' // Will map to 'ativo' boolean: Ativo=true, Inativo=false
  };

  guicheParaExcluir: any = null;

  readonly icons = { 
    plus: Plus, edit: Edit2, trash: Trash2, power: Power, 
    x: X, building: Building, check: Check, layout: Layout
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Escuta mudanças de queryParams em toda a rota (inclusive no pai)
    this.route.queryParamMap.subscribe(params => {
      const fid = params.get('filialId');
      this.selectedFilialId = fid ? Number(fid) : null;
      this.carregarDados();
    });
  }

  carregarDados() {
    this.loading = true;
    // Fetch both filiais and guichês
    this.api.get<any[]>('/filiais').subscribe({
      next: (filiais) => {
        this.filiais = filiais;
        const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
        this.api.get<any[]>(`/guiches${filialQuery}`).subscribe({
          next: (guiches) => {
            this.guichesRaw = guiches;
            this.agruparGuiches();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
              console.error(err);
              this.loading = false;
          }
        });
      },
      error: (err) => {
          console.error(err);
          this.loading = false;
      }
    });
  }

  agruparGuiches() {
    // Filtramos primeiro as filiais pela seleção atual
    this.filiaisAgrupadas = this.filiais
      .filter(f => {
         const ativo = f.ativo;
         const correspondeFiltro = !this.selectedFilialId || f.id === this.selectedFilialId;
         return ativo && correspondeFiltro;
      })
      .map(f => {
        return {
          ...f,
          guiches: this.guichesRaw.filter(g => g.filial_id === f.id)
        };
      })
      .filter(f => f.guiches.length > 0 || !this.loading);
  }

  abrirModal(guiche?: any) {
    if (guiche) {
      this.editando = true;
      this.form = { 
        ...guiche,
        status: guiche.ativo ? 'Ativo' : 'Inativo'
      };
    } else {
      this.editando = false;
      this.form = {
        id: null, 
        nome: '',
        filial_id: this.selectedFilialId || (this.filiais.length > 0 ? this.filiais[0].id : null), 
        status: 'Ativo'
      };
    }
    this.showModal = true;
    this.cdr.detectChanges();
  }

  fecharModal() {
    this.showModal = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: any) {
    if (this.showModal) this.fecharModal();
    if (this.showConfirmDelete) this.fecharConfirmacao();
    if (this.showSuccessModal) this.fecharSucesso();
  }

  salvar() {
    if (!this.form.nome || !this.form.filial_id) {
       return alert("Todos os campos obrigatórios (*) devem ser preenchidos.");
    }
    
    this.loading = true;
    // Map status back to ativo boolean for API
    const payload = {
        ...this.form,
        ativo: this.form.status === 'Ativo',
        numero: this.form.nome // Use name as number for compatibility if backend requires it
    };

    const request = this.editando
      ? this.api.patch(`/guiches/${payload.id}`, payload)
      : this.api.post('/guiches', payload);

    request.subscribe({
      next: () => {
        this.fecharModal();
        this.carregarDados();
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

  toggleStatus(item: any) {
    this.api.patch(`/guiches/${item.id}`, { ativo: !item.ativo }).subscribe(() => {
      this.carregarDados();
      this.cdr.detectChanges();
    });
  }

  excluir(id: number) {
    this.guicheParaExcluir = this.guichesRaw.find(g => g.id === id);
    this.showConfirmDelete = true;
  }

  confirmarExclur() {
    if (this.guicheParaExcluir) {
      this.api.delete(`/guiches/${this.guicheParaExcluir.id}`).subscribe(() => {
        this.carregarDados();
        this.fecharConfirmacao();
        this.cdr.detectChanges();
      });
    }
  }

  fecharConfirmacao() {
    this.showConfirmDelete = false;
    this.guicheParaExcluir = null;
  }
}
