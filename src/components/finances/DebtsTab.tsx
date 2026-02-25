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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceDebts, useSaveDebt, useDeleteDebt, type FinanceDebt } from '@/hooks/useFinanceDebtsLoans';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreatableCombobox } from './CreatableCombobox';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;
const formatVES = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

export function DebtsTab() {
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceDebt | null>(null);

  const { data: rawDebts, isLoading } = useFinanceDebts(showPendingOnly ? undefined : monthFilter);
  const { data: allDebts } = useFinanceDebts();

  const debts = showPendingOnly ? rawDebts?.filter(d => !d.is_paid) : rawDebts;
  const saveDebt = useSaveDebt();
  const deleteDebt = useDeleteDebt();
  const bulk = useBulkSelection(debts);

  const beneficiaryOptions = [...new Set(allDebts?.map(d => d.beneficiary).filter(Boolean) as string[] || [])].sort();
  const descriptionOptions = [...new Set(allDebts?.map(d => d.description) || [])].sort();

  const [form, setForm] = useState({ debt_date: '', beneficiary: '', description: '', amount_usd: 0, amount_ves: 0, is_paid: false, notes: '' });

  const openNew = () => { setEditing(null); setForm({ debt_date: format(new Date(), 'yyyy-MM-dd'), beneficiary: '', description: '', amount_usd: 0, amount_ves: 0, is_paid: false, notes: '' }); setFormOpen(true); };
  const openEdit = (item: FinanceDebt) => { setEditing(item); setForm({ debt_date: item.debt_date, beneficiary: item.beneficiary, description: item.description, amount_usd: item.amount_usd, amount_ves: item.amount_ves, is_paid: item.is_paid, notes: item.notes || '' }); setFormOpen(true); };

  const handleSave = async () => {
    const month = form.debt_date.substring(0, 7);
    await saveDebt.mutateAsync({ ...(editing ? { id: editing.id } : {}), debt_date: form.debt_date, month, beneficiary: form.beneficiary, description: form.description, amount_usd: form.amount_usd, amount_ves: form.amount_ves, is_paid: form.is_paid, notes: form.notes || null });
    setFormOpen(false);
  };

  const unpaidDebts = debts?.filter(d => !d.is_paid) || [];
  const totalUnpaidUSD = unpaidDebts.reduce((s, d) => s + d.amount_usd, 0);
  const totalUnpaidVES = unpaidDebts.reduce((s, d) => s + d.amount_ves, 0);
  const totalUSD = debts?.reduce((s, d) => s + d.amount_usd, 0) || 0;
  const totalVES = debts?.reduce((s, d) => s + d.amount_ves, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Input type="month" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setShowPendingOnly(false); }} className="w-[200px]" disabled={showPendingOnly} />
          <Button variant={showPendingOnly ? 'default' : 'outline'} onClick={() => setShowPendingOnly(!showPendingOnly)} className="whitespace-nowrap">
            {showPendingOnly ? 'Ver por mes' : 'Todas pendientes'}
          </Button>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nueva Deuda</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total USD</p><p className="text-2xl font-bold">{formatUSD(totalUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total VES</p><p className="text-2xl font-bold">{formatVES(totalVES)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendiente USD</p><p className="text-2xl font-bold text-red-600">{formatUSD(totalUnpaidUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendiente VES</p><p className="text-2xl font-bold text-red-600">{formatVES(totalUnpaidVES)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Deudas / Compromisos {showPendingOnly ? '- Todas pendientes' : `- ${monthFilter}`}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : debts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay deudas registradas</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} /></TableHead>
                  <TableHead>Fecha</TableHead><TableHead>Beneficiario</TableHead><TableHead>Descripción</TableHead>
                  <TableHead className="text-right">USD</TableHead><TableHead className="text-right">VES</TableHead>
                  <TableHead>Pagado</TableHead><TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts?.map(item => (
                  <TableRow key={item.id} className={bulk.isSelected(item.id) ? 'bg-muted/50' : ''}>
                    <TableCell><Checkbox checked={bulk.isSelected(item.id)} onCheckedChange={() => bulk.toggle(item.id)} /></TableCell>
                    <TableCell>{format(new Date(item.debt_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.beneficiary}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(item.amount_usd)}</TableCell>
                    <TableCell className="text-right font-mono">{formatVES(item.amount_ves)}</TableCell>
                    <TableCell><Badge variant={item.is_paid ? 'default' : 'destructive'}>{item.is_paid ? 'Sí' : 'No'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteDebt.mutate(item.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
          label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive', confirm: true,
          confirmTitle: '¿Eliminar deudas seleccionadas?',
          onClick: () => { bulk.selectedIds.forEach(id => deleteDebt.mutate(id)); bulk.clearSelection(); },
        }]}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Deuda' : 'Nueva Deuda'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha estimada de pago *</Label><Input type="date" value={form.debt_date} onChange={e => setForm({ ...form, debt_date: e.target.value })} /></div>
            <div><Label>Beneficiario (a quién le debo) *</Label><CreatableCombobox value={form.beneficiary} onChange={v => setForm({ ...form, beneficiary: v })} options={beneficiaryOptions} placeholder="Escribir o seleccionar beneficiario..." /></div>
            <div><Label>Descripción *</Label><CreatableCombobox value={form.description} onChange={v => setForm({ ...form, description: v })} options={descriptionOptions} placeholder="Escribir o seleccionar concepto..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monto USD</Label><Input type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm({ ...form, amount_usd: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Monto VES</Label><Input type="number" step="0.01" value={form.amount_ves || ''} onChange={e => setForm({ ...form, amount_ves: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_paid} onCheckedChange={v => setForm({ ...form, is_paid: v })} /><Label>Pagado</Label></div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveDebt.isPending || !form.description || !form.debt_date || !form.beneficiary}>{saveDebt.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
