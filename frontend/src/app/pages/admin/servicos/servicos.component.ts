import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Settings, Plus, Edit, Trash2, Power, Save, X, Tag } from 'lucide-angular';

@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './servicos.component.html',
  styleUrl: './servicos.component.scss'
})
export class ServicosComponent implements OnInit {
  servicos: any[] = [];
  form = { id: null as number | null, nome: '', sigla: '' };
  loading = false;
  editando = false;

  readonly icons = { settings: Settings, plus: Plus, edit: Edit, trash: Trash2, power: Power, save: Save, x: X, tag: Tag };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.api.get<any[]>('/fila/servicos').subscribe({
      next: (data) => {
        this.servicos = data.sort((a, b) => a.id - b.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  salvar() {
    if (!this.form.nome || !this.form.sigla) return alert("Preencha tudo!");
    
    this.loading = true;
    const request = this.editando && this.form.id
      ? this.api.patch(`/fila/servicos/${this.form.id}`, this.form)
      : this.api.post('/fila/servicos', this.form);

    request.subscribe({
      next: () => {
        this.limpar();
        this.carregar();
      },
      error: (err) => alert(err.error?.message || "Erro ao salvar."),
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStatus(servico: any) {
    this.api.patch(`/fila/servicos/${servico.id}`, { ativo: !servico.ativo }).subscribe(() => {
      this.carregar();
    });
  }

  editar(s: any) {
    this.form = { id: s.id, nome: s.nome, sigla: s.sigla };
    this.editando = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // FUNÇÃO EXCLUIR ATUALIZADA
  excluir(id: number) {
    if(confirm("Tem certeza que deseja excluir este serviço? Isso é irreversível.")) {
      this.api.delete(`/fila/servicos/${id}`).subscribe({
        next: () => {
          alert("Serviço excluído com sucesso!");
          this.carregar();
        },
        error: (err) => {
          // Exibe a mensagem tratada do backend (ex: não pode excluir se tiver histórico)
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