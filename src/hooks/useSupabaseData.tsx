import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Types
export interface BankAccount {
  id: string;
  name: string;
  institution?: string;
  type?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id?: string;
  occurred_at: string;
  description?: string;
  category?: string;
  type: 'credit' | 'debit';
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  start_date: string;
  status: string;
  progress_percent?: number;
  payment_method?: string;
  associated_account?: string;
  installment_amount?: number;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Vault {
  id: string;
  name: string;
  target_amount?: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyGoal {
  id: string;
  month: string;
  category: string;
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VaultMovement {
  id: string;
  vault_id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  description?: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

// Bank Accounts hooks
export function useBankAccounts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bankAccounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });
}

export function useCreateBankAccount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (account: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{ ...account, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Conta criada',
        description: 'Conta bancária adicionada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta bancária',
        variant: 'destructive',
      });
    },
  });
}

// Transactions hooks
export function useTransactions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          bank_accounts (
            name,
            institution
          )
        `)
        .order('occurred_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (transaction: {
      occurred_at: string;
      type: 'credit' | 'debit';
      category: string;
      subcategory?: string;
      amount: number;
      account_id?: string;
      description?: string;
      responsible?: string;
      purpose?: string;
      card?: string;
      installments?: number;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Lançamento criado',
        description: 'Transação adicionada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar lançamento',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Lançamento atualizado',
        description: 'Transação atualizada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar lançamento',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Lançamento excluído',
        description: 'Transação removida com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir lançamento',
        variant: 'destructive',
      });
    },
  });
}

// Installments hooks
export function useInstallments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['installments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Installment[];
    },
    enabled: !!user,
  });
}

export function useCreateInstallment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (installment: Omit<Installment, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
      const { data, error } = await supabase
        .from('installments')
        .insert([{ ...installment, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast({
        title: 'Parcelamento criado',
        description: 'Parcelamento adicionado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar parcelamento',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, description, total_amount, installments_count, start_date, progress_percent, payment_method, associated_account, installment_amount, next_due_date }: { 
      id: string; 
      description?: string;
      total_amount?: number;
      installments_count?: number;
      start_date?: string;
      progress_percent?: number;
      payment_method?: string;
      associated_account?: string;
      installment_amount?: number;
      next_due_date?: string;
    }) => {
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (total_amount !== undefined) updateData.total_amount = total_amount;
      if (installments_count !== undefined) updateData.installments_count = installments_count;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (progress_percent !== undefined) updateData.progress_percent = progress_percent;
      if (payment_method !== undefined) updateData.payment_method = payment_method;
      if (associated_account !== undefined) updateData.associated_account = associated_account;
      if (installment_amount !== undefined) updateData.installment_amount = installment_amount;
      if (next_due_date !== undefined) updateData.next_due_date = next_due_date;

      const { error } = await supabase
        .from('installments')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating installment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast({
        title: 'Parcelamento atualizado',
        description: 'Parcelamento foi atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar parcelamento',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInstallment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      toast({
        title: 'Parcelamento excluído',
        description: 'Parcelamento removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir parcelamento',
        variant: 'destructive',
      });
    },
  });
}

// Vaults hooks
export function useVaults() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['vaults', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Vault[];
    },
    enabled: !!user,
  });
}

export function useCreateVault() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vault: Omit<Vault, 'id' | 'created_at' | 'updated_at' | 'current_amount'>) => {
      const { data, error } = await supabase
        .from('vaults')
        .insert([{ ...vault, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      toast({
        title: 'Cofre criado',
        description: 'Cofre virtual adicionado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar cofre',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteVault() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vaults')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      toast({
        title: 'Cofre excluído',
        description: 'Cofre removido com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cofre',
        variant: 'destructive',
      });
    },
  });
}

export function useVaultMovements(vaultId?: string) {
  return useQuery({
    queryKey: ['vault_movements', vaultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_movements')
        .select('*')
        .eq('vault_id', vaultId)
        .order('occurred_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!vaultId,
  });
}

export function useCreateVaultMovement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (movement: { vault_id: string; amount: number; type: 'deposit' | 'withdrawal'; description?: string }) => {
      const { data, error } = await supabase
        .from('vault_movements')
        .insert([{ 
          vault_id: movement.vault_id,
          amount: movement.amount,
          type: movement.type,
          user_id: user?.id,
          // Adicionar descrição se fornecida
          ...(movement.description && { description: movement.description })
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar o saldo do cofre manualmente
      const { data: vault, error: vaultSelectError } = await supabase
        .from('vaults')
        .select('current_amount')
        .eq('id', movement.vault_id)
        .single();
      
      if (vaultSelectError) throw vaultSelectError;
      
      const newAmount = vault.current_amount + (movement.type === 'deposit' ? movement.amount : -movement.amount);
      
      const { error: vaultUpdateError } = await supabase
        .from('vaults')
        .update({ current_amount: newAmount })
        .eq('id', movement.vault_id);
      
      if (vaultUpdateError) throw vaultUpdateError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['vault_movements'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar movimentação',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateVaultMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { amount?: number; type?: 'deposit' | 'withdrawal'; description?: string } }) => {
      // Get the current movement to calculate balance change
      const { data: currentMovement, error: fetchError } = await supabase
        .from('vault_movements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the movement
      const { data, error } = await supabase
        .from('vault_movements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // If amount or type changed, update vault balance
      if (updates.amount !== undefined || updates.type !== undefined) {
        const { data: vault, error: vaultFetchError } = await supabase
          .from('vaults')
          .select('current_amount')
          .eq('id', currentMovement.vault_id)
          .single();
        
        if (vaultFetchError) throw vaultFetchError;
        
        // Reverse the old movement
        const oldAmountChange = currentMovement.type === 'deposit' ? -Number(currentMovement.amount) : Number(currentMovement.amount);
        
        // Apply the new movement
        const newAmount = updates.amount !== undefined ? Number(updates.amount) : Number(currentMovement.amount);
        const newType = updates.type || currentMovement.type;
        const newAmountChange = newType === 'deposit' ? newAmount : -newAmount;
        
        const finalAmount = Number(vault.current_amount) + oldAmountChange + newAmountChange;
        
        const { error: vaultUpdateError } = await supabase
          .from('vaults')
          .update({ current_amount: finalAmount })
          .eq('id', currentMovement.vault_id);
        
        if (vaultUpdateError) throw vaultUpdateError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['vault_movements'] });
      toast({
        title: "Movimentação atualizada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar movimentação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
      console.error("Erro:", error);
    },
  });
}

export function useDeleteVaultMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (movementId: string) => {
      // First get the movement details before deleting
      const { data: movement, error: fetchError } = await supabase
        .from('vault_movements')
        .select('*')
        .eq('id', movementId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the movement
      const { error } = await supabase
        .from('vault_movements')
        .delete()
        .eq('id', movementId);
      
      if (error) throw error;
      
      // Update vault balance by reversing the movement
      const { data: vault, error: vaultFetchError } = await supabase
        .from('vaults')
        .select('current_amount')
        .eq('id', movement.vault_id)
        .single();
      
      if (vaultFetchError) throw vaultFetchError;
      
      const amountChange = movement.type === 'deposit' ? -Number(movement.amount) : Number(movement.amount);
      const newAmount = Number(vault.current_amount) + amountChange;
      
      const { error: vaultUpdateError } = await supabase
        .from('vaults')
        .update({ current_amount: newAmount })
        .eq('id', movement.vault_id);
      
      if (vaultUpdateError) throw vaultUpdateError;
      
      return { movement, newAmount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['vault_movements'] });
      toast({
        title: "Movimentação excluída com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir movimentação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
      console.error("Erro:", error);
    },
  });
}

// Monthly Goals hooks
export function useMonthlyGoals() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['monthlyGoals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as MonthlyGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateMonthlyGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (goal: Omit<MonthlyGoal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('monthly_goals')
        .insert([{ ...goal, user_id: user?.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
      toast({
        title: 'Meta criada',
        description: 'Meta mensal adicionada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar meta',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMonthlyGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MonthlyGoal> }) => {
      const { data, error } = await supabase
        .from('monthly_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar meta',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMonthlyGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monthly_goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir meta',
        variant: 'destructive',
      });
    },
  });
}

// Bank Account update and delete hooks
export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BankAccount> }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Conta atualizada',
        description: 'Conta bancária atualizada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar conta bancária',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast({
        title: 'Conta excluída',
        description: 'Conta bancária removida com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir conta bancária',
        variant: 'destructive',
      });
    },
  });
}

// Profile hooks
export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Perfil atualizado',
        description: 'Perfil atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil',
        variant: 'destructive',
      });
    },
  });
}