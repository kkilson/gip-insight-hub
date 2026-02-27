import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface CommissionRule {
  id: string;
  advisor_id: string;
  insurer_id: string;
  plan_type: string;
  commission_percentage: number;
  advisor?: { full_name: string };
  insurer?: { name: string };
}

export interface CommissionBatch {
  id: string;
  insurer_id: string | null;
  batch_date: string;
  status: 'pendiente' | 'verificado' | 'asignado';
  total_premium: number;
  total_commission: number;
  currency: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  insurer?: { name: string } | null;
  entries_count?: number;
}

export interface CommissionEntry {
  id: string;
  batch_id: string;
  policy_number: string | null;
  client_name: string;
  client_id: string | null;
  insurer_id: string | null;
  plan_type: string | null;
  premium: number;
  commission_rate: number;
  commission_amount: number;
  has_discrepancy: boolean;
  discrepancy_note: string | null;
  is_verified: boolean;
  insurer?: { name: string } | null;
  client?: { first_name: string; last_name: string } | null;
  assignments?: CommissionAssignment[];
}

export interface CommissionAssignment {
  id: string;
  entry_id: string;
  advisor_id: string;
  percentage: number;
  amount: number;
  advisor?: { full_name: string };
}

// Hooks
export function useCommissionBatches() {
  return useQuery({
    queryKey: ['commission-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_batches')
        .select('*, insurer:insurers(name)')
        .order('batch_date', { ascending: false });
      if (error) throw error;
      return data as CommissionBatch[];
    },
  });
}

export function useCommissionEntries(batchId: string | null) {
  return useQuery({
    queryKey: ['commission-entries', batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_entries')
        .select('*, insurer:insurers(name), client:clients(first_name, last_name)')
        .eq('batch_id', batchId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CommissionEntry[];
    },
  });
}

export function useCommissionAssignments(entryIds: string[]) {
  return useQuery({
    queryKey: ['commission-assignments', entryIds],
    enabled: entryIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_assignments')
        .select('*, advisor:advisors(full_name)')
        .in('entry_id', entryIds);
      if (error) throw error;
      return data as CommissionAssignment[];
    },
  });
}

export function useCommissionRules() {
  return useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*, advisor:advisors(full_name), insurer:insurers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CommissionRule[];
    },
  });
}

export function useSaveBatch() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (batch: { insurer_id: string; batch_date: string; currency: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('commission_batches').insert({
        ...batch,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-batches'] }); toast({ title: 'Lote creado exitosamente' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useSaveEntries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (entries: Array<{
      batch_id: string; policy_number?: string; client_name: string; client_id?: string;
      insurer_id?: string; plan_type?: string; premium: number; commission_rate: number; commission_amount: number;
    }>) => {
      const { data, error } = await supabase.from('commission_entries').insert(entries).select();
      if (error) throw error;
      // Update batch totals
      const batchId = entries[0].batch_id;
      const totalPremium = entries.reduce((s, e) => s + e.premium, 0);
      const totalCommission = entries.reduce((s, e) => s + e.commission_amount, 0);
      await supabase.from('commission_batches').update({
        total_premium: totalPremium,
        total_commission: totalCommission,
      }).eq('id', batchId);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-entries'] }); qc.invalidateQueries({ queryKey: ['commission-batches'] }); toast({ title: 'Entradas guardadas' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CommissionEntry> & { id: string }) => {
      const { error } = await supabase.from('commission_entries').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-entries'] }),
  });
}

export function useUpdateBatchStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('commission_batches').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-batches'] }); toast({ title: 'Estado actualizado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useSaveAssignments() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (assignments: Array<{ entry_id: string; advisor_id: string; percentage: number; amount: number }>) => {
      const { error } = await supabase.from('commission_assignments').insert(assignments);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commission-assignments'] });
      toast({ title: 'Asignaciones guardadas' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteAssignmentsByEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('commission_assignments').delete().eq('entry_id', entryId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-assignments'] }),
  });
}

export function useSaveRule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (rule: { advisor_id: string; insurer_id: string; plan_type: string; commission_percentage: number; id?: string }) => {
      if (rule.id) {
        const { error } = await supabase.from('commission_rules').update({
          advisor_id: rule.advisor_id, insurer_id: rule.insurer_id,
          plan_type: rule.plan_type, commission_percentage: rule.commission_percentage,
        }).eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('commission_rules').insert(rule);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-rules'] }); toast({ title: 'Regla guardada' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('commission_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-rules'] }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('commission_batches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-batches'] }); toast({ title: 'Lote eliminado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteBatches() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from('commission_batches').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['commission-batches'] });
      toast({ title: `${ids.length} lote(s) eliminado(s)` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteEntries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('commission_entries').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['commission-entries'] });
      qc.invalidateQueries({ queryKey: ['commission-batches'] });
      toast({ title: `${ids.length} entrada(s) eliminada(s)` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteAssignmentsBulk() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('commission_assignments').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['commission-assignments'] });
      toast({ title: `${ids.length} asignación(es) eliminada(s)` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
