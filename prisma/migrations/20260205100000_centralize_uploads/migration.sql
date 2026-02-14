-- CreateEnum
CREATE TYPE "UploadSecurityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'SENSITIVE', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "UploadEntityType" AS ENUM ('USER_AVATAR', 'CITIZEN_AVATAR', 'LOGO_STATE', 'LOGO_MUNICIPAL', 'LOGO_ADMINISTRATION', 'PATIENT_DOCUMENT', 'REGULATION_DOCUMENT', 'TEMPLATE_THUMBNAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "UploadAccessAction" AS ENUM ('VIEW', 'DOWNLOAD', 'DELETE', 'UPDATE');

-- AlterTable User - Add avatar_upload_id
ALTER TABLE "users" ADD COLUMN "avatar_upload_id" INTEGER;

-- AlterTable Citizen - Add avatar_upload_id
ALTER TABLE "citizen" ADD COLUMN "avatar_upload_id" INTEGER;

-- AlterTable Subscriber - Remove old logo columns and add new upload references
ALTER TABLE "subscriber" DROP COLUMN "state_logo";
ALTER TABLE "subscriber" DROP COLUMN "municipal_logo";
ALTER TABLE "subscriber" DROP COLUMN "administration_logo";
ALTER TABLE "subscriber" ADD COLUMN "logo_state_upload_id" INTEGER;
ALTER TABLE "subscriber" ADD COLUMN "logo_municipal_upload_id" INTEGER;
ALTER TABLE "subscriber" ADD COLUMN "logo_administration_upload_id" INTEGER;

-- AlterTable Care - Add template_id
ALTER TABLE "care" ADD COLUMN "template_id" INTEGER;

-- AlterTable Regulation - Remove scheduled_date (data already migrated to schedule table)
ALTER TABLE "regulation" DROP COLUMN "scheduled_date";

-- AlterTable Upload - Add new security and entity fields
ALTER TABLE "upload" ADD COLUMN "security_level" "UploadSecurityLevel" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "upload" ADD COLUMN "requires_password_confirmation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "upload" ADD COLUMN "entity_type" "UploadEntityType";
ALTER TABLE "upload" ADD COLUMN "entity_id" TEXT;
ALTER TABLE "upload" ADD COLUMN "description" TEXT;
ALTER TABLE "upload" ADD COLUMN "expiry_date" TIMESTAMP(3);
ALTER TABLE "upload" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable UploadAccessLog
CREATE TABLE "upload_access_log" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "upload_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "UploadAccessAction" NOT NULL,
    "password_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "justification" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "upload_access_log_uuid_key" ON "upload_access_log"("uuid");

-- CreateIndex
CREATE INDEX "upload_access_log_upload_id_idx" ON "upload_access_log"("upload_id");

-- CreateIndex
CREATE INDEX "upload_access_log_user_id_idx" ON "upload_access_log"("user_id");

-- CreateIndex
CREATE INDEX "upload_access_log_upload_id_created_at_idx" ON "upload_access_log"("upload_id", "created_at");

-- CreateIndex
CREATE INDEX "upload_access_log_action_idx" ON "upload_access_log"("action");

-- CreateIndex
CREATE INDEX "users_avatar_upload_id_idx" ON "users"("avatar_upload_id");

-- CreateIndex
CREATE INDEX "citizen_avatar_upload_id_idx" ON "citizen"("avatar_upload_id");

-- CreateIndex
CREATE INDEX "subscriber_logo_state_upload_id_idx" ON "subscriber"("logo_state_upload_id");

-- CreateIndex
CREATE INDEX "subscriber_logo_municipal_upload_id_idx" ON "subscriber"("logo_municipal_upload_id");

-- CreateIndex
CREATE INDEX "subscriber_logo_administration_upload_id_idx" ON "subscriber"("logo_administration_upload_id");

-- CreateIndex
CREATE INDEX "care_template_id_idx" ON "care"("template_id");

-- CreateIndex
CREATE INDEX "upload_security_level_idx" ON "upload"("security_level");

-- CreateIndex
CREATE INDEX "upload_entity_type_idx" ON "upload"("entity_type");

-- CreateIndex
CREATE INDEX "upload_entity_id_idx" ON "upload"("entity_id");

-- CreateIndex
CREATE INDEX "upload_subscriber_id_entity_type_idx" ON "upload"("subscriber_id", "entity_type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_upload_id_fkey" FOREIGN KEY ("avatar_upload_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen" ADD CONSTRAINT "citizen_avatar_upload_id_fkey" FOREIGN KEY ("avatar_upload_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_logo_state_upload_id_fkey" FOREIGN KEY ("logo_state_upload_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_logo_municipal_upload_id_fkey" FOREIGN KEY ("logo_municipal_upload_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_logo_administration_upload_id_fkey" FOREIGN KEY ("logo_administration_upload_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care" ADD CONSTRAINT "care_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_access_log" ADD CONSTRAINT "upload_access_log_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_access_log" ADD CONSTRAINT "upload_access_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
