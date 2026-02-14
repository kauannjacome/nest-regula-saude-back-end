-- Adicionar campo two_factor_reset_required na tabela users
ALTER TABLE "users" ADD COLUMN "two_factor_reset_required" BOOLEAN NOT NULL DEFAULT true;

-- Criar enum para tipo de ticket de suporte
CREATE TYPE "SupportTicketType" AS ENUM ('PASSWORD_RESET', 'TWO_FACTOR_RESET');

-- Criar enum para status de ticket de suporte
CREATE TYPE "SupportTicketStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- Criar tabela de tickets de suporte
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "SupportTicketType" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "temp_password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- Criar índice único para uuid
CREATE UNIQUE INDEX "support_tickets_uuid_key" ON "support_tickets"("uuid");

-- Criar índices para performance
CREATE INDEX "support_tickets_subscriber_id_idx" ON "support_tickets"("subscriber_id");
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_subscriber_id_status_idx" ON "support_tickets"("subscriber_id", "status");

-- Adicionar foreign keys
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Atualizar usuários existentes que já têm 2FA ativo para não exigir reset
UPDATE "users" SET "two_factor_reset_required" = false WHERE "two_factor_enabled" = true;
