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
        return { created: 0, message: 'No hay pólizas vigentes con fecha de pago.' };
      }

      // Get existing pending collections to avoid duplicates
      const { data: existingCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('policy_id, due_date')
        .neq('status', 'cobrada');

      if (collectionsError) throw collectionsError;

      // Create a set of existing collection keys for fast lookup
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

      if (collectionsToCreate.length === 0) {
        return { created: 0, message: 'Todas las cobranzas están al día.' };
      }

      // Insert new collections
      const { error: insertError } = await supabase
        .from('collections')
        .insert(collectionsToCreate);

      if (insertError) throw insertError;

      return {
        created: collectionsToCreate.length,
        message: `Se crearon ${collectionsToCreate.length} cobranzas.`,
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
