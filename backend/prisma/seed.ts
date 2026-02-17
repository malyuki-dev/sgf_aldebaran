import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const senhaHash = await bcrypt.hash('123456', 12);
  await prisma.usuario.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      senha: senhaHash,
      nome: 'Administrador',
    },
  });
  console.log('Usuário admin criado/atualizado!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());