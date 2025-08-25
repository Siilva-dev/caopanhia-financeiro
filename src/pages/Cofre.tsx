import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Vault, Plus, Minus, DollarSign, TrendingUp, TrendingDown, Calendar, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVaults, useCreateVault, useDeleteVault, useCreateVaultMovement, useVaultMovements, useDeleteVaultMovement, useUpdateVaultMovement } from "@/hooks/useSupabaseData";

interface MovimentacaoCofre {
  id: string; // UUID é string, não number
  data: string;
  tipo: "Entrada" | "Saída" | "Transferência";
  valor: number;
  descricao: string;
  saldoAnterior: number;
  saldoAtual: number;
}

const Cofre = () => {
  const {
    data: vaults
  } = useVaults();
  const createVaultMutation = useCreateVault();
  const deleteVaultMutation = useDeleteVault();
  const createMovementMutation = useCreateVaultMovement();
  const updateMovementMutation = useUpdateVaultMovement();
  const deleteMovementMutation = useDeleteVaultMovement();
  // Usar dados reais do cofre principal
  const cofrePrincipal = vaults?.[0];
  const saldoAtual = cofrePrincipal?.current_amount || 0;

  // Buscar movimentações do cofre principal
  const { data: movements } = useVaultMovements(cofrePrincipal?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState<MovimentacaoCofre | null>(null);
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "Entrada" as "Entrada" | "Saída" | "Transferência",
    valor: "",
    descricao: ""
  });
  // Calcular totais baseado nas movimentações reais
  const totalEntradas = movements?.filter(m => m.type === 'deposit').reduce((acc, m) => acc + Number(m.amount), 0) || 0;
  const totalSaidas = movements?.filter(m => m.type === 'withdrawal').reduce((acc, m) => acc + Number(m.amount), 0) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cofrePrincipal) {
      // Criar cofre principal se não existir
      createVaultMutation.mutate({
        name: "Cofre Principal",
        target_amount: null
      });
      return;
    }

    const valor = parseFloat(novaMovimentacao.valor);
    let tipoMovimento: 'deposit' | 'withdrawal';
    
    // Mapear todos os tipos corretamente
    switch (novaMovimentacao.tipo) {
      case "Entrada":
        tipoMovimento = "deposit";
        break;
      case "Saída":
      case "Transferência": // Transferência é tratada como saída do cofre
        tipoMovimento = "withdrawal";
        break;
      default:
        tipoMovimento = "deposit";
    }
    
    if (selectedMovimentacao) {
      // Atualizar movimentação existente
      updateMovementMutation.mutate({
        id: selectedMovimentacao.id, // Já é string UUID
        updates: {
          amount: valor,
          type: tipoMovimento,
          description: novaMovimentacao.descricao
        }
      }, {
        onSuccess: () => {
          resetForm();
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar movimentação",
            description: "Tente novamente em alguns instantes.",
            variant: "destructive"
          });
          console.error("Erro:", error);
        }
      });
    } else {
      // Criar nova movimentação
      createMovementMutation.mutate({
        vault_id: cofrePrincipal.id,
        amount: valor,
        type: tipoMovimento,
        description: novaMovimentacao.descricao
      }, {
        onSuccess: () => {
          toast({
            title: "Movimentação registrada com sucesso!"
          });
          resetForm();
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: "Erro ao salvar movimentação",
            description: "Tente novamente em alguns instantes.",
            variant: "destructive"
          });
          console.error("Erro:", error);
        }
      });
    }
  };
  const resetForm = () => {
    setNovaMovimentacao({
      tipo: "Entrada",
      valor: "",
      descricao: ""
    });
    setSelectedMovimentacao(null);
  };
  const handleEdit = (movement: any) => {
    const movimentacao = {
      id: movement.id, // Usar o UUID diretamente
      data: new Date(movement.occurred_at).toLocaleDateString('pt-BR'),
      tipo: movement.type === 'deposit' ? 'Entrada' : 'Saída' as "Entrada" | "Saída" | "Transferência",
      valor: Number(movement.amount),
      descricao: movement.description || '',
      saldoAnterior: 0,
      saldoAtual: saldoAtual
    };
    
    setSelectedMovimentacao(movimentacao);
    setNovaMovimentacao({
      tipo: movimentacao.tipo,
      valor: movimentacao.valor.toString(),
      descricao: movimentacao.descricao
    });
    setIsDialogOpen(true);
  };
  const handleDelete = () => {
    if (cofrePrincipal && confirm('Tem certeza que deseja excluir o cofre?')) {
      deleteVaultMutation.mutate(cofrePrincipal.id);
    }
  };
  return <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Cofre Virtual</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Controle do dinheiro em espécie e sangrias do caixa
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gradient-primary text-white w-full sm:w-auto">
              <Vault className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Movimentação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {selectedMovimentacao ? 'Editar Movimentação' : 'Adicionar Movimentação'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {selectedMovimentacao ? 'Edite os dados da movimentação' : 'Registre uma nova entrada ou saída do cofre virtual'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={novaMovimentacao.tipo} onChange={e => setNovaMovimentacao({
                ...novaMovimentacao,
                tipo: e.target.value as "Entrada" | "Saída" | "Transferência"
              })} required>
                  <option value="Entrada">Entrada</option>
                  <option value="Saída">Saída</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor</Label>
                <Input id="valor" type="number" step="0.01" min="0" placeholder="0,00" value={novaMovimentacao.valor} onChange={e => setNovaMovimentacao({
                ...novaMovimentacao,
                valor: e.target.value
              })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" placeholder="Ex: Sangria do caixa..." value={novaMovimentacao.descricao} onChange={e => setNovaMovimentacao({
                ...novaMovimentacao,
                descricao: e.target.value
              })} required />
              </div>
              <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="gradient-primary text-white w-full sm:w-auto">
                  {selectedMovimentacao ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Saldo Atual</CardTitle>
            <Vault className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {saldoAtual.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-white/70">
              Dinheiro em espécie
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalEntradas.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              R$ {totalSaidas.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            Todas as entradas e saídas do cofre virtual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements && movements.length > 0 ? (
                  movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.occurred_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={movement.type === 'deposit' ? 'default' : 'destructive'}>
                          {movement.type === 'deposit' ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {movement.type === 'deposit' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.description || 'Sem descrição'}</TableCell>
                      <TableCell className={movement.type === 'deposit' ? 'text-success font-medium' : 'text-danger font-medium'}>
                        {movement.type === 'deposit' ? '+ ' : '- '}
                        R$ {Number(movement.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(movement)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMovementMutation.mutate(movement.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma movimentação registrada ainda. Adicione uma movimentação para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>;
};

export default Cofre;
