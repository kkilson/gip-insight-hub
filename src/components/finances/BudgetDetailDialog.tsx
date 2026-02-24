import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, CheckCircle, Bell } from 'lucide-react';
import { useBudget } from '@/hooks/useFinances';
import { useMemo } from 'react';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';

interface BudgetDetailDialogProps {
  budgetId: string | null;
  onClose: () => void;
}

export function BudgetDetailDialog({ budgetId, onClose }: BudgetDetailDialogProps) {
  const { data: budget, isLoading } = useBudget(budgetId);

  const linesAnalysis = useMemo(() => {
    if (!budget?.lines) return { overBudget: [], atRisk: [], onTrack: [], upcoming: [] };
    
    return budget.lines.reduce(
      (acc, line: any) => {
        const actual = line.actual_amount_usd || 0;
        const budgeted = line.amount_usd;
        const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
        
        if (actual > budgeted) acc.overBudget.push({ ...line, pct, diff: actual - budgeted });
        else if (pct >= 80) acc.atRisk.push({ ...line, pct });
        else acc.onTrack.push({ ...line, pct });
        
        if (line.reminder_date && isBefore(new Date(line.reminder_date), addDays(new Date(), 7))) {
          acc.upcoming.push(line);
        }
        return acc;
      },
      { overBudget: [] as any[], atRisk: [] as any[], onTrack: [] as any[], upcoming: [] as any[] }
    );
  }, [budget?.lines]);

  return (
    <Dialog open={!!budgetId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detalle del Presupuesto</DialogTitle></DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-32 w-full" /></div>
        ) : budget ? (
          <div className="space-y-4">
            <div><p className="text-muted-foreground text-sm">Nombre</p><p className="font-medium">{budget.name}</p></div>

            {linesAnalysis.upcoming.length > 0 && (
              <Alert className="border-blue-300 bg-blue-50">
                <Bell className="h-4 w-4 text-blue-600" />
                <AlertDescription className="ml-2 text-blue-800">
                  <strong>{linesAnalysis.upcoming.length} pago(s)</strong> con recordatorio próximo
                </AlertDescription>
              </Alert>
            )}

            {linesAnalysis.overBudget.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <strong>{linesAnalysis.overBudget.length} línea(s)</strong> sobre presupuesto
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Período</p><p className="font-medium capitalize">{budget.period}</p></div>
              <div><p className="text-muted-foreground">Presupuestado</p><p className="font-medium">${budget.total_budgeted_usd.toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Ejecutado</p><p className="font-medium">${budget.total_spent_usd.toFixed(2)}</p></div>
              <div><p className="text-muted-foreground">Disponible</p>
                <p className={`font-medium ${(budget.total_budgeted_usd - budget.total_spent_usd) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ${(budget.total_budgeted_usd - budget.total_spent_usd).toFixed(2)}
                </p>
              </div>
            </div>

            {budget.lines && budget.lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Categoría</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-right">Monto USD</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Recordatorio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.lines.map((line: any) => {
                      const reminderSoon = line.reminder_date && isBefore(new Date(line.reminder_date), addDays(new Date(), 7));
                      return (
                        <tr key={line.id} className={`border-t ${reminderSoon ? 'bg-blue-50/50' : ''}`}>
                          <td className="p-2">{line.planned_date}</td>
                          <td className="p-2">{line.category || '-'}</td>
                          <td className="p-2">{line.description}</td>
                          <td className="p-2 text-right font-mono">${line.amount_usd.toFixed(2)}</td>
                          <td className="p-2"><Badge variant="outline" className="capitalize">{line.status}</Badge></td>
                          <td className="p-2 text-xs">
                            {line.reminder_date ? (
                              <span className={reminderSoon ? 'text-blue-600 font-medium' : ''}>
                                {line.reminder_date}
                              </span>
                            ) : '-'}
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
