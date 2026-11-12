-- ============================================================================
-- COYDASH — Migration 002:
-- 1. Central de Clientes 360º (clients, client_history_events, client_team_notes)
-- 2. Setores, Projetos e Tarefas do ROOMIE OFFICE AI (task_folders, task_lists, task_statuses, tasks)
-- 3. Módulos do Rangolivre: Atendimento WhatsApp, Tráfego Pago, Marketing, Financeiro e Configurações
-- ============================================================================

DO $coydash_migration_002$
BEGIN

-- ============================================================================
-- 1. CENTRAL DE CLIENTES 360º
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cnpj TEXT DEFAULT '',
    sector TEXT NOT NULL DEFAULT 'Serviços / Advocacia',
    team_squad TEXT NOT NULL DEFAULT 'Sparta',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'ONBOARDING' CHECK (status IN ('ONBOARDING', 'ACTIVE', 'CHURN_RISK')),
    ad_platform TEXT NOT NULL DEFAULT 'BOTH' CHECK (ad_platform IN ('META', 'GOOGLE', 'BOTH', 'NONE')),
    service_type TEXT NOT NULL DEFAULT 'Tráfego + IA',
    is_mc BOOLEAN NOT NULL DEFAULT true,
    nps_score INTEGER DEFAULT 9,
    last_optimization_date TEXT DEFAULT '',
    ad_spend NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ad_results INTEGER NOT NULL DEFAULT 0,
    ad_cpr NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ad_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    mrr_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    setup_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    traffic_manager_name TEXT DEFAULT '',
    designer_name TEXT DEFAULT '',
    cs_manager_name TEXT DEFAULT '',
    contact_name TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    whatsapp_group_link TEXT DEFAULT '',
    drive_folder_link TEXT DEFAULT '',
    connections JSONB NOT NULL DEFAULT '{"meta":"connected","google":"connected","whatsapp":"connected","ai":"connected","crm":"connected","finance":"connected"}'::jsonb,
    briefing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    commercial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    backups_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    agenda_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(organization_id);

CREATE TABLE IF NOT EXISTS client_history_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    actor_name TEXT NOT NULL DEFAULT 'Administrador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_history_client_id ON client_history_events(client_id);

CREATE TABLE IF NOT EXISTS client_team_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    note_type TEXT NOT NULL DEFAULT 'GERAL',
    content TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT 'Equipe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_team_notes(client_id);

