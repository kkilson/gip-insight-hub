import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SalesNote {
  id: string;
  opportunity_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  profile?: { full_name: string | null } | null;
}

export function useSalesNotes(opportunityId: string | null) {
  return useQuery({
    queryKey: ['sales-notes', opportunityId],
    enabled: !!opportunityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_notes')
        .select('*, profile:profiles!sales_notes_created_by_fkey(full_name)')
        .eq('opportunity_id', opportunityId!)
        .order('created_at', { ascending: false });
      if (error) {
        // If the join fails (no FK), fetch without it
        const { data: d2, error: e2 } = await supabase
          .from('sales_notes')
          .select('*')
          .eq('opportunity_id', opportunityId!)
          .order('created_at', { ascending: false });
        if (e2) throw e2;
        return d2 as unknown as SalesNote[];
      }
      return data as unknown as SalesNote[];
    },
  });
}

export function useAddSalesNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, content }: { opportunityId: string; content: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase.from('sales_notes').insert({
        opportunity_id: opportunityId,
        content,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sales-notes', vars.opportunityId] });
      toast.success('Nota agregada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSalesNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, opportunityId }: { id: string; opportunityId: string }) => {
      const { error } = await supabase.from('sales_notes').delete().eq('id', id);
      if (error) throw error;
      return opportunityId;
    },
    onSuccess: (opportunityId) => {
      qc.invalidateQueries({ queryKey: ['sales-notes', opportunityId] });
      toast.success('Nota eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
