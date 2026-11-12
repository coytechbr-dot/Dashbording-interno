# Coytech SDD 05: Modelagem de Banco de Dados (Supabase SQL), RLS e Contratos de API

## 1. Visão Geral do Modelo de Dados Unificado (Studio, Flow & Pulse)

Este documento apresenta o schema relacional e vetorial em **PostgreSQL 16 (Supabase)** que sustenta o ecossistema da **Coytech**. Ele integra em uma única fonte de verdade:
1. **Gestão de Clientes B2B e Ciclo de Vida (6 Etapas):** Onboarding em 5 min, Sprint de 30 dias, LTV mensal e Offboarding seguro em 15 dias;
2. **Coytech Studio:** Filas operacionais com SLA ao vivo, **Aprovação em 1 Clique** e trilha de auditoria imutável;
3. **Coytech Flow:** Registro de execuções de automações **n8n**, horas manuais economizadas (para o **Relatório de Segunda-Feira às 08h**) e memória vetorial (`pgvector`) dos **5 Agentes de IA**;
4. **Coytech Pulse:** Catálogo de processos críticos com **Impacto Financeiro por Minuto (BIA)**, incidentes correlacionados (Zabbix 7.0 LTS / Datadog / SEFAZ) e métricas em tempo real para o **Painel Executivo Mobile (CEO/COO)** e **Painel Técnico (NOC/TI)**.

## 2. Script DDL Completo (PostgreSQL 16 + Extensões Supabase)

