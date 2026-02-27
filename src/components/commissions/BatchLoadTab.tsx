import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Upload, Trash2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionBatches, useSaveBatch, useSaveEntries, useDeleteBatch } from '@/hooks/useCommissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  verificado: { label: 'Verificado', variant: 'default' },
  asignado: { label: 'Asignado', variant: 'outline' },
};

interface ManualEntry {
  policy_number: string;
  client_name: string;
  plan_type: string;
  premium: string;
  commission_rate: string;
  commission_amount: string;
}

const emptyEntry: ManualEntry = { policy_number: '', client_name: '', plan_type: '', premium: '', commission_rate: '', commission_amount: '' };

export function BatchLoadTab() {
  const [showNew, setShowNew] = useState(false);
  const [insurerId, setInsurerId] = useState('');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([{ ...emptyEntry }]);
  const [loadMode, setLoadMode] = useState<'manual' | 'excel'>('manual');

  const { data: batches, isLoading } = useCommissionBatches();
  const { data: insurers } = useQuery({
    queryKey: ['insurers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('insurers').select('id, name').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const saveBatch = useSaveBatch();
  const saveEntries = useSaveEntries();
  const deleteBatch = useDeleteBatch();
  const { toast } = useToast();

  const addRow = () => setManualEntries(prev => [...prev, { ...emptyEntry }]);
  const removeRow = (i: number) => setManualEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof ManualEntry, value: string) => {
    setManualEntries(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      // Auto-calc commission_amount
      if (field === 'premium' || field === 'commission_rate') {
        const premium = parseFloat(field === 'premium' ? value : copy[i].premium) || 0;
        const rate = parseFloat(field === 'commission_rate' ? value : copy[i].commission_rate) || 0;
        copy[i].commission_amount = (premium * rate / 100).toFixed(2);
      }
      return copy;
    });
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        const entries: ManualEntry[] = rows.map(r => {
          const premium = parseFloat(r['Prima'] || r['premium'] || r['PRIMA'] || 0);
          const rate = parseFloat(r['% Comisión'] || r['commission_rate'] || r['COMISION %'] || 0);
          return {
            policy_number: String(r['Póliza'] || r['policy_number'] || r['POLIZA'] || ''),
            client_name: String(r['Cliente'] || r['client_name'] || r['CLIENTE'] || ''),
            plan_type: String(r['Plan'] || r['plan_type'] || r['PLAN'] || ''),
            premium: String(premium),
            commission_rate: String(rate),
            commission_amount: (premium * rate / 100).toFixed(2),
          };
        });
        setManualEntries(entries.length > 0 ? entries : [{ ...emptyEntry }]);
        toast({ title: `${entries.length} registros cargados del Excel` });
      } catch {
        toast({ title: 'Error leyendo Excel', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCreate = async () => {
    if (!insurerId) { toast({ title: 'Selecciona una aseguradora', variant: 'destructive' }); return; }
    const validEntries = manualEntries.filter(e => e.client_name && parseFloat(e.premium) > 0);
    if (validEntries.length === 0) { toast({ title: 'Agrega al menos una entrada válida', variant: 'destructive' }); return; }

    try {
      const batch = await saveBatch.mutateAsync({ insurer_id: insurerId, batch_date: batchDate, currency, notes: notes || undefined });
      await saveEntries.mutateAsync(validEntries.map(e => ({
        batch_id: batch.id,
        policy_number: e.policy_number || undefined,
        client_name: e.client_name,
        insurer_id: insurerId,
        plan_type: e.plan_type || undefined,
        premium: parseFloat(e.premium),
        commission_rate: parseFloat(e.commission_rate) || 0,
        commission_amount: parseFloat(e.commission_amount) || 0,
      })));
      setShowNew(false);
      setManualEntries([{ ...emptyEntry }]);
      setNotes('');
    } catch { /* handled by mutation */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Lotes de Comisiones</h2>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Nuevo Lote</Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : batches && batches.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Prima Total</TableHead>
                  <TableHead>Comisión Total</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map(b => {
                  const st = statusLabels[b.status] || statusLabels.pendiente;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm">{format(new Date(b.batch_date), 'dd MMM yyyy', { locale: es })}</TableCell>
                      <TableCell className="text-sm font-medium">{(b.insurer as any)?.name || '—'}</TableCell>
                      <TableCell className="text-sm">${Number(b.total_premium).toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm font-semibold">${Number(b.total_commission).toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm">{b.currency}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        {b.status === 'pendiente' && (
                          <Button variant="ghost" size="icon" onClick={() => deleteBatch.mutate(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="flex flex-col items-center py-12 text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Sin lotes</h3>
          <p className="text-muted-foreground">Crea tu primer lote de comisiones.</p>
          <Button className="mt-4" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" />Nuevo Lote</Button>
        </CardContent></Card>
      )}

      {/* New Batch Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargar Nuevo Lote de Comisiones</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Aseguradora</Label>
              <Select value={insurerId} onValueChange={setInsurerId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {insurers?.map(ins => <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha del Lote</Label>
              <Input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'BS', 'COP'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo de carga</Label>
              <Select value={loadMode} onValueChange={(v: any) => setLoadMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadMode === 'excel' && (
            <div className="space-y-2">
              <Label>Archivo Excel</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Columnas esperadas: Póliza, Cliente, Plan, Prima, % Comisión</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Pólizas / Entradas</Label>
              <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Fila</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Póliza</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[100px]">Plan</TableHead>
                    <TableHead className="min-w-[100px]">Prima</TableHead>
                    <TableHead className="min-w-[80px]">% Com.</TableHead>
                    <TableHead className="min-w-[100px]">Monto Com.</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualEntries.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell><Input value={entry.policy_number} onChange={e => updateRow(i, 'policy_number', e.target.value)} placeholder="POL-001" /></TableCell>
                      <TableCell><Input value={entry.client_name} onChange={e => updateRow(i, 'client_name', e.target.value)} placeholder="Nombre cliente" /></TableCell>
                      <TableCell><Input value={entry.plan_type} onChange={e => updateRow(i, 'plan_type', e.target.value)} placeholder="Vida, Salud..." /></TableCell>
                      <TableCell><Input type="number" value={entry.premium} onChange={e => updateRow(i, 'premium', e.target.value)} placeholder="0.00" /></TableCell>
                      <TableCell><Input type="number" value={entry.commission_rate} onChange={e => updateRow(i, 'commission_rate', e.target.value)} placeholder="0" /></TableCell>
                      <TableCell><Input value={entry.commission_amount} readOnly className="bg-muted" /></TableCell>
                      <TableCell>
                        {manualEntries.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeRow(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones del lote..." />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saveBatch.isPending || saveEntries.isPending}>
              {(saveBatch.isPending || saveEntries.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
