import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell } from 'lucide-react';
import { useBudget, useUpdateBudget } from '@/hooks/useFinances';
import { useMemo } from 'react';
import { addDays, isBefore, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BudgetDetailDialogProps {
  budgetId: string | null;
  onClose: () => void;
}

function getRowColor(line: any): string {
  if (line.status === 'pagado') return '';
  const planned = new Date(line.planned_date);
  const today = new Date();
  const daysOverdue = differenceInDays(today, planned);
  if (daysOverdue >= 15) return 'bg-red-100 dark:bg-red-950/40';
  if (daysOverdue >= 7) return 'bg-yellow-100 dark:bg-yellow-950/40';
  return '';
}

export function BudgetDetailDialog({ budgetId, onClose }: BudgetDetailDialogProps) {
  const { data: budget, isLoading } = useBudget(budgetId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = async (lineId: string, newStatus: string) => {
    const { error } = await supabase
      .from('budget_lines')
      .update({ status: newStatus as any })
      .eq('id', lineId);
    if (error) {
      toast({ title: 'Error al cambiar estado', variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: `Estado cambiado a ${newStatus === 'pagado' ? 'Pagado' : 'Pendiente'}` });
    }
  };

  const linesAnalysis = useMemo(() => {
    if (!budget?.lines) return { upcoming: [] as any[] };
    return {
      upcoming: budget.lines.filter((line: any) =>
        line.reminder_date && isBefore(new Date(line.reminder_date), addDays(new Date(), 7))
      ),
    };
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

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" /> 7+ días sin pagar</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-400" /> 15+ días sin pagar</div>
            </div>

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
                      <th className="p-2 text-left">Día</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-right">USD</th>
                      <th className="p-2 text-right">VES</th>
                      <th className="p-2 text-center">Bs?</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Recordatorio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.lines.map((line: any) => {
                      const rowColor = getRowColor(line);
                      const reminderSoon = line.reminder_date && isBefore(new Date(line.reminder_date), addDays(new Date(), 7));
                      return (
                        <tr key={line.id} className={`border-t ${rowColor}`}>
                          <td className="p-2">{line.day_of_month || new Date(line.planned_date).getDate()}</td>
                          <td className="p-2">{line.description}</td>
                          <td className="p-2 text-right font-mono">${line.amount_usd.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono">Bs. {(line.amount_ves || 0).toFixed(2)}</td>
                          <td className="p-2 text-center">{line.can_pay_in_ves ? 'Sí' : 'No'}</td>
                          <td className="p-2">
                            <Select value={line.status} onValueChange={(val) => handleStatusChange(line.id, val)}>
                              <SelectTrigger className="h-7 w-[110px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="pagado">Pagado</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
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
