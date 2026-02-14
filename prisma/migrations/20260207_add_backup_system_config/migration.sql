-- CreateEnum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackupType') THEN
        CREATE TYPE "BackupType" AS ENUM ('MANUAL', 'SCHEDULED', 'AUTOMATIC');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackupStatus') THEN
        CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
    END IF;
END
$$;

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "system_config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "backup_history" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "type" "BackupType" NOT NULL DEFAULT 'MANUAL',
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_by_id" TEXT,

    CONSTRAINT "backup_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "system_config_key_key" ON "system_config"("key");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "backup_history_type_idx" ON "backup_history"("type");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "backup_history_status_idx" ON "backup_history"("status");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "backup_history_started_at_idx" ON "backup_history"("started_at");

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'backup_history_created_by_id_fkey'
    ) THEN
        ALTER TABLE "backup_history" ADD CONSTRAINT "backup_history_created_by_id_fkey"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;
