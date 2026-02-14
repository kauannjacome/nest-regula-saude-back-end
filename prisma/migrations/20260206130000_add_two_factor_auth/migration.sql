-- AlterTable: Adicionar campos de autenticação de dois fatores (2FA)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_verified_at" TIMESTAMP(3);
