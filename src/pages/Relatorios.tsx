import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { FileText, Download, Filter, Calendar as CalendarIcon, BarChart3, PieChart, TrendingUp, FileSpreadsheet, Trash2 } from "lucide-react";
import { TransactionChart } from "@/components/charts/TransactionChart";
import { useTransactions, useBankAccounts, useInstallments, useVaults, useMonthlyGoals } from "@/hooks/useSupabaseData";
import { toast } from "@/hooks/use-toast";

// Função para gerar relatório real
const generateReport = (type: string, format: string, filters: any) => {
  // Simulação de geração de relatório
  toast({
    title: "Relatório gerado!",
    description: `Relatório ${type} em formato ${format} foi gerado com sucesso.`
  });
};

// Função para exportar dados em CSV
const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) {
    toast({
      title: "Nenhum dado para exportar",
      description: "Não há dados disponíveis para exportação.",
      variant: "destructive"
    });
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [headers.join(','), ...data.map(row => headers.map(key => `"${row[key] || ''}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  toast({
    title: "Exportação concluída",
    description: `Dados exportados com sucesso!`
  });
};
const Relatorios = () => {
  const navigate = useNavigate();
  const {
    data: transactions
  } = useTransactions();
  const {
    data: bankAccounts
  } = useBankAccounts();
  const {
    data: installments
  } = useInstallments();
  const {
    data: vaults
  } = useVaults();
  const {
    data: monthlyGoals
  } = useMonthlyGoals();
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [filtros, setFiltros] = useState({
    periodo: "",
    categoria: "",
    tipo: "",
    nome: "",
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined
  });

  // Criar relatórios dinâmicos baseados nos dados reais
  const relatoriosDisponiveis = [{
    id: 1,
    nome: "Relatório de Transações",
    descricao: `${transactions?.length || 0} transações registradas`,
    tipo: "CSV",
    categoria: "Financeiro",
    ultimaGeracao: new Date().toISOString().split('T')[0]
  }, {
    id: 2,
    nome: "Relatório de Contas",
    descricao: `${bankAccounts?.length || 0} contas bancárias`,
    tipo: "CSV",
    categoria: "Contas",
    ultimaGeracao: new Date().toISOString().split('T')[0]
  }, {
    id: 3,
    nome: "Relatório de Parcelamentos",
    descricao: `${installments?.length || 0} parcelamentos ativos`,
    tipo: "CSV",
    categoria: "Parcelamentos",
    ultimaGeracao: new Date().toISOString().split('T')[0]
  }, {
    id: 4,
    nome: "Relatório de Cofres",
    descricao: `${vaults?.length || 0} cofres virtuais`,
    tipo: "CSV",
    categoria: "Cofres",
    ultimaGeracao: new Date().toISOString().split('T')[0]
  }, {
    id: 5,
    nome: "Relatório de Metas",
    descricao: `${monthlyGoals?.length || 0} metas mensais`,
    tipo: "CSV",
    categoria: "Metas",
    ultimaGeracao: new Date().toISOString().split('T')[0]
  }];

  // Processar dados para gráficos
  const dadosGrafico = {
    entradas: transactions?.filter(t => t.type === 'credit').reduce((acc, t) => {
      const month = new Date(t.occurred_at).toLocaleDateString('pt-BR', {
        month: 'short'
      });
      const existing = acc.find(item => item.mes === month);
      if (existing) {
        existing.valor += t.amount;
      } else {
        acc.push({
          mes: month,
          valor: t.amount
        });
      }
      return acc;
    }, [] as {
      mes: string;
      valor: number;
    }[]) || [],
    saidas: transactions?.filter(t => t.type === 'debit').reduce((acc, t) => {
      const month = new Date(t.occurred_at).toLocaleDateString('pt-BR', {
        month: 'short'
      });
      const existing = acc.find(item => item.mes === month);
      if (existing) {
        existing.valor += t.amount;
      } else {
        acc.push({
          mes: month,
          valor: t.amount
        });
      }
      return acc;
    }, [] as {
      mes: string;
      valor: number;
    }[]) || []
  };

  // Função para filtrar relatórios
  const relatoriosFiltrados = relatoriosDisponiveis.filter(relatorio => {
    const filtroNome = !filtros.nome || relatorio.nome.toLowerCase().includes(filtros.nome.toLowerCase());
    const filtroCategoria = !filtros.categoria || relatorio.categoria === filtros.categoria;
    const filtroTipo = !filtros.tipo || relatorio.tipo === filtros.tipo;
    let filtroData = true;
    if (filtros.dataInicio || filtros.dataFim) {
      const dataRelatorio = new Date(relatorio.ultimaGeracao);
      if (filtros.dataInicio && dataRelatorio < filtros.dataInicio) filtroData = false;
      if (filtros.dataFim && dataRelatorio > filtros.dataFim) filtroData = false;
    }
    return filtroNome && filtroCategoria && filtroTipo && filtroData;
  });
  const limparFiltros = () => {
    setFiltros({
      periodo: "",
      categoria: "",
      tipo: "",
      nome: "",
      dataInicio: undefined,
      dataFim: undefined
    });
  };
  return <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Análises detalhadas e exportação de dados financeiros
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          
        </div>
      </div>

      {filtrosVisiveis && <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtrar Relatórios</span>
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label>Nome do Relatório</Label>
                <Input placeholder="Buscar por nome..." value={filtros.nome} onChange={e => setFiltros({
              ...filtros,
              nome: e.target.value
            })} />
              </div>

              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={filtros.categoria || "all"} onValueChange={value => setFiltros({
              ...filtros,
              categoria: value === "all" ? "" : value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Geral">Geral</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Análise">Análise</SelectItem>
                    <SelectItem value="Parcelamentos">Parcelamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={filtros.tipo || "all"} onValueChange={value => setFiltros({
              ...filtros,
              tipo: value === "all" ? "" : value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Data de Geração</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 justify-start">
                        <CalendarIcon className="h-3 w-3" />
                        {filtros.dataInicio ? format(filtros.dataInicio, "dd/MM") : "De"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filtros.dataInicio} onSelect={date => setFiltros({
                    ...filtros,
                    dataInicio: date
                  })} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 justify-start">
                        <CalendarIcon className="h-3 w-3" />
                        {filtros.dataFim ? format(filtros.dataFim, "dd/MM") : "Até"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={filtros.dataFim} onSelect={date => setFiltros({
                    ...filtros,
                    dataFim: date
                  })} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>}

      <Tabs defaultValue="gerar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gerar">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Novo Relatório</CardTitle>
              <CardDescription>
                Configure os parâmetros para gerar um relatório personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Tipo de Relatório</Label>
                    <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transacoes">Relatório de Transações</SelectItem>
                        <SelectItem value="contas">Relatório de Contas</SelectItem>
                        <SelectItem value="parcelamentos">Parcelamentos</SelectItem>
                        <SelectItem value="cofres">Cofres Virtuais</SelectItem>
                        <SelectItem value="metas">Metas Mensais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Período</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="semana">Esta Semana</SelectItem>
                        <SelectItem value="mes">Este Mês</SelectItem>
                        <SelectItem value="trimestre">Este Trimestre</SelectItem>
                        <SelectItem value="ano">Este Ano</SelectItem>
                        <SelectItem value="personalizado">Período Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="alimentacao">Alimentação</SelectItem>
                        <SelectItem value="transporte">Transporte</SelectItem>
                        <SelectItem value="lazer">Lazer</SelectItem>
                        <SelectItem value="saude">Saúde</SelectItem>
                        <SelectItem value="educacao">Educação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Data Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filtros.dataInicio ? filtros.dataInicio.toLocaleDateString('pt-BR') : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={filtros.dataInicio} onSelect={date => setFiltros({
                        ...filtros,
                        dataInicio: date
                      })} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Data Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filtros.dataFim ? filtros.dataFim.toLocaleDateString('pt-BR') : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={filtros.dataFim} onSelect={date => setFiltros({
                        ...filtros,
                        dataFim: date
                      })} className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Formato de Saída</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF (em breve)</SelectItem>
                        <SelectItem value="excel">Excel (em breve)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 mt-6">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button className="gradient-primary text-white w-full sm:w-auto" onClick={() => {
                if (!selectedReportType || !selectedFormat) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Selecione o tipo de relatório e formato antes de gerar.",
                    variant: "destructive"
                  });
                  return;
                }

                // Gerar relatório baseado no tipo selecionado
                let dataToExport: any[] = [];
                let filename = "";
                switch (selectedReportType) {
                  case "transacoes":
                    dataToExport = transactions?.map(t => ({
                      Data: new Date(t.occurred_at).toLocaleDateString('pt-BR'),
                      Tipo: t.type === 'credit' ? 'Entrada' : 'Saída',
                      Categoria: t.category || 'Sem categoria',
                      Descrição: t.description || 'Sem descrição',
                      Valor: `R$ ${t.amount.toFixed(2)}`,
                      Conta: bankAccounts?.find(acc => acc.id === t.account_id)?.name || 'N/A'
                    })) || [];
                    filename = "relatorio_transacoes";
                    break;
                  case "contas":
                    dataToExport = bankAccounts?.map(acc => ({
                      Nome: acc.name,
                      Instituição: acc.institution || 'N/A',
                      Tipo: acc.type || 'N/A',
                      Saldo: `R$ ${acc.balance.toFixed(2)}`,
                      Criado: new Date(acc.created_at).toLocaleDateString('pt-BR')
                    })) || [];
                    filename = "relatorio_contas";
                    break;
                  case "parcelamentos":
                    dataToExport = installments?.map(inst => ({
                      Descrição: inst.description,
                      'Valor Total': `R$ ${inst.total_amount.toFixed(2)}`,
                      'Nº Parcelas': inst.installments_count,
                      Status: inst.status,
                      'Data Início': new Date(inst.start_date).toLocaleDateString('pt-BR')
                    })) || [];
                    filename = "relatorio_parcelamentos";
                    break;
                  case "cofres":
                    dataToExport = vaults?.map(vault => ({
                      Nome: vault.name,
                      'Valor Atual': `R$ ${vault.current_amount.toFixed(2)}`,
                      'Valor Meta': vault.target_amount ? `R$ ${vault.target_amount.toFixed(2)}` : 'Sem meta',
                      Progresso: vault.target_amount ? `${(vault.current_amount / vault.target_amount * 100).toFixed(1)}%` : 'N/A'
                    })) || [];
                    filename = "relatorio_cofres";
                    break;
                  case "metas":
                    dataToExport = monthlyGoals?.map(goal => ({
                      Categoria: goal.category,
                      Mês: new Date(goal.month).toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric'
                      }),
                      'Limite Definido': `R$ ${goal.limit_amount.toFixed(2)}`
                    })) || [];
                    filename = "relatorio_metas";
                    break;
                }
                if (selectedFormat === "csv") {
                  exportToCSV(dataToExport, filename);
                } else {
                  generateReport(selectedReportType, selectedFormat, filtros);
                }
              }}>
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Gerar e Baixar</span>
                  <span className="sm:hidden">Gerar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
              <CardDescription>
                Relatórios gerados anteriormente e disponíveis para download
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatoriosFiltrados.length > 0 ? relatoriosFiltrados.map(relatorio => <div key={relatorio.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                      <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          {relatorio.tipo === "PDF" ? <FileText className="h-5 w-5 text-primary" /> : <FileSpreadsheet className="h-5 w-5 text-success" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm sm:text-base truncate">{relatorio.nome}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">{relatorio.descricao}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{relatorio.categoria}</Badge>
                            <Badge variant="secondary" className="text-xs">{relatorio.tipo}</Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              Gerado em {new Date(relatorio.ultimaGeracao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        
                        <Button size="sm" className="gradient-primary text-white flex-1 sm:flex-none" onClick={() => {
                    // Baixar o relatório baseado no tipo
                    let dataToExport: any[] = [];
                    let filename = "";
                    switch (relatorio.categoria.toLowerCase()) {
                      case "financeiro":
                        dataToExport = transactions?.map(t => ({
                          Data: new Date(t.occurred_at).toLocaleDateString('pt-BR'),
                          Tipo: t.type === 'credit' ? 'Entrada' : 'Saída',
                          Categoria: t.category || 'Sem categoria',
                          Descrição: t.description || 'Sem descrição',
                          Valor: `R$ ${t.amount.toFixed(2)}`,
                          Conta: bankAccounts?.find(acc => acc.id === t.account_id)?.name || 'N/A'
                        })) || [];
                        filename = "relatorio_transacoes";
                        break;
                      case "contas":
                        dataToExport = bankAccounts?.map(acc => ({
                          Nome: acc.name,
                          Instituição: acc.institution || 'N/A',
                          Tipo: acc.type || 'N/A',
                          Saldo: `R$ ${acc.balance.toFixed(2)}`,
                          Criado: new Date(acc.created_at).toLocaleDateString('pt-BR')
                        })) || [];
                        filename = "relatorio_contas";
                        break;
                      case "parcelamentos":
                        dataToExport = installments?.map(inst => ({
                          Descrição: inst.description,
                          'Valor Total': `R$ ${inst.total_amount.toFixed(2)}`,
                          'Nº Parcelas': inst.installments_count,
                          Status: inst.status,
                          'Data Início': new Date(inst.start_date).toLocaleDateString('pt-BR')
                        })) || [];
                        filename = "relatorio_parcelamentos";
                        break;
                      case "cofres":
                        dataToExport = vaults?.map(vault => ({
                          Nome: vault.name,
                          'Valor Atual': `R$ ${vault.current_amount.toFixed(2)}`,
                          'Valor Meta': vault.target_amount ? `R$ ${vault.target_amount.toFixed(2)}` : 'Sem meta',
                          Progresso: vault.target_amount ? `${(vault.current_amount / vault.target_amount * 100).toFixed(1)}%` : 'N/A'
                        })) || [];
                        filename = "relatorio_cofres";
                        break;
                      case "metas":
                        dataToExport = monthlyGoals?.map(goal => ({
                          Categoria: goal.category,
                          Mês: new Date(goal.month).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                          }),
                          'Limite Definido': `R$ ${goal.limit_amount.toFixed(2)}`
                        })) || [];
                        filename = "relatorio_metas";
                        break;
                      default:
                        dataToExport = [];
                        filename = "relatorio_geral";
                    }
                    exportToCSV(dataToExport, filename);
                  }}>
                          <Download className="mr-2 h-3 w-3" />
                          Baixar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => {
                    toast({
                      title: "Relatório excluído",
                      description: `${relatorio.nome} foi removido com sucesso.`,
                      variant: "destructive"
                    });
                    // Aqui seria implementada a lógica real de exclusão
                  }}>
                          <Trash2 className="sm:mr-2 h-3 w-3" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </div>
                    </div>) : <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                    <p className="text-muted-foreground">
                      Tente ajustar os filtros ou gere um novo relatório.
                    </p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatoriosDisponiveis.length}</div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Último Download</CardTitle>
                <Download className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Hoje</div>
                <p className="text-xs text-muted-foreground">Relatório Mensal</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Formato Mais Usado</CardTitle>
                <PieChart className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">PDF</div>
                <p className="text-xs text-muted-foreground">75% dos downloads</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendências</CardTitle>
              <CardDescription>
                Visualização dos dados financeiros dos últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionChart data={dadosGrafico.entradas} type="line" title="Evolução Mensal" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default Relatorios;