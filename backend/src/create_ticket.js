require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Pega todas as filiais
  const filiais = await prisma.filial.findMany();
  
  if (filiais.length === 0) {
    console.log("Nenhuma filial encontrada.");
    return;
  }

  for (const filial of filiais) {
    let servico = await prisma.servico.findFirst({
        where: { filial_id: filial.id }
    });

    if (!servico) {
        // Tenta achar um servico global
        servico = await prisma.servico.findFirst({
            where: { filial_id: null }
        });
    }

    if (!servico) continue;

    for (let i = 0; i < 50; i++) {
        const num = 'T-' + servico.sigla + '-' + Math.floor(Math.random() * 9000 + 1000);
        const senha = await prisma.senha.create({
        data: {
            numeroDisplay: num,
            status: 'AGUARDANDO',
            servico_id: servico.id,
            filial_id: filial.id,
            tipoOrigem: 'TOTEM'
        }
        });

        console.log(`Ticket criado! Senha: ${senha.numeroDisplay} | Categoria: ${servico.nome} | Filial: ${filial.nome} (ID: ${filial.id})`);
    }
  }
}

main().catch(console.error);
