import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { FilialService } from '../../../services/filial.service';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Settings, Save, Database, Bell, Power, Shield, Tv, Mail, Globe, Clock, Layout, Share2, Building2, Upload, CheckCircle } from 'lucide-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './configuracoes.component.html',
  styleUrls: ['./configuracoes.component.scss']
})
export class ConfiguracoesComponent implements OnInit, OnDestroy {
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

  get horarioInvalido(): boolean {
    if (!this.form.TOTEM_HORARIO_INICIO || !this.form.TOTEM_HORARIO_FIM) return false;
    return this.form.TOTEM_HORARIO_INICIO >= this.form.TOTEM_HORARIO_FIM;
  }

  loading = false;
  salvando = false;
  mostrarSucesso = false;
  filiais: any[] = [];
  selectedFilialId: number | null = null;
  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private filialService: FilialService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Escuta mudanças de filial via URL (Query Params)
    this.subs.add(
      this.route.queryParamMap.subscribe(params => {
        const fid = params.get('filialId');
        this.selectedFilialId = fid ? Number(fid) : null;
        this.carregar();
      })
    );

    // Carrega lista de filiais do serviço compartilhado
    this.subs.add(
      this.filialService.getFiliais().subscribe(data => {
        this.filiais = data;
        this.cd.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onFilialChange() {
    // Notifica o serviço global sobre a mudança feita localmente nesta página
    this.filialService.setSelectedFilial(this.selectedFilialId);
    
    // Atualiza a URL com o novo filialId
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filialId: this.selectedFilialId },
      queryParamsHandling: 'merge'
    });

    // Sugestão automática do nome da unidade baseada na filial selecionada
    if (this.selectedFilialId) {
      const filialObj = this.filiais.find(f => f.id === this.selectedFilialId);
      if (filialObj && (!this.form.UNIDADE_NOME || this.form.UNIDADE_NOME.trim() === '')) {
        this.form.UNIDADE_NOME = filialObj.nome;
      }
    }
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
    this.cd.detectChanges();

    const url = this.selectedFilialId ? `/configuracoes/lista?filialId=${this.selectedFilialId}` : '/configuracoes/lista';
    this.api.get<any[]>(url).subscribe({
      next: (data) => {
        this.resetFormToDefaults();

        if (data && data.length > 0) {
          data.forEach(item => {
            if (this.form.hasOwnProperty(item.chave)) {
              if (item.chave === 'TOTEM_DIAS') {
                try {
                  this.form[item.chave] = JSON.parse(item.valor);
                } catch {
                  const values = String(item.valor).split(',');
                  this.form[item.chave] = values.map(v => Number(v.trim()));
                }
              } else if (typeof this.form[item.chave] === 'boolean') {
                this.form[item.chave] = String(item.valor) === 'true';
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
    this.salvando = true;
    this.cd.detectChanges();

    const payload = Object.keys(this.form).map(key => ({
      chave: key,
      valor: typeof this.form[key] === 'object' ? JSON.stringify(this.form[key]) : String(this.form[key])
    }));

    const url = this.selectedFilialId ? `/configuracoes/bulk?filialId=${this.selectedFilialId}` : '/configuracoes/bulk';
    this.api.post(url, { configs: payload }).subscribe({
      next: () => {
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
