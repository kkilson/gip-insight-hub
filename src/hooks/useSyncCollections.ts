import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSyncCollections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // Get all active policies that have a premium_payment_date
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('id, client_id, premium, payment_frequency, premium_payment_date')
        .eq('status', 'vigente')
        .not('premium_payment_date', 'is', null);

      if (policiesError) throw policiesError;

      if (!policies || policies.length === 0) {
        return { created: 0, updated: 0, message: 'No hay pólizas vigentes con fecha de pago.' };
      }

      // Get existing pending collections to check for updates and duplicates
      const { data: existingCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, policy_id, due_date, amount')
        .neq('status', 'cobrada');

      if (collectionsError) throw collectionsError;

      // Create a map of existing collections by policy_id for updates
      const existingByPolicy = new Map<string, { id: string; due_date: string; amount: number }[]>();
      (existingCollections || []).forEach((c) => {
        const list = existingByPolicy.get(c.policy_id) || [];
        list.push({ id: c.id, due_date: c.due_date, amount: c.amount });
        existingByPolicy.set(c.policy_id, list);
      });

      // Create a set of existing collection keys for fast lookup (to avoid duplicates)
      const existingKeys = new Set(
        (existingCollections || []).map((c) => `${c.policy_id}-${c.due_date}`)
      );

      // Filter policies that don't have a pending collection for their payment date
      const collectionsToCreate = policies
        .filter((p) => {
          const key = `${p.id}-${p.premium_payment_date}`;
          return !existingKeys.has(key);
        })
        .map((p) => ({
          policy_id: p.id,
          client_id: p.client_id,
          due_date: p.premium_payment_date,
          amount: p.premium || 0,
          payment_frequency: p.payment_frequency || 'mensual',
          status: 'pendiente' as const,
        }));

      // Find collections that need their amount updated
      const collectionsToUpdate: { id: string; amount: number }[] = [];
      policies.forEach((p) => {
        const existingList = existingByPolicy.get(p.id);
        if (existingList && p.premium !== null && p.premium !== undefined) {
          existingList.forEach((existing) => {
            // Only update if amount is different (and existing amount is 0 or different)
            if (existing.amount !== p.premium) {
              collectionsToUpdate.push({ id: existing.id, amount: p.premium });
            }
          });
        }
      });

      // Insert new collections
      if (collectionsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('collections')
          .insert(collectionsToCreate);

        if (insertError) throw insertError;
      }

      // Update existing collections with new amounts
      let updatedCount = 0;
      for (const update of collectionsToUpdate) {
        const { error: updateError } = await supabase
          .from('collections')
          .update({ amount: update.amount })
          .eq('id', update.id);

        if (!updateError) {
          updatedCount++;
        }
      }

      const messages: string[] = [];
      if (collectionsToCreate.length > 0) {
        messages.push(`${collectionsToCreate.length} cobranzas creadas`);
      }
      if (updatedCount > 0) {
        messages.push(`${updatedCount} montos actualizados`);
      }
      if (messages.length === 0) {
        messages.push('Todas las cobranzas están al día');
      }

      return {
        created: collectionsToCreate.length,
        updated: updatedCount,
        message: messages.join(', ') + '.',
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      toast({
        title: 'Sincronización completada',
        description: result.message,
      });
    },
    onError: (error) => {
      console.error('Error syncing collections:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron sincronizar las cobranzas.',
        variant: 'destructive',
      });
    },
  });
}
