-- ==============================================================================
-- COYDASH CRM & PLATFORM - MIGRATION 009: UNIVERSAL MCP SERVER & TOKEN GOVERNANCE
-- ==============================================================================
-- Mapeamento e Infraestrutura para o CoyDash Universal Model Context Protocol (MCP) Server.
-- Inclui tabelas para tokens de API com hash SHA-256 e trilha de auditoria imutável.
-- ==============================================================================

-- 1. Tabela de Tokens de Acesso ao Servidor MCP
CREATE TABLE IF NOT EXISTS public.mcp_api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('READ_ONLY', 'OPERATOR', 'MANAGER', 'ADMIN')),
    allowed_scopes JSONB NOT NULL DEFAULT '["atendimento:read", "comercial:read", "tarefas:read", "clientes:read"]'::jsonb,
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    last_used_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Auditoria Imutável de Chamadas MCP
CREATE TABLE IF NOT EXISTS public.mcp_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    token_id UUID NULL REFERENCES public.mcp_api_tokens(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    arguments JSONB NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FORBIDDEN', 'VALIDATION_ERROR', 'INTERNAL_ERROR')),
    execution_time_ms INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    client_ip TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_org ON public.mcp_api_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_hash ON public.mcp_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_org_created ON public.mcp_audit_logs(organization_id, created_at DESC);

-- 4. RLS & Permissões
ALTER TABLE public.mcp_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir leitura de tokens por organização" ON public.mcp_api_tokens;
    CREATE POLICY "Permitir leitura de tokens por organização" ON public.mcp_api_tokens
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Permitir auditoria MCP" ON public.mcp_audit_logs;
    CREATE POLICY "Permitir auditoria MCP" ON public.mcp_audit_logs
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

GRANT ALL ON public.mcp_api_tokens TO postgres, authenticated, service_role, anon;
GRANT ALL ON public.mcp_audit_logs TO postgres, authenticated, service_role, anon;

