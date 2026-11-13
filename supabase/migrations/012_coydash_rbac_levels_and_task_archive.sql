-- ============================================================================
-- Migration 012: Níveis de Permissão Intermediários (RBAC) & Arquivamento/Autoria de Tarefas
-- ============================================================================

-- 1. Permissões granulares por membro e convite (suportando níveis: ADMIN, MEMBER, GUEST_MANAGER, GUEST_COLLABORATOR, GUEST)
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.workspace_invitations
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Rastreio de autor/criador e arquivamento seguro em tarefas
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID NULL,
  ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS archived_by_user_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_created_by_user_id ON public.tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON public.tasks(organization_id, is_archived);

NOTIFY pgrst, 'reload schema';
