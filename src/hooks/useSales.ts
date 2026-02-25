import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SalesStage =
  | 'lead_identificado'
  | 'reunion_inicial'
  | 'propuesta'
  | 'envio_propuesta'
  | 'seguimiento_1'
  | 'seguimiento_2'
  | 'seguimiento_3'
  | 'propuesta_aceptada'
  | 'ganado'
  | 'perdido'
  | 'postergado';

export const SALES_STAGES: { value: SalesStage; label: string; color: string }[] = [
  { value: 'lead_identificado', label: 'Lead Identificado', color: 'bg-slate-500' },
  { value: 'reunion_inicial', label: 'Reunión Inicial', color: 'bg-blue-500' },
  { value: 'propuesta', label: 'Propuesta', color: 'bg-indigo-500' },
  { value: 'envio_propuesta', label: 'Envío Propuesta', color: 'bg-purple-500' },
  { value: 'seguimiento_1', label: 'Seguimiento 1', color: 'bg-amber-500' },
  { value: 'seguimiento_2', label: 'Seguimiento 2', color: 'bg-orange-500' },
  { value: 'seguimiento_3', label: 'Seguimiento 3', color: 'bg-red-400' },
  { value: 'propuesta_aceptada', label: 'Propuesta Aceptada', color: 'bg-emerald-500' },
  { value: 'ganado', label: 'Ganado', color: 'bg-green-600' },
  { value: 'perdido', label: 'Perdido', color: 'bg-red-600' },
  { value: 'postergado', label: 'Postergado', color: 'bg-gray-500' },
];

export const getStageLabel = (stage: SalesStage) =>
  SALES_STAGES.find((s) => s.value === stage)?.label ?? stage;

export const getStageColor = (stage: SalesStage) =>
  SALES_STAGES.find((s) => s.value === stage)?.color ?? 'bg-muted';

export interface SalesOpportunity {
  id: string;
  client_id: string | null;
  prospect_name: string;
  prospect_email: string | null;
  prospect_phone: string | null;
  prospect_company: string | null;
  stage: SalesStage;
  notes: string | null;
  expected_close_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  products?: SalesOpportunityProduct[];
  client?: { first_name: string; last_name: string } | null;
}

export interface SalesOpportunityProduct {
  id: string;
  opportunity_id: string;
  insurer_id: string | null;
  product_id: string | null;
  annual_premium: number;
  commission_rate: number;
  payment_frequency: string;
  notes: string | null;
  is_selected: boolean;
  insurer?: { name: string } | null;
  product?: { name: string } | null;
}

export function useToggleProductSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, opportunityId, selected }: { productId: string; opportunityId: string; selected: boolean }) => {
      // If selecting, deselect all others first
      if (selected) {
        await supabase
          .from('sales_opportunity_products')
          .update({ is_selected: false })
          .eq('opportunity_id', opportunityId);
      }
      const { error } = await supabase
        .from('sales_opportunity_products')
        .update({ is_selected: selected })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSalesOpportunities() {
  return useQuery({
    queryKey: ['sales-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_opportunities')
        .select(`
          *,
          client:clients(first_name, last_name),
          products:sales_opportunity_products(
            *,
            insurer:insurers(name),
            product:products(name)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as SalesOpportunity[];
    },
  });
}

export function useSaveOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opp: {
      id?: string;
      client_id?: string | null;
      prospect_name: string;
      prospect_email?: string;
      prospect_phone?: string;
      prospect_company?: string;
      stage?: SalesStage;
      notes?: string;
      expected_close_date?: string | null;
    }) => {
      if (opp.id) {
        const { error } = await supabase
          .from('sales_opportunities')
          .update(opp)
          .eq('id', opp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sales_opportunities')
          .insert({ ...opp, created_by: (await supabase.auth.getUser()).data.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      toast.success('Oportunidad guardada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, previousStage }: { id: string; stage: SalesStage; previousStage: SalesStage }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error: e1 } = await supabase
        .from('sales_opportunities')
        .update({ stage })
        .eq('id', id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('sales_activity_log')
        .insert({ opportunity_id: id, previous_stage: previousStage, new_stage: stage, changed_by: userId });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      toast.success('Etapa actualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_opportunities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      toast.success('Oportunidad eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveOpportunityProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prod: {
      id?: string;
      opportunity_id: string;
      insurer_id?: string | null;
      product_id?: string | null;
      annual_premium: number;
      commission_rate: number;
      payment_frequency: string;
      notes?: string;
    }) => {
      if (prod.id) {
        const { error } = await supabase.from('sales_opportunity_products').update(prod).eq('id', prod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sales_opportunity_products').insert(prod);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      toast.success('Producto guardado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteOpportunityProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_opportunity_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-opportunities'] });
      toast.success('Producto eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInsurersAndProducts() {
  const insurers = useQuery({
    queryKey: ['insurers-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insurers').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });
  const products = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name, insurer_id, category').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });
  return { insurers: insurers.data ?? [], products: products.data ?? [], isLoading: insurers.isLoading || products.isLoading };
}
