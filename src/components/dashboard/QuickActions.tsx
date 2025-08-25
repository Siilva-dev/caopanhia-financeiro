import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search, FileText, Target, CreditCard, Building } from "lucide-react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    {
      id: 'add-transaction',
      title: 'Novo Lançamento',
      description: 'Adicionar entrada ou saída',
      icon: PlusCircle,
      variant: 'default' as const,
      gradient: 'gradient-primary'
    },
    {
      id: 'search-transaction',
      title: 'Buscar Lançamento',
      description: 'Localizar e editar',
      icon: Search,
      variant: 'secondary' as const,
      gradient: ''
    },
    {
      id: 'export-report',
      title: 'Relatório',
      description: 'Exportar dados',
      icon: FileText,
      variant: 'secondary' as const,
      gradient: ''
    },
    {
      id: 'add-goal',
      title: 'Nova Meta',
      description: 'Definir objetivo',
      icon: Target,
      variant: 'secondary' as const,
      gradient: ''
    },
    {
      id: 'add-card',
      title: 'Novo Cartão',
      description: 'Cadastrar cartão',
      icon: CreditCard,
      variant: 'secondary' as const,
      gradient: ''
    },
    {
      id: 'add-account',
      title: 'Nova Conta',
      description: 'Conta bancária',
      icon: Building,
      variant: 'secondary' as const,
      gradient: ''
    }
  ];

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
          <span>Ações Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={() => onAction(action.id)}
              className={`h-auto p-4 flex flex-col items-center space-y-2 hover-lift ${action.gradient}`}
            >
              <action.icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-70">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}