import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔓 CONFIGURAÇÃO DE CORS (Essencial para o Frontend conectar)
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

  await app.listen(3000);
  console.log('🚀 Backend rodando em http://localhost:3000');
  console.log('🔓 CORS Habilitado');
  console.log('✅ Validação Global Ativada');
}
bootstrap();