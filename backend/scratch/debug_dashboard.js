const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Mocking NestJS Injectable
class DashboardService {
  constructor(prisma) { this.prisma = prisma; }
  
  async getSupervisorOverview(filialId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const fid = filialId && !isNaN(+filialId) ? +filialId : undefined;

    console.log(`[DEBUG] Calling getSupervisorOverview with fid: ${fid}, today: ${todayStr}`);

    const senhasHoje = await this.prisma.senha.findMany({
      where: {
        dataCriacao: { gte: today },
        ...(fid ? { filial_id: fid } : {}),
      },
      include: { atendimento: true },
    });
    console.log(`[DEBUG] senhasHoje found: ${senhasHoje.length}`);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        data: todayStr,
        status: { not: 'CANCELADO' },
        ...(fid ? { filial_id: fid } : {}),
      },
    });
    console.log(`[DEBUG] agendamentos found: ${agendamentos.length}`);

    return { total: senhasHoje.length, agendamentos: agendamentos.length };
  }
}

async function test() {
  const prisma = new PrismaClient();
  const service = new DashboardService(prisma);
  
  // Test with Filial 1 (Aldebaran)
  const res1 = await service.getSupervisorOverview('1');
  console.log('Result for Filial 1:', res1);

  // Test with Filial 2
  const res2 = await service.getSupervisorOverview('2');
  console.log('Result for Filial 2:', res2);

  // Test without Filial
  const resGlobal = await service.getSupervisorOverview(undefined);
  console.log('Result Global:', resGlobal);
}

test().catch(console.error).finally(() => process.exit());
