import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type ServicoSenha = {
  id: number;
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
    const configBonus = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'BONUS_PRIORIDADE_AGENDAMENTO',
        filial_id: filialId,
      },
    });
    const bonus = Number(configBonus?.valor) || 2;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const configZerar = await this.prisma.configuracao.findFirst({
      where: { chave: 'DATA_ZERAR_FILA', filial_id: filialId },
    });
    const dataZerar = configZerar ? new Date(configZerar.valor) : hoje;
    const effectiveStart = dataZerar > hoje ? dataZerar : hoje;

    const count = await this.prisma.senha.count({
      where: {
        servico_id: params.servico.id,
        filial_id: filialId,
        dataCriacao: { gte: effectiveStart },
      },
    });

    const configMod = await this.prisma.configuracao.findFirst({
      where: {
        chave: 'MODIFICADOR_AGENDAMENTO',
        filial_id: filialId,
      },
    });
    const modificador = configMod?.valor || 'A';
    const codigoCategoria = this.obterCodigoCategoria(
      params.servico.prefixo,
      params.servico.sigla,
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

  private obterCodigoCategoria(prefixo?: string | null, sigla?: string | null): string {
    const base = (prefixo?.trim() || sigla?.trim() || 'XX').toUpperCase();
    const codigo = base.replace(/[^A-Z0-9]/g, '');
    return codigo || 'XX';
  }
}
