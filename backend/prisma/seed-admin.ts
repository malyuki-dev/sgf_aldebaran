import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = 'admin@aldebaran.com';
    const adminLogin = 'admin';
    const adminPassword = '123';

    // Verifica se já existe
    const existingAdmin = await prisma.usuario.findFirst({
        where: {
            OR: [
                { email: adminEmail },
                { login: adminLogin }
            ]
        }
    });

    // Gera o hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (existingAdmin) {
        await prisma.usuario.update({
            where: { id: existingAdmin.id },
            data: { senha: hashedPassword, perfil: 'ADMIN' }
        });
        console.log(`✅ Usuário Admin '${adminLogin}' já existia. A senha foi redefinida para '${adminPassword}'.`);
        return;
    }

    const admin = await prisma.usuario.create({
        data: {
            nome: 'Administrador Master',
            email: adminEmail,
            login: adminLogin,
            senha: hashedPassword,
            perfil: 'ADMIN',
            ativo: true
        }
    });

    console.log('🚀 Usuário Admin criado com sucesso!');
    console.log('==================================');
    console.log(` Login: ${adminLogin} `);
    console.log(` Senha: ${adminPassword} `);
    console.log(` E-mail: ${adminEmail} `);
    console.log('==================================');
}

main()
    .catch(e => {
        console.error('❌ Erro ao criar Admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
