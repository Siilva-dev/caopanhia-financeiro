import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TransactionChartProps {
  data: any[];
  type: 'line' | 'pie';
  title: string;
  description?: string;
}

const COLORS = {
  entrada: 'hsl(142 76% 36%)',
  saida: 'hsl(0 84% 60%)',
  transferencia: 'hsl(217 91% 60%)',
  alimentacao: 'hsl(25 95% 53%)',
  transporte: 'hsl(262 83% 58%)',
  lazer: 'hsl(198 93% 60%)',
  saude: 'hsl(120 76% 40%)',
  outros: 'hsl(280 65% 60%)'
};

export function TransactionChart({ data, type, title, description }: TransactionChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-card-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ name, value, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  const PieLegend = ({ data }: { data: any[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
      {data.map((entry, index) => {
        const colorKey = entry.name.toLowerCase() as keyof typeof COLORS;
        const color = COLORS[colorKey] || COLORS.outros;
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(1);
        
        return (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0" 
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground truncate">
              {entry.name}: {percent}% ({formatCurrency(entry.value)})
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {type === 'pie' ? (
          <div className="space-y-4">
            <div className="h-48 sm:h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => {
                      const colorKey = entry.name.toLowerCase() as keyof typeof COLORS;
                      const color = COLORS[colorKey] || COLORS.outros;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <PieLegend data={data} />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke={COLORS.entrada} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.entrada, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.entrada, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke={COLORS.saida} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.saida, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.saida, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}