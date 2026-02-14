-- CreateTable
CREATE TABLE "document_upload_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hash" TEXT NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "upload_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_upload_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_documents" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" "CitizenDocumentType" NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "file_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "s3_key" TEXT,
    "s3_bucket" TEXT,
    "s3_region" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "original_name" TEXT,
    "expiry_days" INTEGER,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
ALTER TYPE "UploadEntityType" ADD VALUE 'USER_DOCUMENT';

-- CreateIndex
CREATE UNIQUE INDEX "document_upload_tokens_uuid_key" ON "document_upload_tokens"("uuid");
CREATE UNIQUE INDEX "document_upload_tokens_hash_key" ON "document_upload_tokens"("hash");
CREATE INDEX "document_upload_tokens_hash_idx" ON "document_upload_tokens"("hash");
CREATE INDEX "document_upload_tokens_subscriber_id_idx" ON "document_upload_tokens"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_documents_uuid_key" ON "user_documents"("uuid");
CREATE INDEX "user_documents_user_id_idx" ON "user_documents"("user_id");
CREATE INDEX "user_documents_subscriber_id_idx" ON "user_documents"("subscriber_id");
CREATE INDEX "user_documents_subscriber_id_user_id_idx" ON "user_documents"("subscriber_id", "user_id");

-- AddForeignKey
ALTER TABLE "document_upload_tokens" ADD CONSTRAINT "document_upload_tokens_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_upload_tokens" ADD CONSTRAINT "document_upload_tokens_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
