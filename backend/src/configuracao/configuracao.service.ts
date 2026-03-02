import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfiguracaoService {
  constructor(private prisma: PrismaService) { }

  // Busca todas as configurações e mapeia num objeto { chave: valor } pro frontend
  async findAll() {
    const list = await this.prisma.configuracao.findMany();
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
      operations.push(
        this.prisma.configuracao.upsert({
          where: { chave },
          update: { valor },
          create: { chave, valor }
        })
      );
    }
    await this.prisma.$transaction(operations);
    return { message: 'Configurações salvas com sucesso!' };
  }
}
