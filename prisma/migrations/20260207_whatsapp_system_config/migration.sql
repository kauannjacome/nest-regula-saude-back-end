-- CreateEnum: Estado de preferência de notificação
DO $$ BEGIN
    CREATE TYPE "NotificationPreferenceState" AS ENUM ('ON', 'OFF', 'ALWAYS_ASK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar novos valores ao enum WhatsAppTrigger
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_PENDING';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_IN_ANALYSIS';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_APPROVED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_DENIED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_RETURNED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_SCHEDULED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_COMPLETED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STATUS_CANCELLED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'SCHEDULE_CREATED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'SCHEDULE_REMINDER_24H';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'SCHEDULE_REMINDER_2H';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'SCHEDULE_CANCELLED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'SCHEDULE_RESCHEDULED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'MEDICATION_ARRIVED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'MEDICATION_READY';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'MEDICATION_EXPIRING';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STOCK_LOW';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'STOCK_REPLENISHED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'CARE_PLAN_CREATED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'CARE_PLAN_UPDATED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'CARE_REMINDER';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'DOCUMENT_REQUIRED';
ALTER TYPE "WhatsAppTrigger" ADD VALUE IF NOT EXISTS 'DOCUMENT_RECEIVED';

-- Adicionar novos campos ao WhatsAppConfig
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "instance_id" TEXT;
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "instance_status" TEXT;
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "last_connected_at" TIMESTAMP(3);

-- CreateTable: WhatsAppSystemProvider
CREATE TABLE IF NOT EXISTS "whatsapp_system_provider" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_url" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "global_api_key" TEXT,
    "webhook_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_instances" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_system_provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: UUID único para WhatsAppSystemProvider
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_system_provider_uuid_key" ON "whatsapp_system_provider"("uuid");

-- CreateTable: WhatsAppNotificationPreference
CREATE TABLE IF NOT EXISTS "whatsapp_notification_preference" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "trigger_type" "WhatsAppTrigger" NOT NULL,
    "state" "NotificationPreferenceState" NOT NULL DEFAULT 'ALWAYS_ASK',
    "template_id" INTEGER,
    "custom_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: UUID único para WhatsAppNotificationPreference
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_notification_preference_uuid_key" ON "whatsapp_notification_preference"("uuid");

-- CreateIndex: Combinação única de subscriber e trigger
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_notification_preference_subscriber_id_trigger_type_key" ON "whatsapp_notification_preference"("subscriber_id", "trigger_type");

-- CreateIndex: Index por subscriber
CREATE INDEX IF NOT EXISTS "whatsapp_notification_preference_subscriber_id_idx" ON "whatsapp_notification_preference"("subscriber_id");

-- AddForeignKey: Subscriber
ALTER TABLE "whatsapp_notification_preference"
ADD CONSTRAINT "whatsapp_notification_preference_subscriber_id_fkey"
FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Template (opcional)
ALTER TABLE "whatsapp_notification_preference"
ADD CONSTRAINT "whatsapp_notification_preference_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "whatsapp_programmed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Inserir provedor padrão do sistema (Evolution API)
INSERT INTO "whatsapp_system_provider" ("name", "provider", "api_url", "api_key", "is_default", "is_active")
SELECT 'Evolution API (Padrão)', 'evolution', 'https://api.evolution.local', 'default_key', true, true
WHERE NOT EXISTS (SELECT 1 FROM "whatsapp_system_provider" WHERE "is_default" = true);
