-- Enable required extensions
create extension if not exists pgcrypto with schema public;

-- Helper: updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Roles enum and table
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Security definer to check roles
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Profiles table and trigger on signup
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-insert profile on new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS policies for profiles
create policy if not exists "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy if not exists "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Accounts (Contas Bancárias)
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  type text,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;
create index if not exists idx_bank_accounts_user on public.bank_accounts(user_id);
create index if not exists idx_bank_accounts_created on public.bank_accounts(created_at);

create or replace trigger trg_bank_accounts_updated_at
before update on public.bank_accounts
for each row execute function public.update_updated_at_column();

create policy if not exists "Own accounts access"
  on public.bank_accounts for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own accounts insert"
  on public.bank_accounts for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own accounts update"
  on public.bank_accounts for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own accounts delete"
  on public.bank_accounts for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Transactions (Lançamentos)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.bank_accounts(id) on delete set null,
  occurred_at date not null default now(),
  description text,
  category text,
  type text not null check (type in ('credit','debit')),
  amount numeric(14,2) not null,
  installment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_account on public.transactions(account_id);
create index if not exists idx_transactions_date on public.transactions(occurred_at);

create or replace trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.update_updated_at_column();

create policy if not exists "Own transactions access"
  on public.transactions for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own transactions insert"
  on public.transactions for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own transactions update"
  on public.transactions for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own transactions delete"
  on public.transactions for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Installments (Parcelamentos)
create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  total_amount numeric(14,2) not null,
  installments_count int not null check (installments_count > 0),
  start_date date not null default now(),
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.installments enable row level security;
create index if not exists idx_installments_user on public.installments(user_id);

create or replace trigger trg_installments_updated_at
before update on public.installments
for each row execute function public.update_updated_at_column();

create policy if not exists "Own installments access"
  on public.installments for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installments insert"
  on public.installments for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installments update"
  on public.installments for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installments delete"
  on public.installments for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Installment payments
create table if not exists public.installment_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_id uuid not null references public.installments(id) on delete cascade,
  number int not null,
  due_date date not null,
  amount numeric(14,2) not null,
  paid boolean not null default false,
  paid_at timestamptz,
  account_id uuid references public.bank_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (installment_id, number)
);

alter table public.installment_payments enable row level security;
create index if not exists idx_installment_payments_user on public.installment_payments(user_id);
create index if not exists idx_installment_payments_installment on public.installment_payments(installment_id);

create or replace trigger trg_installment_payments_updated_at
before update on public.installment_payments
for each row execute function public.update_updated_at_column();

create policy if not exists "Own installment_payments access"
  on public.installment_payments for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installment_payments insert"
  on public.installment_payments for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installment_payments update"
  on public.installment_payments for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own installment_payments delete"
  on public.installment_payments for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Vaults (Cofre Virtual)
create table if not exists public.vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2),
  current_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vaults enable row level security;
create index if not exists idx_vaults_user on public.vaults(user_id);

create or replace trigger trg_vaults_updated_at
before update on public.vaults
for each row execute function public.update_updated_at_column();

create policy if not exists "Own vaults access"
  on public.vaults for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vaults insert"
  on public.vaults for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vaults update"
  on public.vaults for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vaults delete"
  on public.vaults for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Vault movements
create table if not exists public.vault_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vault_id uuid not null references public.vaults(id) on delete cascade,
  type text not null check (type in ('deposit','withdraw')),
  amount numeric(14,2) not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vault_movements enable row level security;
create index if not exists idx_vault_movements_user on public.vault_movements(user_id);
create index if not exists idx_vault_movements_vault on public.vault_movements(vault_id);

create or replace trigger trg_vault_movements_updated_at
before update on public.vault_movements
for each row execute function public.update_updated_at_column();

create policy if not exists "Own vault_movements access"
  on public.vault_movements for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vault_movements insert"
  on public.vault_movements for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vault_movements update"
  on public.vault_movements for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own vault_movements delete"
  on public.vault_movements for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Monthly goals (Metas Mensais)
create table if not exists public.monthly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  limit_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category)
);

alter table public.monthly_goals enable row level security;
create index if not exists idx_monthly_goals_user on public.monthly_goals(user_id);
create index if not exists idx_monthly_goals_month on public.monthly_goals(month);

create or replace trigger trg_monthly_goals_updated_at
before update on public.monthly_goals
for each row execute function public.update_updated_at_column();

create policy if not exists "Own monthly_goals access"
  on public.monthly_goals for select using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own monthly_goals insert"
  on public.monthly_goals for insert with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own monthly_goals update"
  on public.monthly_goals for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy if not exists "Own monthly_goals delete"
  on public.monthly_goals for delete using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Realtime support
alter table public.bank_accounts replica identity full;
alter table public.transactions replica identity full;
alter table public.installments replica identity full;
alter table public.installment_payments replica identity full;
alter table public.vaults replica identity full;
alter table public.vault_movements replica identity full;
alter table public.monthly_goals replica identity full;

alter publication supabase_realtime add table
  public.bank_accounts,
  public.transactions,
  public.installments,
  public.installment_payments,
  public.vaults,
  public.vault_movements,
  public.monthly_goals;
