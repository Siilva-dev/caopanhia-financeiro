-- Fix enum to include funcionario
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'funcionario';

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