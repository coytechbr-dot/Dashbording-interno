-- ============================================================================
-- COYDASH (ECOSSISTEMA COYTECH: STUDIO, FLOW & PULSE)
-- Migration 001: Schema Relacional, Vetorial (pgvector) e RLS Multi-Tenant
-- Baseado em: SDD 01, SDD 04 e SDD 05
-- ============================================================================

DO $coydash_migration$
BEGIN

-- 1. EXTENSÕES OBRIGATÓRIAS NO SUPABASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 2. CLIENTES B2B (TENANTS) E JORNADA OPERACIONAL DE 6 ETAPAS
-- ============================================================================
BEGIN
    CREATE TYPE company_tier AS ENUM ('MID_MARKET', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END;

BEGIN
    CREATE TYPE lifecycle_stage AS ENUM (
        'STAGE_1_ONBOARDING',
        'STAGE_2_PLANNING_BIA',
        'STAGE_3_PRESENTATION',
        'STAGE_4_GO_LIVE',
        'STAGE_5_LTV_RECURRING',
        'STAGE_6_OFFBOARDING',
        'PASSIVE_RETENTION_PLAN',
        'CHURNED_ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cnpj TEXT,
    sector TEXT NOT NULL DEFAULT 'Operações B2B',
    team_size TEXT NOT NULL DEFAULT '6–20',
    tier company_tier NOT NULL DEFAULT 'MID_MARKET',
    current_stage lifecycle_stage NOT NULL DEFAULT 'STAGE_1_ONBOARDING',
    google_drive_folder_url TEXT,
    whatsapp_group_jid TEXT,
    litellm_virtual_key_id TEXT,
    litellm_monthly_budget NUMERIC(12,2) NOT NULL DEFAULT 2500.00,
    litellm_current_spend NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monthly_mrr_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    setup_fee_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    hourly_revenue_avg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    hourly_revenue_live NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    conversion_rate_avg NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    conversion_rate_live NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    golive_step_a_pulse BOOLEAN NOT NULL DEFAULT false,
    golive_step_b_studio_flow BOOLEAN NOT NULL DEFAULT false,
    golive_step_c_lock_sheets BOOLEAN NOT NULL DEFAULT false,
    kickoff_completed_at TIMESTAMPTZ,
    golive_completed_at TIMESTAMPTZ,
    next_qbr_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

BEGIN
    CREATE TYPE org_role AS ENUM (
        'COYTECH_ADMIN',
        'COYTECH_SRE',
        'CLIENT_CEO_DIRECTOR',
        'CLIENT_COO_MANAGER',
        'CLIENT_CTO_IT',
        'CLIENT_OPERATIONS',
        'EXTERNAL_PARTNER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    whatsapp_phone TEXT,
    role org_role NOT NULL DEFAULT 'CLIENT_CEO_DIRECTOR',
    receive_monday_8am_report BOOLEAN NOT NULL DEFAULT true,
    receive_critical_bia_alerts BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);

-- ============================================================================
-- 3. COYTECH PULSE: MATRIZ DE IMPACTO FINANCEIRO (BIA) & MONITORAMENTO 4 CAMADAS
-- ============================================================================
BEGIN
    CREATE TYPE monitoring_layer AS ENUM (
        'LAYER_1_INFRA_ZABBIX',
        'LAYER_2_APP_DATADOG_N8N',
        'LAYER_3_SYNTHETIC_UX',
        'LAYER_4_EXTERNAL_SEFAZ_BANK'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS bia_critical_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    process_name TEXT NOT NULL,
    layer monitoring_layer NOT NULL,
    cost_per_hour_stopped NUMERIC(12,2) NOT NULL,
    cost_per_minute_stopped NUMERIC(12,2) GENERATED ALWAYS AS (cost_per_hour_stopped / 60.0) STORED,
    external_monitor_id TEXT,
    current_status TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (current_status IN ('HEALTHY', 'DEGRADED', 'CRITICAL_DOWN')),
    latency_ms INTEGER NOT NULL DEFAULT 120,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bia_processes_org_id ON bia_critical_processes(organization_id);

BEGIN
    CREATE TYPE incident_priority AS ENUM ('P1_CRITICAL_15MIN', 'P2_HIGH_30MIN', 'P3_NORMAL_SAMEDAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END;

BEGIN
    CREATE TYPE incident_status AS ENUM ('OPEN', 'INVESTIGATING', 'CONTINGENCY_ACTIVE', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS pulse_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bia_process_id UUID REFERENCES bia_critical_processes(id) ON DELETE SET NULL,
    process_name_snapshot TEXT,
    cost_per_minute_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    priority incident_priority NOT NULL DEFAULT 'P1_CRITICAL_15MIN',
    status incident_status NOT NULL DEFAULT 'OPEN',
    title TEXT NOT NULL,
    is_silent_business_drop BOOLEAN NOT NULL DEFAULT false,
    suppressed_duplicate_alerts_count INTEGER NOT NULL DEFAULT 0,
    ai_sre_root_cause_summary TEXT,
    ai_sre_recommended_action TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    estimated_financial_loss_avoided NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_pulse_incidents_org_id ON pulse_incidents(organization_id);

-- ============================================================================
-- 4. COYTECH STUDIO: FILAS OPERACIONAIS COM SLA, PLANILHAS E AUDITORIA
-- ============================================================================
BEGIN
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED_1CLICK', 'REJECTED', 'NEEDS_REVISION');
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS studio_approval_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_type TEXT NOT NULL,
    title TEXT NOT NULL,
    reference_code TEXT,
    requester_name TEXT NOT NULL DEFAULT 'Operação',
    amount_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    status approval_status NOT NULL DEFAULT 'PENDING',
    sla_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    decided_by UUID REFERENCES auth.users(id),
    decided_by_name TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_queues_org_id ON studio_approval_queues(organization_id);

CREATE TABLE IF NOT EXISTS approval_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_type TEXT NOT NULL,
    auto_approve_limit NUMERIC(12,2) NOT NULL DEFAULT 1500.00,
    coo_max_limit NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
    requires_ceo_above NUMERIC(12,2) NOT NULL DEFAULT 50000.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS studio_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id),
    actor_name TEXT,
    action_type TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id UUID,
    ip_address TEXT DEFAULT '127.0.0.1',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_audit_org_id ON studio_audit_logs(organization_id);

CREATE TABLE IF NOT EXISTS studio_legacy_spreadsheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Operações',
    rows_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PARALLEL_ACTIVE' CHECK (status IN ('PARALLEL_ACTIVE', 'MIGRATED_POSTGRES', 'READ_ONLY_LOCKED')),
    replaced_by_module TEXT NOT NULL DEFAULT 'Coytech Studio',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_sheets_org_id ON studio_legacy_spreadsheets(organization_id);

-- ============================================================================
-- 5. COYTECH FLOW: EXECUÇÕES N8N, AGENTES DE IA, MEMÓRIA 4 CAMADAS E PROVA DE VALOR
-- ============================================================================
BEGIN
    CREATE TYPE agent_class AS ENUM (
        'AGENT_1_SALES_QUALIFIER',
        'AGENT_2_RECOVERY_BILLING',
        'AGENT_3_SUPPORT_TIER1',
        'AGENT_4_CUSTOMER_SUCCESS_LTV',
        'AGENT_5_SRE_INVESTIGATOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END;

CREATE TABLE IF NOT EXISTS flow_automation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    agent_used agent_class,
    n8n_execution_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'RETRIED_SUCCESS', 'CONTINGENCY_QUEUED', 'FAILED')),
    manual_minutes_saved NUMERIC(8,2) NOT NULL DEFAULT 5.00,
    financial_value_processed NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tokens_consumed INTEGER NOT NULL DEFAULT 0,
    summary_result TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_runs_org_id ON flow_automation_runs(organization_id);

CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_class agent_class NOT NULL,
    channel TEXT NOT NULL DEFAULT 'PORTAL',
    external_contact TEXT NOT NULL,
    session_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ESCALATED_TO_HUMAN')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_org_id ON agent_sessions(organization_id);

CREATE TABLE IF NOT EXISTS knowledge_and_runbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    doc_category TEXT NOT NULL CHECK (doc_category IN ('COMPANY_SOP', 'COMMERCIAL_POLICY', 'SRE_RUNBOOK', 'ERP_API_DOC')),
    title TEXT NOT NULL,
    content_chunk TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_org_id ON knowledge_and_runbooks(organization_id);

CREATE TABLE IF NOT EXISTS customer_health_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    weekly_active_users INTEGER NOT NULL DEFAULT 1,
    churn_risk TEXT NOT NULL DEFAULT 'LOW' CHECK (churn_risk IN ('LOW', 'MEDIUM', 'HIGH')),
    upsell_opportunity_notes TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ltv_weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_automated_runs INTEGER NOT NULL DEFAULT 0,
    total_hours_saved NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    incidents_prevented_count INTEGER NOT NULL DEFAULT 0,
    revenue_protected_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sla_uptime_percentage NUMERIC(5,2) NOT NULL DEFAULT 99.98,
    sent_via_whatsapp_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ltv_reports_org_id ON ltv_weekly_reports(organization_id);

-- ============================================================================
-- 6. GOVERNANÇA: CREDENCIAIS PRÉ-KICKOFF & OFFBOARDING SEGURO (15 DIAS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS governance_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    pilar TEXT NOT NULL DEFAULT 'FLOW' CHECK (pilar IN ('STUDIO', 'FLOW', 'PULSE')),
    endpoint_or_host TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONNECTED_VALIDATED' CHECK (status IN ('CONNECTED_VALIDATED', 'PENDING_KEY', 'FAILED_AUTH')),
    latency_ms INTEGER NOT NULL DEFAULT 42,
    last_tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_creds_org_id ON governance_credentials(organization_id);

CREATE TABLE IF NOT EXISTS offboarding_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_reason TEXT,
    passive_plan_offered BOOLEAN NOT NULL DEFAULT false,
    retained_on_passive_plan BOOLEAN NOT NULL DEFAULT false,
    git_repo_archive_url TEXT,
    db_backup_dump_url TEXT,
    n8n_workflows_export_url TEXT,
    monitoring_templates_export_url TEXT,
    litellm_key_revoked_at TIMESTAMPTZ,
    vpn_and_vault_wiped_at TIMESTAMPTZ,
    signed_handover_term_url TEXT,
    followup_60d_scheduled_for DATE,
    followup_120d_scheduled_for DATE
);

-- ============================================================================
-- 7. POLÍTICAS DE ROW LEVEL SECURITY (RLS MULTI-TENANT) & GRANTS
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bia_critical_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_approval_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_legacy_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_and_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_processes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_org_access(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
      AND (
        organization_id = target_org_id
        OR role IN ('COYTECH_ADMIN', 'COYTECH_SRE')
      )
  );
END;
$func$;

DROP POLICY IF EXISTS "Acesso Multi-Tenant Organizações" ON public.organizations;
CREATE POLICY "Acesso Multi-Tenant Organizações"
ON public.organizations FOR ALL TO authenticated
USING (public.has_org_access(id))
WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Multi-Tenant Membros" ON public.organization_members;
CREATE POLICY "Acesso Multi-Tenant Membros"
ON public.organization_members FOR ALL TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.has_org_access(organization_id))
WITH CHECK (user_id = (SELECT auth.uid()) OR public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Processos BIA" ON public.bia_critical_processes;
CREATE POLICY "Acesso Multi-Tenant Processos BIA"
ON public.bia_critical_processes FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Incidentes Pulse" ON public.pulse_incidents;
CREATE POLICY "Acesso Multi-Tenant Incidentes Pulse"
ON public.pulse_incidents FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Filas Studio" ON public.studio_approval_queues;
CREATE POLICY "Acesso Multi-Tenant Filas Studio"
ON public.studio_approval_queues FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Políticas Alçada" ON public.approval_policies;
CREATE POLICY "Acesso Multi-Tenant Políticas Alçada"
ON public.approval_policies FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Audit Logs" ON public.studio_audit_logs;
CREATE POLICY "Acesso Multi-Tenant Audit Logs"
ON public.studio_audit_logs FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Planilhas Legadas" ON public.studio_legacy_spreadsheets;
CREATE POLICY "Acesso Multi-Tenant Planilhas Legadas"
ON public.studio_legacy_spreadsheets FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Execuções Flow" ON public.flow_automation_runs;
CREATE POLICY "Acesso Multi-Tenant Execuções Flow"
ON public.flow_automation_runs FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Sessões Agentes" ON public.agent_sessions;
CREATE POLICY "Acesso Multi-Tenant Sessões Agentes"
ON public.agent_sessions FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Conhecimento RAG" ON public.knowledge_and_runbooks;
CREATE POLICY "Acesso Multi-Tenant Conhecimento RAG"
ON public.knowledge_and_runbooks FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Health Scores" ON public.customer_health_scores;
CREATE POLICY "Acesso Multi-Tenant Health Scores"
ON public.customer_health_scores FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Relatórios LTV" ON public.ltv_weekly_reports;
CREATE POLICY "Acesso Multi-Tenant Relatórios LTV"
ON public.ltv_weekly_reports FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Credenciais Governança" ON public.governance_credentials;
CREATE POLICY "Acesso Multi-Tenant Credenciais Governança"
ON public.governance_credentials FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

DROP POLICY IF EXISTS "Acesso Multi-Tenant Offboarding" ON public.offboarding_processes;
CREATE POLICY "Acesso Multi-Tenant Offboarding"
ON public.offboarding_processes FOR ALL TO authenticated
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

-- Grants explícitos para Data API (PostgREST)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_org_access(UUID) TO authenticated, service_role;

END $coydash_migration$;
