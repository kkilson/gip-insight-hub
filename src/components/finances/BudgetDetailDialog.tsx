import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { useBudget } from '@/hooks/useFinances';
import { useMemo } from 'react';

interface BudgetDetailDialogProps {
  budgetId: string | null;
  onClose: () => void;
}

export function BudgetDetailDialog({ budgetId, onClose }: BudgetDetailDialogProps) {
  const { data: budget, isLoading } = useBudget(budgetId);

  const linesAnalysis = useMemo(() => {
    if (!budget?.lines) return { overBudget: [], atRisk: [], onTrack: [] };
    
    return budget.lines.reduce(
      (acc, line: any) => {
        const actual = line.actual_amount_usd || 0;
        const budgeted = line.amount_usd;
        const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
        
        if (actual > budgeted) {
          acc.overBudget.push({ ...line, percentage, difference: actual - budgeted });
        } else if (percentage >= 80) {
          acc.atRisk.push({ ...line, percentage });
        } else {
          acc.onTrack.push({ ...line, percentage });
        }
        return acc;
      },
      { overBudget: [] as any[], atRisk: [] as any[], onTrack: [] as any[] }
    );
  }, [budget?.lines]);

  const getLineStatus = (line: any) => {
    const actual = line.actual_amount_usd || 0;
    const budgeted = line.amount_usd;
    const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
    
    if (actual > budgeted) {
      return { 
        status: 'over', 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10',
        icon: AlertTriangle,
        label: `+$${(actual - budgeted).toFixed(2)} sobre presupuesto`
      };
    } else if (percentage >= 80) {
      return { 
        status: 'risk', 
        color: 'text-warning', 
        bgColor: 'bg-warning/10',
        icon: TrendingUp,
        label: `${percentage.toFixed(0)}% utilizado`
      };
    }
    return { 
      status: 'ok', 
      color: 'text-success', 
      bgColor: '',
      icon: CheckCircle,
      label: `${percentage.toFixed(0)}% utilizado`
    };
  };

  const totalOverBudget = linesAnalysis.overBudget.reduce(
    (sum, line) => sum + line.difference, 
    0
  );

  return (
    <Dialog open={!!budgetId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Presupuesto</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : budget ? (
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Nombre</p>
              <p className="font-medium">{budget.name}</p>
            </div>

            {/* Alert for over-budget lines */}
            {linesAnalysis.overBudget.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <strong>{linesAnalysis.overBudget.length} línea(s)</strong> han superado el monto presupuestado 
                  por un total de <strong>${totalOverBudget.toFixed(2)}</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Warning for at-risk lines */}
            {linesAnalysis.atRisk.length > 0 && (
              <Alert className="border-warning bg-warning/10">
                <TrendingUp className="h-4 w-4 text-warning" />
                <AlertDescription className="ml-2 text-warning">
                  <strong>{linesAnalysis.atRisk.length} línea(s)</strong> están cerca del límite (≥80% utilizado)
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium capitalize">{budget.period}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Presupuestado</p>
                <p className="font-medium">${budget.total_budgeted_usd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Ejecutado</p>
                <p className={`font-medium ${budget.total_spent_usd > budget.total_budgeted_usd ? 'text-destructive' : ''}`}>
                  ${budget.total_spent_usd.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Disponible</p>
                <p className={`font-medium ${(budget.total_budgeted_usd - budget.total_spent_usd) < 0 ? 'text-destructive' : 'text-success'}`}>
                  ${(budget.total_budgeted_usd - budget.total_spent_usd).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Status badges summary */}
            <div className="flex gap-2">
              {linesAnalysis.overBudget.length > 0 && (
                <Badge variant="destructive">
                  {linesAnalysis.overBudget.length} sobre presupuesto
                </Badge>
              )}
              {linesAnalysis.atRisk.length > 0 && (
                <Badge className="bg-warning text-warning-foreground">
                  {linesAnalysis.atRisk.length} en riesgo
                </Badge>
              )}
              {linesAnalysis.onTrack.length > 0 && (
                <Badge className="bg-success text-success-foreground">
                  {linesAnalysis.onTrack.length} en orden
                </Badge>
              )}
            </div>

            {budget.lines && budget.lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Cuenta</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-right">Presupuestado</th>
                      <th className="p-2 text-right">Ejecutado</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Alerta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.lines.map((line: any) => {
                      const lineStatus = getLineStatus(line);
                      const StatusIcon = lineStatus.icon;
                      return (
                        <tr key={line.id} className={`border-t ${lineStatus.bgColor}`}>
                          <td className="p-2">{line.planned_date}</td>
                          <td className="p-2">{line.account?.code} - {line.account?.name}</td>
                          <td className="p-2">{line.description}</td>
                          <td className="p-2 text-right">${line.amount_usd.toFixed(2)}</td>
                          <td className={`p-2 text-right font-medium ${lineStatus.color}`}>
                            ${(line.actual_amount_usd || 0).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className="capitalize">
                              {line.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`h-4 w-4 ${lineStatus.color}`} />
                              <span className={`text-xs ${lineStatus.color}`}>
                                {lineStatus.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
