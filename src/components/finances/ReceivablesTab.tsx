import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { useFinanceReceivables, useSaveReceivable, useFinanceInvoices, type FinanceReceivable } from '@/hooks/useFinances';
import { FinanceBulkImportWizard } from './import/FinanceBulkImportWizard';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Skeleton } from '@/components/ui/skeleton';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;
const formatVES = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

export function ReceivablesTab() {
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showCollected, setShowCollected] = useState(false);

  const { data: receivables, isLoading } = useFinanceReceivables();
  const { data: invoices } = useFinanceInvoices();
  const saveReceivable = useSaveReceivable();

  const [form, setForm] = useState({ description: '', amount_usd: 0, amount_ves: 0, due_date: '', notes: '' });

  const uncollectedInvoices = invoices?.filter(i => !i.is_collected).map(i => ({
    id: `inv-${i.id}`, source: 'invoice' as const, invoice_id: i.id,
    description: `Factura ${i.invoice_number}: ${i.description}`,
    amount_usd: i.total_usd - (i.total_usd / 100), amount_ves: i.total_ves - (i.total_ves / 100),
    due_date: null, is_collected: false, collected_at: null, notes: null,
    created_by: null, created_at: i.created_at, updated_at: i.updated_at,
  })) || [];

  const allReceivables = [...(receivables || []), ...uncollectedInvoices];
  const filtered = showCollected ? allReceivables : allReceivables.filter(r => !r.is_collected);
  const bulk = useBulkSelection(filtered as any);

  const totalPendingUSD = filtered.filter(r => !r.is_collected).reduce((s, r) => s + r.amount_usd, 0);
  const totalPendingVES = filtered.filter(r => !r.is_collected).reduce((s, r) => s + r.amount_ves, 0);

  const handleSave = async () => {
    await saveReceivable.mutateAsync({ description: form.description, amount_usd: form.amount_usd, amount_ves: form.amount_ves, due_date: form.due_date || null, source: 'manual', notes: form.notes || null });
    setFormOpen(false);
  };

  const markCollected = async (item: FinanceReceivable) => {
    await saveReceivable.mutateAsync({ id: item.id, is_collected: true, description: item.description, amount_usd: item.amount_usd, amount_ves: item.amount_ves });
  };

  const bulkMarkCollected = () => {
    const manualItems = bulk.selectedItems.filter((item: any) => item.source === 'manual' && !item.is_collected);
    manualItems.forEach((item: any) => {
      saveReceivable.mutate({ id: item.id, is_collected: true, description: item.description, amount_usd: item.amount_usd, amount_ves: item.amount_ves });
    });
    bulk.clearSelection();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={showCollected} onChange={e => setShowCollected(e.target.checked)} id="show-collected" />
          <label htmlFor="show-collected" className="text-sm">Mostrar cobradas</label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" />Importar</Button>
          <Button onClick={() => { setForm({ description: '', amount_usd: 0, amount_ves: 0, due_date: '', notes: '' }); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Nueva Cuenta por Cobrar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendiente USD</p><p className="text-2xl font-bold text-blue-600">{formatUSD(totalPendingUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendiente VES</p><p className="text-2xl font-bold text-blue-600">{formatVES(totalPendingVES)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cuentas por Cobrar</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay cuentas por cobrar</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} /></TableHead>
                  <TableHead>Origen</TableHead><TableHead>Descripción</TableHead>
                  <TableHead className="text-right">USD</TableHead><TableHead className="text-right">VES</TableHead>
                  <TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead><TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id} className={bulk.isSelected(item.id) ? 'bg-muted/50' : ''}>
                    <TableCell><Checkbox checked={bulk.isSelected(item.id)} onCheckedChange={() => bulk.toggle(item.id)} /></TableCell>
                    <TableCell><Badge variant="outline">{item.source === 'invoice' ? 'Factura' : 'Manual'}</Badge></TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(item.amount_usd)}</TableCell>
                    <TableCell className="text-right font-mono">{formatVES(item.amount_ves)}</TableCell>
                    <TableCell>{item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell><Badge variant={item.is_collected ? 'default' : 'secondary'}>{item.is_collected ? 'Cobrada' : 'Pendiente'}</Badge></TableCell>
                    <TableCell>
                      {!item.is_collected && item.source === 'manual' && (
                        <Button variant="ghost" size="icon" onClick={() => markCollected(item as FinanceReceivable)} title="Marcar como cobrada">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clearSelection}
        actions={[{
          label: 'Marcar como cobradas', icon: <CheckCircle className="h-4 w-4" />, variant: 'default', confirm: true,
          confirmTitle: '¿Marcar como cobradas?',
          confirmDescription: `Se marcarán las cuentas manuales seleccionadas como cobradas.`,
          onClick: bulkMarkCollected,
        }]}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Cuenta por Cobrar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Descripción *</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Deuda pendiente" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monto USD</Label><Input type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm({ ...form, amount_usd: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Monto VES</Label><Input type="number" step="0.01" value={form.amount_ves || ''} onChange={e => setForm({ ...form, amount_ves: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Fecha de vencimiento</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveReceivable.isPending || !form.description}>{saveReceivable.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FinanceBulkImportWizard open={importOpen} onOpenChange={setImportOpen} module="receivables" />
    </div>
  );
}
