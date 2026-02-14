-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'OVERDUE', 'TEMPORARY_UNBLOCK', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable: Adicionar subscriptionStatus e remover payment/isBlocked
ALTER TABLE "subscriber" ADD COLUMN "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- Migrar dados existentes
UPDATE "subscriber" SET "subscription_status" =
  CASE
    WHEN "is_blocked" = true THEN 'BLOCKED'::"SubscriptionStatus"
    WHEN "payment" = false THEN 'OVERDUE'::"SubscriptionStatus"
    ELSE 'ACTIVE'::"SubscriptionStatus"
  END;

-- Remover colunas antigas
ALTER TABLE "subscriber" DROP COLUMN IF EXISTS "payment";
ALTER TABLE "subscriber" DROP COLUMN IF EXISTS "is_blocked";

-- CreateTable
CREATE TABLE "subscription_payment" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "reference_month" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "paid_amount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_uuid_key" ON "subscription_payment"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_subscriber_id_reference_month_key" ON "subscription_payment"("subscriber_id", "reference_month");

-- CreateIndex
CREATE INDEX "subscription_payment_subscriber_id_idx" ON "subscription_payment"("subscriber_id");

-- CreateIndex
CREATE INDEX "subscription_payment_status_idx" ON "subscription_payment"("status");

-- CreateIndex
CREATE INDEX "subscription_payment_due_date_idx" ON "subscription_payment"("due_date");

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
