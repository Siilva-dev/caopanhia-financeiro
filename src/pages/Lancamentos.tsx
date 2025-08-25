import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, Edit, Trash2, Filter, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, useBankAccounts, useMonthlyGoals } from "@/hooks/useSupabaseData";

interface Transaction {
  id: string;
  date: string;
  type: 'entrada' | 'saida' | 'transferencia';
  category: string;
  subcategory: string;
  amount: number;
  installments?: number;
  currentInstallment?: number;
  account: string;
  card?: string;
  responsible: string;
  purpose: string;
  description: string;
  status: 'concluido' | 'pendente' | 'cancelado';
}

export default function Lancamentos() {
  // Hooks do Supabase
  const { data: transactionsData, isLoading } = useTransactions();
  const { data: bankAccounts } = useBankAccounts();
  const { data: monthlyGoals } = useMonthlyGoals();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');

  const categories = {
    entrada: ['Serviços', 'Produtos', 'Consultas'],
    saida: ['Estoque', 'Aluguel', 'Funcionários', 'Fornecedores'],
    transferencia: ['Contas', 'Investimentos']
  };

  const subcategories = {
    'Serviços': ['Banho e Tosa', 'Hospedagem', 'Adestramento'],
    'Produtos': ['Ração', 'Brinquedos', 'Acessórios', 'Medicamentos'],
    'Consultas': ['Consulta Veterinária', 'Vacinação', 'Cirurgia'],
    'Estoque': ['Ração', 'Medicamentos', 'Produtos de Higiene'],
    'Aluguel': ['Aluguel do Espaço', 'Condomínio'],
    'Funcionários': ['Salários', 'Benefícios'],
    'Fornecedores': ['Compras', 'Serviços Terceirizados']
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'entrada' as 'entrada' | 'saida' | 'transferencia',
    category: '',
    customCategory: '',
    subcategory: '',
    amount: '',
    installments: '',
    account: '',
    customAccount: '',
    card: '',
    responsible: '',
    purpose: '',
    description: ''
  });

  // Converter dados do Supabase para o formato da interface
  const transactions = transactionsData?.map(t => ({
    id: t.id,
    date: t.occurred_at,
    type: t.type === 'credit' ? 'entrada' : 'saida' as 'entrada' | 'saida' | 'transferencia',
    category: t.category || '',
    subcategory: t.subcategory || '', // Nome do lançamento
    amount: t.amount,
    installments: t.installments,
    currentInstallment: undefined,
    account: bankAccounts?.find(acc => acc.id === t.account_id)?.name || '',
    card: t.card || '',
    responsible: t.responsible || '',
    purpose: t.purpose || '',
    description: t.description || '', // Campo descrição
    status: 'concluido' as 'concluido' | 'pendente' | 'cancelado'
  })) || [];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'todos' || transaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Função para exportar dados para CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há lançamentos para exportar.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Data', 'Tipo', 'Categoria', 'Nome', 'Valor', 'Conta', 'Responsável', 'Finalidade', 'Descrição', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(transaction => [
        new Date(transaction.date).toLocaleDateString('pt-BR'),
        transaction.type,
        transaction.category,
        transaction.subcategory,
        `R$ ${transaction.amount.toFixed(2)}`,
        transaction.account,
        transaction.responsible,
        transaction.purpose,
        `"${transaction.description}"`, // Aspas para descrições com vírgulas
        transaction.status
      ].join(','))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `${filteredTransactions.length} lançamentos exportados com sucesso!`
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = formData.category === 'Outro' ? formData.customCategory : formData.category;
    const finalAccount = formData.account === 'Outro' ? formData.customAccount : formData.account;
    
    // Encontrar o ID da conta bancária
    const accountId = bankAccounts?.find(acc => acc.name === finalAccount)?.id;
    
    // Verificar se existe uma meta com o mesmo nome (subcategory)
    const existingGoal = monthlyGoals?.find(goal => 
      goal.category.toLowerCase() === formData.subcategory.toLowerCase()
    );
    
    // Se existe uma meta correspondente, incluir informação na categoria
    const categoryWithGoal = existingGoal 
      ? `${finalCategory} (Meta: ${existingGoal.category})`
      : finalCategory;
    
    const transactionData = {
      occurred_at: formData.date,
      type: formData.type === 'entrada' ? 'credit' : 'debit' as 'credit' | 'debit',
      category: categoryWithGoal,
      subcategory: formData.subcategory, // Nome do lançamento
      amount: parseFloat(formData.amount),
      account_id: accountId,
      description: formData.description, // Campo descrição do formulário
      responsible: formData.responsible,
      purpose: formData.purpose,
      card: formData.card,
      installments: formData.installments ? parseInt(formData.installments) : undefined
    };

    if (selectedTransaction) {
      // Atualizar transação existente
      updateTransactionMutation.mutate({ id: selectedTransaction.id, ...transactionData }, {
        onSuccess: () => {
          resetForm();
          setIsDialogOpen(false);
        }
      });
    } else {
      // Criar nova transação
      createTransactionMutation.mutate(transactionData, {
        onSuccess: () => {
          if (existingGoal) {
            toast({
              title: "Lançamento vinculado à meta!",
              description: `Este lançamento foi associado à meta "${existingGoal.category}".`
            });
          }
          resetForm();
          setIsDialogOpen(false);
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'entrada',
      category: '',
      customCategory: '',
      subcategory: '',
      amount: '',
      installments: '',
      account: '',
      customAccount: '',
      card: '',
      responsible: '',
      purpose: '',
      description: ''
    });
    setSelectedTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Extrair categoria base (sem a informação de meta)
    const baseCategory = transaction.category.includes('(Meta:') 
      ? transaction.category.split(' (Meta:')[0] 
      : transaction.category;
    
    setFormData({
      date: transaction.date,
      type: transaction.type,
      category: baseCategory,
      customCategory: '',
      subcategory: transaction.subcategory,
      amount: transaction.amount.toString(),
      installments: transaction.installments?.toString() || '',
      account: transaction.account,
      customAccount: '',
      card: transaction.card || '',
      responsible: transaction.responsible,
      purpose: transaction.purpose,
      description: transaction.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'bg-success text-success-foreground';
      case 'saida': return 'bg-danger text-danger-foreground';
      case 'transferencia': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-success text-success-foreground';
      case 'pendente': return 'bg-warning text-warning-foreground';
      case 'cancelado': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Lançamentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie suas movimentações financeiras</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-primary text-white shadow-glow w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {selectedTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Preencha os dados da movimentação financeira
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value, category: '', subcategory: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type && categories[formData.type]?.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.category === 'Outro' && (
                    <Input
                      placeholder="Digite a categoria..."
                      value={formData.customCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Nome</Label>
                  <Input
                    id="subcategory"
                    placeholder="Nome do lançamento"
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas (opcional)</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Select value={formData.account} onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map(account => (
                        <SelectItem key={account.id} value={account.name}>
                          {account.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.account === 'Outro' && (
                    <Input
                      placeholder="Digite o nome da conta..."
                      value={formData.customAccount}
                      onChange={(e) => setFormData(prev => ({ ...prev, customAccount: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card">Cartão (opcional)</Label>
                  <Input
                    id="card"
                    placeholder="Visa, Mastercard, Mastercard Gold, Elo Nacional"
                    value={formData.card}
                    onChange={(e) => setFormData(prev => ({ ...prev, card: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input
                    id="responsible"
                    placeholder="Araújo, Cleuma, Funcionário"
                    value={formData.responsible}
                    onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Finalidade</Label>
                  <Input
                    id="purpose"
                    placeholder="Necessidade"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a movimentação..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary text-white w-full sm:w-auto">
                  {selectedTransaction ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card className="glass-effect border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                  <SelectItem value="transferencia">Transferências</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card className="glass-effect border-border/50">
        <CardHeader>
          <CardTitle>Lançamentos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background/50 border border-border/50 hover:shadow-md transition-shadow gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className={`h-4 w-4 rounded-full flex-shrink-0 mt-0.5 sm:mt-0 ${transaction.type === 'entrada' ? 'bg-success' : transaction.type === 'saida' ? 'bg-danger' : 'bg-primary'}`} />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.subcategory}</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={`${getTypeColor(transaction.type)} text-xs`} variant="secondary">
                          {transaction.type}
                        </Badge>
                        <Badge className={`${getStatusColor(transaction.status)} text-xs`} variant="secondary">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                      <span className="truncate">{transaction.category}</span>
                      <span className="truncate">{transaction.account}</span>
                      <span className="truncate">{transaction.responsible}</span>
                      {transaction.installments && (
                        <span className="whitespace-nowrap">{transaction.currentInstallment}/{transaction.installments}x</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 flex-shrink-0">
                  <div className={`text-base sm:text-lg font-bold ${transaction.type === 'entrada' ? 'text-success' : transaction.type === 'saida' ? 'text-danger' : 'text-primary'}`}>
                    {transaction.type === 'entrada' ? '+' : transaction.type === 'saida' ? '-' : ''} 
                    R$ {transaction.amount.toFixed(2)}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(transaction)} className="h-8 w-8 p-0">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(transaction.id)} className="h-8 w-8 p-0">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Carregando lançamentos...
              </div>
            )}
            
            {!isLoading && filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum lançamento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}