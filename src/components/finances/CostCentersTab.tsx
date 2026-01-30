import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useCostCenters, type CostCenter } from '@/hooks/useFinances';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CostCenterFormDialog } from './CostCenterFormDialog';

const typeLabels: Record<string, string> = {
  operativo: 'Operativo',
  comercial: 'Comercial',
  administrativo: 'Administrativo',
  soporte: 'Soporte',
};

const typeColors: Record<string, string> = {
  operativo: 'bg-blue-100 text-blue-800',
  comercial: 'bg-green-100 text-green-800',
  administrativo: 'bg-purple-100 text-purple-800',
  soporte: 'bg-orange-100 text-orange-800',
};

export function CostCentersTab() {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);
  
  const { data: costCenters, isLoading } = useCostCenters();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cost_centers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast({ title: 'Centro de costos eliminado' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const filteredCenters = costCenters?.filter(cc => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return cc.code.toLowerCase().includes(searchLower) || cc.name.toLowerCase().includes(searchLower);
  });

  const handleEdit = (center: CostCenter) => {
    setEditingCenter(center);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este centro de costos?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCenter(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar centro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Centro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centros de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredCenters?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay centros de costos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters?.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-mono font-semibold">
                      {center.code}
                    </TableCell>
                    <TableCell>{center.name}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[center.type]}>
                        {typeLabels[center.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.is_active ? 'default' : 'secondary'}>
                        {center.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(center)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(center.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CostCenterFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        costCenter={editingCenter}
      />
    </div>
  );
}
