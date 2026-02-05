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
        return { created: 0, updated: 0, deleted: 0, message: 'No hay pólizas vigentes con fecha de pago.' };
      }

      // Get existing pending collections
      const { data: existingCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, policy_id, due_date, amount')
        .eq('status', 'pendiente');

      if (collectionsError) throw collectionsError;

      // Create a map of policy_id to their expected due_date from the policy
      const policyExpectedDates = new Map<string, string>();
      policies.forEach((p) => {
        if (p.premium_payment_date) {
          policyExpectedDates.set(p.id, p.premium_payment_date);
        }
      });

      // Create a set of existing collection keys for fast lookup
      const existingKeys = new Set(
        (existingCollections || []).map((c) => `${c.policy_id}-${c.due_date}`)
      );

      // Find orphaned collections (due_date doesn't match policy's premium_payment_date)
      const orphanedCollectionIds: string[] = [];
      (existingCollections || []).forEach((c) => {
        const expectedDate = policyExpectedDates.get(c.policy_id);
        // If the policy has a different expected date than this collection's due_date,
        // and there's no other collection with the correct date, this is orphaned
        if (expectedDate && c.due_date !== expectedDate) {
          orphanedCollectionIds.push(c.id);
        }
      });

      // Delete orphaned collections (old dates that no longer match)
      let deletedCount = 0;
      if (orphanedCollectionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('collections')
          .delete()
          .in('id', orphanedCollectionIds);

        if (!deleteError) {
          deletedCount = orphanedCollectionIds.length;
        }
      }

      // Recalculate existing keys after deletion
      const remainingKeys = new Set(
        (existingCollections || [])
          .filter((c) => !orphanedCollectionIds.includes(c.id))
          .map((c) => `${c.policy_id}-${c.due_date}`)
      );

      // Filter policies that don't have a pending collection for their payment date
      const collectionsToCreate = policies
        .filter((p) => {
          const key = `${p.id}-${p.premium_payment_date}`;
          return !remainingKeys.has(key);
        })
        .map((p) => {
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

      // Find collections that need their amount updated (for remaining non-orphaned ones)
      const collectionsToUpdate: { id: string; amount: number }[] = [];
      const remainingCollections = (existingCollections || []).filter(
        (c) => !orphanedCollectionIds.includes(c.id)
      );
      
      policies.forEach((p) => {
        const matchingCollection = remainingCollections.find(
          (c) => c.policy_id === p.id && c.due_date === p.premium_payment_date
        );
        if (matchingCollection && p.premium !== null && p.premium !== undefined) {
          const correctInstallment = calculateInstallment(p.premium, p.payment_frequency || 'mensual') || p.premium;
          if (matchingCollection.amount !== correctInstallment) {
            collectionsToUpdate.push({ id: matchingCollection.id, amount: correctInstallment });
          }
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
      if (deletedCount > 0) {
        messages.push(`${deletedCount} duplicados eliminados`);
      }
      if (messages.length === 0) {
        messages.push('Todas las cobranzas están al día');
      }

      return {
        created: collectionsToCreate.length,
        updated: updatedCount,
        deleted: deletedCount,
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
