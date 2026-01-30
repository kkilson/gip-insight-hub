import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type Advisor = Tables<'advisors'>;

interface AdvisorTableProps {
  advisors: Advisor[];
  isLoading: boolean;
  onEdit: (advisor: Advisor) => void;
  onDelete: (id: string) => void;
}

export function AdvisorTable({ advisors, isLoading, onEdit, onDelete }: AdvisorTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Comisión</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advisors.map((advisor) => (
            <TableRow key={advisor.id}>
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
                {advisor.commission_rate != null
                  ? `${advisor.commission_rate}%`
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={advisor.is_active ? 'default' : 'secondary'}>
                  {advisor.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(advisor)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(advisor.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
