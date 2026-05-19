ALTER TABLE "notificacao"
ADD COLUMN IF NOT EXISTS "cliente_id" UUID;

CREATE INDEX IF NOT EXISTS "IDX_notificacao_cliente_id"
ON "notificacao"("cliente_id");

ALTER TABLE "notificacao"
ADD CONSTRAINT "FK_notificacao_cliente_id"
FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
