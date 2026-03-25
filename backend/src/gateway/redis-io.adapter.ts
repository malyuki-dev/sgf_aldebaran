import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext } from '@nestjs/common';

/**
 * Adaptador Redis para escalabilidade horizontal do Socket.io.
 * Permite que múltiplas instâncias do backend compartilhem o estado da fila.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super();
  }

  /**
   * Conecta ao Redis e cria os clientes de Publish/Subscribe.
   * Retorna true se a conexão for bem sucedida, false caso contrário.
   */
  async connectToRedis(redisUrl: string): Promise<boolean> {
    try {
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      // Timeout de conexão para não travar o boot do app
      await Promise.race([
        Promise.all([pubClient.connect(), subClient.connect()]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 5000))
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      return true;
    } catch (error) {
      console.warn('⚠️ [RedisIoAdapter] Falha ao conectar ao Redis. Usando adaptador local (sem escalabilidade horizontal).');
      console.warn('Erro:', error.message);
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*', // Em produção, restringir ao domínio do painel
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket'], // Força WS para maior performance e segurança
    });

    server.adapter(this.adapterConstructor);
    return server;
  }
}
