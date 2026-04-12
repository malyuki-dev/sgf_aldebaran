-- AlterTable
ALTER TABLE "usuario"
ADD COLUMN "filial_id" INTEGER;

-- AddForeignKey
ALTER TABLE "usuario"
ADD CONSTRAINT "usuario_filial_id_fkey"
FOREIGN KEY ("filial_id") REFERENCES "filial"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
