import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
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
    selectedFilialId: number | null = null;

    // Modal state
    showModal = false;
    showSuccessModal = false;
    isEditing = false;

    // Form Model
    caminhaoForm = {
        id: null as number | null,
        placa: '',
        modelo: '',
        transportadora: '',
        capacidade: '',
        status: 'ATIVO',
        observacoes: '',
        motorista_id: null as number | null,
        filial_id: null as number | null
    };

    constructor(
        private api: ApiService, 
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const fid = params.get('filialId');
            this.selectedFilialId = fid ? Number(fid) : null;
            this.carregarDados();
            this.carregarMotoristas();
        });
    }

    carregarDados() {
        this.loading = true;
        const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
        this.api.get<any[]>(`/caminhoes${filialQuery}`).subscribe({
            next: (data) => {
                if (this.filtro) {
                    const termo = this.filtro.toLowerCase();
                    this.caminhoes = data.filter(c => 
                        c.placa.toLowerCase().includes(termo) ||
                        c.modelo.toLowerCase().includes(termo) ||
                        c.transportadora.toLowerCase().includes(termo)
                    );
                } else {
                    this.caminhoes = data;
                }
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
            this.api.get<{exists: boolean}>(`/caminhoes/check`, {
                placa
            }).subscribe(res => {
                if (res.exists) {
                    alert('Placa já cadastrada no sistema!');
                }
            });
        }
    }

    carregarMotoristas() {
        const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
        this.api.get<any[]>(`/motoristas${filialQuery}`).subscribe({
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
            id: null, placa: '', modelo: '', transportadora: '', capacidade: '', status: 'ATIVO', observacoes: '', motorista_id: null, filial_id: this.selectedFilialId
        };
        this.showModal = true;
    }

    abrirModalEditar(cam: any) {
        this.isEditing = true;
        this.caminhaoForm = { ...cam };
        if (this.caminhaoForm.filial_id === undefined) this.caminhaoForm.filial_id = null;
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
        const payload = {
            ...payloadData,
            filial_id: this.caminhaoForm.filial_id ? Number(this.caminhaoForm.filial_id) : null,
            motorista_id: this.caminhaoForm.motorista_id ? Number(this.caminhaoForm.motorista_id) : null,
            observacoes: this.caminhaoForm.observacoes || ''
        };

        if (this.isEditing) {
            this.api.patch(`/caminhoes/${this.caminhaoForm.id}`, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarDados();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            this.api.post('/caminhoes', payload).subscribe({
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
        this.api.patch(`/caminhoes/${id}/status`, {}).subscribe({
            next: () => {
                this.carregarDados();
                this.cdr.detectChanges();
            },
            error: (err) => alert('Erro ao alterar status')
        });
    }
}
