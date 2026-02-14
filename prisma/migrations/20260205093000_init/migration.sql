-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRAZO', 'PRIORIDADE', 'QUANTIDADE_ATINGIDA', 'AGENDAMENTO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'PRINT', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'SEND', 'RECEIVE', 'IMPERSONATE_START', 'IMPERSONATE_STOP');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'APPROVED', 'DENIED', 'RETURNED');

-- CreateEnum
CREATE TYPE "CareStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UnitMeasure" AS ENUM ('MG', 'G', 'MCG', 'KG', 'ML', 'L', 'AMP', 'COMP', 'CAPS', 'FR', 'TUB', 'DOSE', 'UI', 'CX', 'UN', 'SESSION', 'DAILY', 'MEASURE', 'OINTMENT', 'CREAM', 'GEL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('ELECTIVE', 'URGENCY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('FRIEND', 'PARENT', 'CAREGIVER', 'BOYFRIEND_GIRLFRIEND', 'SPOUSE', 'UNCLE_AUNT', 'SIBLING', 'COUSIN', 'NEPHEW_NIECE');

-- CreateEnum
CREATE TYPE "ResourceOrigin" AS ENUM ('NOT_SPECIFIED', 'MUNICIPAL', 'STATE', 'FEDERAL');

-- CreateEnum
CREATE TYPE "TypeDeclaration" AS ENUM ('NONE', 'RESIDENCE_PEC', 'RESIDENCE_CADSUS', 'UPDATE_CADSUS', 'COST_HELP', 'HIGH_COST_EXAM', 'AUTHORIZATION', 'WITHDRAWAL', 'AIH', 'TRANSPORT', 'CER', 'CONTINUOUS_MEDICATION', 'PHARMACEUTICAL_ASSISTANCE');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'JUSTIFICATION', 'SELECT', 'MULTISELECT');

-- CreateEnum
CREATE TYPE "WhatsAppTrigger" AS ENUM ('STATUS_CHANGE', 'SCHEDULE_REMINDER', 'SCHEDULE_CONFIRMED', 'PICKUP_READY', 'CITIZEN_QUESTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PRINTED_DOCUMENT', 'DIGITAL_DOCUMENT');

