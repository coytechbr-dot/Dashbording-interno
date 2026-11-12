-- ============================================================================
-- Migration 007: Campos Personalizados estilo ClickUp, Time Tracking & Vínculos
-- ============================================================================

-- 1. Ampliar a tabela de tarefas com novos atributos do ClickUp
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS time_estimate TEXT,
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_tracking_time BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS linked_task_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS origin_reference TEXT DEFAULT '';

-- 2. Tabela de Definições de Campos Personalizados (Templates e Escopo de Lista/Tarefa)
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.task_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    options JSONB DEFAULT '[]'::jsonb,
    scope TEXT NOT NULL DEFAULT 'list', -- 'task', 'list', 'template'
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_field_defs_org_id ON public.custom_field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_defs_list_id ON public.custom_field_definitions(list_id);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_field_definitions_all" ON public.custom_field_definitions FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
