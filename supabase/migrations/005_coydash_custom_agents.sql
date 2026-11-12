-- Migration 005: Tabela de Agentes Customizados Conectados ao n8n
CREATE TABLE IF NOT EXISTS public.custom_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    webhook_url TEXT,
    channel TEXT NOT NULL DEFAULT 'WHATSAPP_COMMERCIAL',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_agents_org_id ON public.custom_agents(organization_id);

-- RLS
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_agents_all" ON public.custom_agents
    FOR ALL
    USING (true)
    WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
