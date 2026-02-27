import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Save, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useCommissionBatches, useCommissionEntries, useCommissionRules,
  useCommissionAssignments, useSaveAssignments, useDeleteAssignmentsByEntry,
  useUpdateBatchStatus,
} from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';

interface LocalAssignment {
  advisor_id: string;
  percentage: number;
}

export function AssignTab() {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [assignments, setAssignments] = useState<Record<string, LocalAssignment[]>>({});

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
      // Auto-suggest percentage when advisor selected
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

  const handleSave = async () => {
    if (!entries) return;
    try {
      // Delete existing, then re-insert
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
              amount: Number(entry.commission_amount) * a.percentage / 100,
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

  const getEntryTotal = (entryId: string) => {
    return (assignments[entryId] || []).reduce((s, a) => s + a.percentage, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-[350px]"><SelectValue placeholder="Seleccionar lote verificado..." /></SelectTrigger>
          <SelectContent>
            {verifiedBatches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {(b.insurer as any)?.name} — {b.batch_date} (${Number(b.total_commission).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBatch && entries && entries.length > 0 && (
          <Button onClick={handleSave} disabled={saveAssignments.isPending}>
            <Save className="h-4 w-4 mr-2" />Guardar y Marcar Asignado
          </Button>
        )}
      </div>

      {!selectedBatch ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona un lote verificado para asignar asesores.</CardContent></Card>
      ) : isLoading ? (
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>
      ) : entries && entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map(entry => {
            const entryAssigns = assignments[entry.id] || [{ advisor_id: '', percentage: 0 }];
            const totalPct = getEntryTotal(entry.id);
            const agencyMargin = 100 - totalPct;
            return (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{entry.client_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{entry.policy_number || ''}</span>
                      <span className="text-sm text-muted-foreground ml-2">• {entry.plan_type || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm">Comisión: </span>
                      <span className="font-semibold">${Number(entry.commission_amount).toFixed(2)}</span>
                      <Badge variant={agencyMargin >= 0 ? 'outline' : 'destructive'} className="ml-2">
                        Margen: {agencyMargin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  {entryAssigns.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3">
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
                      <span className="text-sm font-medium">${(Number(entry.commission_amount) * a.percentage / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {entryAssigns.length < 2 && (
                    <Button variant="ghost" size="sm" onClick={() => addAdvisor(entry.id)}>
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
