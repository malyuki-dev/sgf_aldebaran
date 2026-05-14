-- Align senha table with the Prisma schema used by queue and client check-in flows.
ALTER TABLE "senha" ADD COLUMN IF NOT EXISTS "agendamento_id" INTEGER;
ALTER TABLE "senha" ADD COLUMN IF NOT EXISTS "filial_id" INTEGER;
ALTER TABLE "senha" ADD COLUMN IF NOT EXISTS "qtdeGarrafoes" INTEGER DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'senha_agendamento_id_fkey'
  ) THEN
    ALTER TABLE "senha"
    ADD CONSTRAINT "senha_agendamento_id_fkey"
    FOREIGN KEY ("agendamento_id") REFERENCES "agendamento"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'senha_filial_id_fkey'
  ) THEN
    ALTER TABLE "senha"
    ADD CONSTRAINT "senha_filial_id_fkey"
    FOREIGN KEY ("filial_id") REFERENCES "filial"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_senha_agendamento_id" ON "senha"("agendamento_id");
CREATE INDEX IF NOT EXISTS "IDX_senha_filial_id" ON "senha"("filial_id");
