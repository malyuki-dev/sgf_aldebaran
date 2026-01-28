import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- IMPORTAR ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Users, Search, Plus, Edit, Trash2, Filter, X } from 'lucide-angular';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  clientes: any[] = [];
  loading = false;

  // Filtros
  filtros = {
    nome: '',
    documento: '',
    status: 'todos'
  };

  readonly icons = { 
    users: Users, 
    search: Search, 
    plus: Plus, 
    edit: Edit, 
    trash: Trash2, 
    filter: Filter, 
    x: X 
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef // <--- INJETAR AQUI
  ) {}

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.loading = true;
    
    let query = '?';
    if (this.filtros.nome) query += `nome=${this.filtros.nome}&`;
    if (this.filtros.documento) query += `documento=${this.filtros.documento}&`;
    
    this.api.get<any[]>(`/clientes${query}`).subscribe({
      next: (data) => {
        if (this.filtros.status !== 'todos') {
          const isAtivo = this.filtros.status === 'ativo';
          this.clientes = data.filter(c => c.ativo === isAtivo);
        } else {
          this.clientes = data;
        }
        this.loading = false;
        
        // O PULO DO GATO: Força a tela atualizar AGORA
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Erro ao buscar clientes', err);
        this.loading = false;
        this.cdr.detectChanges(); // Atualiza mesmo com erro (para tirar o loading)
      }
    });
  }

  limparFiltros() {
    this.filtros = { nome: '', documento: '', status: 'todos' };
    this.buscar();
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.api.delete(`/clientes/${id}`).subscribe({
        next: () => {
          alert('Cliente excluído com sucesso!');
          this.buscar();
        },
        error: () => alert('Erro ao excluir. Verifique se o cliente possui vínculos.')
      });
    }
  }

  novoCliente() {
    this.router.navigate(['/admin/clientes/novo']);
  }

  editar(id: number) {
    this.router.navigate(['/admin/clientes', id]);
  }
}