-- Create admin and funcionario users with predefined credentials
-- Admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@financeiro.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Administrador"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Funcionario user  
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'funcionario@financeiro.com',
  crypt('func123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Funcionário"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Insert roles for the created users
-- Get admin user ID and assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'admin@financeiro.com';

-- Get funcionario user ID and assign funcionario role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario'::app_role 
FROM auth.users 
WHERE email = 'funcionario@financeiro.com';

-- Update RLS policies to consider funcionario role
-- Update all existing RLS policies to include funcionario access where appropriate

-- Bank accounts: funcionario can only see their own, admin sees all
DROP POLICY IF EXISTS "Own accounts access" ON public.bank_accounts;
CREATE POLICY "Own accounts access" ON public.bank_accounts
FOR SELECT USING (
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- Transactions: funcionario can only see their own, admin sees all  
DROP POLICY IF EXISTS "Own transactions access" ON public.transactions;
CREATE POLICY "Own transactions access" ON public.transactions
FOR SELECT USING (
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- Installments: funcionario can only see their own, admin sees all
DROP POLICY IF EXISTS "Own installments access" ON public.installments;
CREATE POLICY "Own installments access" ON public.installments
FOR SELECT USING (
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- Installment payments: funcionario can only see their own, admin sees all
DROP POLICY IF EXISTS "Own installment_payments access" ON public.installment_payments;
CREATE POLICY "Own installment_payments access" ON public.installment_payments
FOR SELECT USING (
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- Monthly goals: funcionario can only see their own, admin sees all
DROP POLICY IF EXISTS "Own monthly_goals access" ON public.monthly_goals;
CREATE POLICY "Own monthly_goals access" ON public.monthly_goals
FOR SELECT USING (
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

-- Vaults: only admin can access (funcionario has no access)
DROP POLICY IF EXISTS "Own vaults access" ON public.vaults;
CREATE POLICY "Admin vaults access" ON public.vaults
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vaults insert" ON public.vaults;
CREATE POLICY "Admin vaults insert" ON public.vaults
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vaults update" ON public.vaults;
CREATE POLICY "Admin vaults update" ON public.vaults
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vaults delete" ON public.vaults;
CREATE POLICY "Admin vaults delete" ON public.vaults
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Vault movements: only admin can access
DROP POLICY IF EXISTS "Own vault_movements access" ON public.vault_movements;
CREATE POLICY "Admin vault_movements access" ON public.vault_movements
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vault_movements insert" ON public.vault_movements;
CREATE POLICY "Admin vault_movements insert" ON public.vault_movements
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vault_movements update" ON public.vault_movements;
CREATE POLICY "Admin vault_movements update" ON public.vault_movements
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Own vault_movements delete" ON public.vault_movements;
CREATE POLICY "Admin vault_movements delete" ON public.vault_movements
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));