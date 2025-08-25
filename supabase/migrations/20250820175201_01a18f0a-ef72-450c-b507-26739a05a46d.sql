-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Profiles table and trigger on signup
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-insert profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Accounts (Contas Bancárias)
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text,
  type text,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_created ON public.bank_accounts(created_at);

CREATE TRIGGER trg_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own accounts access"
  ON public.bank_accounts FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own accounts insert"
  ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own accounts update"
  ON public.bank_accounts FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own accounts delete"
  ON public.bank_accounts FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Transactions (Lançamentos)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  category text,
  type text NOT NULL CHECK (type IN ('credit','debit')),
  amount numeric(14,2) NOT NULL,
  installment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(occurred_at);

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own transactions access"
  ON public.transactions FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own transactions insert"
  ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own transactions update"
  ON public.transactions FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own transactions delete"
  ON public.transactions FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Installments (Parcelamentos)
CREATE TABLE public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  total_amount numeric(14,2) NOT NULL,
  installments_count int NOT NULL CHECK (installments_count > 0),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_installments_user ON public.installments(user_id);

CREATE TRIGGER trg_installments_updated_at
BEFORE UPDATE ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own installments access"
  ON public.installments FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own installments insert"
  ON public.installments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own installments update"
  ON public.installments FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own installments delete"
  ON public.installments FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Installment payments
CREATE TABLE public.installment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_id uuid NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  number int NOT NULL,
  due_date date NOT NULL,
  amount numeric(14,2) NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (installment_id, number)
);

ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_installment_payments_user ON public.installment_payments(user_id);
CREATE INDEX idx_installment_payments_installment ON public.installment_payments(installment_id);

CREATE TRIGGER trg_installment_payments_updated_at
BEFORE UPDATE ON public.installment_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own installment_payments access"
  ON public.installment_payments FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own installment_payments insert"
  ON public.installment_payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own installment_payments update"
  ON public.installment_payments FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own installment_payments delete"
  ON public.installment_payments FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Vaults (Cofre Virtual)
CREATE TABLE public.vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(14,2),
  current_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vaults_user ON public.vaults(user_id);

CREATE TRIGGER trg_vaults_updated_at
BEFORE UPDATE ON public.vaults
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own vaults access"
  ON public.vaults FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own vaults insert"
  ON public.vaults FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own vaults update"
  ON public.vaults FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own vaults delete"
  ON public.vaults FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Vault movements
CREATE TABLE public.vault_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id uuid NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','withdraw')),
  amount numeric(14,2) NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vault_movements_user ON public.vault_movements(user_id);
CREATE INDEX idx_vault_movements_vault ON public.vault_movements(vault_id);

CREATE TRIGGER trg_vault_movements_updated_at
BEFORE UPDATE ON public.vault_movements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own vault_movements access"
  ON public.vault_movements FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own vault_movements insert"
  ON public.vault_movements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own vault_movements update"
  ON public.vault_movements FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own vault_movements delete"
  ON public.vault_movements FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Monthly goals (Metas Mensais)
CREATE TABLE public.monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  category text NOT NULL,
  limit_amount numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month, category)
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_monthly_goals_user ON public.monthly_goals(user_id);
CREATE INDEX idx_monthly_goals_month ON public.monthly_goals(month);

CREATE TRIGGER trg_monthly_goals_updated_at
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own monthly_goals access"
  ON public.monthly_goals FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own monthly_goals insert"
  ON public.monthly_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own monthly_goals update"
  ON public.monthly_goals FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own monthly_goals delete"
  ON public.monthly_goals FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Realtime support
ALTER TABLE public.bank_accounts REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.installments REPLICA IDENTITY FULL;
ALTER TABLE public.installment_payments REPLICA IDENTITY FULL;
ALTER TABLE public.vaults REPLICA IDENTITY FULL;
ALTER TABLE public.vault_movements REPLICA IDENTITY FULL;
ALTER TABLE public.monthly_goals REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.bank_accounts,
  public.transactions,
  public.installments,
  public.installment_payments,
  public.vaults,
  public.vault_movements,
  public.monthly_goals;