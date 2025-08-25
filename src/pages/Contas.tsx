import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building, Plus, DollarSign, TrendingUp, Trash2, Edit, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { useBankAccounts, useCreateBankAccount, useUpdateBankAccount, useDeleteBankAccount } from "@/hooks/useSupabaseData";

const Contas = () => {
  const { data: bankAccounts, isLoading } = useBankAccounts();
  const createBankAccountMutation = useCreateBankAccount();
  const updateBankAccountMutation = useUpdateBankAccount();
  const deleteBankAccountMutation = useDeleteBankAccount();
  const [novaConta, setNovaConta] = useState({
    banco: "", tipoConta: "Conta Corrente", saldo: "", numero: ""
  });
  const [isNovaContaDialogOpen, setIsNovaContaDialogOpen] = useState(false);

  // Convert Supabase data to display format
  const contas = bankAccounts?.map(account => ({
    id: account.id,
    banco: account.name,
    tipoConta: account.type || "Conta Corrente",
    saldo: Number(account.balance),
    status: "Ativa" as const,
    numero: `****-${account.id.slice(-4)}`,
    cor: "#" + Math.floor(Math.random()*16777215).toString(16)
  })) || [];

  const saldoTotal = contas.reduce((acc, conta) => acc + conta.saldo, 0);
  const contasAtivas = contas.length;

  const handleSalvarNovaConta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaConta.banco || !novaConta.numero || !novaConta.saldo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Save to Supabase
    createBankAccountMutation.mutate({
      name: novaConta.banco,
      institution: novaConta.banco,
      type: novaConta.tipoConta,
      balance: parseFloat(novaConta.saldo)
    }, {
      onSuccess: () => {
        setNovaConta({ banco: "", tipoConta: "Conta Corrente", saldo: "", numero: "" });
        setIsNovaContaDialogOpen(false);
        toast.success("Conta adicionada com sucesso!");
      },
      onError: () => {
        toast.error("Erro ao salvar conta. Tente novamente.");
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Contas Bancárias</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie todas as suas contas bancárias e digitais
          </p>
        </div>
        
        <Dialog open={isNovaContaDialogOpen} onOpenChange={setIsNovaContaDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Conta</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Adicionar Conta Bancária</DialogTitle>
              <DialogDescription className="text-sm">
                Cadastre uma nova conta bancária ou digital
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSalvarNovaConta}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    placeholder="Ex: Banco Inter"
                    value={novaConta.banco}
                    onChange={(e) => setNovaConta({...novaConta, banco: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de Conta</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={novaConta.tipoConta}
                    onChange={(e) => setNovaConta({...novaConta, tipoConta: e.target.value})}
                    required
                  >
                    <option value="Conta Corrente">Conta Corrente</option>
                    <option value="Conta Digital">Conta Digital</option>
                    <option value="Conta Poupança">Conta Poupança</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="numero">Número da Conta</Label>
                  <Input
                    id="numero"
                    placeholder="****-1234"
                    value={novaConta.numero}
                    onChange={(e) => setNovaConta({...novaConta, numero: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saldo">Saldo Inicial</Label>
                  <Input
                    id="saldo"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={novaConta.saldo}
                    onChange={(e) => setNovaConta({...novaConta, saldo: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsNovaContaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary text-white w-full sm:w-auto">
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-lift gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-white/70">
              Todas as contas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <Building className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              De {contas.length} cadastradas
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Saldo</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {Math.max(...contas.map(c => c.saldo)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {contas.find(c => c.saldo === Math.max(...contas.map(c => c.saldo)))?.banco}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Contas */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((conta) => (
          <Card key={conta.id} className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: conta.cor }}
                  />
                  <CardTitle className="text-lg">{conta.banco}</CardTitle>
                </div>
                <Badge variant={conta.status === "Ativa" ? "default" : "secondary"}>
                  {conta.status}
                </Badge>
              </div>
              <CardDescription>{conta.tipoConta}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Número da Conta</p>
                  <p className="font-mono text-sm">{conta.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Atual</p>
                  <p className="text-xl font-bold">
                    R$ {conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const novoSaldo = prompt("Digite o novo saldo:", conta.saldo.toString());
                      if (novoSaldo !== null && !isNaN(Number(novoSaldo))) {
                        updateBankAccountMutation.mutate({
                          id: conta.id,
                          updates: { balance: Number(novoSaldo) }
                        }, {
                          onSuccess: () => {
                            toast.success("Saldo atualizado com sucesso!");
                          },
                          onError: () => {
                            toast.error("Erro ao atualizar saldo. Tente novamente.");
                          }
                        });
                      }
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir esta conta?")) {
                        deleteBankAccountMutation.mutate(conta.id, {
                          onSuccess: () => {
                            toast.success("Conta excluída com sucesso!");
                          },
                          onError: () => {
                            toast.error("Erro ao excluir conta. Tente novamente.");
                          }
                        });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Contas;