-- CreateEnum
CREATE TYPE "CitizenDocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'RG', 'CPF', 'CNH', 'VOTER_ID', 'PROOF_OF_RESIDENCE', 'WORK_CARD', 'SUS_CARD', 'SUS_MIRROR', 'PIS_PASEP', 'RESERVIST_CERTIFICATE', 'GOV_BR', 'DIGITAL_CNH', 'DIGITAL_RG', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRegulationAction" AS ENUM ('CREATOR', 'ANALYZER', 'PRINTER', 'VIEWER', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "uuid" UUID NOT NULL,
    "cpf" TEXT,
    "name" TEXT,
    "name_normalized" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "cargo" TEXT,
    "sex" "Sex",
    "birth_date" TIMESTAMP(3),
    "phone_number" TEXT,
    "cns" TEXT,
    "professional_registry" TEXT,
    "registry_type" TEXT,
    "registry_number" TEXT,
    "registry_state" TEXT,
    "role" TEXT DEFAULT 'TYPIST',
    "password_hash" TEXT,
    "is_password_temp" BOOLEAN NOT NULL DEFAULT false,
    "number_try" INTEGER DEFAULT 0,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms_at" TIMESTAMP(3),
    "accepted_terms_version" TEXT,
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "complement" TEXT,
    "death_date" TIMESTAMP(3),
    "father_name" TEXT,
    "gender" TEXT,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "marital_status" TEXT,
    "mother_name" TEXT,
    "nationality" TEXT,
    "naturalness" TEXT,
    "neighborhood" TEXT,
    "number" TEXT,
    "postal_code" TEXT,
    "race" TEXT,
    "social_name" TEXT,
    "state" TEXT,
    "number_unlock" INTEGER DEFAULT 0,
    "is_system_manager" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "rg" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "municipality_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "state_name" TEXT NOT NULL,
    "state_acronym" TEXT NOT NULL,
    "state_logo" TEXT,
    "municipal_logo" TEXT,
    "administration_logo" TEXT,
    "payment" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "cnes" TEXT,
    "complement" TEXT,
    "email" TEXT,
    "neighborhood" TEXT,
    "number" TEXT,
    "phone" TEXT,
    "postal_code" TEXT,
    "state" TEXT,
    "type" TEXT,

    CONSTRAINT "unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "actor_id" TEXT,
    "object_type" TEXT NOT NULL,
    "object_id" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "detail" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT,
    "acronym" TEXT,
    "description" TEXT,
    "status" "CareStatus" DEFAULT 'ACTIVE',
    "resource_origin" "ResourceOrigin" DEFAULT 'NOT_SPECIFIED',
    "priority" "Priority" DEFAULT 'ELECTIVE',
    "unit_measure" "UnitMeasure",
    "type_declaration" "TypeDeclaration",
    "value" DOUBLE PRECISION,
    "amount" INTEGER,
    "min_deadline_days" INTEGER,
    "group_id" INTEGER,
    "user_id" TEXT,
    "supplier_id" INTEGER,
    "type" TEXT,
    "protocol" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "care_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT,
    "id_code" TEXT,
    "description" TEXT,
    "responsible_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "color" TEXT DEFAULT '#3B82F6',

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "cns" TEXT,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT,
    "social_name" TEXT,
    "gender" TEXT,
    "race" TEXT,
    "sex" TEXT,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "death_date" TIMESTAMP(3),
    "mother_name" TEXT,
    "father_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "postal_code" TEXT,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "nationality" TEXT,
    "naturalness" TEXT,
    "marital_status" TEXT,
    "blood_type" TEXT,
    "password_hash" TEXT,
    "is_password_temp" BOOLEAN NOT NULL DEFAULT false,
    "number_try" INTEGER DEFAULT 0,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms_at" TIMESTAMP(3),
    "accepted_terms_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "number_unlock" INTEGER DEFAULT 0,
    "rg" TEXT,
    "rg_issue_date" TIMESTAMP(3),
    "rg_issuer" TEXT,
    "rg_state" TEXT,

    CONSTRAINT "citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_employment" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "role_id" TEXT,
    "role" TEXT DEFAULT 'TYPIST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "id_code" TEXT,
    "citizen_id" INTEGER,
    "responsible_id" INTEGER,
    "request_date" TIMESTAMP(3),
    "scheduled_date" TIMESTAMP(3),
    "status" "Status",
    "notes" TEXT,
    "clinical_indication" TEXT,
    "cid" TEXT,
    "folder_id" INTEGER,
    "relationship" "Relationship",
    "priority" "Priority" DEFAULT 'ELECTIVE',
    "template_id" INTEGER,
    "requesting_professional" TEXT,
    "creator_id" TEXT,
    "analyzed_id" TEXT,
    "printer_id" TEXT,
    "supplier_id" INTEGER,
    "history" INTEGER DEFAULT 1,
    "version_document" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_user" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "regulation_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "action" "UserRegulationAction",
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "regulation_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "trade_name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "postal_code" TEXT,
    "city" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "address" TEXT,
    "complement" TEXT,
    "email" TEXT,
    "inscricao_estadual" TEXT,
    "neighborhood" TEXT,
    "number" TEXT,
    "phone" TEXT,
    "website" TEXT,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_regulation" (
    "id" SERIAL NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "care_id" INTEGER NOT NULL,
    "regulation_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_of_use" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "terms_of_use_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "regulation_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "days_count" INTEGER,
    "citizen_name" TEXT,
    "priority" "Priority",
    "scheduled_date" TIMESTAMP(3),

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_config" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "instance_name" TEXT,
    "api_key" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'evolution',
    "credentials" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "api_url" TEXT,
    "webhook_secret" TEXT,

    CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_document" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "citizen_id" INTEGER NOT NULL,
    "document_type" "CitizenDocumentType" NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "file_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "expiry_days" INTEGER,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "original_name" TEXT,
    "s3_bucket" TEXT,
    "s3_key" TEXT,
    "s3_region" TEXT,
    "uploaded_by_id" TEXT,

    CONSTRAINT "citizen_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_log" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "document_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_template" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT,
    "description" TEXT,
    "category" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_by" TEXT,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "parent_template_id" INTEGER,
    "thumbnail_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "content" TEXT,
    "db_models" JSONB,
    "markers" JSONB,
    "page_config" JSONB,
    "quick_texts" JSONB,

    CONSTRAINT "document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "tag" TEXT,
    "uploader_id" TEXT,
    "subscriber_id" INTEGER,
    "template_id" INTEGER,
    "regulation_id" INTEGER,
    "citizen_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_document" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "template_version" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "data_snapshot" JSONB NOT NULL,
    "file_path" TEXT,
    "file_url" TEXT,
    "file_size" INTEGER,
    "generation_time" INTEGER,
    "generated_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "thumbnail_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "content" TEXT,
    "markers" JSONB,
    "page_config" JSONB,
    "regulationId" INTEGER,

    CONSTRAINT "generated_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_programmed" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" "WhatsAppTrigger" NOT NULL,
    "trigger_value" TEXT,
    "header_text" TEXT,
    "body_text" TEXT NOT NULL,
    "footer_text" TEXT,
    "buttons" JSONB,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_programmed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "regulation_id" INTEGER NOT NULL,
    "professional_id" TEXT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "scheduled_end_date" TIMESTAMP(3),
    "notes" TEXT,
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrence_interval" INTEGER,
    "recurrence_end_date" TIMESTAMP(3),
    "parent_schedule_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rule" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_programmed_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_actions" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "allowed_actions" TEXT[],
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "access_limit" INTEGER NOT NULL DEFAULT 3,
    "targetData" JSONB NOT NULL,
    "executionLogs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "type" TEXT,

    CONSTRAINT "batch_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_roles" (
    "id" TEXT NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BatchRegulations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BatchRegulations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BatchSchedules" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BatchSchedules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rg_key" ON "users"("rg");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_cpf_idx" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_uuid_key" ON "subscriber"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_cnpj_key" ON "subscriber"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "unit_uuid_key" ON "unit"("uuid");

-- CreateIndex
CREATE INDEX "unit_subscriber_id_idx" ON "unit"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_uuid_key" ON "audit_log"("uuid");

-- CreateIndex
CREATE INDEX "audit_log_subscriber_id_idx" ON "audit_log"("subscriber_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_object_type_object_id_idx" ON "audit_log"("object_type", "object_id");

-- CreateIndex
CREATE UNIQUE INDEX "care_uuid_key" ON "care"("uuid");

-- CreateIndex
CREATE INDEX "care_subscriber_id_idx" ON "care"("subscriber_id");

-- CreateIndex
CREATE INDEX "care_group_id_idx" ON "care"("group_id");

-- CreateIndex
CREATE INDEX "care_user_id_idx" ON "care"("user_id");

-- CreateIndex
CREATE INDEX "care_subscriber_id_status_deleted_at_idx" ON "care"("subscriber_id", "status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "folder_uuid_key" ON "folder"("uuid");

-- CreateIndex
CREATE INDEX "folder_subscriber_id_idx" ON "folder"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_uuid_key" ON "group"("uuid");

-- CreateIndex
CREATE INDEX "group_id_idx" ON "group"("id");

-- CreateIndex
CREATE INDEX "group_subscriber_id_idx" ON "group"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_uuid_key" ON "citizen"("uuid");

-- CreateIndex
CREATE INDEX "citizen_subscriber_id_idx" ON "citizen"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_subscriber_id_cpf_key" ON "citizen"("subscriber_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "user_employment_uuid_key" ON "user_employment"("uuid");

-- CreateIndex
CREATE INDEX "user_employment_user_id_idx" ON "user_employment"("user_id");

-- CreateIndex
CREATE INDEX "user_employment_subscriber_id_idx" ON "user_employment"("subscriber_id");

-- CreateIndex
CREATE INDEX "user_employment_role_id_idx" ON "user_employment"("role_id");

-- CreateIndex
CREATE INDEX "user_employment_role_idx" ON "user_employment"("role");

-- CreateIndex
CREATE INDEX "user_employment_is_active_idx" ON "user_employment"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_employment_user_id_subscriber_id_key" ON "user_employment"("user_id", "subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_uuid_key" ON "regulation"("uuid");

-- CreateIndex
CREATE INDEX "regulation_subscriber_id_idx" ON "regulation"("subscriber_id");

-- CreateIndex
CREATE INDEX "regulation_citizen_id_idx" ON "regulation"("citizen_id");

-- CreateIndex
CREATE INDEX "regulation_folder_id_idx" ON "regulation"("folder_id");

-- CreateIndex
CREATE INDEX "regulation_supplier_id_idx" ON "regulation"("supplier_id");

-- CreateIndex
CREATE INDEX "regulation_template_id_idx" ON "regulation"("template_id");

-- CreateIndex
CREATE INDEX "regulation_subscriber_id_status_idx" ON "regulation"("subscriber_id", "status");

-- CreateIndex
CREATE INDEX "regulation_subscriber_id_created_at_idx" ON "regulation"("subscriber_id", "created_at");

-- CreateIndex
CREATE INDEX "regulation_subscriber_id_status_deleted_at_idx" ON "regulation"("subscriber_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "regulation_subscriber_id_request_date_idx" ON "regulation"("subscriber_id", "request_date" DESC);

-- CreateIndex
CREATE INDEX "regulation_citizen_id_status_idx" ON "regulation"("citizen_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_user_uuid_key" ON "regulation_user"("uuid");

-- CreateIndex
CREATE INDEX "regulation_user_regulation_id_idx" ON "regulation_user"("regulation_id");

-- CreateIndex
CREATE INDEX "regulation_user_user_id_idx" ON "regulation_user"("user_id");

-- CreateIndex
CREATE INDEX "regulation_user_action_idx" ON "regulation_user"("action");

-- CreateIndex
CREATE INDEX "regulation_user_regulation_id_action_idx" ON "regulation_user"("regulation_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_uuid_key" ON "supplier"("uuid");

-- CreateIndex
CREATE INDEX "supplier_subscriber_id_idx" ON "supplier"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_subscriber_id_cnpj_key" ON "supplier"("subscriber_id", "cnpj");

-- CreateIndex
CREATE INDEX "care_regulation_care_id_idx" ON "care_regulation"("care_id");

-- CreateIndex
CREATE INDEX "care_regulation_regulation_id_idx" ON "care_regulation"("regulation_id");

-- CreateIndex
CREATE INDEX "care_regulation_subscriber_id_idx" ON "care_regulation"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "care_regulation_care_id_regulation_id_key" ON "care_regulation"("care_id", "regulation_id");

-- CreateIndex
CREATE UNIQUE INDEX "terms_of_use_uuid_key" ON "terms_of_use"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "terms_of_use_version_key" ON "terms_of_use"("version");

-- CreateIndex
CREATE INDEX "terms_of_use_is_active_idx" ON "terms_of_use"("is_active");

-- CreateIndex
CREATE INDEX "terms_of_use_version_idx" ON "terms_of_use"("version");

-- CreateIndex
CREATE UNIQUE INDEX "notification_uuid_key" ON "notification"("uuid");

-- CreateIndex
CREATE INDEX "notification_subscriber_id_idx" ON "notification"("subscriber_id");

-- CreateIndex
CREATE INDEX "notification_user_id_idx" ON "notification"("user_id");

-- CreateIndex
CREATE INDEX "notification_regulation_id_idx" ON "notification"("regulation_id");

-- CreateIndex
CREATE INDEX "notification_created_at_idx" ON "notification"("created_at");

-- CreateIndex
CREATE INDEX "notification_subscriber_id_created_at_idx" ON "notification"("subscriber_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_config_uuid_key" ON "whatsapp_config"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_config_subscriber_id_key" ON "whatsapp_config"("subscriber_id");

-- CreateIndex
CREATE INDEX "whatsapp_config_subscriber_id_idx" ON "whatsapp_config"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_document_uuid_key" ON "citizen_document"("uuid");

-- CreateIndex
CREATE INDEX "citizen_document_category_idx" ON "citizen_document"("category");

-- CreateIndex
CREATE INDEX "citizen_document_document_type_idx" ON "citizen_document"("document_type");

-- CreateIndex
CREATE INDEX "citizen_document_citizen_id_idx" ON "citizen_document"("citizen_id");

-- CreateIndex
CREATE INDEX "citizen_document_subscriber_id_idx" ON "citizen_document"("subscriber_id");

-- CreateIndex
CREATE INDEX "citizen_document_subscriber_id_citizen_id_idx" ON "citizen_document"("subscriber_id", "citizen_id");

-- CreateIndex
CREATE INDEX "citizen_document_uploaded_by_id_idx" ON "citizen_document"("uploaded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_access_log_uuid_key" ON "document_access_log"("uuid");

-- CreateIndex
CREATE INDEX "document_access_log_document_id_idx" ON "document_access_log"("document_id");

-- CreateIndex
CREATE INDEX "document_access_log_user_id_idx" ON "document_access_log"("user_id");

-- CreateIndex
CREATE INDEX "document_access_log_document_id_created_at_idx" ON "document_access_log"("document_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_template_uuid_key" ON "document_template"("uuid");

-- CreateIndex
CREATE INDEX "document_template_subscriber_id_idx" ON "document_template"("subscriber_id");

-- CreateIndex
CREATE INDEX "document_template_created_by_idx" ON "document_template"("created_by");

-- CreateIndex
CREATE INDEX "document_template_subscriber_id_status_idx" ON "document_template"("subscriber_id", "status");

-- CreateIndex
CREATE INDEX "document_template_subscriber_id_category_idx" ON "document_template"("subscriber_id", "category");

-- CreateIndex
CREATE INDEX "document_template_version_idx" ON "document_template"("version");

-- CreateIndex
CREATE UNIQUE INDEX "upload_uuid_key" ON "upload"("uuid");

-- CreateIndex
CREATE INDEX "upload_uploader_id_idx" ON "upload"("uploader_id");

-- CreateIndex
CREATE INDEX "upload_subscriber_id_idx" ON "upload"("subscriber_id");

-- CreateIndex
CREATE INDEX "upload_template_id_idx" ON "upload"("template_id");

-- CreateIndex
CREATE INDEX "upload_regulation_id_idx" ON "upload"("regulation_id");

-- CreateIndex
CREATE INDEX "upload_citizen_id_idx" ON "upload"("citizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "generated_document_uuid_key" ON "generated_document"("uuid");

-- CreateIndex
CREATE INDEX "generated_document_subscriber_id_idx" ON "generated_document"("subscriber_id");

-- CreateIndex
CREATE INDEX "generated_document_template_id_idx" ON "generated_document"("template_id");

-- CreateIndex
CREATE INDEX "generated_document_generated_by_idx" ON "generated_document"("generated_by");

-- CreateIndex
CREATE INDEX "generated_document_subscriber_id_created_at_idx" ON "generated_document"("subscriber_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_programmed_uuid_key" ON "whatsapp_programmed"("uuid");

-- CreateIndex
CREATE INDEX "whatsapp_programmed_subscriber_id_idx" ON "whatsapp_programmed"("subscriber_id");

-- CreateIndex
CREATE INDEX "whatsapp_programmed_subscriber_id_trigger_type_idx" ON "whatsapp_programmed"("subscriber_id", "trigger_type");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_uuid_key" ON "schedule"("uuid");

-- CreateIndex
CREATE INDEX "schedule_subscriber_id_idx" ON "schedule"("subscriber_id");

-- CreateIndex
CREATE INDEX "schedule_regulation_id_idx" ON "schedule"("regulation_id");

-- CreateIndex
CREATE INDEX "schedule_subscriber_id_scheduled_date_idx" ON "schedule"("subscriber_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "schedule_parent_schedule_id_idx" ON "schedule"("parent_schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_rule_uuid_key" ON "notification_rule"("uuid");

-- CreateIndex
CREATE INDEX "notification_rule_subscriber_id_idx" ON "notification_rule"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_actions_uuid_key" ON "batch_actions"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "batch_actions_hash_key" ON "batch_actions"("hash");

-- CreateIndex
CREATE INDEX "batch_actions_hash_idx" ON "batch_actions"("hash");

-- CreateIndex
CREATE INDEX "batch_actions_subscriber_id_idx" ON "batch_actions"("subscriber_id");

-- CreateIndex
CREATE INDEX "batch_actions_user_id_idx" ON "batch_actions"("user_id");

-- CreateIndex
CREATE INDEX "permissions_subscriber_id_idx" ON "permissions"("subscriber_id");

-- CreateIndex
CREATE INDEX "permissions_subscriber_id_resource_idx" ON "permissions"("subscriber_id", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_subscriber_id_name_key" ON "permissions"("subscriber_id", "name");

-- CreateIndex
CREATE INDEX "tenant_roles_subscriber_id_idx" ON "tenant_roles"("subscriber_id");

-- CreateIndex
CREATE INDEX "tenant_roles_subscriber_id_is_system_idx" ON "tenant_roles"("subscriber_id", "is_system");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_roles_subscriber_id_name_key" ON "tenant_roles"("subscriber_id", "name");

-- CreateIndex
CREATE INDEX "tenant_role_permissions_role_id_idx" ON "tenant_role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "tenant_role_permissions_permission_id_idx" ON "tenant_role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_role_permissions_role_id_permission_id_key" ON "tenant_role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "_BatchRegulations_B_index" ON "_BatchRegulations"("B");

-- CreateIndex
CREATE INDEX "_BatchSchedules_B_index" ON "_BatchSchedules"("B");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit" ADD CONSTRAINT "unit_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care" ADD CONSTRAINT "care_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care" ADD CONSTRAINT "care_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care" ADD CONSTRAINT "care_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care" ADD CONSTRAINT "care_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group" ADD CONSTRAINT "group_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen" ADD CONSTRAINT "citizen_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_employment" ADD CONSTRAINT "user_employment_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_employment" ADD CONSTRAINT "user_employment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_employment" ADD CONSTRAINT "user_employment_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tenant_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_analyzed_id_fkey" FOREIGN KEY ("analyzed_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_printer_id_fkey" FOREIGN KEY ("printer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_user" ADD CONSTRAINT "regulation_user_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_user" ADD CONSTRAINT "regulation_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_regulation" ADD CONSTRAINT "care_regulation_care_id_fkey" FOREIGN KEY ("care_id") REFERENCES "care"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_regulation" ADD CONSTRAINT "care_regulation_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_regulation" ADD CONSTRAINT "care_regulation_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_config" ADD CONSTRAINT "whatsapp_config_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_document" ADD CONSTRAINT "citizen_document_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_document" ADD CONSTRAINT "citizen_document_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_document" ADD CONSTRAINT "citizen_document_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_log" ADD CONSTRAINT "document_access_log_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "citizen_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_log" ADD CONSTRAINT "document_access_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template" ADD CONSTRAINT "document_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template" ADD CONSTRAINT "document_template_parent_template_id_fkey" FOREIGN KEY ("parent_template_id") REFERENCES "document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template" ADD CONSTRAINT "document_template_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_template" ADD CONSTRAINT "document_template_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "document_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload" ADD CONSTRAINT "upload_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_document" ADD CONSTRAINT "generated_document_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_document" ADD CONSTRAINT "generated_document_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "regulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_document" ADD CONSTRAINT "generated_document_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_document" ADD CONSTRAINT "generated_document_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "document_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_document" ADD CONSTRAINT "generated_document_thumbnail_id_fkey" FOREIGN KEY ("thumbnail_id") REFERENCES "upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_programmed" ADD CONSTRAINT "whatsapp_programmed_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_parent_schedule_id_fkey" FOREIGN KEY ("parent_schedule_id") REFERENCES "schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_whatsapp_programmed_id_fkey" FOREIGN KEY ("whatsapp_programmed_id") REFERENCES "whatsapp_programmed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_actions" ADD CONSTRAINT "batch_actions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_actions" ADD CONSTRAINT "batch_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_roles" ADD CONSTRAINT "tenant_roles_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_role_permissions" ADD CONSTRAINT "tenant_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tenant_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_role_permissions" ADD CONSTRAINT "tenant_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchRegulations" ADD CONSTRAINT "_BatchRegulations_A_fkey" FOREIGN KEY ("A") REFERENCES "batch_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchRegulations" ADD CONSTRAINT "_BatchRegulations_B_fkey" FOREIGN KEY ("B") REFERENCES "regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchSchedules" ADD CONSTRAINT "_BatchSchedules_A_fkey" FOREIGN KEY ("A") REFERENCES "batch_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchSchedules" ADD CONSTRAINT "_BatchSchedules_B_fkey" FOREIGN KEY ("B") REFERENCES "schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
