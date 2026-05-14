import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ServicoSenha = {
  id: number;
  nome?: string | null;
  sigla?: string | null;
  prefixo?: string | null;
  prioridadePeso?: number | null;
};

type GerarSenhaAgendamentoParams = {
  servico: ServicoSenha;
  filialId?: number | null;
  agendamentoId: number;
};

@Injectable()
export class SenhaService {
  constructor(private readonly prisma: PrismaService) {}

  async gerarSenhaCliente(params: GerarSenhaAgendamentoParams) {
    return this.gerarSenhaAgendamento(params);
  }

  async gerarSenhaAgendamento(params: GerarSenhaAgendamentoParams) {
    const filialId = params.filialId ?? null;
    const configBonus = await this.buscarConfiguracaoComFallback(
      'BONUS_PRIORIDADE_AGENDAMENTO',
      filialId,
    );
    const bonus = Number(configBonus?.valor) || 2;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const configZerar = await this.buscarConfiguracaoComFallback(
      'DATA_ZERAR_FILA',
      filialId,
    );
    const dataZerar = configZerar ? new Date(configZerar.valor) : hoje;
    const effectiveStart = dataZerar > hoje ? dataZerar : hoje;

    const count = await this.prisma.senha.count({
      where: {
        servico_id: params.servico.id,
        filial_id: filialId,
        dataCriacao: { gte: effectiveStart },
      },
    });

    const configMod = await this.buscarConfiguracaoComFallback(
      'MODIFICADOR_AGENDAMENTO',
      filialId,
    );
    const modificador = configMod?.valor || 'A';
    const codigoCategoria = this.obterCodigoCategoria(
      params.servico.prefixo,
      params.servico.sigla,
      params.servico.nome,
    );
    const sequencial = (count + 1).toString().padStart(3, '0');
    const numeroDisplay = `C-${codigoCategoria}${modificador}${sequencial}`;

    return this.prisma.senha.create({
      data: {
        numeroDisplay,
        status: 'AGUARDANDO',
        tipo: 'Convencional',
        tipoOrigem: 'AGENDAMENTO',
        prioridade: (params.servico.prioridadePeso || 0) + bonus,
        servico: { connect: { id: params.servico.id } },
        filial: filialId ? { connect: { id: filialId } } : undefined,
        agendamento: { connect: { id: params.agendamentoId } },
      },
    });
  }

  async calcularPosicao(senhaId: number, servicoId: number, filialId?: number | null) {
    const senha = await this.prisma.senha.findUnique({
      where: { id: senhaId },
      select: { id: true },
    });

    if (!senha) {
      throw new BadRequestException('Senha nao encontrada.');
    }

    const naFrente = await this.prisma.senha.count({
      where: {
        servico_id: servicoId,
        filial_id: filialId ?? null,
        status: 'AGUARDANDO',
        id: { lt: senhaId },
      },
    });

    return {
      posicao: naFrente + 1,
      estimativa: (naFrente + 1) * 5,
    };
  }

  private async buscarConfiguracaoComFallback(chave: string, filialId: number | null) {
    const configs = await this.prisma.configuracao.findMany({
      where: {
        chave,
        OR: [{ filial_id: filialId }, { filial_id: null }],
      },
    });

    return (
      configs.find((config) => config.filial_id === filialId) ||
      configs.find((config) => config.filial_id === null) ||
      null
    );
  }

  private obterCodigoCategoria(
    prefixo?: string | null,
    sigla?: string | null,
    nome?: string | null,
  ): string {
    const base =
      prefixo?.trim() ||
      sigla?.trim() ||
      this.gerarCodigoPorNome(nome) ||
      'XX';
    const codigo = base.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return codigo || 'XX';
  }

  private gerarCodigoPorNome(nome?: string | null): string {
    const palavras = String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .map((parte) => parte.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean);

    if (palavras.length >= 2) {
      return palavras
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('');
    }

    return palavras[0]?.slice(0, 2) || '';
  }
}