-- ============================================================================
-- 2. SETORES, PROJETOS E TAREFAS (SISTEMA DO ROOMIE OFFICE AI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_folders_org_id ON task_folders(organization_id);

CREATE TABLE IF NOT EXISTS task_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    folder_id UUID NOT NULL REFERENCES task_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'ListTodo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_lists_org_id ON task_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_lists_folder_id ON task_lists(folder_id);

CREATE TABLE IF NOT EXISTS task_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_statuses_list_id ON task_statuses(list_id);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name_snapshot TEXT DEFAULT '',
    status_id UUID REFERENCES task_statuses(id) ON DELETE SET NULL,
    status_key TEXT NOT NULL DEFAULT 'todo',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_name TEXT DEFAULT '',
    due_date DATE,
    subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- ============================================================================
-- 3. MÓDULOS OPERACIONAIS DO RANGOLIVRE:
--    ATENDIMENTO WHATSAPP, TRÁFEGO PAGO, MARKETING, FINANCEIRO E CONFIGURAÇÕES
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    handoff_to_human BOOLEAN NOT NULL DEFAULT false,
    orders_count INTEGER NOT NULL DEFAULT 1,
    total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cashback_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ai_memory JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft_order JSONB DEFAULT NULL,
    draft_accepted BOOLEAN NOT NULL DEFAULT false,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_message_at TEXT NOT NULL DEFAULT 'Agora',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_convs_org_id ON whatsapp_conversations(organization_id);

CREATE TABLE IF NOT EXISTS paid_traffic_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    campaign_name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Meta Ads',
    note TEXT DEFAULT '',
    daily_budget NUMERIC(12,2) NOT NULL DEFAULT 50.00,
    spent_week NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    ctr_percent NUMERIC(5,2) NOT NULL DEFAULT 2.40,
    conversions_count INTEGER NOT NULL DEFAULT 0,
    revenue_attributed NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    roas NUMERIC(6,2) NOT NULL DEFAULT 5.00,
    is_champion_offer BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paid_campaigns_org_id ON paid_traffic_campaigns(organization_id);

CREATE TABLE IF NOT EXISTS marketing_blasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    segment_label TEXT NOT NULL,
    scheduled_for TEXT NOT NULL DEFAULT 'Hoje 18h30',
    delivered_count INTEGER NOT NULL DEFAULT 0,
    read_count INTEGER NOT NULL DEFAULT 0,
    conversions_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_blasts_org_id ON marketing_blasts(organization_id);

CREATE TABLE IF NOT EXISTS financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'RECEITA_SERVICO' CHECK (category IN ('RECEITA_SERVICO', 'TAXA_IMPOSTO', 'CUSTO_CMV', 'DESCONTO_CASHBACK')),
    channel TEXT NOT NULL DEFAULT 'WhatsApp IA',
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    margin_percent NUMERIC(5,2) NOT NULL DEFAULT 65.00,
    amount_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    health_tag TEXT NOT NULL DEFAULT 'Estrela',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_org_id ON financial_entries(organization_id);

CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    daily_budget_ads NUMERIC(12,2) NOT NULL DEFAULT 50.00,
    cashback_enabled BOOLEAN NOT NULL DEFAULT true,
    cashback_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    hunger_coupon_enabled BOOLEAN NOT NULL DEFAULT true,
    ai_auto_accept BOOLEAN NOT NULL DEFAULT true,
    handoff_only_on_insistence BOOLEAN NOT NULL DEFAULT true,
    selected_gateway TEXT NOT NULL DEFAULT 'ASAAS',
    gateway_status TEXT NOT NULL DEFAULT 'CONNECTED',
    pix_key TEXT DEFAULT '',
    whatsapp_number TEXT DEFAULT '+55 11 94000-1234',
    integrations_state JSONB NOT NULL DEFAULT '{"meta_ads":true,"google_ads":true,"whatsapp_cloud":true,"asaas_erp":true,"n8n_flow":true}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) E GRANTS PARA TODAS AS NOVAS TABELAS
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_history_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_team_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_traffic_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_blasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Multi-Tenant Clients" ON public.clients;
CREATE POLICY "Acesso Multi-Tenant Clients"
ON public.clients FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Client History" ON public.client_history_events;
CREATE POLICY "Acesso Multi-Tenant Client History"
ON public.client_history_events FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Client Notes" ON public.client_team_notes;
CREATE POLICY "Acesso Multi-Tenant Client Notes"
ON public.client_team_notes FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Task Folders" ON public.task_folders;
CREATE POLICY "Acesso Multi-Tenant Task Folders"
ON public.task_folders FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Task Lists" ON public.task_lists;
CREATE POLICY "Acesso Multi-Tenant Task Lists"
ON public.task_lists FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Task Statuses" ON public.task_statuses;
CREATE POLICY "Acesso Multi-Tenant Task Statuses"
ON public.task_statuses FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Tasks" ON public.tasks;
CREATE POLICY "Acesso Multi-Tenant Tasks"
ON public.tasks FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant WhatsApp Convs" ON public.whatsapp_conversations;
CREATE POLICY "Acesso Multi-Tenant WhatsApp Convs"
ON public.whatsapp_conversations FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Paid Traffic" ON public.paid_traffic_campaigns;
CREATE POLICY "Acesso Multi-Tenant Paid Traffic"
ON public.paid_traffic_campaigns FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Marketing Blasts" ON public.marketing_blasts;
CREATE POLICY "Acesso Multi-Tenant Marketing Blasts"
ON public.marketing_blasts FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Financial Entries" ON public.financial_entries;
CREATE POLICY "Acesso Multi-Tenant Financial Entries"
ON public.financial_entries FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Org Settings" ON public.organization_settings;
CREATE POLICY "Acesso Multi-Tenant Org Settings"
ON public.organization_settings FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

END $coydash_migration_002$;

