import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { CollectionFilters as Filters, CollectionStatus } from '@/hooks/useCollections';

interface CollectionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function CollectionFilters({ filters, onFiltersChange }: CollectionFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value as CollectionStatus | 'all' });
  };

  const handleDaysOverdueChange = (min: number | undefined, max: number | undefined) => {
    onFiltersChange({ ...filters, daysOverdueMin: min, daysOverdueMax: max });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    filters.search || 
    (filters.status && filters.status !== 'all') || 
    filters.daysOverdueMin !== undefined || 
    filters.daysOverdueMax !== undefined;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o póliza..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="contacto_asesor">Contacto Asesor</SelectItem>
            <SelectItem value="cobrada">Cobrada</SelectItem>
          </SelectContent>
        </Select>

        {/* Days overdue filter */}
        <Select
          value={
            filters.daysOverdueMin !== undefined
              ? `${filters.daysOverdueMin}-${filters.daysOverdueMax || ''}`
              : 'all'
          }
          onValueChange={(value) => {
            if (value === 'all') {
              handleDaysOverdueChange(undefined, undefined);
            } else if (value === 'upcoming') {
              handleDaysOverdueChange(undefined, -1);
            } else if (value === '0-7') {
              handleDaysOverdueChange(0, 7);
            } else if (value === '8-15') {
              handleDaysOverdueChange(8, 15);
            } else if (value === '16-30') {
              handleDaysOverdueChange(16, 30);
            } else if (value === '31-60') {
              handleDaysOverdueChange(31, 60);
            } else if (value === '60+') {
              handleDaysOverdueChange(60, undefined);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Días de mora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="upcoming">Próximas a vencer</SelectItem>
            <SelectItem value="0-7">0-7 días de mora</SelectItem>
            <SelectItem value="8-15">8-15 días de mora</SelectItem>
            <SelectItem value="16-30">16-30 días de mora</SelectItem>
            <SelectItem value="31-60">31-60 días de mora</SelectItem>
            <SelectItem value="60+">+60 días de mora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
