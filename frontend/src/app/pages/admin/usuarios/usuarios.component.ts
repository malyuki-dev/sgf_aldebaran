import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Search, Plus, Edit2, Trash2, X, Users, Mail, Shield, UserX, CheckCircle, RefreshCw, User, Check, Building } from 'lucide-angular';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './usuarios.component.html',
    styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
    icons = {
        search: Search, plus: Plus, edit2: Edit2,
        trash2: Trash2, x: X, users: Users,
        mail: Mail, shield: Shield, userX: UserX, checkCircle: CheckCircle, refresh: RefreshCw, user: User, check: Check,
        building: Building
    };

    usuarios: any[] = [];
    filtro = '';
    loading = false;
    selectedFilialId: number | null = null;
    filiais: any[] = [];

    // Modal state
    showModal = false;
    showPasswordResetModal = false;
    showSuccessModal = false;
    successMessage = '';
    isEditing = false;

    // Form Model
    usuarioForm = {
        id: null as number | null,
        nome: '',
        email: '',
        login: '',
        senha: '',
        perfil: 'OPERADOR',
        filial_id: null as number | null
    };

    novaSenhaForm = {
        id: null as number | null,
        senha: ''
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
            this.carregarUsuarios();
        });
        this.carregarFiliais();
    }

    carregarFiliais() {
        this.api.get<any[]>(`/filiais`).subscribe({
            next: (data) => this.filiais = data.filter(f => f.ativo),
            error: (err) => console.error('Erro ao carregar filiais', err)
        });
    }

    carregarUsuarios() {
        this.loading = true;
        const filialQuery = this.selectedFilialId ? `?filialId=${this.selectedFilialId}` : '';
        this.api.get<any[]>(`/usuarios${filialQuery}`).subscribe({
            next: (data) => {
                if (this.filtro) {
                    const termo = this.filtro.toLowerCase();
                    this.usuarios = data.filter(u =>
                        u.nome.toLowerCase().includes(termo) ||
                        u.email?.toLowerCase().includes(termo) ||
                        u.login.toLowerCase().includes(termo)
                    );
                } else {
                    this.usuarios = data;
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Erro ao carregar usuários', err);
                if (err.status === 401) {
                    alert('Sessão expirada ou usuário não autenticado.');
                }
                this.loading = false;
            }
        });
    }

    buscar() {
        this.carregarUsuarios();
    }

    getPerfilColor(perfil: string) {
        switch (perfil) {
            case 'ADMIN': return '#e74c3c';
            case 'SUPERVISOR': return '#f39c12';
            default: return '#3498db';
        }
    }

    abrirModalNovo() {
        this.isEditing = false;
        this.usuarioForm = { 
            id: null, nome: '', email: '', login: '', senha: '', 
            perfil: 'OPERADOR',
            filial_id: this.selectedFilialId
        };
        this.showModal = true;
    }

    abrirModalEditar(usu: any) {
        this.isEditing = true;
        this.usuarioForm = {
            id: usu.id,
            nome: usu.nome,
            email: usu.email,
            login: usu.login,
            senha: '', // Senha goes blank on edit unless resetting
            perfil: usu.perfil,
            filial_id: usu.filial_id
        };
        this.showModal = true;
    }

    abrirModalRedefinirSenha(usu: any) {
        this.novaSenhaForm = { id: usu.id, senha: '' };
        this.showPasswordResetModal = true;
    }

    fecharModal() {
        this.showModal = false;
        this.showPasswordResetModal = false;
        this.showSuccessModal = false;
    }

    @HostListener('document:keydown.escape', ['$event'])
    onKeydownHandler(event: Event) {
        if (this.showModal || this.showPasswordResetModal || this.showSuccessModal) {
            this.fecharModal();
        }
    }

    salvar() {
        if (!this.usuarioForm.nome || !this.usuarioForm.login || !this.usuarioForm.perfil) {
            alert('Nome, Login e Perfil são obrigatórios!');
            return;
        }

        if (!this.isEditing && !this.usuarioForm.senha) {
            alert('Senha é obrigatória para novos usuários!');
            return;
        }

        if (this.isEditing) {
            // Update
            const payload = {
                nome: this.usuarioForm.nome,
                email: this.usuarioForm.email,
                login: this.usuarioForm.login,
                perfil: this.usuarioForm.perfil,
                filial_id: this.usuarioForm.filial_id
            };
            this.api.put(`/usuarios/${this.usuarioForm.id}`, payload).subscribe({
                next: () => {
                    this.showModal = false;
                    this.successMessage = 'Usuário atualizado com sucesso.';
                    this.showSuccessModal = true;
                    this.carregarUsuarios();
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            // Create
            this.api.post('/usuarios', this.usuarioForm).subscribe({
                next: () => {
                    this.showModal = false;
                    this.successMessage = 'Usuário cadastrado com sucesso.';
                    this.showSuccessModal = true;
                    this.carregarUsuarios();
                },
                error: (err) => alert('Erro ao salvar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        }
    }

    salvarNovaSenha() {
        if (!this.novaSenhaForm.senha || this.novaSenhaForm.senha.length < 6) {
            alert('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }

        this.api.patch(`/usuarios/${this.novaSenhaForm.id}/senha`, { senha: this.novaSenhaForm.senha })
            .subscribe({
                next: () => {
                    this.showPasswordResetModal = false;
                    this.successMessage = 'Senha redefinida com sucesso!';
                    this.showSuccessModal = true;
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao redefinir senha: ' + (err.error?.message || 'Erro desconhecido'))
            });
    }

    alternarStatus(id: number, statusAtual: boolean) {
        const acao = statusAtual ? 'inativar' : 'ativar';
        if (confirm(`Tem certeza que deseja ${acao} este usuário?`)) {
            this.api.patch(`/usuarios/${id}/status`, {}).subscribe({
                next: () => {
                    this.carregarUsuarios();
                    this.cdr.detectChanges();
                },
                error: (err) => alert(`Erro ao ${acao} usuário`)
            });
        }
    }

    excluirUsuario(id: number, nome: string) {
        if (confirm(`Tem certeza que deseja excluir permanentemente o usuário "${nome}"?`)) {
            this.api.delete(`/usuarios/${id}`).subscribe({
                next: () => {
                    this.carregarUsuarios();
                    this.successMessage = 'Usuário excluído com sucesso.';
                    this.showSuccessModal = true;
                    this.cdr.detectChanges();
                },
                error: (err) => alert('Erro ao excluir usuário: ' + (err.error?.message || 'Erro desconhecido'))
            });
        }
    }
}
