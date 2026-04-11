import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracaoService {
  constructor(private prisma: PrismaService) { }

  // Busca todas as configurações e mapeia num objeto { chave: valor } pro frontend
  async findAll() {
    const list = await this.prisma.configuracao.findMany({
      where: { filial_id: null }
    });
    const configMap: Record<string, string> = {};
    for (const item of list) {
      configMap[item.chave] = item.valor;
    }
    return configMap;
  }

  // Recebe um objeto chave: valor do frontend e cria ou atualiza tudo
  async updateAll(configBody: Record<string, string>) {
    const operations: any[] = [];
    for (const [chave, valor] of Object.entries(configBody)) {
      const existing = await this.prisma.configuracao.findFirst({
        where: { chave, filial_id: null }
      });
      if (existing) {
        operations.push(
          this.prisma.configuracao.update({
            where: { id: existing.id },
            data: { valor }
          })
        );
      } else {
        operations.push(
          this.prisma.configuracao.create({
            data: { chave, valor }
          })
        );
      }
    }
    await this.prisma.$transaction(operations);
    return { message: 'Configurações salvas com sucesso!' };
  }
}
