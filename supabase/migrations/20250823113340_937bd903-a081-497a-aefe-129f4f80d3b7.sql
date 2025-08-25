-- Add subcategory field to transactions table
ALTER TABLE public.transactions ADD COLUMN subcategory text;