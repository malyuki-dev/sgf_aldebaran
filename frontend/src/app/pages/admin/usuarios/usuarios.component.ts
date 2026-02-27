import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LucideAngularModule, Search, Plus, Edit2, Trash2, X, Users, Mail, Shield, UserX, CheckCircle, RefreshCw } from 'lucide-angular';

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
        mail: Mail, shield: Shield, userX: UserX, checkCircle: CheckCircle, refresh: RefreshCw
    };

    usuarios: any[] = [];
    filtro = '';
    loading = false;

    // Modal state
    showModal = false;
    showPasswordResetModal = false;
    isEditing = false;

    // Form Model
    usuarioForm = {
        id: null as number | null,
        nome: '',
        email: '',
        login: '',
        senha: '',
        perfil: 'OPERADOR'
    };

    novaSenhaForm = {
        id: null as number | null,
        senha: ''
    };

    private apiUrl = `http://localhost:3000/usuarios`;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.carregarUsuarios();
    }

    private getHeaders() {
        // In a real app, this token would come from an AuthService
        const token = localStorage.getItem('token') || '';
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    carregarUsuarios() {
        this.loading = true;
        // In this basic version without advanced JWT setup in frontend yet, we just pass the headers.
        this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
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
            },
            error: (err) => {
                console.error('Erro ao carregar usuários', err);
                // Temporary workaround if JWT fails because it's not set in localstorage in the mocked app
                // We'll alert the user or fallback.
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
        this.usuarioForm = { id: null, nome: '', email: '', login: '', senha: '', perfil: 'OPERADOR' };
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
            perfil: usu.perfil
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

        const headers = this.getHeaders();

        if (this.isEditing) {
            // Update
            const payload = {
                nome: this.usuarioForm.nome,
                email: this.usuarioForm.email,
                login: this.usuarioForm.login,
                perfil: this.usuarioForm.perfil
            };
            this.http.put(`${this.apiUrl}/${this.usuarioForm.id}`, payload, { headers }).subscribe({
                next: () => {
                    this.fecharModal();
                    this.carregarUsuarios();
                },
                error: (err) => alert('Erro ao atualizar: ' + (err.error?.message || 'Erro desconhecido'))
            });
        } else {
            // Create
            this.http.post(this.apiUrl, this.usuarioForm, { headers }).subscribe({
                next: () => {
                    this.fecharModal();
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

        this.http.patch(`${this.apiUrl}/${this.novaSenhaForm.id}/senha`, { senha: this.novaSenhaForm.senha }, { headers: this.getHeaders() })
            .subscribe({
                next: () => {
                    alert('Senha redefinida com sucesso!');
                    this.fecharModal();
                },
                error: (err) => alert('Erro ao redefinir senha: ' + (err.error?.message || 'Erro desconhecido'))
            });
    }

    alternarStatus(id: number, statusAtual: boolean) {
        const acao = statusAtual ? 'inativar' : 'ativar';
        if (confirm(`Tem certeza que deseja ${acao} este usuário?`)) {
            this.http.patch(`${this.apiUrl}/${id}/status`, {}, { headers: this.getHeaders() }).subscribe({
                next: () => this.carregarUsuarios(),
                error: (err) => alert(`Erro ao ${acao} usuário`)
            });
        }
    }
}
