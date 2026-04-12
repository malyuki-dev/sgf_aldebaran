-- AlterTable
ALTER TABLE "clientes"
ADD COLUMN "filial_id" INTEGER;

-- AddForeignKey
ALTER TABLE "clientes"
ADD CONSTRAINT "clientes_filial_id_fkey"
FOREIGN KEY ("filial_id") REFERENCES "filial"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
