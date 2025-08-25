import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TransactionChart } from "@/components/charts/TransactionChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useBankAccounts, useTransactions, useMonthlyGoals, useVaults } from "@/hooks/useSupabaseData";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch real data from Supabase
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: monthlyGoals = [] } = useMonthlyGoals();
  const { data: vaults = [] } = useVaults();
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate real stats from Supabase data
  const { statsData, lineChartData, pieChartData, goals, recentTransactions } = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(transaction => {
      const date = parseISO(transaction.occurred_at);
      return date >= currentMonth && date <= currentMonthEnd;
    });

    // Filter transactions for last month
    const lastMonthTransactions = transactions.filter(transaction => {
      const date = parseISO(transaction.occurred_at);
      return date >= lastMonth && date <= lastMonthEnd;
    });

    // Calculate monthly totals
    const currentMonthCredit = currentMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const currentMonthDebit = currentMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const lastMonthCredit = lastMonthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const lastMonthDebit = lastMonthTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate total balances
    const totalBalance = bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0);
    const totalVaultAmount = vaults.reduce((sum, vault) => sum + Number(vault.current_amount), 0);

    // Calculate percentage changes
    const creditChange = lastMonthCredit > 0 
      ? ((currentMonthCredit - lastMonthCredit) / lastMonthCredit * 100).toFixed(1)
      : '0';
    
    const debitChange = lastMonthDebit > 0 
      ? ((currentMonthDebit - lastMonthDebit) / lastMonthDebit * 100).toFixed(1)
      : '0';

    // Stats data with real calculations
    const realStatsData = [
      {
        title: "Entradas do Mês",
        value: `R$ ${currentMonthCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        change: { 
          value: `${Number(creditChange) >= 0 ? '+' : ''}${creditChange}%`, 
          type: Number(creditChange) >= 0 ? 'increase' as const : 'decrease' as const 
        },
        icon: TrendingUp,
        variant: 'success' as const
      },
      {
        title: "Saídas do Mês",
        value: `R$ ${currentMonthDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        change: { 
          value: `${Number(debitChange) >= 0 ? '+' : ''}${debitChange}%`, 
          type: Number(debitChange) >= 0 ? 'increase' as const : 'decrease' as const 
        },
        icon: TrendingDown,
        variant: 'danger' as const
      },
      {
        title: "Saldo Total",
        value: `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        change: { value: "+0%", type: 'increase' as const },
        icon: DollarSign,
        variant: 'default' as const
      },
      {
        title: "Cofre Virtual",
        value: `R$ ${totalVaultAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        change: { value: "+0%", type: 'increase' as const },
        icon: Wallet,
        variant: 'warning' as const
      }
    ];

    // Line chart data - last 5 months
    const months = eachMonthOfInterval({
      start: subMonths(now, 4),
      end: now
    });

    const realLineChartData = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(transaction => {
        const date = parseISO(transaction.occurred_at);
        return date >= monthStart && date <= monthEnd;
      });

      const entradas = monthTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const saidas = monthTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: format(month, 'MMM', { locale: ptBR }),
        entradas,
        saidas
      };
    });

    // Pie chart data - current month expenses by category
    const expensesByCategory = currentMonthTransactions
      .filter(t => t.type === 'debit' && t.category)
      .reduce((acc, transaction) => {
        const category = transaction.category?.split(' (')[0] || 'Outros';
        acc[category] = (acc[category] || 0) + Number(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

    const realPieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value
    }));

    // Goals with real data
    const currentMonthStr = format(now, 'yyyy-MM-dd');
    const currentMonthGoals = monthlyGoals.filter(goal => 
      goal.month.startsWith(currentMonthStr.substring(0, 7))
    );

    const realGoals = currentMonthGoals.map(goal => {
      const spent = currentMonthTransactions
        .filter(t => t.type === 'debit' && t.category?.includes(goal.category))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const percentage = (spent / Number(goal.limit_amount)) * 100;
      
      return {
        name: `Meta: ${goal.category}`,
        current: spent,
        target: Number(goal.limit_amount),
        status: percentage > 100 ? 'exceeded' : percentage >= 100 ? 'completed' : 'progress'
      };
    });

    // Recent transactions (last 4)
    const realRecentTransactions = transactions
      .slice(0, 4)
      .map(transaction => ({
        id: transaction.id,
        name: transaction.purpose || transaction.category || transaction.description || 'Sem nome',
        type: transaction.type === 'credit' ? 'entrada' : 'saida',
        value: Number(transaction.amount),
        date: transaction.occurred_at
      }));

    return {
      statsData: realStatsData,
      lineChartData: realLineChartData,
      pieChartData: realPieChartData,
      goals: realGoals,
      recentTransactions: realRecentTransactions
    };
  }, [bankAccounts, transactions, monthlyGoals, vaults]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-transaction':
      case 'search-transaction':
        navigate('/lancamentos');
        break;
      case 'export-report':
        navigate('/relatorios');
        break;
      case 'add-goal':
        navigate('/metas');
        break;
      case 'add-card':
      case 'add-account':
        navigate('/contas');
        break;
      default:
        console.log('Ação rápida:', action);
    }
  };

  const getGoalStatus = (goal: any) => {
    const percentage = (goal.current / goal.target) * 100;
    if (goal.status === 'exceeded') {
      return { color: 'bg-danger', percentage: Math.min(percentage, 100), icon: AlertTriangle };
    }
    if (percentage >= 100) {
      return { color: 'bg-success', percentage: 100, icon: CheckCircle };
    }
    return { color: 'bg-primary', percentage, icon: Clock };
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-4 sm:p-6 w-full min-w-0">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient">Sistema Financeiro</h1>
        <p className="text-sm sm:text-base text-muted-foreground capitalize">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <div key={stat.title} className="animate-slide-up min-w-0" style={{ animationDelay: `${index * 100}ms` }}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="min-w-0">
          <TransactionChart
            data={lineChartData}
            type="line"
            title="Evolução Mensal"
            description="Entradas vs Saídas ao longo do tempo"
          />
        </div>
        <div className="min-w-0">
          <TransactionChart
            data={pieChartData}
            type="pie"
            title="Gastos por Categoria"
            description="Distribuição das despesas mensais"
          />
        </div>
      </div>

      {/* Quick Actions and Goals */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <QuickActions onAction={handleQuickAction} />
        </div>

        <Card className="glass-effect border-border/50 min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center space-x-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Metas Mensais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => {
              const status = getGoalStatus(goal);
              const Icon = status.icon;
              
              return (
                <div key={goal.name} className="space-y-2">
                  <div className="flex items-center justify-between min-w-0">
                    <span className="text-sm font-medium truncate mr-2">{goal.name}</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Icon className={`h-4 w-4 ${goal.status === 'exceeded' ? 'text-danger' : goal.status === 'completed' ? 'text-success' : 'text-primary'}`} />
                      <Badge variant={goal.status === 'exceeded' ? 'destructive' : 'secondary'} className="text-xs">
                        {Math.round(status.percentage)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={status.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {goal.current.toLocaleString('pt-BR')}</span>
                    <span>R$ {goal.target.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-effect border-border/50 min-w-0">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold">Lançamentos Recentes</CardTitle>
          <CardDescription className="text-sm">Últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 min-w-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`h-3 w-3 rounded-full flex-shrink-0 ${transaction.type === 'entrada' ? 'bg-success' : 'bg-danger'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{transaction.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium flex-shrink-0 ml-2 ${transaction.type === 'entrada' ? 'text-success' : 'text-danger'}`}>
                  {transaction.type === 'entrada' ? '+' : '-'} R$ {transaction.value.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}