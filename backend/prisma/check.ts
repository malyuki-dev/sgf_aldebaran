import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function check() {
    const users = await prisma.usuario.findMany({
        where: { OR: [{ login: 'admin' }, { email: 'admin@aldebaran.com' }] }
    });
    console.log('Admins found:', users);

    // Set all of them to ADMIN
    await prisma.usuario.updateMany({
        where: { OR: [{ login: 'admin' }, { email: 'admin@aldebaran.com' }] },
        data: { perfil: 'ADMIN' }
    });
}
check().finally(() => process.exit(0));
