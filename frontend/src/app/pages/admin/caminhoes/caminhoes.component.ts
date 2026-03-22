import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// We fix the import to point to the correct environment structure we will assume if not existent, or just omit if no env is generated yet. 
// Assuming the backend runs on 3000 since we saw NestJS. Let's use a standard default approach or environment
import { LucideAngularModule, Search, Plus, Edit2, Trash2, X, Truck, UserCircle, Hash, Briefcase, Users, User, CheckCircle, Check } from 'lucide-angular';

@Component({
    selector: 'app-caminhoes',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './caminhoes.component.html',
    styleUrls: ['./caminhoes.component.scss']
})
export class CaminhoesComponent implements OnInit {
    icons = { search: Search, plus: Plus, edit2: Edit2, trash2: Trash2, x: X, truck: Truck, userCircle: UserCircle, hash: Hash, briefcase: Briefcase, users: Users, user: User, checkCircle: CheckCircle, check: Check };

    caminhoes: any[] = [];
    motoristas: any[] = []; // for dropdown
    filtro = '';
    loading = false;

    // Modal state
    showModal = false;
    showSuccessModal = false;
    isEditing = false;

    // Form Model
    caminhaoForm = {
        id: null,
        placa: '',
        modelo: '',
        transportadora: '',
        capacidade: '',
        status: 'ATIVO',
        observacoes: '',
        motorista_id: null
    };

    private apiUrl = `http://localhost:3000/caminhoes`;
    private motoristasUrl = `http://localhost:3000/motoristas`;

    constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.carregarDados();
        this.carregarMotoristas();
    }

    carregarDados() {
        this.loading = true;
        const url = this.filtro ? `${this.apiUrl}?q=${this.filtro}` : this.apiUrl;

        this.http.get<any[]>(url).subscribe({
            next: (data) => {
                this.caminhoes = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao carregar', err);
                this.loading = false;
            }
        });
    }

    checkPlaca() {
        if (this.isEditing) return;
        const placa = this.caminhaoForm.placa;
        if (placa && (placa.length >= 7)) {
            this.http.get<{exists: boolean}>(`${this.apiUrl}/check`, {
                params: { placa }
            }).subscribe(res => {
                if (res.exists) {
                    alert('Placa já cadastrada no sistema!');
                }
            });
        }
    }

    carregarMotoristas() {
        this.http.get<any[]>(this.motoristasUrl).subscribe({
            next: (data) => {
                this.motoristas = data;
                this.cdr.detectChanges();
            },
            error: (err) => console.error(err)
        });
    }

    buscar() {
        this.carregarDados();
    }

    abrirModalNovo() {
        this.isEditing = false;
        this.caminhaoForm = {
            id: null, placa: '', modelo: '', transportadora: '', capacidade: '', status: 'ATIVO', observacoes: '', motorista_id: null
        };
        this.showModal = true;
    }

    abrirModalEditar(cam: any) {
        this.isEditing = true;
        this.caminhaoForm = { ...cam };
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
        if (!this.caminhaoForm.placa || !this.caminhaoForm.modelo || !this.caminhaoForm.transportadora || !this.caminhaoForm.capacidade) {
            alert('Placa, Modelo, Transportadora e Capacidade são obrigatórios!');
            return;
        }

        const { id, ...payloadData } = this.caminhaoForm;
        const payload: any = {
            ...payloadData,
            observacoes: this.caminhaoForm.observacoes || ''
        };
        if (payload.motorista_id) {
            payload.motorista_id = Number(payload.motorista_id);
        } else {
            payload.motorista_id = null;
        }

        if (this.isEditing) {
            this.http.put(`${this.apiUrl}/${this.caminhaoForm.id}`, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarDados();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            this.http.post(this.apiUrl, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarDados();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao salvar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        }
    }

    alternarStatus(id: number) {
        this.http.patch(`${this.apiUrl}/${id}/status`, {}).subscribe({
            next: () => {
                this.carregarDados();
                this.cdr.detectChanges();
            },
            error: (err) => alert('Erro ao alterar status')
        });
    }
}
