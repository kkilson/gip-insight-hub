import { format, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePayables } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;

export function PayablesTab() {
  const { data: payables, isLoading } = usePayables();

  const totalUSD = payables?.reduce((s, p) => s + p.amount_usd, 0) || 0;
  const overdue = payables?.filter(p => p.status === 'vencido' || (p.planned_date && isPast(new Date(p.planned_date)))) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total por Pagar</p>
            <p className="text-2xl font-bold text-orange-600">{formatUSD(totalUSD)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vencidos</p>
            <p className="text-2xl font-bold text-red-600">{overdue.length} partida{overdue.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Pagar (Presupuestos Pendientes)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : !payables?.length ? (
            <div className="text-center py-8 text-muted-foreground">No hay pagos pendientes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha Planificada</TableHead>
                  <TableHead className="text-right">Monto USD</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recordatorio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map(item => {
                  const isOverdue = item.planned_date && isPast(new Date(item.planned_date));
                  return (
                    <TableRow key={item.id} className={isOverdue ? 'bg-red-50/50' : ''}>
                      <TableCell className="font-medium">{(item as any).budget?.name || '-'}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {format(new Date(item.planned_date), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatUSD(item.amount_usd)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'vencido' ? 'destructive' : 'secondary'} className="capitalize">
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.reminder_date || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
