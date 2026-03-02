import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface TrackingTableProps {
  cases: any[];
  onViewCase: (c: any) => void;
}

const statusColors: Record<string, string> = {
  abierto: 'bg-blue-100 text-blue-800',
  en_progreso: 'bg-amber-100 text-amber-800',
  en_espera: 'bg-orange-100 text-orange-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  abierto: 'Abierto',
  en_progreso: 'En Progreso',
  en_espera: 'En Espera',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const priorityColors: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export function TrackingTable({ cases, onViewCase }: TrackingTableProps) {
  if (cases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron casos de seguimiento
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Póliza</TableHead>
          <TableHead>Fase Actual</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Prioridad</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c: any) => (
          <TableRow key={c.id} className="cursor-pointer" onClick={() => onViewCase(c)}>
            <TableCell className="font-medium">{c.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{c.tracking_case_types?.name || 'N/A'}</Badge>
            </TableCell>
            <TableCell>
              {c.clients?.first_name} {c.clients?.last_name}
            </TableCell>
            <TableCell>{c.policies?.policy_number || '—'}</TableCell>
            <TableCell>
              <span className="text-sm">{c.tracking_case_phases?.name || 'Sin fase'}</span>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={priorityColors[c.priority]}>{c.priority}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(c.created_at), 'dd/MM/yyyy')}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onViewCase(c); }}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
