import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Pencil } from 'lucide-react';
import { useJournalEntries, useActiveCostCenters, type JournalEntry } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';
import { JournalEntryFormDialog } from './JournalEntryFormDialog';
import { JournalEntryDetailDialog } from './JournalEntryDetailDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

const statusColors: Record<string, string> = {
  borrador: 'bg-yellow-100 text-yellow-800',
  publicado: 'bg-green-100 text-green-800',
  cerrado: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  borrador: 'Borrador',
  publicado: 'Publicado',
  cerrado: 'Cerrado',
};

export function JournalEntriesTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [costCenterFilter, setCostCenterFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  
  const { data: entries, isLoading } = useJournalEntries({
    status: statusFilter,
    costCenterId: costCenterFilter,
  });
  const { data: costCenters } = useActiveCostCenters();
  
  const filteredEntries = entries?.filter(entry => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      entry.description.toLowerCase().includes(searchLower) ||
      entry.entry_number.toString().includes(searchLower)
    );
  });

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por # o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Centro de costos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los centros</SelectItem>
              {costCenters?.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Asiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Libro Diario</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEntries?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay asientos registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">#</TableHead>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[120px]">Centro</TableHead>
                  <TableHead className="text-right w-[120px]">Débito</TableHead>
                  <TableHead className="text-right w-[120px]">Crédito</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">
                      #{entry.entry_number.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      {entry.cost_center?.code || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.total_debit_usd)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(entry.total_credit_usd)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingEntryId(entry.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {entry.status !== 'cerrado' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <JournalEntryFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        entry={editingEntry}
      />

      <JournalEntryDetailDialog
        entryId={viewingEntryId}
        onClose={() => setViewingEntryId(null)}
      />
    </div>
  );
}
