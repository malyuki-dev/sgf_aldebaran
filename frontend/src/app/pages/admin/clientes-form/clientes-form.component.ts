import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, User, FileText, Phone, Mail, MapPin, Save, X, ArrowLeft } from 'lucide-angular';

@Component({
  selector: 'app-clientes-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clientes-form.component.html',
  styleUrl: './clientes-form.component.scss'
})
export class ClientesFormComponent implements OnInit {
  form = {
    id: null,
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    endereco: '',
    ativo: true
  };

  loading = false;
  modoEdicao = false;

  readonly icons = { user: User, file: FileText, phone: Phone, mail: Mail, map: MapPin, save: Save, x: X, back: ArrowLeft };

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'novo') {
      this.modoEdicao = true;
      this.carregarCliente(id);
    }
  }

  carregarCliente(id: string) {
    this.loading = true;
    this.api.get<any>(`/clientes/${id}`).subscribe({
      next: (res) => {
        this.form = res;
        this.loading = false;
      },
      error: (err) => {
        alert('Erro ao carregar cliente.');
        this.router.navigate(['/admin/clientes']);
      }
    });
  }

  salvar() {
    if (!this.form.nome || !this.form.documento || !this.form.email) {
      alert('Preencha os campos obrigatórios (*)');
      return;
    }

    this.loading = true;
    const request = this.modoEdicao
      ? this.api.patch(`/clientes/${this.form.id}`, this.form)
      : this.api.post('/clientes', this.form);

    request.subscribe({
      next: () => {
        alert('Cliente salvo com sucesso!');
        this.router.navigate(['/admin/clientes']);
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Erro ao salvar.');
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/clientes']);
  }

  // --- MÁSCARAS INTELIGENTES ---

  mascaraDocumento(event: any) {
    let v = event.target.value.replace(/\D/g, '');
    
    if (v.length <= 11) { // CPF
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else { // CNPJ
      v = v.substring(0, 14);
      v = v.replace(/^(\d{2})(\d)/, '$1.$2');
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    this.form.documento = v;
  }

  mascaraTelefone(event: any) {
    let v = event.target.value.replace(/\D/g, '');
    v = v.substring(0, 11);
    
    if (v.length > 10) { // Celular (9 digitos)
      v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (v.length > 5) { // Fixo ou incompleto
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    this.form.telefone = v;
  }
}