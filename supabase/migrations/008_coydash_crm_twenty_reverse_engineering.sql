-- ============================================================================
-- COYDASH — Migration 008:
-- Engenharia Reversa do Twenty CRM:
-- 1. Pipelines de Vendas e Oportunidades Multi-Funil (pipelines, pipeline_stages, deals)
-- 2. Pessoas e Múltiplos Contatos por Cliente (client_contacts 1:N)
-- 3. Linha do Tempo Unificada de Atividades (activity_timeline)
-- 4. Visões Salvas e Configuração de Colunas/Filtros (workspace_saved_views)
-- 5. Expansão de Custom Fields para Clientes e Negócios
-- 6. RLS Multi-Tenant e Supabase Realtime
-- ============================================================================

DO $coydash_migration_008$
BEGIN

-- 1. PIPELINES DE VENDAS (MULTI-FUNIL)
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    color TEXT NOT NULL DEFAULT '#F0521F',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_org_id ON public.pipelines(organization_id);

-- 2. ESTÁGIOS DO PIPELINE (STAGES COM PROBABILIDADE E CORES)
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL DEFAULT 0,
    probability_percent INTEGER NOT NULL DEFAULT 10,
    color TEXT NOT NULL DEFAULT '#38bdf8',
    is_won BOOLEAN NOT NULL DEFAULT false,
    is_lost BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipe_id ON public.pipeline_stages(pipeline_id);

-- 3. OPORTUNIDADES COMERCIAIS (DEALS)
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
    client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id TEXT NULL REFERENCES public.leads(lead_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    value_mrr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    value_setup NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    expected_close_date DATE NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_member_id UUID NULL REFERENCES public.organization_members(id) ON DELETE SET NULL,
    assigned_member_name TEXT DEFAULT '',
    lost_reason TEXT NULL,
    notes TEXT DEFAULT '',
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deals_org_id ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON public.deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON public.deals(lead_id);

-- 4. PESSOAS & MÚLTIPLOS CONTATOS POR CLIENTE (1:N CLIENT_CONTACTS)
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    lead_id TEXT NULL REFERENCES public.leads(lead_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    job_title TEXT NOT NULL DEFAULT 'Contato Comercial',
    department TEXT NOT NULL DEFAULT 'Diretoria / Operações',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    is_decision_maker BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_org_id ON public.client_contacts(organization_id);

-- 5. LINHA DO TEMPO UNIFICADA DE ATIVIDADES E AUDITORIA (ACTIVITY_TIMELINE)
CREATE TABLE IF NOT EXISTS public.activity_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CLIENT', 'DEAL', 'LEAD', 'TASK')),
    entity_id TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT 'Sistema',
    actor_id UUID NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'STATUS_CHANGED', 
        'STAGE_MOVED', 
        'NOTE_ADDED', 
        'MEETING_SCHEDULED', 
        'PROPOSAL_CREATED', 
        'DEAL_WON', 
        'DEAL_LOST', 
        'TASK_COMPLETED',
        'FIELD_UPDATED',
        'COMMUNICATION_LOGGED'
    )),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_entity ON public.activity_timeline(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_org_id ON public.activity_timeline(organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON public.activity_timeline(created_at DESC);

-- 6. VISÕES SALVAS DO DATA GRID (WORKSPACE_SAVED_VIEWS)
CREATE TABLE IF NOT EXISTS public.workspace_saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NULL,
    view_scope TEXT NOT NULL CHECK (view_scope IN ('CLIENTS', 'DEALS', 'TASKS')),
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'LayoutGrid',
    is_shared BOOLEAN NOT NULL DEFAULT true,
    columns_visible JSONB NOT NULL DEFAULT '[]'::jsonb,
    filters_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_config JSONB NOT NULL DEFAULT '{"field": "created_at", "direction": "desc"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_org_scope ON public.workspace_saved_views(organization_id, view_scope);

-- 7. EXPANDIR CUSTOM FIELDS DEFINITIONS PARA CLIENTES E DEALS
ALTER TABLE public.custom_field_definitions
    DROP CONSTRAINT IF EXISTS custom_field_definitions_scope_check;

ALTER TABLE public.custom_field_definitions
    ADD CONSTRAINT custom_field_definitions_scope_check 
    CHECK (scope IN ('task', 'list', 'template', 'client', 'deal'));

-- 8. RLS POLICIES MULTI-TENANT
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_auth_pipelines" ON public.pipelines;
CREATE POLICY "allow_all_auth_pipelines" ON public.pipelines
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_pipeline_stages" ON public.pipeline_stages;
CREATE POLICY "allow_all_auth_pipeline_stages" ON public.pipeline_stages
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_deals" ON public.deals;
CREATE POLICY "allow_all_auth_deals" ON public.deals
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_client_contacts" ON public.client_contacts;
CREATE POLICY "allow_all_auth_client_contacts" ON public.client_contacts
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_activity_timeline" ON public.activity_timeline;
CREATE POLICY "allow_all_auth_activity_timeline" ON public.activity_timeline
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_auth_saved_views" ON public.workspace_saved_views;
CREATE POLICY "allow_all_auth_saved_views" ON public.workspace_saved_views
    FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.pipelines TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.pipeline_stages TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.deals TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.client_contacts TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.activity_timeline TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.workspace_saved_views TO postgres, anon, authenticated, service_role;

-- 9. HABILITAR REALTIME SUPABASE PARA AS NOVAS TABELAS
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pipelines;
EXCEPTION WHEN duplicate_object THEN NULL;
END;

BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_stages;
EXCEPTION WHEN duplicate_object THEN NULL;
END;

BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
EXCEPTION WHEN duplicate_object THEN NULL;
END;

BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_contacts;
EXCEPTION WHEN duplicate_object THEN NULL;
END;

BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_timeline;
EXCEPTION WHEN duplicate_object THEN NULL;
END;

NOTIFY pgrst, 'reload schema';

END $coydash_migration_008$;
