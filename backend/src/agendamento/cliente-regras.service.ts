import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfiguracaoService } from '../configuracao/configuracao.service';
import { buildAgendamentoDate } from './mappers/agendamento-response.mapper';

@Injectable()
export class ClienteRegrasService {
  private static readonly ANTECEDENCIA_MINIMA_AGENDAMENTO_MINUTOS = 120;
  private static readonly JANELA_CHECKIN_MINUTOS = 120;

  constructor(private readonly configuracaoService: ConfiguracaoService) {}

  async validarAgendamentoCliente(params: {
    data: string;
    hora: string;
    filialId?: number | null;
    now?: Date;
  }): Promise<void> {
    const configs = await this.getConfigMap(params.filialId);
    const dataHora = buildAgendamentoDate(params.data, params.hora);
    const now = params.now || new Date();

    this.validarDiaAtivo(params.data, configs);
    this.validarHorarioFuncionamento(params.hora, configs);
    this.validarAntecedenciaMinima(dataHora, now);
  }

  async validarCheckinCliente(params: {
    data: string;
    hora: string;
    filialId?: number | null;
    now?: Date;
  }): Promise<void> {
    const configs = await this.getConfigMap(params.filialId);
    const dataHora = buildAgendamentoDate(params.data, params.hora);
    const now = params.now || new Date();

    this.validarDiaAtivo(params.data, configs);
    this.validarHorarioFuncionamento(params.hora, configs);
    this.validarJanelaCheckin(dataHora, now);
  }

  async isHorarioDisponivelParaAgendamento(params: {
    data: string;
    hora: string;
    filialId?: number | null;
    now?: Date;
  }): Promise<boolean> {
    try {
      await this.validarAgendamentoCliente(params);
      return true;
    } catch {
      return false;
    }
  }

  private async getConfigMap(filialId?: number | null): Promise<Record<string, string>> {
    const configs = await this.configuracaoService.findAllList(filialId);
    return configs.reduce<Record<string, string>>((acc, item) => {
      acc[item.chave] = item.valor;
      return acc;
    }, {});
  }

  private validarDiaAtivo(data: string, configs: Record<string, string>): void {
    const diasPermitidos = this.parseDiasPermitidos(configs['TOTEM_DIAS']);
    const dataObj = new Date(`${data}T12:00:00`);

    if (!diasPermitidos.includes(dataObj.getDay())) {
      throw new BadRequestException('Esta filial nao atende no dia selecionado.');
    }
  }

  private validarHorarioFuncionamento(
    hora: string,
    configs: Record<string, string>,
  ): void {
    const inicio = this.parseTime(configs['TOTEM_HORARIO_INICIO'] || '08:00');
    const fim = this.parseTime(configs['TOTEM_HORARIO_FIM'] || '18:00');
    const atual = this.parseTime(hora);

    if (atual < inicio || atual >= fim) {
      throw new BadRequestException(
        'Horario fora do periodo de funcionamento da filial.',
      );
    }
  }

  private validarAntecedenciaMinima(dataHora: Date, now: Date): void {
    const minimoMs =
      ClienteRegrasService.ANTECEDENCIA_MINIMA_AGENDAMENTO_MINUTOS * 60 * 1000;

    if (dataHora.getTime() < now.getTime() + minimoMs) {
      throw new BadRequestException(
        'Agendamentos devem respeitar antecedencia minima de 2 horas.',
      );
    }
  }

  private validarJanelaCheckin(dataHora: Date, now: Date): void {
    const inicioMs = dataHora.getTime();
    const nowMs = now.getTime();
    const aberturaMs =
      inicioMs - ClienteRegrasService.JANELA_CHECKIN_MINUTOS * 60 * 1000;

    if (nowMs < aberturaMs) {
      throw new BadRequestException(
        'Check-in disponivel apenas nas 2 horas anteriores ao agendamento',
      );
    }

    if (inicioMs < nowMs) {
      throw new BadRequestException('Agendamento expirado nao permite check-in');
    }
  }

  private parseDiasPermitidos(raw?: string): number[] {
    if (!raw) return [1, 2, 3, 4, 5];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [1, 2, 3, 4, 5];
    } catch {
      return [1, 2, 3, 4, 5];
    }
  }

  private parseTime(timeStr: string): number {
    const cleanTime = String(timeStr || '').trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    const timePart = cleanTime.replace('AM', '').replace('PM', '').trim();
    const [hourRaw, minuteRaw] = timePart.split(':').map(Number);
    let hours = hourRaw || 0;
    const minutes = minuteRaw || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }
}
