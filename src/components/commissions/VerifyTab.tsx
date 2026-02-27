import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCommissionBatches, useCommissionEntries, useUpdateEntry, useUpdateBatchStatus } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';

export function VerifyTab() {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const { data: batches } = useCommissionBatches();
  const { data: entries, isLoading } = useCommissionEntries(selectedBatch || null);
  const updateEntry = useUpdateEntry();
  const updateBatchStatus = useUpdateBatchStatus();
  const { toast } = useToast();

  const pendingBatches = useMemo(() => batches?.filter(b => b.status === 'pendiente') || [], [batches]);

  const selectedBatchData = useMemo(() => batches?.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const currencySymbol = selectedBatchData?.currency === 'BS' ? 'Bs.' : '$';

  const detectDiscrepancy = (premium: number, rate: number, amount: number) => {
    const expected = premium * rate / 100;
    return Math.abs(expected - amount) > 0.01;
  };

  const toggleVerified = (entry: any) => {
    updateEntry.mutate({ id: entry.id, is_verified: !entry.is_verified });
  };

  const markDiscrepancy = (entry: any) => {
    const hasDisc = detectDiscrepancy(Number(entry.premium), Number(entry.commission_rate), Number(entry.commission_amount));
    updateEntry.mutate({
      id: entry.id,
      has_discrepancy: hasDisc,
      discrepancy_note: hasDisc ? `Esperado: ${currencySymbol}${(Number(entry.premium) * Number(entry.commission_rate) / 100).toFixed(2)}, Recibido: ${currencySymbol}${Number(entry.commission_amount).toFixed(2)}` : null,
    });
  };

  const markBatchVerified = () => {
    if (!entries?.every(e => e.is_verified)) {
      toast({ title: 'Verifica todas las entradas primero', variant: 'destructive' });
      return;
    }
    updateBatchStatus.mutate({ id: selectedBatch, status: 'verificado' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[350px]"><SelectValue placeholder="Seleccionar lote pendiente..." /></SelectTrigger>
          <SelectContent>
            {pendingBatches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {(b.insurer as any)?.name} — {b.batch_date} (${Number(b.total_commission).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBatch && entries && entries.length > 0 && (
          <Button onClick={markBatchVerified} disabled={updateBatchStatus.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Marcar como Verificado
          </Button>
        )}
      </div>

      {!selectedBatch ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona un lote pendiente para verificar sus datos.</CardContent></Card>
      ) : isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : entries && entries.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">✓</TableHead>
                  <TableHead>Póliza</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Prima</TableHead>
                  <TableHead>% Com.</TableHead>
                  <TableHead>Monto Com.</TableHead>
                  <TableHead>Discrepancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => {
                  const hasDisc = detectDiscrepancy(Number(entry.premium), Number(entry.commission_rate), Number(entry.commission_amount));
                  return (
                    <TableRow key={entry.id} className={hasDisc ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <Checkbox checked={entry.is_verified} onCheckedChange={() => toggleVerified(entry)} />
                      </TableCell>
                      <TableCell className="text-sm font-mono">{entry.policy_number || '—'}</TableCell>
                      <TableCell className="text-sm">{entry.client_name}</TableCell>
                      <TableCell className="text-sm">{entry.plan_type || '—'}</TableCell>
                      <TableCell className="text-sm">{currencySymbol}{Number(entry.premium).toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm">{Number(entry.commission_rate)}%</TableCell>
                      <TableCell className="text-sm font-semibold">{currencySymbol}{Number(entry.commission_amount).toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {hasDisc ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive">
                              Esperado: {currencySymbol}{(Number(entry.premium) * Number(entry.commission_rate) / 100).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">Este lote no tiene entradas.</CardContent></Card>
      )}
    </div>
  );
}
