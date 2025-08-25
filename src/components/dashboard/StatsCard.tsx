import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

export function StatsCard({ title, value, change, icon: Icon, variant = 'default' }: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          card: 'border-success/20 bg-success/5',
          icon: 'bg-success text-success-foreground',
          value: 'text-success'
        };
      case 'danger':
        return {
          card: 'border-danger/20 bg-danger/5',
          icon: 'bg-danger text-danger-foreground',
          value: 'text-danger'
        };
      case 'warning':
        return {
          card: 'border-warning/20 bg-warning/5',
          icon: 'bg-warning text-warning-foreground',
          value: 'text-warning'
        };
      default:
        return {
          card: 'border-primary/20 bg-primary/5',
          icon: 'bg-primary text-primary-foreground',
          value: 'text-primary'
        };
    }
  };

  const styles = getVariantStyles();

  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`hover-lift transition-all duration-200 ${styles.card}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${styles.value} mb-1`}>
          {value}
        </div>
        {change && (
          <p className={`text-xs ${getChangeColor()}`}>
            {change.value} em relação ao mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}