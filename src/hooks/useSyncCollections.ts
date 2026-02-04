import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateInstallment } from '@/lib/premiumCalculations';

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
        .map((p) => {
          // Calculate the installment amount based on frequency instead of using annual premium
          const installment = calculateInstallment(p.premium, p.payment_frequency || 'mensual');
          return {
            policy_id: p.id,
            client_id: p.client_id,
            due_date: p.premium_payment_date,
            amount: installment || p.premium || 0,
            payment_frequency: p.payment_frequency || 'mensual',
            status: 'pendiente' as const,
          };
        });

      // Find collections that need their amount or due_date updated
      const collectionsToUpdate: { id: string; amount: number; due_date: string }[] = [];
      policies.forEach((p) => {
        const existingList = existingByPolicy.get(p.id);
        if (existingList && p.premium !== null && p.premium !== undefined) {
          // Calculate the correct installment amount
          const correctInstallment = calculateInstallment(p.premium, p.payment_frequency || 'mensual') || p.premium;
          existingList.forEach((existing) => {
            // Update if amount differs OR due_date differs from policy's premium_payment_date
            const needsAmountUpdate = existing.amount !== correctInstallment;
            const needsDueDateUpdate = existing.due_date !== p.premium_payment_date;
            
            if (needsAmountUpdate || needsDueDateUpdate) {
              collectionsToUpdate.push({ 
                id: existing.id, 
                amount: correctInstallment,
                due_date: p.premium_payment_date!
              });
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

      // Update existing collections with new amounts and/or due dates
      let updatedCount = 0;
      for (const update of collectionsToUpdate) {
        const { error: updateError } = await supabase
          .from('collections')
          .update({ amount: update.amount, due_date: update.due_date })
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
