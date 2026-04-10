-- CreateEnum
CREATE TYPE "Origin" AS ENUM ('TOTEM', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('PREFERENTIAL', 'CONVENTIONAL', 'NA');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CAMINHAO', 'RETIRADA_PESADA', 'RETIRADA_RAPIDA', 'CLIENTE_RAPIDO');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "atendimento" ADD COLUMN     "justificativaDemora" VARCHAR(500),
ADD COLUMN     "motivoDemora" VARCHAR(100);

-- AlterTable
ALTER TABLE "guiche" ADD COLUMN     "deletadoEm" TIMESTAMP(6),
ADD COLUMN     "filial_id" INTEGER,
ADD COLUMN     "nome" VARCHAR(100),
ALTER COLUMN "numero" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "status" SET DEFAULT 'Offline';

-- AlterTable
ALTER TABLE "senha" ADD COLUMN     "prioridade" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tipoOrigem" VARCHAR(20);

-- AlterTable
ALTER TABLE "servico" ADD COLUMN     "cor" VARCHAR,
ADD COLUMN     "icone" VARCHAR(50),
ADD COLUMN     "metaAtendimento" INTEGER DEFAULT 15,
ADD COLUMN     "metaEspera" INTEGER DEFAULT 20,
ADD COLUMN     "prefixo" VARCHAR,
ADD COLUMN     "tipo" VARCHAR;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletadoEm" TIMESTAMP(6),
ADD COLUMN     "email" VARCHAR(100),
ADD COLUMN     "fotoPerfil" VARCHAR(500),
ADD COLUMN     "perfil" VARCHAR(20) NOT NULL DEFAULT 'OPERADOR',
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(150);

-- CreateTable
CREATE TABLE "motorista" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "cnh" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(15),
    "transportadora" VARCHAR(100),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletadoEm" TIMESTAMP(6),

    CONSTRAINT "motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caminhao" (
    "id" SERIAL NOT NULL,
    "placa" VARCHAR(8) NOT NULL,
    "modelo" VARCHAR(100) NOT NULL,
    "transportadora" VARCHAR(100) NOT NULL,
    "capacidade" VARCHAR(20) NOT NULL,
    "observacoes" VARCHAR(300),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    "motorista_id" INTEGER,
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletadoEm" TIMESTAMP(6),

    CONSTRAINT "caminhao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao" (
    "id" SERIAL NOT NULL,
    "chave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" VARCHAR(200),
    "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filial_id" INTEGER,

    CONSTRAINT "configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" SERIAL NOT NULL,
    "acao" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500) NOT NULL,
    "entidade" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'Sucesso',
    "usuario_id" INTEGER,
    "filial_id" INTEGER,
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensagem" VARCHAR(500) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "rota" VARCHAR(200),
    "icon" VARCHAR(50) DEFAULT 'bell',
    "iconClass" VARCHAR(50) DEFAULT 'blue-icon',
    "usuario_id" INTEGER,
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filial" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(100),
    "telefone" VARCHAR(20),
    "cnpj" VARCHAR(20),
    "endereco" VARCHAR(200),
    "cor" VARCHAR(20) DEFAULT '#0ea5e9',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletadoEm" TIMESTAMP(6),

    CONSTRAINT "filial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aldebaran_tickets" (
    "id" UUID NOT NULL,
    "origin" "Origin" NOT NULL,
    "type" "TicketType" NOT NULL,
    "category" "Category" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aldebaran_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motorista_cpf_key" ON "motorista"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "motorista_cnh_key" ON "motorista"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "caminhao_placa_key" ON "caminhao"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_chave_filial_id_key" ON "configuracao"("chave", "filial_id");

-- CreateIndex
CREATE UNIQUE INDEX "filial_cnpj_key" ON "filial"("cnpj");

-- CreateIndex
CREATE INDEX "idx_active_tickets" ON "aldebaran_tickets"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_guiche_fkey" FOREIGN KEY ("guiche") REFERENCES "guiche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caminhao" ADD CONSTRAINT "caminhao_motorista_id_fkey" FOREIGN KEY ("motorista_id") REFERENCES "motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracao" ADD CONSTRAINT "configuracao_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guiche" ADD CONSTRAINT "guiche_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
