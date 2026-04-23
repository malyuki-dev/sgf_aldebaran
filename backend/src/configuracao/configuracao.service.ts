import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoService } from '../notificacao/notificacao.service';

@Injectable()
export class ConfiguracaoService {
  constructor(
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
  ) {}

  // Busca todas as configurações e mapeia num objeto { chave: valor } pro frontend (LEGADO)
  async findAll(filialId?: any) {
    const fId =
      filialId && filialId !== 'null' && filialId !== 'undefined'
        ? Number(filialId)
        : null;
    const list = await this.prisma.configuracao.findMany({
      where: { filial_id: fId },
    });
    const configMap: Record<string, string> = {};
    for (const item of list) {
      configMap[item.chave] = item.valor;
    }
    return configMap;
  }

  // Busca lista bruta de configurações
  async findAllList(filialId?: any) {
    const fId =
      filialId && filialId !== 'null' && filialId !== 'undefined'
        ? Number(filialId)
        : null;

    const allConfigs = await this.prisma.configuracao.findMany({
      where: {
        OR: [{ filial_id: fId }, { filial_id: null }],
      },
      orderBy: { filial_id: 'desc' }, // Filiais (não-null) vêm primeiro
    });

    // De-duplicar preferendo a versão da filial
    const merged: any[] = [];
    const keys = new Set<string>();

    for (const config of allConfigs) {
      if (!keys.has(config.chave)) {
        merged.push(config);
        keys.add(config.chave);
      }
    }

    return merged;
  }

  // Atualização em lote (Bulk)
  async updateBulk(
    configs: { chave: string; valor: string }[],
    filialId?: any,
  ) {
    const fId =
      filialId && filialId !== 'null' && filialId !== 'undefined'
        ? Number(filialId)
        : null;

    console.log(
      `[CONFIG] Salvando bulk para filial: ${fId}, total itens: ${configs.length}`,
    );

    for (const c of configs) {
      const existing = await this.prisma.configuracao.findFirst({
        where: { chave: c.chave, filial_id: fId },
      });

      if (existing) {
        await this.prisma.configuracao.update({
          where: { id: existing.id },
          data: { valor: c.valor },
        });
      } else {
        await this.prisma.configuracao.create({
          data: { chave: c.chave, valor: c.valor, filial_id: fId },
        });
      }
    }

    // Notificação de alteração de configurações do sistema
    await this.notificacaoService.criar({
      titulo: 'Configurações Atualizadas',
      mensagem: `As configurações do sistema (${fId ? 'Filial ' + fId : 'Geral'}) foram salvas.`,
      icon: 'settings',
      rota: '/admin/configuracoes',
    });

    return { message: 'Lote de configurações salvo com sucesso!' };
  }

  // Recebe um objeto chave: valor do frontend e cria ou atualiza tudo (MANTIDO PARA COMPATIBILIDADE)
  async updateAll(configBody: Record<string, string>, filialId?: number) {
    const fId = filialId ? Number(filialId) : null;
    const operations: any[] = [];
    for (const [chave, valor] of Object.entries(configBody)) {
      operations.push(
        this.prisma.configuracao.upsert({
          where: {
            chave_filial_id: {
              chave,
              filial_id: fId as any,
            },
          },
          update: { valor },
          create: { chave, valor, filial_id: fId as any },
        }),
      );
    }
    await this.prisma.$transaction(operations);
    return { message: 'Configurações salvas com sucesso!' };
  }
}
