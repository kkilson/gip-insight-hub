import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import type { Tables } from '@/integrations/supabase/types';

type Advisor = Tables<'advisors'>;

interface AdvisorTableProps {
  advisors: Advisor[];
  isLoading: boolean;
  onEdit: (advisor: Advisor) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function AdvisorTable({ advisors, isLoading, onEdit, onDelete, onBulkDelete }: AdvisorTableProps) {
  const bulk = useBulkSelection(advisors);

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No hay asesores registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={bulk.isAllSelected}
                  onCheckedChange={bulk.toggleAll}
                  aria-label="Seleccionar todos"
                  {...(bulk.isIndeterminate ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {advisors.map((advisor) => (
              <TableRow key={advisor.id} className={bulk.isSelected(advisor.id) ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={bulk.isSelected(advisor.id)}
                    onCheckedChange={() => bulk.toggle(advisor.id)}
                    aria-label={`Seleccionar ${advisor.full_name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{advisor.full_name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    {advisor.email && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {advisor.email}
                      </span>
                    )}
                    {advisor.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {advisor.phone}
                      </span>
                    )}
                    {!advisor.email && !advisor.phone && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {advisor.commission_rate != null ? `${advisor.commission_rate}%` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={advisor.is_active ? 'default' : 'secondary'}>
                    {advisor.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(advisor)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(advisor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BulkActionsBar
        selectedCount={bulk.selectedCount}
        onClear={bulk.clearSelection}
        actions={[
          {
            label: 'Eliminar',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            confirm: true,
            confirmTitle: '¿Eliminar asesores seleccionados?',
            confirmDescription: `Se eliminarán ${bulk.selectedCount} asesor(es). Esta acción no se puede deshacer.`,
            onClick: () => {
              if (onBulkDelete) {
                onBulkDelete(Array.from(bulk.selectedIds));
              } else {
                bulk.selectedIds.forEach(id => onDelete(id));
              }
              bulk.clearSelection();
            },
          },
        ]}
      />
    </>
  );
}
