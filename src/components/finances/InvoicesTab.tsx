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
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useFinanceInvoices, useSaveInvoice, useDeleteInvoice, type FinanceInvoice } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const formatUSD = (n: number) => `$${n.toFixed(2)}`;
const formatVES = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;

// ISLR calculation helpers
const calcISLR = (total: number) => total / 100;
const calcTaxUnits = (islr: number) => islr * 5;
const calcNet = (total: number) => total - calcISLR(total);

export function InvoicesTab() {
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceInvoice | null>(null);

  const { data: invoices, isLoading } = useFinanceInvoices(monthFilter);
  const saveInvoice = useSaveInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [form, setForm] = useState({ invoice_date: '', invoice_number: '', control_number: '', description: '', total_usd: 0, total_ves: 0, is_collected: false, notes: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ invoice_date: format(new Date(), 'yyyy-MM-dd'), invoice_number: '', control_number: '', description: '', total_usd: 0, total_ves: 0, is_collected: false, notes: '' });
    setFormOpen(true);
  };

  const openEdit = (item: FinanceInvoice) => {
    setEditing(item);
    setForm({ invoice_date: item.invoice_date, invoice_number: item.invoice_number, control_number: item.control_number || '', description: item.description, total_usd: item.total_usd, total_ves: item.total_ves, is_collected: item.is_collected, notes: item.notes || '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const month = form.invoice_date.substring(0, 7);
    await saveInvoice.mutateAsync({
      ...(editing ? { id: editing.id } : {}),
      month, invoice_date: form.invoice_date, invoice_number: form.invoice_number,
      control_number: form.control_number || null, description: form.description,
      total_usd: form.total_usd, total_ves: form.total_ves,
      is_collected: form.is_collected, notes: form.notes || null,
    });
    setFormOpen(false);
  };

  const totalFactUSD = invoices?.reduce((s, i) => s + i.total_usd, 0) || 0;
  const totalFactVES = invoices?.reduce((s, i) => s + i.total_ves, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-[200px]" />
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nueva Factura</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Facturado USD</p><p className="text-2xl font-bold">{formatUSD(totalFactUSD)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Facturado VES</p><p className="text-2xl font-bold">{formatVES(totalFactVES)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Facturación - {monthFilter}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : invoices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay facturas registradas</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>N° Factura</TableHead>
                    <TableHead>N° Control</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Total USD</TableHead>
                    <TableHead className="text-right">Total VES</TableHead>
                    <TableHead className="text-right">ISLR USD</TableHead>
                    <TableHead className="text-right">UT</TableHead>
                    <TableHead className="text-right">Neto USD</TableHead>
                    <TableHead>Cobrada</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map(inv => {
                    const islrUSD = calcISLR(inv.total_usd);
                    const tu = calcTaxUnits(islrUSD);
                    const netUSD = calcNet(inv.total_usd);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>{format(new Date(inv.invoice_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                        <TableCell>{inv.control_number || '-'}</TableCell>
                        <TableCell>{inv.description}</TableCell>
                        <TableCell className="text-right font-mono">{formatUSD(inv.total_usd)}</TableCell>
                        <TableCell className="text-right font-mono">{formatVES(inv.total_ves)}</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">{formatUSD(islrUSD)}</TableCell>
                        <TableCell className="text-right font-mono">{tu.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatUSD(netUSD)}</TableCell>
                        <TableCell>
                          <Badge variant={inv.is_collected ? 'default' : 'secondary'}>
                            {inv.is_collected ? 'Sí' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(inv)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteInvoice.mutate(inv.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Factura' : 'Nueva Factura'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha *</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} /></div>
              <div><Label>N° Factura *</Label><Input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></div>
            </div>
            <div><Label>N° Control</Label><Input value={form.control_number} onChange={e => setForm({ ...form, control_number: e.target.value })} /></div>
            <div><Label>Descripción *</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Total USD</Label><Input type="number" step="0.01" value={form.total_usd || ''} onChange={e => setForm({ ...form, total_usd: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Total VES</Label><Input type="number" step="0.01" value={form.total_ves || ''} onChange={e => setForm({ ...form, total_ves: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            
            {form.total_usd > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Retención ISLR (1%):</span><span className="font-mono">{formatUSD(calcISLR(form.total_usd))}</span></div>
                  <div className="flex justify-between"><span>Unidades Tributarias:</span><span className="font-mono">{calcTaxUnits(calcISLR(form.total_usd)).toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Neto a Recibir:</span><span className="font-mono">{formatUSD(calcNet(form.total_usd))}</span></div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_collected} onChange={e => setForm({ ...form, is_collected: e.target.checked })} />
              <Label>Cobrada</Label>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveInvoice.isPending || !form.description || !form.invoice_number || !form.invoice_date}>
              {saveInvoice.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
