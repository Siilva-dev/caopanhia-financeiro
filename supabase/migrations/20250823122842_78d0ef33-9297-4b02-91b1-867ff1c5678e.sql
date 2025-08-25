-- Adicionar campos faltantes na tabela installments para armazenar informações completas do parcelamento
ALTER TABLE public.installments 
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS associated_account text,
ADD COLUMN IF NOT EXISTS installment_amount numeric,
ADD COLUMN IF NOT EXISTS next_due_date date;