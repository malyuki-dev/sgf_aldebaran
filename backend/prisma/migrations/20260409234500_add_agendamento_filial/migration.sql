-- AlterTable
ALTER TABLE "agendamento" ADD COLUMN "filial_id" INTEGER;

-- AddForeignKey
ALTER TABLE "agendamento" ADD CONSTRAINT "agendamento_filial_id_fkey" FOREIGN KEY ("filial_id") REFERENCES "filial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
