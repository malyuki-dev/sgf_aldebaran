ALTER TABLE "servico"
ADD COLUMN "filial_id" INTEGER;

ALTER TABLE "servico"
ADD CONSTRAINT "servico_filial_id_fkey"
FOREIGN KEY ("filial_id") REFERENCES "filial"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
