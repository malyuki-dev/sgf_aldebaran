import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../../services/api.service';
import { LucideAngularModule, Plus, Edit2, Trash2, Power, X, Search, Building2, MapPin, Phone, Check } from 'lucide-angular';

@Component({
  selector: 'app-filiais',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './filiais.component.html',
  styleUrls: ['./filiais.component.scss']
})
export class FiliaisComponent implements OnInit {
  filiais: any[] = [];
  loading = false;
  
  // Modais State
  showModal = false;
  editando = false;
  showConfirmDelete = false;
  showSuccessModal = false;
  
  // Modal Form (Filial)
  form: any = {
    id: null,
    nome: '',
    email: '',
    endereco: '',
    telefone: '',
    ativo: true,
    cor: '#0ea5e9'
  };

  filialParaExcluir: any = null;

  readonly icons = { 
    plus: Plus, edit: Edit2, trash: Trash2, power: Power, 
    x: X, search: Search, building: Building2, map: MapPin, 
    phone: Phone, check: Check
  };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.carregarFiliais();
  }

  carregarFiliais() {
    this.api.get<any[]>('/filiais').subscribe({
      next: (data) => {
        this.filiais = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  abrirModal(filial?: any) {
    if (filial) {
      this.editando = true;
      this.form = { ...filial };
    } else {
      this.editando = false;
      this.form = {
        id: null, nome: '', email: '', endereco: '',
        telefone: '', ativo: true, cor: this.getRandomColor()
      };
    }
    this.showModal = true;
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

  getRandomColor() {
    const colors = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  salvarFilial() {
    this.loading = true;
    const request = this.editando 
      ? this.api.patch(`/filiais/${this.form.id}`, this.form)
      : this.api.post('/filiais', this.form);

    request.subscribe({
      next: () => {
        this.fecharModal();
        this.carregarFiliais();
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
    this.api.patch(`/filiais/${item.id}`, { ativo: !item.ativo }).subscribe(() => {
      this.carregarFiliais();
      this.cdr.detectChanges();
    });
  }

  excluirFilial(id: number) {
    this.filialParaExcluir = this.filiais.find(f => f.id === id);
    this.showConfirmDelete = true;
  }

  confirmarExclur() {
    if (this.filialParaExcluir) {
      this.api.delete(`/filiais/${this.filialParaExcluir.id}`).subscribe(() => {
        this.carregarFiliais();
        this.fecharConfirmacao();
        this.cdr.detectChanges();
      });
    }
  }

  fecharConfirmacao() {
    this.showConfirmDelete = false;
    this.filialParaExcluir = null;
  }
}
