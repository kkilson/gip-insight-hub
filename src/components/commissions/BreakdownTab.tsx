import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FileDown, Printer, Loader2, Trash2, Check, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionBatches, useDeleteAssignmentsBulk, useUpdateEntry, useUpdateAssignment } from '@/hooks/useCommissions';
import { useBrokerSettings } from '@/hooks/useBrokerSettings';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { generateBreakdownPdf } from './generateBreakdownPdf';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BreakdownEntry {
  assignment_id: string;
  entry_id: string;
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

// Inline editable cell component
function EditableCell({
  value,
  suffix,
  prefix,
  isEditing,
  onStartEdit,
  onChange,
  type = 'number',
  className = '',
}: {
  value: number | string;
  suffix?: string;
  prefix?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (val: string) => void;
  type?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-24 text-sm px-1"
        step="any"
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors ${className}`}
      onDoubleClick={onStartEdit}
      title="Doble clic para editar"
    >
      {prefix}{typeof value === 'number' ? value.toLocaleString('es', { minimumFractionDigits: 2 }) : value}{suffix}
    </span>
  );
}

export function BreakdownTab() {
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { data: batches } = useCommissionBatches();
  const { settings: brokerSettings } = useBrokerSettings();
  const assignedBatches = useMemo(() => batches?.filter(b => b.status === 'asignado') || [], [batches]);
  const deleteAssignments = useDeleteAssignmentsBulk();
  const updateEntry = useUpdateEntry();
  const updateAssignment = useUpdateAssignment();

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

  const selectedBatchData = useMemo(() => {
    if (batchFilter !== 'all') return assignedBatches.find(b => b.id === batchFilter);
    return assignedBatches[0];
  }, [batchFilter, assignedBatches]);
  const currencySymbol = selectedBatchData?.currency === 'BS' ? 'Bs.' : '$';

  const { data: breakdownData, isLoading } = useQuery({
    queryKey: ['commission-breakdown', batchIds, advisorFilter],
    enabled: batchIds.length > 0,
    queryFn: async () => {
      const { data: entries } = await supabase
        .from('commission_entries')
        .select('*, insurer:insurers(name), batch:commission_batches(batch_date,currency)')
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
          entry_id: a.entry_id,
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

  const startEdit = (id: string, field: string, currentValue: number) => {
    setEditingCell({ id, field });
    setEditValues({ [field]: String(currentValue) });
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValues({});
  };

  const saveEdit = async (entry: BreakdownEntry) => {
    if (!editingCell) return;
    const { field } = editingCell;
    const newVal = parseFloat(editValues[field] || '0');

    if (isNaN(newVal) || newVal < 0) {
      toast.error('Valor inválido');
      cancelEdit();
      return;
    }

    try {
      if (field === 'premium' || field === 'commission_rate') {
        // Update the commission_entry
        const updates: any = {};
        const premium = field === 'premium' ? newVal : entry.premium;
        const rate = field === 'commission_rate' ? newVal : entry.commission_rate;
        updates[field] = newVal;
        updates.commission_amount = premium * (rate / 100);
        
        await updateEntry.mutateAsync({ id: entry.entry_id, ...updates });
        
        // Also update the assignment amount based on new commission
        const newCommission = premium * (rate / 100);
        const newAssignmentAmount = newCommission * (entry.advisor_percentage / 100);
        await updateAssignment.mutateAsync({
          id: entry.assignment_id,
          amount: newAssignmentAmount,
        });
      } else if (field === 'advisor_percentage') {
        const newAmount = entry.commission_amount * (newVal / 100);
        await updateAssignment.mutateAsync({
          id: entry.assignment_id,
          percentage: newVal,
          amount: newAmount,
        });
      } else if (field === 'advisor_amount') {
        await updateAssignment.mutateAsync({
          id: entry.assignment_id,
          amount: newVal,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['commission-breakdown'] });
      toast.success('Actualizado correctamente');
    } catch (err: any) {
      toast.error('Error al actualizar: ' + err.message);
    }

    cancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent, entry: BreakdownEntry) => {
    if (e.key === 'Enter') saveEdit(entry);
    if (e.key === 'Escape') cancelEdit();
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

  const handlePrint = () => {
    if (!breakdownData || breakdownData.length === 0) return;
    for (const advisor of breakdownData) {
      generateBreakdownPdf(advisor, currencySymbol, brokerSettings);
    }
  };

  const isEditingRow = (assignmentId: string, field: string) =>
    editingCell?.id === assignmentId && editingCell?.field === field;

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

      {/* Hint */}
      {breakdownData && breakdownData.length > 0 && !editingCell && (
        <p className="text-xs text-muted-foreground">
          💡 Doble clic en cualquier celda numérica para editarla en línea
        </p>
      )}

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
                    Total: {currencySymbol}{advisor.total.toLocaleString('es', { minimumFractionDigits: 2 })}
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
                      {editingCell && <TableHead className="w-20"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisor.entries.map((e) => {
                      const isRowEditing = editingCell?.id === e.assignment_id;
                      return (
                        <TableRow key={e.assignment_id} className={isRowEditing ? 'bg-muted/30' : ''} onKeyDown={(ev) => handleKeyDown(ev, e)}>
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
                          <TableCell className="text-sm">
                            <EditableCell
                              value={e.premium}
                              prefix={currencySymbol}
                              isEditing={isEditingRow(e.assignment_id, 'premium')}
                              onStartEdit={() => startEdit(e.assignment_id, 'premium', e.premium)}
                              onChange={(v) => setEditValues(prev => ({ ...prev, premium: v }))}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            <EditableCell
                              value={e.commission_rate}
                              suffix="%"
                              isEditing={isEditingRow(e.assignment_id, 'commission_rate')}
                              onStartEdit={() => startEdit(e.assignment_id, 'commission_rate', e.commission_rate)}
                              onChange={(v) => setEditValues(prev => ({ ...prev, commission_rate: v }))}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            {currencySymbol}{e.commission_amount.toLocaleString('es', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-sm">
                            <EditableCell
                              value={e.advisor_percentage}
                              suffix="%"
                              isEditing={isEditingRow(e.assignment_id, 'advisor_percentage')}
                              onStartEdit={() => startEdit(e.assignment_id, 'advisor_percentage', e.advisor_percentage)}
                              onChange={(v) => setEditValues(prev => ({ ...prev, advisor_percentage: v }))}
                              className="font-medium"
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            <EditableCell
                              value={e.advisor_amount}
                              prefix={currencySymbol}
                              isEditing={isEditingRow(e.assignment_id, 'advisor_amount')}
                              onStartEdit={() => startEdit(e.assignment_id, 'advisor_amount', e.advisor_amount)}
                              onChange={(v) => setEditValues(prev => ({ ...prev, advisor_amount: v }))}
                              className="font-bold"
                            />
                          </TableCell>
                          {editingCell && (
                            <TableCell>
                              {isRowEditing && (
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(e)}>
                                    <Check className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
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
