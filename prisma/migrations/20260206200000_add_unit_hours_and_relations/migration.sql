-- Adicionar campos de horário de funcionamento à tabela Unit
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "monday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "monday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "tuesday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "tuesday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "wednesday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "wednesday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "thursday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "thursday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "friday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "friday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "saturday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "saturday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "sunday_open" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "sunday_close" TEXT;
ALTER TABLE "unit" ADD COLUMN IF NOT EXISTS "operating_notes" TEXT;

-- Adicionar unitId à tabela UserEmployment (relação: funcionário trabalha em uma unidade)
ALTER TABLE "user_employment" ADD COLUMN IF NOT EXISTS "unit_id" INTEGER;

-- Adicionar unitId à tabela Regulation (relação: regulação originada de uma unidade)
ALTER TABLE "regulation" ADD COLUMN IF NOT EXISTS "unit_id" INTEGER;

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS "user_employment_unit_id_idx" ON "user_employment"("unit_id");
CREATE INDEX IF NOT EXISTS "regulation_unit_id_idx" ON "regulation"("unit_id");

-- Adicionar foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_employment_unit_id_fkey'
    ) THEN
        ALTER TABLE "user_employment"
        ADD CONSTRAINT "user_employment_unit_id_fkey"
        FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'regulation_unit_id_fkey'
    ) THEN
        ALTER TABLE "regulation"
        ADD CONSTRAINT "regulation_unit_id_fkey"
        FOREIGN KEY ("unit_id") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
