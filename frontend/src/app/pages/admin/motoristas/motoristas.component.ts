import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
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
    selectedFilialId: number | null = null;

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
        ativo: true,
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
            this.carregarMotoristas();
        });
    }

    carregarMotoristas() {
        this.loading = true;
        const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
        this.api.get<any[]>(`/motoristas${filialQuery}`).subscribe({
            next: (data) => {
                if (this.filtro) {
                    const termo = this.filtro.toLowerCase();
                    this.motoristas = data.filter(m => 
                        m.nome.toLowerCase().includes(termo) ||
                        m.cpf.includes(termo) ||
                        m.cnh.includes(termo)
                    );
                } else {
                    this.motoristas = data;
                }
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
            this.api.get<{exists: boolean}>(`/motoristas/check`, {
                cpf: cpf || '', cnh: cnh || ''
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
        this.motoristaForm = { 
            id: null, nome: '', cpf: '', cnh: '', email: '', 
            telefone: '', transportadora: '', ativo: true, 
            filial_id: this.selectedFilialId 
        };
        this.showModal = true;
    }

    abrirModalEditar(mot: any) {
        this.isEditing = true;
        this.motoristaForm = { ...mot };
        if (this.motoristaForm.filial_id === undefined) this.motoristaForm.filial_id = null;
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
        const { id, ...payloadData } = this.motoristaForm;
        const payload = {
            ...payloadData,
            filial_id: this.motoristaForm.filial_id ? Number(this.motoristaForm.filial_id) : null,
            email: this.motoristaForm.email || '',
            telefone: this.motoristaForm.telefone || '',
            transportadora: this.motoristaForm.transportadora || ''
        };

        if (this.isEditing) {
            this.api.patch(`/motoristas/${this.motoristaForm.id}`, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.showSuccessModal = true;
                    this.carregarMotoristas();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            this.api.post('/motoristas', payload).subscribe({
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
        this.api.patch(`/motoristas/${id}/status`, {}).subscribe({
            next: () => {
                this.carregarMotoristas();
                this.cdr.detectChanges();
            },
            error: (err) => alert('Erro ao alterar status')
        });
    }
}
