const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedToday() {
  const aldebaran = await prisma.filial.findFirst({ where: { nome: 'Aldebaran' } });
  if (!aldebaran) {
    console.log('Filial Aldebaran not found');
    return;
  }
  
  const servico = await prisma.servico.findFirst({ where: { filial_id: aldebaran.id } }) 
                || await prisma.servico.findFirst({ where: { filial_id: null } });
                
  if (!servico) {
    console.log('No service found');
    return;
  }

  // Create a senha for today
  const senha = await prisma.senha.create({
    data: {
      numeroDisplay: 'REAL-001',
      status: 'AGUARDANDO',
      servico_id: servico.id,
      filial_id: aldebaran.id,
      dataCriacao: new Date()
    }
  });
  console.log('Created ticket for today:', senha.numeroDisplay);
  
  // Create an agendamento for today
  const agendamento = await prisma.agendamento.create({
    data: {
      nomeCliente: 'Cliente Teste Real',
      data: new Date().toISOString().split('T')[0],
      hora: '10:00',
      servico_id: servico.id,
      filial_id: aldebaran.id,
      status: 'PENDENTE',
      codigo: 'TESTE-REAL'
    }
  });
  console.log('Created agendamento for today:', agendamento.nomeCliente);
}

seedToday().catch(console.error).finally(() => prisma.$disconnect());
