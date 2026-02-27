import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Save, Loader2, CheckSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useCommissionBatches, useCommissionEntries, useCommissionRules,
  useCommissionAssignments, useSaveAssignments, useDeleteAssignmentsByEntry,
  useUpdateBatchStatus, CommissionEntry,
} from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';

interface LocalAssignment {
  advisor_id: string;
  percentage: number;
}

export function AssignTab() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [assignments, setAssignments] = useState<Record<string, LocalAssignment[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAdvisor, setBulkAdvisor] = useState('');
  const [bulkPercentage, setBulkPercentage] = useState(0);

  const { data: batches } = useCommissionBatches();
  const { data: entries, isLoading } = useCommissionEntries(selectedBatch || null);
  const { data: rules } = useCommissionRules();
  const entryIds = useMemo(() => entries?.map(e => e.id) || [], [entries]);
  const { data: existingAssignments } = useCommissionAssignments(entryIds);
  const saveAssignments = useSaveAssignments();
  const deleteByEntry = useDeleteAssignmentsByEntry();
  const updateBatchStatus = useUpdateBatchStatus();
  const { toast } = useToast();

  const { data: advisors } = useQuery({
    queryKey: ['advisors-active'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      return data || [];
    },
  });

  const verifiedBatches = useMemo(() => batches?.filter(b => b.status === 'verificado') || [], [batches]);

  const selectedBatchData = useMemo(() => batches?.find(b => b.id === selectedBatch), [batches, selectedBatch]);
  const currencySymbol = selectedBatchData?.currency === 'BS' ? 'Bs.' : '$';

  // Initialize local assignments from existing
  useEffect(() => {
    if (existingAssignments && entries) {
      const map: Record<string, LocalAssignment[]> = {};
      entries.forEach(e => {
        const existing = existingAssignments.filter(a => a.entry_id === e.id);
        map[e.id] = existing.length > 0
          ? existing.map(a => ({ advisor_id: a.advisor_id, percentage: Number(a.percentage) }))
          : [{ advisor_id: '', percentage: 0 }];
      });
      setAssignments(map);
    }
  }, [existingAssignments, entries]);

  // Clear selection when batch changes
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkAdvisor('');
    setBulkPercentage(0);
  }, [selectedBatch]);

  const getSuggestedRate = (insurerId: string | null, planType: string | null, advisorId: string) => {
    if (!rules || !insurerId || !advisorId) return 0;
    const rule = rules.find(r => r.advisor_id === advisorId && r.insurer_id === insurerId && r.plan_type === (planType || 'general'));
    return rule ? Number(rule.commission_percentage) : 0;
  };

  const updateAssignment = (entryId: string, idx: number, field: 'advisor_id' | 'percentage', value: any) => {
    setAssignments(prev => {
      const copy = { ...prev };
      const list = [...(copy[entryId] || [])];
      list[idx] = { ...list[idx], [field]: value };
      if (field === 'advisor_id' && entries) {
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
          const suggested = getSuggestedRate(entry.insurer_id, entry.plan_type, value);
          if (suggested > 0) list[idx].percentage = suggested;
        }
      }
      copy[entryId] = list;
      return copy;
    });
  };

  const addAdvisor = (entryId: string) => {
    setAssignments(prev => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), { advisor_id: '', percentage: 0 }],
    }));
  };

  // Bulk selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!entries) return;
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const applyBulkAssignment = () => {
    if (!bulkAdvisor || bulkPercentage <= 0 || selectedIds.size === 0 || !entries) return;
    setAssignments(prev => {
      const copy = { ...prev };
      for (const entryId of selectedIds) {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) continue;
        const suggested = getSuggestedRate(entry.insurer_id, entry.plan_type, bulkAdvisor);
        const pct = suggested > 0 ? suggested : bulkPercentage;
        copy[entryId] = [{ advisor_id: bulkAdvisor, percentage: pct }];
      }
      return copy;
    });
    toast({ title: `Asignación aplicada a ${selectedIds.size} póliza(s)` });
    setSelectedIds(new Set());
    setBulkAdvisor('');
    setBulkPercentage(0);
  };

  const handleSave = async () => {
    if (!entries) return;
    try {
      for (const entry of entries) {
        await deleteByEntry.mutateAsync(entry.id);
      }
      const allAssignments: Array<{ entry_id: string; advisor_id: string; percentage: number; amount: number }> = [];
      for (const entry of entries) {
        const list = assignments[entry.id] || [];
        for (const a of list) {
          if (a.advisor_id && a.percentage > 0) {
            allAssignments.push({
              entry_id: entry.id,
              advisor_id: a.advisor_id,
              percentage: a.percentage,
              amount: Number(entry.premium) * a.percentage / 100,
            });
          }
        }
      }
      if (allAssignments.length > 0) {
        await saveAssignments.mutateAsync(allAssignments);
      }
      await updateBatchStatus.mutateAsync({ id: selectedBatch, status: 'asignado' });
    } catch { /* handled */ }
  };

  const getAdvisorAmounts = (entry: CommissionEntry) => {
    const list = assignments[entry.id] || [];
    return list.reduce((s, a) => s + (Number(entry.commission_amount) * a.percentage / 100), 0);
  };

  const getMarginAmount = (entry: CommissionEntry) => {
    return Number(entry.commission_amount) - getAdvisorAmounts(entry);
  };

  const getEntryTotalPct = (entryId: string) => {
    return (assignments[entryId] || []).reduce((s, a) => s + a.percentage, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[350px]"><SelectValue placeholder="Seleccionar lote verificado..." /></SelectTrigger>
          <SelectContent>
            {verifiedBatches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {(b.insurer as any)?.name} — {b.batch_date} ({b.currency === 'BS' ? 'Bs.' : '$'}{Number(b.total_commission).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBatch && entries && entries.length > 0 && (
          <Button onClick={handleSave} disabled={saveAssignments.isPending}>
            <Save className="h-4 w-4 mr-2" />Guardar asignaciones
          </Button>
        )}
      </div>

      {/* Bulk assignment bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              {selectedIds.size} seleccionada(s)
            </Badge>
            <Select value={bulkAdvisor} onValueChange={setBulkAdvisor}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Asesor..." /></SelectTrigger>
              <SelectContent>
                {advisors?.map(adv => <SelectItem key={adv.id} value={adv.id}>{adv.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input type="number" className="w-[80px]" placeholder="%" value={bulkPercentage || ''} onChange={e => setBulkPercentage(parseFloat(e.target.value) || 0)} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button size="sm" onClick={applyBulkAssignment} disabled={!bulkAdvisor || bulkPercentage <= 0}>
              Asignar a seleccionadas
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Cancelar</Button>
          </CardContent>
        </Card>
      )}

      {!selectedBatch ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona un lote verificado para asignar asesores.</CardContent></Card>
      ) : isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={entries.length > 0 && selectedIds.size === entries.length}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">Seleccionar todas ({entries.length})</span>
          </div>

          {entries.map(entry => {
            const entryAssigns = assignments[entry.id] || [{ advisor_id: '', percentage: 0 }];
            const marginAmount = getMarginAmount(entry);
            const marginPct = Number(entry.commission_amount) > 0
              ? (marginAmount / Number(entry.commission_amount)) * 100
              : 0;
            return (
              <Card key={entry.id} className={selectedIds.has(entry.id) ? 'ring-2 ring-primary/40' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={() => toggleSelect(entry.id)}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{entry.client_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">{entry.policy_number || ''}</span>
                        <span className="text-sm text-muted-foreground ml-2">• {entry.plan_type || '—'}</span>
                      </div>
                      <div className="text-right flex items-center gap-2 flex-wrap justify-end">
                        <Badge variant="secondary" className="font-normal">
                          Prima: {currencySymbol}{Number(entry.premium).toFixed(2)}
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          % Aseg: {Number(entry.commission_rate).toFixed(1)}%
                        </Badge>
                        <Badge variant="outline" className="font-semibold">
                          Comisión: {currencySymbol}{Number(entry.commission_amount).toFixed(2)}
                        </Badge>
                        <Badge variant={marginAmount >= 0 ? 'default' : 'destructive'}>
                          Margen: {currencySymbol}{marginAmount.toFixed(2)} ({marginPct.toFixed(1)}%)
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {entryAssigns.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 ml-7">
                      <Select value={a.advisor_id} onValueChange={v => updateAssignment(entry.id, idx, 'advisor_id', v)}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Asesor" /></SelectTrigger>
                        <SelectContent>
                          {advisors?.map(adv => <SelectItem key={adv.id} value={adv.id}>{adv.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input type="number" className="w-[80px]" value={a.percentage} onChange={e => updateAssignment(entry.id, idx, 'percentage', parseFloat(e.target.value) || 0)} />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <span className="text-sm font-medium">{currencySymbol}{(Number(entry.commission_amount) * a.percentage / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {entryAssigns.length < 2 && (
                    <Button variant="ghost" size="sm" className="ml-7" onClick={() => addAdvisor(entry.id)}>
                      <Users className="h-3.5 w-3.5 mr-1" />Agregar asesor
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Este lote no tiene entradas.</CardContent></Card>
      )}
    </div>
  );
}
