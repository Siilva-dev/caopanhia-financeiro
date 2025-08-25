import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Edit, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/parcelamentos/ProgressBar";
import { NovoParcelamentoModal } from "@/components/parcelamentos/NovoParcelamentoModal";
import { useToast } from "@/hooks/use-toast";
import { useInstallments, useCreateInstallment, useDeleteInstallment, useUpdateInstallment } from "@/hooks/useSupabaseData";

// Remove mock data - now using Supabase

const Parcelamentos = () => {
  const {
    data: installments
  } = useInstallments();
  const createInstallmentMutation = useCreateInstallment();
  const deleteInstallmentMutation = useDeleteInstallment();
  const updateInstallmentMutation = useUpdateInstallment();
  // Convert Supabase data to local format
  const parcelamentosList = installments?.map(item => ({
    id: item.id,
    descricao: item.description,
    valorTotal: item.total_amount,
    valorParcela: item.total_amount / item.installments_count,
    totalParcelas: item.installments_count,
    parcelasPagas: Math.round((item.progress_percent || 0) * item.installments_count / 100),
    progressPercent: item.progress_percent || 0,
    proximaData: new Date(item.start_date).toLocaleDateString('pt-BR'),
    cartao: "Supabase",
    // TODO: implementar sistema de cartões
    status: item.status === 'ativo' ? 'Em andamento' : item.status
  })) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParcelamento, setSelectedParcelamento] = useState<any>(null);
  const {
    toast
  } = useToast();
  const totalEmAndamento = parcelamentosList.filter(p => p.status === "Em andamento").reduce((acc, p) => acc + p.valorParcela * (p.totalParcelas - p.parcelasPagas), 0);
  const proximosVencimentos = parcelamentosList.filter(p => p.status !== "Concluído").length;
  const handleNovoParcelamento = (data: any) => {
    if (selectedParcelamento?.id) {
      // Editando parcelamento existente
      updateInstallmentMutation.mutate({
        id: selectedParcelamento.id,
        description: data.descricao,
        total_amount: data.valorTotal,
        installments_count: data.numeroParcelas,
        installment_amount: data.valorParcela,
        start_date: data.proximaData.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        next_due_date: data.proximaData.toISOString().split('T')[0],
        payment_method: data.formaPagamento,
        associated_account: data.contaAssociada
      });
    } else {
      // Criando novo parcelamento
      createInstallmentMutation.mutate({
        description: data.descricao,
        total_amount: data.valorTotal,
        installments_count: data.numeroParcelas,
        installment_amount: data.valorParcela,
        start_date: data.proximaData.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        next_due_date: data.proximaData.toISOString().split('T')[0],
        payment_method: data.formaPagamento,
        associated_account: data.contaAssociada
      });
    }

    setSelectedParcelamento(null);
  };
  const handleEdit = (parcelamento: any) => {
    // Buscar dados completos do Supabase pelo ID
    const fullInstallmentData = installments?.find(item => item.id === parcelamento.id);
    
    if (!fullInstallmentData) return;
    
    // Converter data corretamente
    let validDate = new Date();
    if (fullInstallmentData.next_due_date) {
      validDate = new Date(fullInstallmentData.next_due_date);
    } else if (fullInstallmentData.start_date) {
      validDate = new Date(fullInstallmentData.start_date);
    }
    
    if (isNaN(validDate.getTime())) {
      validDate = new Date();
    }

    // Passar dados completos do Supabase para o modal
    setSelectedParcelamento(fullInstallmentData);
    setIsModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este parcelamento?')) {
      deleteInstallmentMutation.mutate(id);
    }
  };
  const resetModal = () => {
    setSelectedParcelamento(null);
    setIsModalOpen(false);
  };
  return <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Parcelamentos</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Controle detalhado de todas as suas parcelas
          </p>
        </div>
        <Button className="gradient-primary text-white w-full sm:w-auto" onClick={() => {
        setSelectedParcelamento(null);
        setIsModalOpen(true);
      }}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Parcelamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Andamento</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalEmAndamento.toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor restante a pagar
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Vencimentos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proximosVencimentos}</div>
            <p className="text-xs text-muted-foreground">
              Parcelas a vencer este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Parcelamentos</CardTitle>
            <CreditCard className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parcelamentosList.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos e concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Parcelamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Parcelamentos</CardTitle>
          <CardDescription>
            Acompanhe o status de todas as suas parcelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: Cards */}
          <div className="block sm:hidden space-y-4">
            {parcelamentosList.map(item => {
            const progresso = item.parcelasPagas / item.totalParcelas * 100;
            return <div key={item.id} className="p-4 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{item.descricao}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === "Concluído" ? "default" : item.status === "Em andamento" ? "secondary" : "destructive"}>
                        {item.status === "Concluído" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {item.status === "Em andamento" && <Clock className="mr-1 h-3 w-3" />}
                        {item.status === "Pendente" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {item.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Cartão:</span>
                      <p className="font-medium">{item.cartao}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Total:</span>
                      <p className="font-medium">R$ {item.valorTotal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parcela:</span>
                      <p className="font-medium">R$ {item.valorParcela.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Próximo:</span>
                      <p className="font-medium">{item.proximaData}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span>{item.parcelasPagas}/{item.totalParcelas}</span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                  </div>
                </div>;
          })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Parcela</TableHead>
                  
                  <TableHead>Próximo Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelamentosList.map(item => {
                const progresso = item.parcelasPagas / item.totalParcelas * 100;
                return <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.descricao}
                      </TableCell>
                      
                      <TableCell>
                        R$ {item.valorTotal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                      </TableCell>
                      <TableCell>
                        R$ {item.valorParcela.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}
                      </TableCell>
                      
                      <TableCell>{item.proximaData}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Concluído" ? "default" : item.status === "Em andamento" ? "secondary" : "destructive"}>
                          {item.status === "Concluído" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {item.status === "Em andamento" && <Clock className="mr-1 h-3 w-3" />}
                          {item.status === "Pendente" && <AlertCircle className="mr-1 h-3 w-3" />}
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <ProgressBar 
                            initialValue={item.progressPercent} 
                            onProgressChange={value => {
                              updateInstallmentMutation.mutate({
                                id: item.id,
                                progress_percent: value
                              });
                            }} 
                          />
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoParcelamentoModal open={isModalOpen} onOpenChange={resetModal} onSubmit={handleNovoParcelamento} selectedParcelamento={selectedParcelamento} />
    </div>;
};
export default Parcelamentos;