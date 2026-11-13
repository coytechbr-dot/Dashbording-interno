-- ============================================================================
-- Migration 010: Subtarefas Reais em `public.tasks` + Limpeza de Campos Padrão
-- ============================================================================

-- 1. Garantir FK ON DELETE CASCADE e índice em parent_task_id
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS parent_task_id UUID;

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.tasks'::regclass
    AND confrelid = 'public.tasks'::regclass
    AND contype = 'f';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_parent_task_id_fkey
    FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- 2. Migrar subtarefas JSON legadas (`tasks.subtasks`) para linhas reais em `public.tasks`
DO $$
DECLARE
  parent_rec RECORD;
  sub_item JSONB;
  is_done BOOLEAN;
  done_status TEXT;
  todo_status TEXT;
  chosen_status TEXT;
  sub_title TEXT;
BEGIN
  FOR parent_rec IN
    SELECT *
    FROM public.tasks
    WHERE subtasks IS NOT NULL
      AND jsonb_typeof(subtasks) = 'array'
      AND jsonb_array_length(subtasks) > 0
  LOOP
    -- Descobrir status inicial e concluído da lista da tarefa pai (quando existir)
    SELECT name INTO todo_status
    FROM public.task_statuses
    WHERE list_id = parent_rec.list_id
    ORDER BY order_index ASC
    LIMIT 1;

    SELECT name INTO done_status
    FROM public.task_statuses
    WHERE list_id = parent_rec.list_id
      AND (
        lower(name) LIKE '%concl%'
        OR lower(name) LIKE '%finaliz%'
        OR lower(name) LIKE '%done%'
      )
    ORDER BY order_index DESC
    LIMIT 1;

    IF todo_status IS NULL THEN
      todo_status := 'A Fazer';
    END IF;
    IF done_status IS NULL THEN
      done_status := 'Concluído';
    END IF;

    FOR sub_item IN SELECT * FROM jsonb_array_elements(parent_rec.subtasks)
    LOOP
      sub_title := COALESCE(NULLIF(trim(sub_item->>'title'), ''), 'Subtarefa');
      is_done := COALESCE((sub_item->>'is_completed')::boolean, (sub_item->>'completed')::boolean, false);
      chosen_status := CASE WHEN is_done THEN done_status ELSE todo_status END;

      -- Evita duplicar caso já exista subtarefa filha com mesmo título e mesmo parent_task_id
      IF NOT EXISTS (
        SELECT 1 FROM public.tasks t_child
        WHERE t_child.parent_task_id = parent_rec.id
          AND t_child.title = sub_title
      ) THEN
        INSERT INTO public.tasks (
          organization_id,
          list_id,
          client_id,
          client_name_snapshot,
          status_key,
          title,
          description,
          priority,
          assignee_name,
          assignees,
          start_date,
          due_date,
          parent_task_id,
          subtasks,
          comments,
          attachments,
          links,
          linked_task_ids,
          custom_fields,
          origin_reference
        ) VALUES (
          parent_rec.organization_id,
          parent_rec.list_id,
          parent_rec.client_id,
          COALESCE(parent_rec.client_name_snapshot, ''),
          chosen_status,
          sub_title,
          '',
          COALESCE(parent_rec.priority, 'medium'),
          COALESCE(parent_rec.assignee_name, ''),
          COALESCE(parent_rec.assignees, '[]'::jsonb),
          parent_rec.start_date,
          parent_rec.due_date,
          parent_rec.id,
          '[]'::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          ''
        );
      END IF;
    END LOOP;

    -- Limpa o array legado JSON para não duplicar dados antigos
    UPDATE public.tasks
    SET subtasks = '[]'::jsonb
    WHERE id = parent_rec.id;
  END LOOP;
END $$;

-- 3. Limpar definições de campos personalizados genéricos antigos (seed duplicado)
DELETE FROM public.custom_field_definitions
WHERE list_id IS NULL
  AND name IN (
    'Pasta de Criativos',
    'Relatório final da OS',
    'SUCESSO DA TAREFA',
    'Bônus do Cliente (R$)',
    'Cliente',
    'Criativos por OS',
    'Data de Conclusão',
    'Descrição do Problema',
    'Design responsável',
    'Freelancer',
    'Gestor de Tráfego',
    'Informações Adicionais',
    'Relatório enviado',
    'REVISOES DIÁRIAS',
    'Tipo da Solicitação'
  );

NOTIFY pgrst, 'reload schema';
