import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Search, Plus, Edit2, Trash2, X, Users, Briefcase, Hash, User, CheckCircle, Truck, Check } from 'lucide-angular';

@Component({
    selector: 'app-motoristas',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './motoristas.component.html',
    styleUrls: ['./motoristas.component.scss']
})
export class MotoristasComponent implements OnInit {
    icons = { search: Search, plus: Plus, edit2: Edit2, trash2: Trash2, x: X, users: Users, briefcase: Briefcase, hash: Hash, user: User, checkCircle: CheckCircle, truck: Truck, check: Check };

    motoristas: any[] = [];
    filtro = '';
    loading = false;

    // Modal state
    showModal = false;
    showSuccessModal = false;
    isEditing = false;

    // Form Model
    motoristaForm = {
        id: null as number | null,
        nome: '',
        cpf: '',
        cnh: '',
        email: '',
        telefone: '',
        transportadora: '',
        ativo: true
    };

    private apiUrl = `http://localhost:3000/motoristas`;

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.carregarMotoristas();
    }

    carregarMotoristas() {
        this.loading = true;
        const url = this.filtro ? `${this.apiUrl}?q=${this.filtro}` : this.apiUrl;

        this.http.get<any[]>(url).subscribe({
            next: (data) => {
                this.motoristas = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao carregar motoristas', err);
                this.loading = false;
            }
        });
    }

    checkIdentidade() {
        if (this.isEditing) return;
        
        const cpf = this.motoristaForm.cpf;
        const cnh = this.motoristaForm.cnh;
        
        if (cpf?.length === 11 || cnh?.length === 11) {
            this.http.get<{exists: boolean}>(`${this.apiUrl}/check`, {
                params: { cpf: cpf || '', cnh: cnh || '' }
            }).subscribe(res => {
                if (res.exists) {
                    alert('CPF ou CNH já cadastrado para outro motorista!');
                }
            });
        }
    }

    buscar() {
        this.carregarMotoristas();
    }

    abrirModalNovo() {
        this.isEditing = false;
        this.motoristaForm = { id: null, nome: '', cpf: '', cnh: '', email: '', telefone: '', transportadora: '', ativo: true };
        this.showModal = true;
    }

    abrirModalEditar(mot: any) {
        this.isEditing = true;
        this.motoristaForm = { ...mot };
        this.showModal = true;
    }

    fecharModal() {
        this.showModal = false;
        this.showSuccessModal = false;
    }

    @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: Event) {
        if (this.showModal || this.showSuccessModal) {
            this.fecharModal();
        }
    }

    salvar() {
        if (!this.motoristaForm.nome || !this.motoristaForm.cpf || !this.motoristaForm.cnh) {
            alert('Nome, CPF e CNH são obrigatórios!');
            return;
        }
        const { id, ...payload } = this.motoristaForm;
        const finalPayload = {
            ...payload,
            email: this.motoristaForm.email || '',
            telefone: this.motoristaForm.telefone || '',
            transportadora: this.motoristaForm.transportadora || ''
        };

        if (this.isEditing) {
            this.http.put(`${this.apiUrl}/${this.motoristaForm.id}`, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarMotoristas();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            this.http.post(this.apiUrl, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarMotoristas();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao salvar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        }
    }

    alternarStatus(id: number) {
        this.http.patch(`${this.apiUrl}/${id}/status`, {}).subscribe({
            next: () => {
                this.carregarMotoristas();
                this.cdr.detectChanges();
            },
            error: (err) => alert('Erro ao alterar status')
        });
    }
}
