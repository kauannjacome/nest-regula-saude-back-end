-- CreateTable
CREATE TABLE "qrcode_smart_actions" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "allowed_actions" TEXT[] NOT NULL,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "access_limit" INTEGER NOT NULL DEFAULT 3,
    "targetData" JSONB NOT NULL,
    "executionLogs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "qrcode_smart_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qrcode_smart_actions_uuid_key" ON "qrcode_smart_actions"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "qrcode_smart_actions_hash_key" ON "qrcode_smart_actions"("hash");

-- CreateIndex
CREATE INDEX "qrcode_smart_actions_hash_idx" ON "qrcode_smart_actions"("hash");

-- AlterTable
ALTER TABLE "batch_actions" ADD COLUMN "qrcode_smart_action_id" INTEGER;

-- Migrate data
WITH inserted AS (
    INSERT INTO "qrcode_smart_actions" (
        "uuid",
        "hash",
        "expires_at",
        "allowed_actions",
        "access_count",
        "access_limit",
        "targetData",
        "executionLogs",
        "created_at",
        "updated_at",
        "deleted_at"
    )
    SELECT
        "uuid",
        "hash",
        "expires_at",
        COALESCE("allowed_actions", ARRAY[]::TEXT[]),
        "access_count",
        "access_limit",
        "targetData",
        "executionLogs",
        "created_at",
        "updated_at",
        "deleted_at"
    FROM "batch_actions"
    RETURNING "id", "hash"
)
UPDATE "batch_actions" AS b
SET "qrcode_smart_action_id" = i."id"
FROM inserted AS i
WHERE b."hash" = i."hash";

-- Ensure FK column is required and unique
ALTER TABLE "batch_actions" ALTER COLUMN "qrcode_smart_action_id" SET NOT NULL;
CREATE UNIQUE INDEX "batch_actions_qrcode_smart_action_id_key" ON "batch_actions"("qrcode_smart_action_id");

-- Drop old hash indexes
DROP INDEX "batch_actions_hash_key";
DROP INDEX "batch_actions_hash_idx";

-- Drop moved columns
ALTER TABLE "batch_actions" DROP COLUMN "hash";
ALTER TABLE "batch_actions" DROP COLUMN "expires_at";
ALTER TABLE "batch_actions" DROP COLUMN "allowed_actions";
ALTER TABLE "batch_actions" DROP COLUMN "access_count";
ALTER TABLE "batch_actions" DROP COLUMN "access_limit";
ALTER TABLE "batch_actions" DROP COLUMN "targetData";
ALTER TABLE "batch_actions" DROP COLUMN "executionLogs";
ALTER TABLE "batch_actions" DROP COLUMN "deleted_at";

-- AddForeignKey
ALTER TABLE "batch_actions" ADD CONSTRAINT "batch_actions_qrcode_smart_action_id_fkey" FOREIGN KEY ("qrcode_smart_action_id") REFERENCES "qrcode_smart_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
