-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('WELCOME', 'PROFILE', 'IMPORT', 'TOUR', 'COMPLETE');

-- CreateEnum
CREATE TYPE "OnboardingImportType" AS ENUM ('CITIZENS', 'PROFESSIONALS', 'UNITS');

-- CreateEnum
CREATE TYPE "OnboardingImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "user_onboarding" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "current_step" TEXT NOT NULL DEFAULT 'WELCOME',
    "welcome_completed_at" TIMESTAMP(3),
    "profile_completed_at" TIMESTAMP(3),
    "import_completed_at" TIMESTAMP(3),
    "tour_completed_at" TIMESTAMP(3),
    "skip_import" BOOLEAN NOT NULL DEFAULT false,
    "skip_tour" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_import_log" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "import_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,
    "errors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_import_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_uuid_key" ON "user_onboarding"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_user_id_key" ON "user_onboarding"("user_id");

-- CreateIndex
CREATE INDEX "user_onboarding_user_id_idx" ON "user_onboarding"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_import_log_uuid_key" ON "onboarding_import_log"("uuid");

-- CreateIndex
CREATE INDEX "onboarding_import_log_subscriber_id_idx" ON "onboarding_import_log"("subscriber_id");

-- CreateIndex
CREATE INDEX "onboarding_import_log_user_id_idx" ON "onboarding_import_log"("user_id");

-- CreateIndex
CREATE INDEX "onboarding_import_log_subscriber_id_created_at_idx" ON "onboarding_import_log"("subscriber_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_import_log" ADD CONSTRAINT "onboarding_import_log_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
