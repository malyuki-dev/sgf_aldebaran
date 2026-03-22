import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { LucideAngularModule, Settings, Save, Database, Bell, Power, Shield, Tv, Mail, Globe, Clock, Layout, Share2, Building2, Upload, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit {
  readonly icons = {
    settings: Settings,
    save: Save,
    database: Database,
    bell: Bell,
    power: Power,
    shield: Shield,
    tv: Tv,
    mail: Mail,
    globe: Globe,
    clock: Clock,
    layout: Layout,
    share: Share2,
    building: Building2,
    upload: Upload,
    check: CheckCircle
  };

  activeTab: 'geral' | 'notificacoes' | 'integracoes' | 'seguranca' | 'tv' | 'templates' = 'geral';

  diasDaSemanaLabels = [
    { id: 1, label: 'S', full: 'Segunda-feira' },
    { id: 2, label: 'T', full: 'Terça-feira' },
    { id: 3, label: 'Q', full: 'Quarta-feira' },
    { id: 4, label: 'Q', full: 'Quinta-feira' },
    { id: 5, label: 'S', full: 'Sexta-feira' },
    { id: 6, label: 'S', full: 'Sábado' },
    { id: 0, label: 'D', full: 'Domingo' }
  ];

  form: any = {
    // Geral
    UNIDADE_NOME: '',
    FUSO_HORARIO: 'America/Sao_Paulo',
    IDIOMA_SISTEMA: 'PT',
    TOTEM_HORARIO_INICIO: '08:00',
    TOTEM_HORARIO_FIM: '18:00',
    TOTEM_DIAS: [1, 2, 3, 4, 5], // IDs dos dias
    BACKUP_DIARIO: true,
    LOG_DETALHADO: true,
    LOGO_SISTEMA: '',

    // ... (rest remains same)
    ALERTA_WHATSAPP: true,
    ALERTA_SMS: false,
    ALERTA_EMAIL: true,
    NOTIF_CHAMADA: true,
    NOTIF_ATENDIMENTO: true,
    NOTIF_CANCELAMENTO: false,
    WHATSAPP_API_KEY: '',
    PROVEDOR_SMS: '',
    GATEWAY_PAGAMENTO: '',
    MFA_ATIVO: false,
    TEMPO_SESSAO: '60',
    POLITICA_SENHA: 'FORTE',
    TV_LAYOUT: 'PADRAO',
    TV_VIDEO_URL: '',
    MOSTRAR_NOTICIAS: true
  };

  get horarioInvalido(): boolean {
    if (!this.form.TOTEM_HORARIO_INICIO || !this.form.TOTEM_HORARIO_FIM) return false;
    return this.form.TOTEM_HORARIO_INICIO >= this.form.TOTEM_HORARIO_FIM;
  }

  loading = false;
  salvando = false;
  mostrarSucesso = false;
  filiais: any[] = [];
  selectedFilialId: number | null = null;

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.carregarFiliais();
    this.carregar();
  }

  carregarFiliais() {
    this.api.get<any[]>('/filiais').subscribe({
      next: (data) => {
        this.filiais = data;
        if (this.filiais.length > 0 && this.selectedFilialId === null) {
          // Opcional: auto-selecionar a primeira filial se desejar
          // this.selectedFilialId = this.filiais[0].id;
          // this.carregar();
        }
      },
      error: (err) => console.error('Erro ao carregar filiais', err)
    });
  }

  onFilialChange() {
    console.log('Mudando para filial:', this.selectedFilialId);
    
    // Sincronização automática do Nome da Unidade (Pedido pelo usuário)
    if (this.selectedFilialId) {
      const filialObj = this.filiais.find(f => f.id === this.selectedFilialId);
      if (filialObj) {
        // Se estiver vazio ou for o padrão, sugere o nome da filial
        if (!this.form.UNIDADE_NOME || this.form.UNIDADE_NOME.trim() === '') {
          this.form.UNIDADE_NOME = filialObj.nome;
        }
      }
    }

    this.carregar();
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('O arquivo é muito grande! Limite de 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.form.LOGO_SISTEMA = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  carregar() {
    this.loading = true;
    this.cd.detectChanges(); // Garante que spinner apareça

    const url = this.selectedFilialId ? `/configuracoes/lista?filialId=${this.selectedFilialId}` : '/configuracoes/lista';
    this.api.get<any[]>(url).subscribe({
      next: (data) => {
        // Reseta o form para garantir que valores antigos não "vazamento" entre filiais
        this.resetFormToDefaults();

        if (data && data.length > 0) {
          data.forEach(item => {
            if (this.form.hasOwnProperty(item.chave)) {
              if (item.chave === 'TOTEM_DIAS') {
                try {
                  this.form[item.chave] = JSON.parse(item.valor);
                } catch {
                  this.form[item.chave] = item.valor.split(',').map(Number);
                }
              } else if (typeof this.form[item.chave] === 'boolean') {
                this.form[item.chave] = item.valor === 'true';
              } else {
                this.form[item.chave] = item.valor;
              }
            }
          });
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar configurações', err);
        this.loading = false;
        this.cd.detectChanges();
      },
      complete: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  resetFormToDefaults() {
    this.form = {
      UNIDADE_NOME: '',
      FUSO_HORARIO: 'America/Sao_Paulo',
      IDIOMA_SISTEMA: 'PT',
      TOTEM_HORARIO_INICIO: '08:00',
      TOTEM_HORARIO_FIM: '18:00',
      TOTEM_DIAS: [1, 2, 3, 4, 5],
      BACKUP_DIARIO: true,
      LOG_DETALHADO: true,
      LOGO_SISTEMA: '',
      ALERTA_WHATSAPP: true,
      ALERTA_SMS: false,
      ALERTA_EMAIL: true,
      NOTIF_CHAMADA: true,
      NOTIF_ATENDIMENTO: true,
      NOTIF_CANCELAMENTO: false,
      WHATSAPP_API_KEY: '',
      PROVEDOR_SMS: '',
      GATEWAY_PAGAMENTO: '',
      MFA_ATIVO: false,
      TEMPO_SESSAO: '60',
      POLITICA_SENHA: 'FORTE',
      TV_LAYOUT: 'PADRAO',
      TV_VIDEO_URL: '',
      MOSTRAR_NOTICIAS: true
    };
  }

  toggleDia(id: number) {
    const idx = this.form.TOTEM_DIAS.indexOf(id);
    if (idx > -1) {
      this.form.TOTEM_DIAS.splice(idx, 1);
    } else {
      this.form.TOTEM_DIAS.push(id);
    }
  }

  isDiaSelected(id: number): boolean {
    return this.form.TOTEM_DIAS.includes(id);
  }

  salvar() {
    console.log('Salvando configurações...', this.form);
    this.salvando = true;
    this.cd.detectChanges();

    const payload = Object.keys(this.form).map(key => ({
      chave: key,
      valor: typeof this.form[key] === 'object' ? JSON.stringify(this.form[key]) : String(this.form[key])
    }));

    const url = this.selectedFilialId ? `/configuracoes/bulk?filialId=${this.selectedFilialId}` : '/configuracoes/bulk';
    this.api.post(url, { configs: payload }).subscribe({
      next: () => {
        console.log('Configurações salvas com sucesso!');
        this.salvando = false;
        this.mostrarSucesso = true;
        this.cd.detectChanges();
        
        setTimeout(() => {
          this.mostrarSucesso = false;
          this.cd.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        console.error('Erro ao salvar', err);
        this.salvando = false;
        this.cd.detectChanges();
        alert('Erro ao salvar configurações: ' + (err.message || 'Verifique sua conexão.'));
      },
      complete: () => {
        this.salvando = false;
        this.cd.detectChanges();
      }
    });
  }
}
