import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AdvisorTable } from '@/components/advisors/AdvisorTable';
import { AdvisorFormDialog } from '@/components/advisors/AdvisorFormDialog';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Advisor = Tables<'advisors'>;

export default function Advisors() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: advisors, isLoading } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Advisor[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('advisors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast({ title: 'Asesor eliminado correctamente' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar asesor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este asesor?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAdvisor(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asesores</h1>
          <p className="text-muted-foreground">
            Gestiona los asesores de seguros del sistema
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Asesor
        </Button>
      </div>

      <AdvisorTable
        advisors={advisors || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AdvisorFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        advisor={editingAdvisor}
      />
    </div>
  );
}
