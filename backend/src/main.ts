// Ensure crypto is available globally for Node.js < 19
if (!global.crypto) {
  global.crypto = require('crypto');
}

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './gateway/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔌 ADAPTADOR REDIS (Escalabilidade de Sockets)
  const redisIoAdapter = new RedisIoAdapter(app);
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const isRedisConnected = await redisIoAdapter.connectToRedis(redisUrl);

  if (isRedisConnected) {
    app.useWebSocketAdapter(redisIoAdapter);
    console.log('🔌 Redis WebSockets Habilitado');
  } else {
    console.log('💡 Usando adaptador WebSocket padrão (In-memory)');
  }

  // 🔓 CONFIGURAÇÃO DE CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ✅ VALIDAÇÃO GLOBAL (Valida DTOs automaticamente)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Retorna erro se houver propriedades extras
      transform: true, // Transforma dados para os tipos dos DTOs
    }),
  );

  try {
    await app.listen(3000);
    console.log('🚀 Backend rodando em http://localhost:3000');
    console.log('🔓 CORS Habilitado');
    console.log('✅ Validação Global Ativada');
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error('❌ ERRO: A porta 3000 já está em uso!');
      console.error('💡 Dica: Verifique se outro servidor já está rodando ou use: fuser -k 3000/tcp');
      process.exit(1);
    } else {
      throw error;
    }
  }
}
bootstrap();
