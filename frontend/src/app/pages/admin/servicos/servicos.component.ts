import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Power, Save, X, Settings } from 'lucide-angular';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './servicos.component.html',
  styleUrls: ['./servicos.component.scss']
})
export class ServicosComponent implements OnInit {
  servicos: any[] = [];
  form = { id: null as number | null, nome: '', sigla: '' };
  loading = false;
  editando = false;

  readonly icons = { plus: Plus, edit: Edit2, trash: Trash2, power: Power, save: Save, x: X, settings: Settings };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading = true;
    this.api.get<any[]>('/servicos').subscribe({
      next: (data) => {
        this.servicos = data.sort((a, b) => a.id - b.id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  salvar() {
    if (!this.form.nome || !this.form.sigla) return alert("Preencha Nome e Sigla obrigatoriamente!");

    this.loading = true;
    const request = this.editando && this.form.id
      ? this.api.patch(`/servicos/${this.form.id}`, this.form)
      : this.api.post('/servicos', this.form);

    request.subscribe({
      next: () => {
        this.limpar();
        this.carregar();
      },
      error: (err: any) => {
        alert(err.error?.message || "Erro ao salvar.");
        this.loading = false;
      }
    });
  }

  toggleStatus(servico: any) {
    this.api.patch(`/servicos/${servico.id}`, { ativo: !servico.ativo }).subscribe(() => {
      this.carregar();
    });
  }

  editar(s: any) {
    this.form = { id: s.id, nome: s.nome, sigla: s.sigla };
    this.editando = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  excluir(id: number) {
    if (confirm("Tem certeza que deseja inativar/excluir este serviço?")) {
      this.api.delete(`/servicos/${id}`).subscribe({
        next: () => {
          this.carregar();
        },
        error: (err) => {
          alert(err.error?.message || "Erro ao excluir serviço.");
        }
      });
    }
  }

  limpar() {
    this.form = { id: null, nome: '', sigla: '' };
    this.editando = false;
  }
}