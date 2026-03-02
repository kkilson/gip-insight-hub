import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCaseTypes() {
  return useQuery({
    queryKey: ['tracking-case-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_case_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCasePhases(caseTypeId?: string) {
  return useQuery({
    queryKey: ['tracking-case-phases', caseTypeId],
    queryFn: async () => {
      let query = supabase
        .from('tracking_case_phases')
        .select('*')
        .order('sort_order');
      if (caseTypeId) query = query.eq('case_type_id', caseTypeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !caseTypeId || caseTypeId.length > 0,
  });
}

export function useTrackingCases(filters?: {
  status?: string;
  caseTypeId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['tracking-cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('tracking_cases')
        .select(`
          *,
          tracking_case_types(id, name, affects_consumption, default_duration_days),
          tracking_case_phases(id, name),
          clients(id, first_name, last_name, identification_number),
          policies(id, policy_number, insurer_id, insurers(name))
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.caseTypeId && filters.caseTypeId !== 'todos') {
        query = query.eq('case_type_id', filters.caseTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter((c: any) =>
          c.title?.toLowerCase().includes(s) ||
          c.clients?.first_name?.toLowerCase().includes(s) ||
          c.clients?.last_name?.toLowerCase().includes(s) ||
          c.policies?.policy_number?.toLowerCase().includes(s)
        );
      }
      return filtered;
    },
  });
}

export function useCaseUpdates(caseId?: string) {
  return useQuery({
    queryKey: ['tracking-case-updates', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_case_updates')
        .select(`
          *,
          previous_phase:tracking_case_phases!tracking_case_updates_previous_phase_id_fkey(name),
          new_phase:tracking_case_phases!tracking_case_updates_new_phase_id_fkey(name)
        `)
        .eq('case_id', caseId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      case_type_id: string;
      client_id: string;
      policy_id?: string;
      title: string;
      description?: string;
      priority?: string;
      due_date?: string;
      affects_consumption?: boolean;
    }) => {
      // Get first phase of case type
      const { data: phases } = await supabase
        .from('tracking_case_phases')
        .select('id')
        .eq('case_type_id', data.case_type_id)
        .order('sort_order')
        .limit(1);

      const firstPhaseId = phases?.[0]?.id || null;

      const { data: result, error } = await supabase
        .from('tracking_cases')
        .insert({
          ...data,
          current_phase_id: firstPhaseId,
          status: 'abierto',
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-cases'] });
      toast.success('Caso creado exitosamente');
    },
    onError: (e: any) => toast.error(`Error al crear caso: ${e.message}`),
  });
}

export function useUpdateCasePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      newPhaseId,
      previousPhaseId,
      notes,
    }: {
      caseId: string;
      newPhaseId: string;
      previousPhaseId?: string;
      notes?: string;
    }) => {
      // Update case
      const { error: updateError } = await supabase
        .from('tracking_cases')
        .update({ current_phase_id: newPhaseId, status: 'en_progreso' })
        .eq('id', caseId);
      if (updateError) throw updateError;

      // Insert update log
      const { error: logError } = await supabase
        .from('tracking_case_updates')
        .insert({
          case_id: caseId,
          previous_phase_id: previousPhaseId || null,
          new_phase_id: newPhaseId,
          previous_status: 'en_progreso',
          new_status: 'en_progreso',
          notes,
        });
      if (logError) throw logError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-cases'] });
      qc.invalidateQueries({ queryKey: ['tracking-case-updates'] });
      toast.success('Fase actualizada');
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateCaseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      newStatus,
      previousStatus,
      notes,
    }: {
      caseId: string;
      newStatus: string;
      previousStatus?: string;
      notes?: string;
    }) => {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completado' || newStatus === 'cancelado') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('tracking_cases')
        .update(updateData)
        .eq('id', caseId);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('tracking_case_updates')
        .insert({
          case_id: caseId,
          previous_status: previousStatus as any,
          new_status: newStatus as any,
          notes,
        });
      if (logError) throw logError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-cases'] });
      qc.invalidateQueries({ queryKey: ['tracking-case-updates'] });
      toast.success('Estado actualizado');
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

export function useFollowUpPatterns(caseTypeId?: string) {
  return useQuery({
    queryKey: ['tracking-follow-up-patterns', caseTypeId],
    queryFn: async () => {
      let query = supabase
        .from('tracking_follow_up_patterns')
        .select('*, tracking_case_phases(name)')
        .order('days_after_phase_start');
      if (caseTypeId) query = query.eq('case_type_id', caseTypeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!caseTypeId,
  });
}

export function useCreateFollowUpPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      case_type_id: string;
      phase_id?: string;
      days_after_phase_start: number;
      action_type: string;
      message_template?: string;
      channel: string;
      requires_approval: boolean;
    }) => {
      const { error } = await supabase
        .from('tracking_follow_up_patterns')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracking-follow-up-patterns'] });
      toast.success('Patrón de seguimiento creado');
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });
}

export function useScheduledReminders(caseId?: string) {
  return useQuery({
    queryKey: ['tracking-scheduled-reminders', caseId],
    queryFn: async () => {
      let query = supabase
        .from('tracking_scheduled_reminders')
        .select('*')
        .order('scheduled_date');
      if (caseId) query = query.eq('case_id', caseId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}
