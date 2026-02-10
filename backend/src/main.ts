import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { FilaService } from './fila/fila.service'; // Comente por enquanto

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🔓 CONFIGURAÇÃO DE CORS (Essencial para o Frontend conectar)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /* --- BLOCO DE SEED TEMPORARIAMENTE DESATIVADO ---
  Motivo: Se der erro aqui, o servidor não inicia e o login trava.
  Vamos testar o Login primeiro!
  
  try {
    const filaService = app.get(FilaService);
    const servicos = await filaService.listarServicos();
    
    if (servicos.length === 0) {
      console.log('🌱 Criando serviços padrão...');
      await filaService.criarServico('Caminhão', 'C');
      await filaService.criarServico('Retirada Pesada', 'RP');
      await filaService.criarServico('Cliente Rápido', 'CR');
      console.log('✅ Serviços criados!');
    }
  } catch (error) {
    console.error('⚠️ Pulei o Seed por erro:', error.message);
  }
  */

  await app.listen(3000);
  console.log('🚀 Backend rodando em http://localhost:3000');
  console.log('🔓 CORS Habilitado');
}
bootstrap();