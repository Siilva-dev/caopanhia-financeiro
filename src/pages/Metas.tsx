import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, TrendingUp, AlertTriangle, CheckCircle, Calendar, Trash2, Edit, Check } from "lucide-react";
import { toast } from "sonner";
import { useMonthlyGoals, useCreateMonthlyGoal, useUpdateMonthlyGoal, useDeleteMonthlyGoal, useTransactions } from "@/hooks/useSupabaseData";
const Metas = () => {
  const {
    data: monthlyGoals = []
  } = useMonthlyGoals();
  const {
    data: transactions = []
  } = useTransactions();
  const createMonthlyGoalMutation = useCreateMonthlyGoal();
  const updateMonthlyGoalMutation = useUpdateMonthlyGoal();
  const deleteMonthlyGoalMutation = useDeleteMonthlyGoal();

  // Calcular gastos baseado nos lançamentos reais do Supabase
  const gastosCalculados = useMemo(() => {
    const gastosPorCategoria: {
      [key: string]: number;
    } = {};
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    // Filtrar apenas transações de débito do mês atual
    const saidasDoMes = transactions.filter(transaction => transaction.type === 'debit' && transaction.occurred_at.includes(currentMonth));

    // Para cada meta, calcular os gastos baseados na categoria
    monthlyGoals.forEach(goal => {
      const gastosCategoria = saidasDoMes.filter(transaction => transaction.category?.includes(goal.category)).reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      gastosPorCategoria[goal.category] = gastosCategoria;
    });
    return gastosPorCategoria;
  }, [transactions, monthlyGoals]);

  // Metas com gastos calculados - usando dados do Supabase
  const metasComGastos = useMemo(() => {
    return monthlyGoals.map(goal => ({
      id: goal.id,
      categoria: goal.category,
      metaMensal: Number(goal.limit_amount),
      mes: new Date(goal.month).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      }),
      cor: "#10B981",
      gastoAtual: gastosCalculados[goal.category] || 0
    }));
  }, [monthlyGoals, gastosCalculados]);
  const [novaMeta, setNovaMeta] = useState({
    categoria: "",
    valor: "",
    mes: ""
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<any>(null);
  const criarMeta = () => {
    if (!novaMeta.categoria || !novaMeta.valor || !novaMeta.mes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Parse the month string to create a proper date
    const monthDate = new Date();
    if (novaMeta.mes.includes('/')) {
      const [month, year] = novaMeta.mes.split('/');
      monthDate.setMonth(parseInt(month) - 1);
      monthDate.setFullYear(parseInt(year));
    }

    // Save to Supabase only
    createMonthlyGoalMutation.mutate({
      category: novaMeta.categoria,
      limit_amount: parseFloat(novaMeta.valor),
      month: monthDate.toISOString().split('T')[0]
    });
    setNovaMeta({
      categoria: "",
      valor: "",
      mes: ""
    });
    setDialogAberto(false);
  };
  const excluirMeta = (id: string) => {
    deleteMonthlyGoalMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Meta excluída com sucesso!");
      },
      onError: (error: any) => {
        toast.error("Erro ao excluir meta: " + error.message);
      }
    });
  };
  const concluirMeta = (id: string, metaValor: number) => {
    // Atualizar a meta para mostrar como 100% completa
    const metaAtualizada = metasComGastos.find(meta => meta.id === id);
    if (metaAtualizada) {
      // Simular que a meta foi atingida atualizando os gastos calculados
      metaAtualizada.gastoAtual = metaValor;
      toast.success("Meta marcada como concluída!");
    }
  };
  const editarMeta = (meta: any) => {
    setEditandoMeta(meta);
    setNovaMeta({
      categoria: meta.categoria,
      valor: meta.metaMensal.toString(),
      mes: meta.mes
    });
    setDialogAberto(true);
  };
  const salvarEdicao = () => {
    if (!novaMeta.categoria || !novaMeta.valor || !novaMeta.mes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!editandoMeta) return;

    // Parse the month string to create a proper date
    const monthDate = new Date();
    if (novaMeta.mes.includes('/')) {
      const [month, year] = novaMeta.mes.split('/');
      monthDate.setMonth(parseInt(month) - 1);
      monthDate.setFullYear(parseInt(year));
    }
    updateMonthlyGoalMutation.mutate({
      id: editandoMeta.id,
      updates: {
        category: novaMeta.categoria,
        limit_amount: parseFloat(novaMeta.valor),
        month: monthDate.toISOString().split('T')[0]
      }
    }, {
      onSuccess: () => {
        toast.success("Meta atualizada com sucesso!");
        setNovaMeta({
          categoria: "",
          valor: "",
          mes: ""
        });
        setEditandoMeta(null);
        setDialogAberto(false);
      },
      onError: (error: any) => {
        toast.error("Erro ao atualizar meta: " + error.message);
      }
    });
  };
  const cancelarDialog = () => {
    setNovaMeta({
      categoria: "",
      valor: "",
      mes: ""
    });
    setEditandoMeta(null);
    setDialogAberto(false);
  };
  const totalMetas = metasComGastos.reduce((acc, meta) => acc + meta.metaMensal, 0);
  const totalGasto = metasComGastos.reduce((acc, meta) => acc + meta.gastoAtual, 0);
  const metasUltrapassadas = metasComGastos.filter(meta => meta.gastoAtual > meta.metaMensal).length;
  const metasAtingidas = metasComGastos.filter(meta => meta.gastoAtual === meta.metaMensal).length;
  const getStatusBadge = (meta: any) => {
    const percentual = meta.gastoAtual / meta.metaMensal * 100;
    if (meta.gastoAtual === meta.metaMensal) {
      return <Badge className="bg-success text-white">Meta atingida</Badge>;
    } else if (meta.gastoAtual > meta.metaMensal) {
      return <Badge variant="destructive">Gasto ultrapassado</Badge>;
    } else if (percentual >= 90) {
      return <Badge className="bg-warning text-warning-foreground">Próximo do limite</Badge>;
    } else {
      return <Badge variant="secondary">Em andamento</Badge>;
    }
  };
  const getStatusIcon = (meta: any) => {
    if (meta.gastoAtual === meta.metaMensal) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    } else if (meta.gastoAtual > meta.metaMensal) {
      return <AlertTriangle className="h-4 w-4 text-danger" />;
    } else if (meta.gastoAtual / meta.metaMensal * 100 >= 90) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    } else {
      return <Target className="h-4 w-4 text-primary" />;
    }
  };
  return <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Metas Mensais</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Controle seus gastos por categoria e mantenha-se no orçamento
          </p>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white w-full sm:w-auto" onClick={() => setDialogAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Meta</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editandoMeta ? "Editar Meta" : "Criar Nova Meta"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editandoMeta ? "Edite os dados da meta" : "Defina uma meta de gastos para uma categoria específica"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" placeholder="Ex: Alimentação" value={novaMeta.categoria} onChange={e => setNovaMeta({
                ...novaMeta,
                categoria: e.target.value
              })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor da Meta</Label>
                <Input id="valor" type="number" placeholder="0,00" value={novaMeta.valor} onChange={e => setNovaMeta({
                ...novaMeta,
                valor: e.target.value
              })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mes">Mês/Ano</Label>
                <Input id="mes" placeholder="Ex: Setembro 2024" value={novaMeta.mes} onChange={e => setNovaMeta({
                ...novaMeta,
                mes: e.target.value
              })} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={cancelarDialog}>
                Cancelar
              </Button>
              <Button className="gradient-primary text-white w-full sm:w-auto" onClick={editandoMeta ? salvarEdicao : criarMeta}>
                {editandoMeta ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalMetas.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Orçamento mensal
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalGasto.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              {(totalGasto / totalMetas * 100).toFixed(1)}% do orçamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ultrapassadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{metasUltrapassadas}</div>
            <p className="text-xs text-muted-foreground">
              De {metasComGastos.length} metas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metasAtingidas}</div>
            <p className="text-xs text-muted-foreground">
              De {metasComGastos.length} metas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Metas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {metasComGastos.map(meta => {
        const percentual = meta.gastoAtual / meta.metaMensal * 100;
        const saldoRestante = meta.metaMensal - meta.gastoAtual;
        return <Card key={meta.id} className="hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(meta)}
                    <CardTitle className="text-lg">{meta.categoria}</CardTitle>
                  </div>
                  {getStatusBadge(meta)}
                </div>
                <CardDescription className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {meta.mes}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso</span>
                      <span>{percentual.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(percentual, 100)} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Meta</p>
                      <p className="font-medium">
                        R$ {meta.metaMensal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gasto</p>
                      <p className="font-medium">
                        R$ {meta.gastoAtual.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      {saldoRestante > 0 ? "Saldo restante" : "Valor ultrapassado"}
                    </p>
                    <p className={`font-medium ${saldoRestante > 0 ? "text-success" : "text-danger"}`}>
                      R$ {Math.abs(saldoRestante).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-3 border-t flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="flex-1 min-w-[80px]" onClick={() => editarMeta(meta)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    
                    {meta.gastoAtual !== meta.metaMensal}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex-1 min-w-[80px]">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a meta "{meta.categoria}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-danger hover:bg-danger/90" onClick={() => excluirMeta(meta.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};
export default Metas;