-- Primeiro, dropar tabela e tipos existentes da migração anterior
DROP TABLE IF EXISTS "support_ticket_messages" CASCADE;
DROP TABLE IF EXISTS "support_tickets" CASCADE;
DROP TYPE IF EXISTS "SupportTicketType";
DROP TYPE IF EXISTS "SupportTicketStatus";
DROP TYPE IF EXISTS "TicketChannel";
DROP TYPE IF EXISTS "TicketCategory";
DROP TYPE IF EXISTS "TicketStatus";
DROP TYPE IF EXISTS "TicketPriority";

-- CreateEnum
CREATE TYPE "TicketChannel" AS ENUM ('APP', 'WEB', 'EMAIL', 'CHAT', 'PHONE', 'API', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BUG', 'QUESTION', 'BILLING', 'FEATURE', 'ACCESS', 'PERFORMANCE', 'INTEGRATION', 'DATA', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'WAITING_DEV', 'RESOLVED', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER,
    "user_id" TEXT,
    "ticket_number" TEXT NOT NULL,
    "channel" "TicketChannel" NOT NULL DEFAULT 'WEB',
    "category" "TicketCategory" NOT NULL,
    "subcategory" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "error_context" JSONB,
    "contact_email" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "assigned_to_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "first_response_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_messages" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_from_user" BOOLEAN NOT NULL DEFAULT true,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_uuid_key" ON "support_tickets"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_subscriber_id_idx" ON "support_tickets"("subscriber_id");

-- CreateIndex
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_assigned_to_id_idx" ON "support_tickets"("assigned_to_id");

-- CreateIndex
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets"("created_at");

-- CreateIndex
CREATE INDEX "support_tickets_ticket_number_idx" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "support_ticket_messages_uuid_key" ON "support_ticket_messages"("uuid");

-- CreateIndex
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_user_id_idx" ON "support_ticket_messages"("user_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx" ON "support_ticket_messages"("ticket_id", "created_at");

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
