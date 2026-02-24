import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePayables } from '@/hooks/useFinances';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { FinanceBulkImportWizard } from './import/FinanceBulkImportWizard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;

export function PayablesTab() {
  const [importOpen, setImportOpen] = useState(false);
  const { data: payables, isLoading } = usePayables();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const bulk = useBulkSelection(payables);

  const totalUSD = payables?.reduce((s, p) => s + p.amount_usd, 0) || 0;
  const overdue = payables?.filter(p => p.status === 'vencido' || (p.planned_date && isPast(new Date(p.planned_date)))) || [];

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from('budget_lines').delete().in('id', ids);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    queryClient.invalidateQueries({ queryKey: ['payables'] });
    toast({ title: `${ids.length} partida(s) eliminada(s)` });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" />Importar</Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total por Pagar</p><p className="text-2xl font-bold text-orange-600">{formatUSD(totalUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Vencidos</p><p className="text-2xl font-bold text-red-600">{overdue.length} partida{overdue.length !== 1 ? 's' : ''}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cuentas por Pagar (Presupuestos Pendientes)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : !payables?.length ? (
            <div className="text-center py-8 text-muted-foreground">No hay pagos pendientes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} /></TableHead>
                  <TableHead>Presupuesto</TableHead><TableHead>Categoría</TableHead><TableHead>Descripción</TableHead>
                  <TableHead>Fecha Planificada</TableHead><TableHead className="text-right">Monto USD</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Recordatorio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map(item => {
                  const isOverdue = item.planned_date && isPast(new Date(item.planned_date));
                  return (
                    <TableRow key={item.id} className={`${isOverdue ? 'bg-red-50/50' : ''} ${bulk.isSelected(item.id) ? 'bg-muted/50' : ''}`}>
                      <TableCell><Checkbox checked={bulk.isSelected(item.id)} onCheckedChange={() => bulk.toggle(item.id)} /></TableCell>
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
                      <TableCell><Badge variant={item.status === 'vencido' ? 'destructive' : 'secondary'} className="capitalize">{item.status}</Badge></TableCell>
                      <TableCell className="text-xs">{item.reminder_date || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clearSelection}
        actions={[{
          label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive', confirm: true,
          confirmTitle: '¿Eliminar partidas seleccionadas?',
          onClick: () => { handleBulkDelete(Array.from(bulk.selectedIds)); bulk.clearSelection(); },
        }]}
      />

      <FinanceBulkImportWizard open={importOpen} onOpenChange={setImportOpen} module="payables" />
    </div>
  );
}