```sql
-- ============================================================================
-- 1. EXTENSÕES OBRIGATÓRIAS NO SUPABASE
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";      -- Memória Semântica e Runbooks SRE (pgvector)
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- Relatório Segunda 08h e Rotinas LTV

-- ============================================================================
-- 2. CLIENTES B2B (TENANTS) E JORNADA OPERACIONAL DE 6 ETAPAS
-- ============================================================================
CREATE TYPE company_tier AS ENUM ('MID_MARKET', 'ENTERPRISE');
CREATE TYPE lifecycle_stage AS ENUM (
    'STAGE_1_ONBOARDING',       -- Dias 0 a 3
    'STAGE_2_PLANNING_BIA',     -- Semana 1 (Dias 1 a 5)
    'STAGE_3_PRESENTATION',     -- Fim Semana 1 e Fim Semana 3
    'STAGE_4_GO_LIVE',          -- Semana 4 (Dias 22 a 30)
    'STAGE_5_LTV_RECURRING',    -- Mês 2 em diante (MRR Contínuo)
    'STAGE_6_OFFBOARDING',      -- Encerramento seguro (15 dias) ou Retenção Passiva
    'PASSIVE_RETENTION_PLAN',   -- Plano enxuto de Monitoramento Passivo + Backup
    'CHURNED_ARCHIVED'
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cnpj TEXT UNIQUE,
    tier company_tier NOT NULL DEFAULT 'MID_MARKET',
    current_stage lifecycle_stage NOT NULL DEFAULT 'STAGE_1_ONBOARDING',
    -- Links e Credenciais de Governança (Onboarding 5 min + LiteLLM)
    google_drive_folder_url TEXT,
    whatsapp_group_jid TEXT,
    litellm_virtual_key_id TEXT,
    monthly_mrr_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    setup_fee_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    kickoff_completed_at TIMESTAMPTZ,
    golive_completed_at TIMESTAMPTZ,
    next_qbr_date DATE, -- Reunião Trimestral de Expansão (a cada 90 dias)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de Acesso (RBAC: Diretoria/CEO, Gerência/COO, Operação, TI/CTO/SRE, Cliente Externo)
CREATE TYPE org_role AS ENUM (
    'COYTECH_ADMIN',
    'COYTECH_SRE',
    'CLIENT_CEO_DIRECTOR',
    'CLIENT_COO_MANAGER',
    'CLIENT_CTO_IT',
    'CLIENT_OPERATIONS',
    'EXTERNAL_PARTNER'
);

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    whatsapp_phone TEXT,
    role org_role NOT NULL DEFAULT 'CLIENT_OPERATIONS',
    receive_monday_8am_report BOOLEAN NOT NULL DEFAULT false,
    receive_critical_bia_alerts BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- ============================================================================
-- 3. COYTECH PULSE: MATRIZ DE IMPACTO FINANCEIRO (BIA) & MONITORAMENTO 4 CAMADAS
-- ============================================================================
CREATE TYPE monitoring_layer AS ENUM (
    'LAYER_1_INFRA_ZABBIX',
    'LAYER_2_APP_DATADOG_N8N',
    'LAYER_3_SYNTHETIC_UX',
    'LAYER_4_EXTERNAL_SEFAZ_BANK'
);

-- Catálogo de Processos Críticos Mapeados na Etapa 2 (Planejamento BIA)
CREATE TABLE bia_critical_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    process_name TEXT NOT NULL, -- Ex: "Checkout E-commerce", "Autorização NFe SEFAZ-SP", "Aprovação de Pedidos"
    layer monitoring_layer NOT NULL,
    cost_per_hour_stopped NUMERIC(12,2) NOT NULL, -- Ex: R$ 80.000,00 / hora
    cost_per_minute_stopped NUMERIC(12,2) GENERATED ALWAYS AS (cost_per_hour_stopped / 60.0) STORED,
    external_monitor_id TEXT, -- Trigger ID no Zabbix 7.0 LTS ou Monitor ID no Datadog
    current_status TEXT NOT NULL DEFAULT 'HEALTHY' CHECK (current_status IN ('HEALTHY', 'DEGRADED', 'CRITICAL_DOWN')),
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE incident_priority AS ENUM ('P1_CRITICAL_15MIN', 'P2_HIGH_30MIN', 'P3_NORMAL_SAMEDAY');
CREATE TYPE incident_status AS ENUM ('OPEN', 'INVESTIGATING', 'CONTINGENCY_ACTIVE', 'RESOLVED');

CREATE TABLE pulse_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bia_process_id UUID NOT NULL REFERENCES bia_critical_processes(id),
    priority incident_priority NOT NULL DEFAULT 'P1_CRITICAL_15MIN',
    status incident_status NOT NULL DEFAULT 'OPEN',
    title TEXT NOT NULL,
    is_silent_business_drop BOOLEAN NOT NULL DEFAULT false, -- True = "TI verde com vendas caindo"
    suppressed_duplicate_alerts_count INTEGER NOT NULL DEFAULT 0, -- Comprova redução >75% de ruído
    -- Diagnóstico Automático do Agente 05 (SRE IA)
    ai_sre_root_cause_summary TEXT,
    ai_sre_recommended_action TEXT,
    -- Tempos e Cálculo de Impacto Financeiro Protegido/Exposto
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ, -- Meta P1: <= 15 minutos
    resolved_at TIMESTAMPTZ,
    estimated_financial_loss_avoided NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- ============================================================================
-- 4. COYTECH STUDIO: FILAS OPERACIONAIS COM SLA E APROVAÇÃO EM 1 CLIQUE
-- ============================================================================
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED_1CLICK', 'REJECTED', 'NEEDS_REVISION');

CREATE TABLE studio_approval_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue_type TEXT NOT NULL, -- Ex: 'PURCHASE_ORDER', 'FINANCIAL_RELEASE', 'DISCOUNT_EXCEPTION', 'KYC_ONBOARDING'
    title TEXT NOT NULL,
    reference_code TEXT,      -- ID do pedido/nota no ERP
    amount_value NUMERIC(12,2),
    payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    status approval_status NOT NULL DEFAULT 'PENDING',
    sla_due_at TIMESTAMPTZ NOT NULL,
    decided_by UUID REFERENCES auth.users(id),
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trilha de Auditoria Imutável (Audit Log)
CREATE TABLE studio_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- Ex: 'ONE_CLICK_APPROVE', 'LEGACY_SHEET_LOCKED', 'OFFBOARDING_KEY_REVOKED'
    entity_table TEXT NOT NULL,
    entity_id UUID,
    ip_address TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. COYTECH FLOW: EXECUÇÕES N8N, AGENTES DE IA, MEMÓRIA PGVECTOR E PROVA DE VALOR
-- ============================================================================
CREATE TYPE agent_class AS ENUM (
    'AGENT_1_SALES_QUALIFIER',
    'AGENT_2_RECOVERY_BILLING',
    'AGENT_3_SUPPORT_TIER1',
    'AGENT_4_CUSTOMER_SUCCESS_LTV',
    'AGENT_5_SRE_INVESTIGATOR'
);

-- Contabiliza cada automação/agente para o Relatório de Segunda-Feira às 08h00
CREATE TABLE flow_automation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL, -- Ex: "Conciliação Pix Diária", "Lote NFe SEFAZ", "Agente Cobrança"
    agent_used agent_class,
    n8n_execution_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'RETRIED_SUCCESS', 'CONTINGENCY_QUEUED', 'FAILED')),
    manual_minutes_saved NUMERIC(8,2) NOT NULL DEFAULT 5.00, -- Tempo humano economizado na execução
    financial_value_processed NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tokens_consumed INTEGER NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memória Vetorial (Camada 3): Base de Conhecimento do Cliente e Runbooks SRE
CREATE TABLE knowledge_and_runbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    doc_category TEXT NOT NULL CHECK (doc_category IN ('COMPANY_SOP', 'COMMERCIAL_POLICY', 'SRE_RUNBOOK', 'ERP_API_DOC')),
    title TEXT NOT NULL,
    content_chunk TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico de Relatórios Executivos Enviados Toda Segunda-Feira às 08h00
CREATE TABLE ltv_weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_automated_runs INTEGER NOT NULL,
    total_hours_saved NUMERIC(10,2) NOT NULL,
    incidents_prevented_count INTEGER NOT NULL,
    revenue_protected_value NUMERIC(12,2) NOT NULL,
    sla_uptime_percentage NUMERIC(5,2) NOT NULL DEFAULT 99.95,
    sent_via_whatsapp_at TIMESTAMPTZ,
    UNIQUE (organization_id, week_start)
);

-- ============================================================================
-- 6. OFFBOARDING SEGURO E RETENÇÃO (ETAPA 6 — CHECKLIST DE 15 DIAS)
-- ============================================================================
CREATE TABLE offboarding_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_reason TEXT,
    -- Dias 1 a 3: Tentativa de Retenção no Plano Enxuto Passivo
    passive_plan_offered BOOLEAN NOT NULL DEFAULT false,
    retained_on_passive_plan BOOLEAN NOT NULL DEFAULT false,
    -- Dias 4 a 10: Entrega de Ativos ao Cliente
    git_repo_archive_url TEXT,
    db_backup_dump_url TEXT,
    n8n_workflows_export_url TEXT,
    monitoring_templates_export_url TEXT,
    -- Dias 11 a 15: Desligamento de Senhas e LGPD
    litellm_key_revoked_at TIMESTAMPTZ,
    vpn_and_vault_wiped_at TIMESTAMPTZ,
    signed_handover_term_url TEXT,
    -- Reconexão Futura (60 e 120 dias depois)
    followup_60d_scheduled_for DATE,
    followup_120d_scheduled_for DATE
);
```

