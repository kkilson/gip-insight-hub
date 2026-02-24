import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFinanceIncome, useSaveIncome, useDeleteIncome, useActiveBanks, useSaveBank, type FinanceIncome } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;
const formatVES = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

export function IncomeTab() {
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceIncome | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  const { data: income, isLoading } = useFinanceIncome(monthFilter);
  const { data: banks } = useActiveBanks();
  const saveIncome = useSaveIncome();
  const deleteIncome = useDeleteIncome();
  const saveBank = useSaveBank();

  const [form, setForm] = useState({ income_date: '', description: '', amount_usd: 0, amount_ves: 0, exchange_rate: null as number | null, bank_id: '' as string, notes: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ income_date: format(new Date(), 'yyyy-MM-dd'), description: '', amount_usd: 0, amount_ves: 0, exchange_rate: null, bank_id: '', notes: '' });
    setFormOpen(true);
  };

  const openEdit = (item: FinanceIncome) => {
    setEditing(item);
    setForm({ income_date: item.income_date, description: item.description, amount_usd: item.amount_usd, amount_ves: item.amount_ves, exchange_rate: item.exchange_rate, bank_id: item.bank_id || '', notes: item.notes || '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const month = form.income_date.substring(0, 7);
    await saveIncome.mutateAsync({
      ...(editing ? { id: editing.id } : {}),
      income_date: form.income_date, month, description: form.description,
      amount_usd: form.amount_usd, amount_ves: form.amount_ves,
      exchange_rate: form.exchange_rate, bank_id: form.bank_id || null, notes: form.notes || null,
    });
    setFormOpen(false);
  };

  const totalUSD = income?.reduce((s, i) => s + i.amount_usd, 0) || 0;
  const totalVES = income?.reduce((s, i) => s + i.amount_ves, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-[200px]" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBankDialogOpen(true)}>Gestionar Bancos</Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nuevo Ingreso</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total USD</p><p className="text-2xl font-bold text-green-600">{formatUSD(totalUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total VES</p><p className="text-2xl font-bold text-green-600">{formatVES(totalVES)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ingresos - {monthFilter}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : income?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay ingresos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                  <TableHead className="text-right">VES</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {income?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.income_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatUSD(item.amount_usd)}</TableCell>
                    <TableCell className="text-right font-mono">{formatVES(item.amount_ves)}</TableCell>
                    <TableCell>{item.bank?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar ingreso?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteIncome.mutate(item.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
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

      {/* Income Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Ingreso' : 'Nuevo Ingreso'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha *</Label><Input type="date" value={form.income_date} onChange={e => setForm({ ...form, income_date: e.target.value })} /></div>
            <div><Label>Descripción *</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Concepto del ingreso" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Monto USD</Label><Input type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm({ ...form, amount_usd: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Monto VES</Label><Input type="number" step="0.01" value={form.amount_ves || ''} onChange={e => setForm({ ...form, amount_ves: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Tasa de cambio (opcional)</Label><Input type="number" step="0.01" value={form.exchange_rate || ''} onChange={e => setForm({ ...form, exchange_rate: parseFloat(e.target.value) || null })} /></div>
            <div><Label>Banco</Label>
              <Select value={form.bank_id} onValueChange={v => setForm({ ...form, bank_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin banco</SelectItem>
                  {banks?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveIncome.isPending || !form.description || !form.income_date}>
              {saveIncome.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banks Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gestionar Bancos</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="Nombre del banco" />
              <Button onClick={async () => { if (newBankName) { await saveBank.mutateAsync({ name: newBankName }); setNewBankName(''); } }} disabled={!newBankName}>Agregar</Button>
            </div>
            <div className="space-y-2">
              {banks?.map(b => (
                <div key={b.id} className="flex justify-between items-center p-2 border rounded">
                  <span>{b.name}</span>
                </div>
              ))}
              {(!banks || banks.length === 0) && <p className="text-muted-foreground text-sm">No hay bancos registrados</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
