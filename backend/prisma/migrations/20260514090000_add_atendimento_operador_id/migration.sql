-- Add operador responsible for the atendimento at the moment the ticket is called.
ALTER TABLE "atendimento" ADD COLUMN IF NOT EXISTS "operadorId" INTEGER;

ALTER TABLE "atendimento"
ADD CONSTRAINT "atendimento_operadorId_fkey"
FOREIGN KEY ("operadorId") REFERENCES "usuario"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "IDX_atendimento_operadorId" ON "atendimento"("operadorId");
