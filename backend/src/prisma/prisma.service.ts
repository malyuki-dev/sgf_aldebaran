import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
  async onModuleInit() {
    console.log('🔌 [PRISMA] Conectando ao Banco de Dados...');
    try {
      await this.$connect();
      console.log('✅ [PRISMA] Conectado com sucesso!');
    } catch (error) {
      console.error('❌ [PRISMA] Erro ao conectar no banco:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}