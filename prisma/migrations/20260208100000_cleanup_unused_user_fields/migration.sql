-- ============================================================================
-- Migration: Cleanup Unused User Fields
-- ============================================================================
-- Remove campos não utilizados das tabelas users e user_employment
--
-- Campos removidos:
-- - users.death_date: Não faz sentido para funcionários do sistema
-- - users.is_disabled: Redundante com is_blocked
-- - users.role: Substituído por TenantRole via UserEmployment
-- - user_employment.role: Substituído por tenant_role_id
-- ============================================================================

-- Remover campos da tabela users
ALTER TABLE "users" DROP COLUMN IF EXISTS "death_date";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_disabled";
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

-- Remover índice e campo da tabela user_employment
DROP INDEX IF EXISTS "user_employment_role_idx";
ALTER TABLE "user_employment" DROP COLUMN IF EXISTS "role";
