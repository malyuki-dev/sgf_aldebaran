import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Power, X, Building, Check, Layout } from 'lucide-angular';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

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
  saving = false;
  errorMessage = '';
  selectedFilialId: number | null = null;

  showModal = false;
  editando = false;
  showConfirmDelete = false;
  showSuccessModal = false;

  form: any = {
    id: null,
    nome: '',
    filial_id: null,
    status: 'Ativo'
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
    this.route.queryParamMap.subscribe(params => {
      const fid = params.get('filialId');
      this.selectedFilialId = fid ? Number(fid) : null;
      this.carregarDados();
    });
  }

  carregarDados() {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      filiais: this.api.get<any[]>('/filiais'),
      guiches: this.api.get<any[]>(
        '/guiches/admin/lista',
        this.selectedFilialId ? { filialId: this.selectedFilialId } : undefined,
      ),
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: ({ filiais, guiches }) => {
        this.filiais = filiais || [];
        this.guichesRaw = guiches || [];
        this.agruparGuiches();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Nao foi possivel carregar os guiches desta filial. Tente novamente.';
        this.filiais = [];
        this.guichesRaw = [];
        this.filiaisAgrupadas = [];
      },
    });
  }

  agruparGuiches() {
    this.filiaisAgrupadas = this.filiais
      .filter(f => {
        const ativo = f.ativo;
        const correspondeFiltro =
          !this.selectedFilialId || Number(f.id) === Number(this.selectedFilialId);
        return ativo && correspondeFiltro;
      })
      .map(f => ({
        ...f,
        guiches: this.guichesRaw.filter(g => Number(g.filial_id) === Number(f.id))
      }));
  }

  abrirModal(guiche?: any) {
    if (guiche) {
      this.editando = true;
      this.form = {
        ...guiche,
        nome: String(guiche.numero || guiche.nome || '').replace(/^Guich[êe]\s*/i, '').trim(),
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
      return alert('Todos os campos obrigatorios (*) devem ser preenchidos.');
    }

    this.saving = true;
    const valorCanonico = String(this.form.nome).replace(/^Guich[êe]\s*/i, '').trim();

    const payload = {
      ...this.form,
      ativo: this.form.status === 'Ativo',
      nome: valorCanonico,
      numero: valorCanonico
    };

    const request = this.editando
      ? this.api.patch(`/guiches/${payload.id}`, payload)
      : this.api.post('/guiches', payload);

    request.pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: () => {
        this.fecharModal();
        this.showSuccessModal = true;
        this.carregarDados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Erro: ' + (err.error?.message || 'Erro desconhecido'));
        this.cdr.detectChanges();
      }
    });
  }

  fecharSucesso() {
    this.showSuccessModal = false;
  }

  toggleStatus(item: any) {
    this.api.patch(`/guiches/${item.id}`, { ativo: !item.ativo }).subscribe({
      next: () => {
        this.carregarDados();
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Erro: ' + (err.error?.message || 'Erro desconhecido'));
      }
    });
  }

  excluir(id: number) {
    this.guicheParaExcluir = this.guichesRaw.find(g => Number(g.id) === Number(id));
    this.showConfirmDelete = true;
  }

  confirmarExclur() {
    if (this.guicheParaExcluir) {
      this.api.delete(`/guiches/${this.guicheParaExcluir.id}`).subscribe({
        next: () => {
          this.carregarDados();
          this.fecharConfirmacao();
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert('Erro: ' + (err.error?.message || 'Erro desconhecido'));
        }
      });
    }
  }

  fecharConfirmacao() {
    this.showConfirmDelete = false;
    this.guicheParaExcluir = null;
  }
}
