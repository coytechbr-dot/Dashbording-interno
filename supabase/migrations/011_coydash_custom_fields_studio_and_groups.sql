-- ============================================================================
-- Migration 011: Estúdio de Campos Personalizados, Grupos Modelos e Sync Multi-Usuário
-- ============================================================================

-- 1. Tabela de Grupos de Campos Modelos (ex: Tráfego, Implantação Tech, QA, Financeiro)
CREATE TABLE IF NOT EXISTS public.custom_field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '/images/custom-field-banner.jpg',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_field_groups_org_id
  ON public.custom_field_groups(organization_id);

ALTER TABLE public.custom_field_groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'custom_field_groups'
      AND policyname = 'custom_field_groups_all'
  ) THEN
    CREATE POLICY "custom_field_groups_all"
      ON public.custom_field_groups
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Ampliar custom_field_definitions com escopo granular por tarefas (`target_task_ids`),
--    descrição, valor padrão, grupo e imagem de capa
ALTER TABLE public.custom_field_definitions
  ADD COLUMN IF NOT EXISTS target_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_value TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.custom_field_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image TEXT NOT NULL DEFAULT '';

-- 3. Habilitar REPLICA IDENTITY FULL e publicação Realtime para sincronização entre responsáveis
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.custom_field_definitions REPLICA IDENTITY FULL;
ALTER TABLE public.custom_field_groups REPLICA IDENTITY FULL;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['tasks', 'custom_field_definitions', 'custom_field_groups'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