## 3. Políticas de Row Level Security (RLS Multi-Tenant)

Garante que cada cliente B2B visualize apenas suas próprias filas, relatórios e indicadores financeiros, enquanto a equipe de engenharia/SRE da Coytech opera o monitoramento centralizado:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bia_critical_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_approval_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_weekly_reports ENABLE ROW LEVEL SECURITY;

-- Função de Verificação de Vínculo com a Organização ou Equipe Interna Coytech
CREATE OR REPLACE FUNCTION public.has_org_access(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND (
        organization_id = target_org_id
        OR role IN ('COYTECH_ADMIN', 'COYTECH_SRE')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Isolamento Multi-Tenant na Fila de Aprovação 1-Clique"
ON public.studio_approval_queues
FOR ALL
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));

CREATE POLICY "Isolamento Multi-Tenant em Incidentes e BIA"
ON public.pulse_incidents
FOR ALL
USING (public.has_org_access(organization_id))
WITH CHECK (public.has_org_access(organization_id));
```

## 4. Contratos de API e Webhooks do Ecossistema (Next.js + n8n)

| Método e Endpoint | Origem da Chamada | Ação Executada no Ecossistema Coytech |
| :--- | :--- | :--- |
| `POST /api/webhooks/onboarding-contract` | Clicksign / DocuSign / CRM | **Etapa 1 (Em 5 min):** Cria tenant no Supabase, provisiona pasta no Google Drive, cria grupo no WhatsApp e dispara link do Cofre de Senhas + agenda Kick-off. |
| `POST /api/studio/queues/[id]/one-click-approve` | Portal Web / Mobile (**Camila COO / Rodrigo CEO**) | **Aprovação em 1 Clique (< 3s):** Valida RBAC, grava log em `studio_audit_logs`, atualiza o ERP via webhook n8n e transmite mudança via Supabase Realtime. |
| `POST /api/webhooks/pulse-alert` | Zabbix 7.0 LTS / Datadog / Sonda SEFAZ | **Motor BIA & SRE:** Correlaciona alertas (suprimindo >75% de ruído), calcula perda em R$/minuto, aciona o **Agente 05 (SRE)** para diagnóstico em < 60s e notifica plantão (SLA 15 min para P1 / 30 min para contingência SEFAZ). |
| `POST /api/cron/monday-8am-report` | `pg_cron` / n8n (Toda Segunda às 08h00) | **Etapa 5 (LTV):** Soma execuções de `flow_automation_runs`, calcula horas manuais poupadas e falhas evitadas na semana, salva em `ltv_weekly_reports` e envia no WhatsApp dos sócios. |
| `POST /api/offboarding/[orgId]/execute-step` | Console Interno Coytech | **Etapa 6 (Offboarding Seguro):** Gera pacote de exportação (Git + DB + n8n + Zabbix), revoga chave no **LiteLLM**, limpa segredos do Vault e agenda follow-ups de 60 e 120 dias. |
