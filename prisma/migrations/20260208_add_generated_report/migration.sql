-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('REGULATIONS', 'CITIZENS', 'SCHEDULES', 'CARES', 'SUPPLIERS', 'USERS', 'AUDIT_LOG', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "generated_report" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "header_data" JSONB NOT NULL,
    "filters_used" JSONB NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "s3_key" TEXT,
    "s3_bucket" TEXT,
    "s3_region" TEXT,
    "file_size" INTEGER,
    "generated_by" TEXT,
    "generation_time" INTEGER,
    "error_message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "generated_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_report_uuid_key" ON "generated_report"("uuid");

-- CreateIndex
CREATE INDEX "generated_report_subscriber_id_idx" ON "generated_report"("subscriber_id");

-- CreateIndex
CREATE INDEX "generated_report_generated_by_idx" ON "generated_report"("generated_by");

-- CreateIndex
CREATE INDEX "generated_report_report_type_idx" ON "generated_report"("report_type");

-- CreateIndex
CREATE INDEX "generated_report_status_idx" ON "generated_report"("status");

-- CreateIndex
CREATE INDEX "generated_report_expires_at_idx" ON "generated_report"("expires_at");

-- CreateIndex
CREATE INDEX "generated_report_subscriber_id_created_at_idx" ON "generated_report"("subscriber_id", "created_at");

-- AddForeignKey
ALTER TABLE "generated_report" ADD CONSTRAINT "generated_report_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_report" ADD CONSTRAINT "generated_report_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
