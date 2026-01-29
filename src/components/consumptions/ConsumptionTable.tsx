import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Consumption, useDeleteConsumption } from '@/hooks/useConsumptions';
import { useToast } from '@/hooks/use-toast';

interface ConsumptionTableProps {
  consumptions: Consumption[] | undefined;
  isLoading: boolean;
  onEdit: (consumption: Consumption) => void;
  onViewPolicy: (policyId: string) => void;
}

export function ConsumptionTable({ consumptions, isLoading, onEdit, onViewPolicy }: ConsumptionTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteConsumption();
  const { toast } = useToast();

  const formatCurrency = (value: number | null, currency: 'bs' | 'usd') => {
    if (value === null || value === undefined) return '-';
    const prefix = currency === 'bs' ? 'Bs.' : '$';
    return `${prefix} ${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Consumo eliminado',
        description: 'El registro de consumo ha sido eliminado correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el consumo',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!consumptions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay consumos registrados</h3>
        <p className="text-muted-foreground max-w-sm">
          Registra el primer consumo de póliza usando el botón "Nuevo consumo".
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Póliza</TableHead>
              <TableHead>Beneficiario</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto Bs</TableHead>
              <TableHead className="text-right">Monto USD</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumptions.map((consumption) => {
              const policy = consumption.policy;
              const client = Array.isArray(policy?.client) ? policy.client[0] : policy?.client;

              return (
                <TableRow key={consumption.id}>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium"
                      onClick={() => policy && onViewPolicy(policy.id)}
                    >
                      {policy?.policy_number || 'Sin número'}
                    </Button>
                    {client && (
                      <div className="text-xs text-muted-foreground">
                        {client.first_name} {client.last_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {consumption.beneficiary_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {consumption.usage_type?.name || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(consumption.usage_date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={consumption.description}>
                    {consumption.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(consumption.amount_bs, 'bs')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(consumption.amount_usd, 'usd')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(consumption)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(consumption.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este consumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de consumo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
