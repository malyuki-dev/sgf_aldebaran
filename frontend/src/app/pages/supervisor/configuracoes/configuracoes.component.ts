import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Edit2, Trash2, Search, Plus, X, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-supervisor-configuracoes',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class SupervisorConfiguracoesComponent implements OnInit {
  currentTab = 'geral';
  configForm!: FormGroup;
  novoUsuarioForm!: FormGroup;
  usuarioModal = false;
  showZerarModal = false;
  zerarInput = '';
  showSuccessModal = false;
  successMessage = '';

  icons = { edit: Edit2, trash: Trash2, search: Search, plus: Plus, x: X, check: CheckCircle };

  tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'regras', label: 'Regras da Fila' },
    { id: 'notificacoes', label: 'Notificações' },
    { id: 'usuarios', label: 'Gestão de Usuários' }
  ];

  usuariosMock = [
    { nome: 'Ana Costa', email: 'ana.costa@fila.com', perfil: 'Operador', status: 'Ativo' },
    { nome: 'Carlos Mendes', email: 'carlos.m@fila.com', perfil: 'Supervisor', status: 'Ativo' },
    { nome: 'Julia Farias', email: 'julia.f@fila.com', perfil: 'Operador', status: 'Inativo' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.configForm = this.fb.group({
      nomeFilial: ['Matriz - Centro'],
      fusoHorario: ['(GMT-03:00) Brasília'],
      modoEscuro: [false],
      sonsAlerta: [true],
      impressaoAutomatica: [true],
      
      // Regras da Fila
      tempoTolerancia: [15],
      limiteAtendimentos: [50],
      prioridadePcdIdoso: [true],
      redirecionarAusentes: [false],

      // Notificações
      notificarEmail: [true],
      notificarWhatsapp: [false]
    });

    this.novoUsuarioForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      perfil: ['', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.senhasIguais });
  }

  senhasIguais(group: FormGroup) {
    const senha = group.get('senha')?.value;
    const confirmar = group.get('confirmarSenha')?.value;
    return senha === confirmar ? null : { senhasDiferentes: true };
  }

  getTabLabel(id: string) {
    return this.tabs.find(t => t.id === id)?.label;
  }

  setTab(tabId: string) {
    this.currentTab = tabId;
  }

  salvarConfiguracoes() {
    this.showSuccessModal = true;
    this.successMessage = 'Configurações salvas com sucesso!';
  }

  salvarRegras() {
    this.showSuccessModal = true;
    this.successMessage = 'Regras de fila salvas com sucesso!';
  }

  salvarNotificacoes() {
    this.showSuccessModal = true;
    this.successMessage = 'Configurações de notificação salvas com sucesso!';
  }

  fecharSuccessModal() {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  zerarFila() {
    this.showZerarModal = true;
    this.zerarInput = '';
  }

  confirmarZerar() {
    if (this.zerarInput.trim().toUpperCase() === 'ZERAR') {
      this.showZerarModal = false;
      this.zerarInput = '';
      this.showSuccessModal = true;
      this.successMessage = 'Fila zerada com sucesso. Numeração reiniciada.';
    }
  }

  cancelarZerar() {
    this.showZerarModal = false;
    this.zerarInput = '';
  }

  abrirModalUsuario() {
    this.usuarioModal = true;
  }

  fecharModalUsuario() {
    this.usuarioModal = false;
    this.novoUsuarioForm.reset();
  }

  criarUsuario() {
    if (this.novoUsuarioForm.invalid) {
      this.novoUsuarioForm.markAllAsTouched();
      return;
    }
    const u = this.novoUsuarioForm.value;
    this.usuariosMock.push({ nome: u.nome, email: u.email, perfil: u.perfil, status: 'Ativo' });
    this.fecharModalUsuario();
    this.showSuccessModal = true;
    this.successMessage = `Usuário "${u.nome}" criado com sucesso!`;
  }
}
