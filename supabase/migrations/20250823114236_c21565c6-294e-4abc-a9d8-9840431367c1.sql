-- Adiciona coluna para persistir progresso do parcelamento
ALTER TABLE public.installments
ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0
CHECK (progress_percent >= 0 AND progress_percent <= 100);