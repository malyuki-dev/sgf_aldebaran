const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const guiches = await prisma.guiche.findMany();
  console.log("Guiches:", guiches);
}

main().finally(() => prisma.$disconnect());
