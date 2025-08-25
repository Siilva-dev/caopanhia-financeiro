-- Adicionar campos faltantes na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN responsible TEXT,
ADD COLUMN purpose TEXT,
ADD COLUMN card TEXT,
ADD COLUMN installments INTEGER;