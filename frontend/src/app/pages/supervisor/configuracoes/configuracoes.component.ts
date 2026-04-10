import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Edit2, Trash2, Search, Plus, X, CheckCircle } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { FilialService } from '../../../services/filial.service';
import { environment } from '../../../../environments/environment';

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

  selectedFilialId: number | null = null;
  private filialSub?: any;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private filialService: FilialService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.configForm = this.fb.group({
      nomeFilial: [{ value: '', disabled: true }],
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
      perfil: ['OPERADOR', Validators.required],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.senhasIguais });

    this.filialSub = this.filialService.selectedFilial$.subscribe((id: number | null) => {
      this.selectedFilialId = id;
      if (id) {
        this.carregarConfiguracoes();
      }
    });
  }

  ngOnDestroy() {
    if (this.filialSub) this.filialSub.unsubscribe();
  }

  carregarConfiguracoes() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${environment.apiUrl}/configuracao/filial/${this.selectedFilialId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (configs) => {
        const patch: any = {};
        configs.forEach(c => {
          if (c.chave === 'TEMPO_TOLERANCIA') patch.tempoTolerancia = parseInt(c.valor, 10);
          if (c.chave === 'LIMITE_ATENDIMENTOS') patch.limiteAtendimentos = parseInt(c.valor, 10);
          if (c.chave === 'PRIORIDADE_AUTOMATICA') patch.prioridadePcdIdoso = c.valor === 'true';
        });
        
        // Carrega nome da filial
        this.filialService.getFiliais().subscribe((filiais: any[]) => {
          const f = filiais.find((fl: any) => fl.id === this.selectedFilialId);
          if (f) patch.nomeFilial = f.nome;
          this.configForm.patchValue(patch);
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Erro ao carregar configurações:', err)
    });
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
    this.persistirConfiguracoes();
  }

  salvarRegras() {
    this.persistirConfiguracoes();
  }

  salvarNotificacoes() {
    this.persistirConfiguracoes();
  }

  private persistirConfiguracoes() {
    const val = this.configForm.value;
    const items = [
      { chave: 'TEMPO_TOLERANCIA', valor: String(val.tempoTolerancia) },
      { chave: 'LIMITE_ATENDIMENTOS', valor: String(val.limiteAtendimentos) },
      { chave: 'PRIORIDADE_AUTOMATICA', valor: String(val.prioridadePcdIdoso) }
    ];

    const token = localStorage.getItem('token') || '';
    this.http.post(`${environment.apiUrl}/configuracao/batch`, {
      filialId: this.selectedFilialId,
      configs: items
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.showSuccessModal = true;
        this.successMessage = 'Configurações salvas com sucesso!';
        this.cdr.detectChanges();
      },
      error: (err) => alert('Erro ao salvar configurações')
    });
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
      const token = localStorage.getItem('token') || '';
      this.http.post(`${environment.apiUrl}/fila/reset`, { filialId: this.selectedFilialId }, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({
        next: () => {
          this.showZerarModal = false;
          this.zerarInput = '';
          this.showSuccessModal = true;
          this.successMessage = 'Fila zerada com sucesso. Numeração reiniciada.';
          this.cdr.detectChanges();
        }
      });
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
    const val = this.novoUsuarioForm.value;
    const payload = {
      nome: val.nome,
      email: val.email,
      login: val.email.split('@')[0], // Fallback login
      senha: val.senha,
      perfil: val.perfil,
      filial_id: this.selectedFilialId
    };

    const token = localStorage.getItem('token') || '';
    this.http.post(`${environment.apiUrl}/usuarios`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.fecharModalUsuario();
        this.showSuccessModal = true;
        this.successMessage = `Usuário "${val.nome}" criado com sucesso!`;
        this.cdr.detectChanges();
      }
    });
  }
}
