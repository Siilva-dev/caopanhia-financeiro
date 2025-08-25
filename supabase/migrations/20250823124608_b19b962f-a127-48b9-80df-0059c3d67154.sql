-- Adicionar campo description na tabela vault_movements para armazenar a descrição das movimentações
ALTER TABLE public.vault_movements 
ADD COLUMN IF NOT EXISTS description text;