import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import {
  LucideAngularModule,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  MapPin,
  Tag,
  RefreshCcw,
} from 'lucide-angular';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-comprovante',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './comprovante.component.html',
  styleUrl: './comprovante.component.scss'
})
export class ComprovanteComponent implements OnInit, OnDestroy {
  dados: any = null;
  agendamentoId: number | null = null;
  loading = true;
  carregandoSilencioso = false;
  erro = '';
  qrCodeImage: string = '';
  codigoCheckinExibicao: string = '';
  ultimaAtualizacao: Date | null = null;
  private qrTextoAtual = '';
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private readonly refreshMs = 10000;
  private requisicaoEmAndamento = false;
  private recargaPendente = false;

  readonly icons = {
    calendar: Calendar,
    clock: Clock,
    user: User,
    file: FileText,
    check: CheckCircle,
    map: MapPin,
    tag: Tag,
    refresh: RefreshCcw,
  };

  constructor(private route: ActivatedRoute, private api: ApiService) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isFinite(id) || id <= 0) {
        this.loading = false;
        this.erro = 'ID de agendamento invalido.';
        this.pararAtualizacaoAutomatica();
        return;
      }

      this.agendamentoId = id;
      this.carregarVoucher(true);
      this.iniciarAtualizacaoAutomatica();
    });
  }

  ngOnDestroy() {
    this.pararAtualizacaoAutomatica();
  }

  private iniciarAtualizacaoAutomatica() {
    this.pararAtualizacaoAutomatica();
    this.refreshHandle = setInterval(() => {
      this.carregarVoucher(false);
    }, this.refreshMs);
  }

  private pararAtualizacaoAutomatica() {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  recarregarAgora() {
    if (!this.requisicaoEmAndamento) {
      this.carregarVoucher(false);
      return;
    }

    this.recargaPendente = true;
  }

  private carregarVoucher(mostrarLoading: boolean) {
    if (!this.agendamentoId) return;

    if (this.requisicaoEmAndamento) {
      if (!mostrarLoading) {
        this.recargaPendente = true;
      }
      return;
    }

    this.erro = '';
    this.requisicaoEmAndamento = true;
    if (mostrarLoading) {
      this.loading = true;
    } else {
      this.carregandoSilencioso = true;
    }

    this.api.get<any>(`/fila/agendamento/${this.agendamentoId}`).subscribe({
      next: async (res) => {
        this.dados = res;

        const codigoCheckin = this.obterCodigoCheckin(res);
        this.codigoCheckinExibicao = codigoCheckin.startsWith('#')
          ? codigoCheckin
          : `#${codigoCheckin}`;

        // QR do voucher representa o mesmo valor aceito no check-in manual.
        if (codigoCheckin !== this.qrTextoAtual) {
          this.qrTextoAtual = codigoCheckin;
          await this.gerarQR(codigoCheckin);
        }

        this.ultimaAtualizacao = new Date();
        this.loading = false;
        this.carregandoSilencioso = false;
        this.finalizarRequisicao();
      },
      error: () => {
        this.loading = false;
        this.carregandoSilencioso = false;
        this.erro = 'Nao foi possivel carregar o voucher agora.';
        this.finalizarRequisicao();
      },
    });
  }

  private finalizarRequisicao() {
    this.requisicaoEmAndamento = false;

    if (this.recargaPendente) {
      this.recargaPendente = false;
      this.carregarVoucher(false);
    }
  }

  getTextoAtualizacao(): string {
    if (this.carregandoSilencioso) return 'Atualizando dados...';
    if (!this.ultimaAtualizacao)
      return 'Atualizacao automatica a cada 10 segundos';

    const hora = this.ultimaAtualizacao.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `Atualizado as ${hora}`;
  }

  get podeAtualizar(): boolean {
    return !this.requisicaoEmAndamento && !this.loading;
  }

  private obterCodigoCheckin(dados: any): string {
    const codigo = String(dados?.codigo || '').trim().toUpperCase();
    if (codigo) return codigo;
    // Compatibilidade para registros antigos sem codigo persistido.
    return `AGENDAMENTO:${dados?.id}`;
  }

  async gerarQR(texto: string) {
    try {
      this.qrCodeImage = await QRCode.toDataURL(texto, { width: 220, margin: 1 });
    } catch (err) {
      console.error(err);
    }
  }

  getDataFormatada(): string {
    if (!this.dados?.data) return '-';
    const data = new Date(`${this.dados.data}T12:00:00`);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getHorarioExibicao(): string {
    const hora = String(this.dados?.hora || '').trim();
    if (!hora) return '-';
    if (hora.includes('-')) return hora;
    const [hRaw, mRaw] = hora.split(':');
    const h = Number(hRaw);
    const m = Number(mRaw || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hora;
    const fimH = (h + 1).toString().padStart(2, '0');
    const iniH = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    return `${iniH}:${mm} - ${fimH}:${mm}`;
  }

  getLocalExibicao(): string {
    return this.dados?.filial?.nome || 'Matriz - Centro';
  }

  getStatusLabel(): string {
    const status = String(this.dados?.status || '').toUpperCase();
    if (status === 'PENDENTE') return 'Aguardando check-in';
    if (status === 'CONFIRMADO') return 'Check-in realizado';
    if (status === 'REALIZADO') return 'Atendimento realizado';
    if (status === 'CANCELADO') return 'Cancelado';
    return this.dados?.status || '-';
  }

  getStatusClass(): string {
    const status = String(this.dados?.status || '').toUpperCase();
    if (status === 'REALIZADO') return 'status-ok';
    if (status === 'CANCELADO') return 'status-cancel';
    if (status === 'CONFIRMADO') return 'status-confirm';
    return 'status-pending';
  }
}