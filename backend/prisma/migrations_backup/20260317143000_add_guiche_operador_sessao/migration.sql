-- CreateTable
CREATE TABLE "guiche" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "descricao" VARCHAR(120),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',
    "operadorAtualId" INTEGER,
    "loginOperadorEm" TIMESTAMP(6),
    "atendimentoAtualCodigo" VARCHAR(30),
    "criadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operador_sessao" (
    "id" SERIAL NOT NULL,
    "operador_id" INTEGER NOT NULL,
    "guiche_id" INTEGER NOT NULL,
    "loginEm" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutEm" TIMESTAMP(6),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "operador_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guiche_numero_key" ON "guiche"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "guiche_operadorAtualId_key" ON "guiche"("operadorAtualId");

-- CreateIndex
CREATE INDEX "IDX_operador_sessao_operador" ON "operador_sessao"("operador_id");

-- CreateIndex
CREATE INDEX "IDX_operador_sessao_guiche" ON "operador_sessao"("guiche_id");

-- CreateIndex
CREATE INDEX "IDX_operador_sessao_ativo" ON "operador_sessao"("ativo");

-- AddForeignKey
ALTER TABLE "guiche" ADD CONSTRAINT "guiche_operadorAtualId_fkey" FOREIGN KEY ("operadorAtualId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operador_sessao" ADD CONSTRAINT "operador_sessao_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operador_sessao" ADD CONSTRAINT "operador_sessao_guiche_id_fkey" FOREIGN KEY ("guiche_id") REFERENCES "guiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;
