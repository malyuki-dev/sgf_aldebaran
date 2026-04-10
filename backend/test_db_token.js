const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function run() {
  const staff = await prisma.usuario.findFirst({ where: { perfil: 'OPERADOR' } });
  const payload = {
    sub: staff.id,
    email: staff.email,
    tipo: staff.perfil,
    perfil: staff.perfil,
    iniciais: 'OP',
    filial_id: staff.filial_id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'SGF_ALDEBARAN_SECRET_KEY');
  const res = await fetch('http://localhost:3000/guiches/operador', { headers: { Authorization: 'Bearer ' + token } });
  console.log(await res.json());
}
run();
