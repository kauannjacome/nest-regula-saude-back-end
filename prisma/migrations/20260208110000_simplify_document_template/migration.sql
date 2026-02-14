-- ============================================================================
-- Migration: Simplify DocumentTemplate
-- ============================================================================
-- Remove campos não utilizados do modelo DocumentTemplate.
-- Os templates são definidos em código TypeScript (lib/templates/documents/),
-- não como templates dinâmicos no banco de dados.
--
-- Campos removidos de document_template:
-- - is_global: Templates globais não implementados
-- - parent_template_id: Hierarquia de templates não implementada
-- - thumbnail_id: Preview visual não implementado
-- - content: Conteúdo HTML (templates são em .ts)
-- - db_models: Modelos de dados associados
-- - markers: Marcadores de substituição
-- - page_config: Configuração de página
-- - quick_texts: Textos rápidos
--
-- Campos removidos de upload:
-- - template_id: Relação com templates removida
-- ============================================================================

-- Remover campos da tabela document_template
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "is_global";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "parent_template_id";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "thumbnail_id";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "content";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "db_models";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "markers";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "page_config";
ALTER TABLE "document_template" DROP COLUMN IF EXISTS "quick_texts";

-- Remover índice e campo da tabela upload
DROP INDEX IF EXISTS "upload_template_id_idx";
ALTER TABLE "upload" DROP COLUMN IF EXISTS "template_id";

-- Remover índice de version que não é mais necessário
DROP INDEX IF EXISTS "document_template_version_idx";
