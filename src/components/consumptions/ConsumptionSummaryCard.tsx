import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Receipt, PieChart } from 'lucide-react';
import { ConsumptionSummary } from '@/hooks/useConsumptions';
import { cn } from '@/lib/utils';

interface ConsumptionSummaryCardProps {
  summary: ConsumptionSummary | undefined;
  isLoading: boolean;
  policyNumber?: string;
}

export function ConsumptionSummaryCard({ summary, isLoading, policyNumber }: ConsumptionSummaryCardProps) {
  const formatCurrency = (value: number, currency: 'bs' | 'usd') => {
    const prefix = currency === 'bs' ? 'Bs.' : '$';
    return `${prefix} ${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {policyNumber 
                ? `No hay consumos registrados para la póliza ${policyNumber}`
                : 'Selecciona una póliza para ver el resumen de consumos'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Resumen de Consumos
          {policyNumber && (
            <Badge variant="outline" className="ml-2 font-normal">
              {policyNumber}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Bs</p>
            <p className="text-lg font-bold">{formatCurrency(summary.total_bs, 'bs')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total USD</p>
            <p className="text-lg font-bold">{formatCurrency(summary.total_usd, 'usd')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Usos</p>
            <p className="text-lg font-bold">{summary.count}</p>
          </div>
        </div>

        {/* By type breakdown */}
        {summary.by_type.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Desglose por tipo</p>
            <div className="space-y-2">
              {summary.by_type.map((item, index) => (
                <div
                  key={item.type_name}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.type_name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} uso{item.count !== 1 && 's'}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    {item.total_bs > 0 && (
                      <span className="text-muted-foreground mr-3">
                        {formatCurrency(item.total_bs, 'bs')}
                      </span>
                    )}
                    {item.total_usd > 0 && (
                      <span className="font-medium">
                        {formatCurrency(item.total_usd, 'usd')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
