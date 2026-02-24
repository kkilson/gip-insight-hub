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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceExpenses, useSaveExpense, useDeleteExpense, type FinanceExpense } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CreatableCombobox } from './CreatableCombobox';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;
const formatVES = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

export function ExpensesTab() {
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceExpense | null>(null);

  const { data: expenses, isLoading } = useFinanceExpenses(monthFilter);
  const { data: allExpenses } = useFinanceExpenses();
  const saveExpense = useSaveExpense();
  const deleteExpense = useDeleteExpense();

  const descriptionOptions = [...new Set(allExpenses?.map(e => e.description) || [])].sort();

  const [form, setForm] = useState({ expense_date: '', description: '', amount_usd: 0, amount_ves: 0, exchange_rate: null as number | null, is_paid: true, notes: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ expense_date: format(new Date(), 'yyyy-MM-dd'), description: '', amount_usd: 0, amount_ves: 0, exchange_rate: null, is_paid: true, notes: '' });
    setFormOpen(true);
  };

  const openEdit = (item: FinanceExpense) => {
    setEditing(item);
    setForm({ expense_date: item.expense_date, description: item.description, amount_usd: item.amount_usd, amount_ves: item.amount_ves, exchange_rate: item.exchange_rate, is_paid: item.is_paid, notes: item.notes || '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const month = form.expense_date.substring(0, 7);
    await saveExpense.mutateAsync({
      ...(editing ? { id: editing.id } : {}),
      expense_date: form.expense_date, month, description: form.description,
      amount_usd: form.amount_usd, amount_ves: form.amount_ves,
      exchange_rate: form.exchange_rate, is_paid: form.is_paid, notes: form.notes || null,
    });
    setFormOpen(false);
  };

  const totalUSD = expenses?.reduce((s, e) => s + e.amount_usd, 0) || 0;
  const totalVES = expenses?.reduce((s, e) => s + e.amount_ves, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-[200px]" />
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nuevo Egreso</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total USD</p><p className="text-2xl font-bold text-red-600">{formatUSD(totalUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total VES</p><p className="text-2xl font-bold text-red-600">{formatVES(totalVES)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Egresos - {monthFilter}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : expenses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay egresos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                  <TableHead className="text-right">VES</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.expense_date), 'dd/MM/yyyy')}</TableCell>
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
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar egreso?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteExpense.mutate(item.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Egreso' : 'Nuevo Egreso'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha *</Label><Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div>
              <Label>Descripción / Concepto *</Label>
              <CreatableCombobox
                value={form.description}
                onChange={v => setForm({ ...form, description: v })}
                options={descriptionOptions}
                placeholder="Escribir o seleccionar concepto..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monto USD</Label><Input type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm({ ...form, amount_usd: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Monto VES</Label><Input type="number" step="0.01" value={form.amount_ves || ''} onChange={e => setForm({ ...form, amount_ves: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_paid} onCheckedChange={v => setForm({ ...form, is_paid: v })} />
              <Label>Pagado</Label>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveExpense.isPending || !form.description || !form.expense_date}>
              {saveExpense.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
