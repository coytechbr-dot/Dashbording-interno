-- ============================================================================
-- Migration 006: Compartilhamento de Workspace, Permissões Granulares & RH
-- ============================================================================

-- 1. Ampliação da tabela de membros da organização para suportar RH e acessos granulares
ALTER TABLE public.organization_members ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'MEMBER',
ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'Geral',
ADD COLUMN IF NOT EXISTS job_title TEXT DEFAULT 'Colaborador',
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'PJ',
ADD COLUMN IF NOT EXISTS hiring_date DATE,
ADD COLUMN IF NOT EXISTS salary_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_info TEXT,
ADD COLUMN IF NOT EXISTS work_regime TEXT DEFAULT 'REMOTO',
ADD COLUMN IF NOT EXISTS member_status TEXT DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS contract_document_url TEXT,
ADD COLUMN IF NOT EXISTS allowed_screens JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_folder_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allowed_list_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- 2. Tabela de Anotações do RH (Histórico / Chat interno de anotações do colaborador)
CREATE TABLE IF NOT EXISTS public.member_hr_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    author_id UUID,
    author_name TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_hr_notes_member_id ON public.member_hr_notes(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_hr_notes_org_id ON public.member_hr_notes(organization_id);

ALTER TABLE public.member_hr_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_hr_notes_all" ON public.member_hr_notes FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabela de Convites de Workspace (Workspace Invitations)
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    sector TEXT NOT NULL DEFAULT 'Geral',
    job_title TEXT NOT NULL DEFAULT 'Colaborador',
    access_type TEXT NOT NULL DEFAULT 'GUEST',
    allowed_screens JSONB DEFAULT '[]'::jsonb,
    allowed_folder_ids JSONB DEFAULT '[]'::jsonb,
    allowed_list_ids JSONB DEFAULT '[]'::jsonb,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(email);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_invitations_all" ON public.workspace_invitations FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
