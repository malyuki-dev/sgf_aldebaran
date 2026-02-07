import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FilaService } from './fila/fila.service'; // Importe o Service

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔓 CONFIGURAÇÃO BLINDADA DE CORS
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // --- SEED AUTOMÁTICO (Popula o banco ao iniciar) ---
  try {
    const filaService = app.get(FilaService);
    const servicos = await filaService.listarServicos();
    
    if (servicos.length === 0) {
      console.log('🌱 Banco vazio detectado. Criando serviços padrão...');
      await filaService.criarServico('Caminhão', 'C');
      await filaService.criarServico('Retirada Pesada', 'RP');
      await filaService.criarServico('Cliente Rápido', 'CR');
      console.log('✅ Serviços criados com sucesso!');
    } else {
      console.log('✅ Serviços já existem no banco.');
    }
  } catch (error) {
    console.error('Erro ao rodar seed:', error);
  }
  // ---------------------------------------------------

  await app.listen(3000);
}
bootstrap();