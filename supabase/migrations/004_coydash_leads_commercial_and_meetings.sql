DO $$
BEGIN
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS inbox_type VARCHAR(20) DEFAULT 'CLIENT';
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_scheduled_at TIMESTAMPTZ;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS meeting_link TEXT;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS qualification_score INT DEFAULT 0;
  ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS commercial_stage VARCHAR(30) DEFAULT 'NOVO';

  -- Atualiza leads existentes sem inbox_type para CLIENT
  UPDATE public.leads SET inbox_type = 'CLIENT' WHERE inbox_type IS NULL;

  NOTIFY pgrst, 'reload schema';
END $$;

