import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudget } from '@/hooks/useFinances';

interface BudgetDetailDialogProps {
  budgetId: string | null;
  onClose: () => void;
}

export function BudgetDetailDialog({ budgetId, onClose }: BudgetDetailDialogProps) {
  const { data: budget, isLoading } = useBudget(budgetId);

  return (
    <Dialog open={!!budgetId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl">
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium">{budget.period}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Presupuestado</p>
                <p className="font-medium">${budget.total_budgeted_usd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Ejecutado</p>
                <p className="font-medium">${budget.total_spent_usd.toFixed(2)}</p>
              </div>
            </div>
            {budget.lines && budget.lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Fecha</th>
                      <th className="p-2 text-left">Cuenta</th>
                      <th className="p-2 text-left">Descripción</th>
                      <th className="p-2 text-right">Monto USD</th>
                      <th className="p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.lines.map((line: any) => (
                      <tr key={line.id} className="border-t">
                        <td className="p-2">{line.planned_date}</td>
                        <td className="p-2">{line.account?.code} - {line.account?.name}</td>
                        <td className="p-2">{line.description}</td>
                        <td className="p-2 text-right">${line.amount_usd.toFixed(2)}</td>
                        <td className="p-2 text-center capitalize">{line.status}</td>
                      </tr>
                    ))}
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
