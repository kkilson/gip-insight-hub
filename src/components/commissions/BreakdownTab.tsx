import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDown, Printer, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionBatches, useDeleteAssignmentsBulk } from '@/hooks/useCommissions';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import * as XLSX from 'xlsx';

interface BreakdownEntry {
  assignment_id: string;
  policy_number: string;
  client_name: string;
  plan_type: string;
  premium: number;
  commission_rate: number;
  commission_amount: number;
  advisor_percentage: number;
  advisor_amount: number;
  insurer_name: string;
  batch_date: string;
}

interface BreakdownRow {
  advisor_name: string;
  advisor_id: string;
  entries: BreakdownEntry[];
  total: number;
}

export function BreakdownTab() {
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: batches } = useCommissionBatches();
  const assignedBatches = useMemo(() => batches?.filter(b => b.status === 'asignado') || [], [batches]);
  const deleteAssignments = useDeleteAssignmentsBulk();

  const { data: advisors } = useQuery({
    queryKey: ['advisors-active'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      return data || [];
    },
  });

  const batchIds = useMemo(() => {
    if (batchFilter === 'all') return assignedBatches.map(b => b.id);
    return [batchFilter];
  }, [batchFilter, assignedBatches]);

  const { data: breakdownData, isLoading } = useQuery({
    queryKey: ['commission-breakdown', batchIds, advisorFilter],
    enabled: batchIds.length > 0,
    queryFn: async () => {
      const { data: entries } = await supabase
        .from('commission_entries')
        .select('*, insurer:insurers(name), batch:commission_batches(batch_date)')
        .in('batch_id', batchIds);

      if (!entries || entries.length === 0) return [];

      const entryIds = entries.map(e => e.id);
      const { data: assignments } = await supabase
        .from('commission_assignments')
        .select('*, advisor:advisors(full_name)')
        .in('entry_id', entryIds);

      if (!assignments) return [];

      const byAdvisor: Record<string, BreakdownRow> = {};
      for (const a of assignments) {
        if (advisorFilter !== 'all' && a.advisor_id !== advisorFilter) continue;
        const entry = entries.find(e => e.id === a.entry_id);
        if (!entry) continue;

        if (!byAdvisor[a.advisor_id]) {
          byAdvisor[a.advisor_id] = {
            advisor_name: (a.advisor as any)?.full_name || 'Sin nombre',
            advisor_id: a.advisor_id,
            entries: [],
            total: 0,
          };
        }
        const amount = Number(a.amount);
        byAdvisor[a.advisor_id].entries.push({
          assignment_id: a.id,
          policy_number: entry.policy_number || '—',
          client_name: entry.client_name,
          plan_type: entry.plan_type || '—',
          premium: Number(entry.premium),
          commission_rate: Number(entry.commission_rate),
          commission_amount: Number(entry.commission_amount),
          advisor_percentage: Number(a.percentage),
          advisor_amount: amount,
          insurer_name: (entry.insurer as any)?.name || '—',
          batch_date: (entry.batch as any)?.batch_date || '',
        });
        byAdvisor[a.advisor_id].total += amount;
      }

      return Object.values(byAdvisor).sort((a, b) => b.total - a.total);
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allAssignmentIds = useMemo(() =>
    breakdownData?.flatMap(a => a.entries.map(e => e.assignment_id)) || [],
    [breakdownData]
  );

  const toggleAll = () => {
    if (selectedIds.size === allAssignmentIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allAssignmentIds));
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    deleteAssignments.mutate(ids, { onSuccess: () => setSelectedIds(new Set()) });
  };

  const exportExcel = () => {
    if (!breakdownData) return;
    const rows: any[] = [];
    for (const advisor of breakdownData) {
      for (const e of advisor.entries) {
        rows.push({
          Asesor: advisor.advisor_name,
          Póliza: e.policy_number,
          Cliente: e.client_name,
          Aseguradora: e.insurer_name,
          Plan: e.plan_type,
          Prima: e.premium,
          '% Comisión': e.commission_rate,
          'Comisión Total': e.commission_amount,
          '% Asesor': e.advisor_percentage,
          'Monto Asesor': e.advisor_amount,
        });
      }
      rows.push({ Asesor: `TOTAL ${advisor.advisor_name}`, 'Monto Asesor': advisor.total });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Desglose');
    XLSX.writeFile(wb, `desglose_comisiones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por asesor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los asesores</SelectItem>
            {advisors?.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Filtrar por lote" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los lotes asignados</SelectItem>
            {assignedBatches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {(b.insurer as any)?.name} — {b.batch_date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={exportExcel} disabled={!breakdownData?.length}>
            <FileDown className="h-4 w-4 mr-2" />Excel
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!breakdownData?.length}>
            <Printer className="h-4 w-4 mr-2" />Imprimir
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : breakdownData && breakdownData.length > 0 ? (
        <div className="space-y-6 print:space-y-4" id="breakdown-print">
          {breakdownData.map(advisor => (
            <Card key={advisor.advisor_id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">{advisor.advisor_name}</CardTitle>
                  <span className="text-lg font-bold text-primary">
                    Total: ${advisor.total.toLocaleString('es', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allAssignmentIds.length > 0 && selectedIds.size === allAssignmentIds.length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Aseguradora</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Prima</TableHead>
                      <TableHead>% Com.</TableHead>
                      <TableHead>Com. Total</TableHead>
                      <TableHead>% Asesor</TableHead>
                      <TableHead>Monto Asesor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisor.entries.map((e) => (
                      <TableRow key={e.assignment_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(e.assignment_id)}
                            onCheckedChange={() => toggleSelect(e.assignment_id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-mono">{e.policy_number}</TableCell>
                        <TableCell className="text-sm">{e.client_name}</TableCell>
                        <TableCell className="text-sm">{e.insurer_name}</TableCell>
                        <TableCell className="text-sm">{e.plan_type}</TableCell>
                        <TableCell className="text-sm">${e.premium.toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm">{e.commission_rate}%</TableCell>
                        <TableCell className="text-sm">${e.commission_amount.toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm font-medium">{e.advisor_percentage}%</TableCell>
                        <TableCell className="text-sm font-bold">${e.advisor_amount.toLocaleString('es', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {batchIds.length === 0 ? 'No hay lotes asignados aún.' : 'No se encontraron asignaciones con los filtros seleccionados.'}
        </CardContent></Card>
      )}

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Eliminar asignaciones',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            onClick: handleBulkDelete,
            confirm: true,
            confirmTitle: '¿Eliminar asignaciones seleccionadas?',
            confirmDescription: `Se eliminarán ${selectedIds.size} asignación(es). Esta acción no se puede deshacer.`,
          },
        ]}
      />
    </div>
  );
}
