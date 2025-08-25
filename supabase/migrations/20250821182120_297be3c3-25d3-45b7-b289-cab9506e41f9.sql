-- Create function to update vault balance
CREATE OR REPLACE FUNCTION public.update_vault_balance(vault_id uuid, amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vaults 
  SET current_amount = current_amount + amount_change,
      updated_at = now()
  WHERE id = vault_id;
END;
$$;