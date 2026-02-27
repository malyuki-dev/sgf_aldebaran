import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LucideAngularModule, Search, Plus, Filter, User, Users, Building, Phone, Edit2, AlertCircle, X, ShieldAlert, Check, Calendar } from 'lucide-angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [DatePipe],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss']
})
export class ClientesComponent implements OnInit {
  readonly icons = { search: Search, plus: Plus, filter: Filter, user: User, users: Users, building: Building, phone: Phone, edit: Edit2, alertCircle: AlertCircle, x: X, shieldAlert: ShieldAlert, check: Check, calendar: Calendar };

  clientes: any[] = [];
  loading = true;
  filtro = '';
  filtroStatus: 'TODOS' | 'ATIVOS' | 'INATIVOS' = 'TODOS';

  showModal = false;
  isEditing = false;

  // US-0002 Fields
  clienteForm = {
    id: null as number | null,
    nome: '',
    email: '',
    tipo: 'PF', // PF ou PJ
    cpf: '',
    cnpj: '',
    telefone: '',
    senha: '' // Default password placeholder logic is handled in backend, but we can allow admin to set one.
  };

  private apiUrl = `http://localhost:3000/clientes`;

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.carregarClientes();
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  carregarClientes() {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        let filtrados = data;

        if (this.filtro) {
          const termo = this.filtro.toLowerCase();
          filtrados = filtrados.filter(c =>
            c.nome.toLowerCase().includes(termo) ||
            (c.cpf && c.cpf.includes(termo)) ||
            (c.cnpj && c.cnpj.includes(termo)) ||
            (c.email && c.email.toLowerCase().includes(termo))
          );
        }

        if (this.filtroStatus === 'ATIVOS') {
          filtrados = filtrados.filter(c => c.deletedAt === null);
        } else if (this.filtroStatus === 'INATIVOS') {
          filtrados = filtrados.filter(c => c.deletedAt !== null);
        }

        this.clientes = filtrados;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar clientes', err);
        if (err.status === 401) alert('Sessão expirada ou usuário não autenticado.');
        this.loading = false;
      }
    });
  }

  abrirModalNovo() {
    this.isEditing = false;
    this.clienteForm = { id: null, nome: '', email: '', tipo: 'PF', cpf: '', cnpj: '', telefone: '', senha: '' };
    this.showModal = true;
  }

  abrirModalEditar(cliente: any) {
    this.isEditing = true;
    this.clienteForm = { ...cliente, senha: '' }; // Don't bind password on edit
    if (!this.clienteForm.tipo) this.clienteForm.tipo = (cliente.cnpj) ? 'PJ' : 'PF';
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
  }

  salvar() {
    // Basic validation
    if (!this.clienteForm.nome || !this.clienteForm.email) {
      alert('Nome e E-mail são obrigatórios!');
      return;
    }
    if (this.clienteForm.tipo === 'PF' && !this.clienteForm.cpf) {
      alert('CPF é obrigatório para Pessoa Física.'); return;
    }
    if (this.clienteForm.tipo === 'PJ' && !this.clienteForm.cnpj) {
      alert('CNPJ é obrigatório para Pessoa Jurídica.'); return;
    }

    // Build Payload depending on Type to prevent duplicate fields sending
    const payload: any = {
      nome: this.clienteForm.nome,
      email: this.clienteForm.email,
      tipo: this.clienteForm.tipo,
      telefone: this.clienteForm.telefone
    };
    if (this.clienteForm.tipo === 'PF') payload.cpf = this.clienteForm.cpf;
    if (this.clienteForm.tipo === 'PJ') payload.cnpj = this.clienteForm.cnpj;

    // Only send password if we are creating and it's filled, if empty Backend uses Default 
    if (!this.isEditing && this.clienteForm.senha) {
      payload.senha = this.clienteForm.senha;
    }

    if (this.isEditing) {
      this.http.put(`${this.apiUrl}/${this.clienteForm.id}`, payload, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            this.carregarClientes();
            this.fecharModal();
          },
          error: (err) => this.handleError(err, 'Erro ao atualizar.')
        });
    } else {
      this.http.post(this.apiUrl, payload, { headers: this.getHeaders() })
        .subscribe({
          next: () => {
            this.carregarClientes();
            this.fecharModal();
          },
          error: (err) => this.handleError(err, 'Erro ao criar cliente.')
        });
    }
  }

  alternarStatus(id: number) {
    if (confirm('Tem certeza que deseja alterar o status (Inativar/Ativar) deste cliente?')) {
      this.http.patch(`${this.apiUrl}/${id}/status`, {}, { headers: this.getHeaders() })
        .subscribe({
          next: () => this.carregarClientes(),
          error: (err) => console.error('Erro ao alterar status', err)
        });
    }
  }

  private handleError(err: any, defaultMsg: string) {
    console.error(defaultMsg, err);
    alert(err.error?.message || defaultMsg);
  }

  isAtivo(cliente: any): boolean {
    return cliente.deletedAt === null;
  }

  getDocument(cliente: any): string {
    if (cliente.cpf) return `CPF: ${cliente.cpf}`;
    if (cliente.cnpj) return `CNPJ: ${cliente.cnpj}`;
    return 'Sem Doc';
  }
}