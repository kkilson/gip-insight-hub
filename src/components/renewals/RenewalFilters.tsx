import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { RenewalFilters as FilterType } from '@/hooks/useRenewals';

interface RenewalFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function RenewalFilters({ filters, onFiltersChange }: RenewalFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o póliza..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Days ahead filter */}
      <Select
        value={filters.daysAhead || '30'}
        onValueChange={(value) => onFiltersChange({ ...filters, daysAhead: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="past-240">Últimos 240 días</SelectItem>
          <SelectItem value="past-180">Últimos 180 días</SelectItem>
          <SelectItem value="past-90">Últimos 90 días</SelectItem>
          <SelectItem value="past-60">Últimos 60 días</SelectItem>
          <SelectItem value="past-30">Últimos 30 días</SelectItem>
          <SelectItem value="7">Próximos 7 días</SelectItem>
          <SelectItem value="15">Próximos 15 días</SelectItem>
          <SelectItem value="30">Próximos 30 días</SelectItem>
          <SelectItem value="60">Próximos 60 días</SelectItem>
          <SelectItem value="90">Próximos 90 días</SelectItem>
          <SelectItem value="180">Próximos 180 días</SelectItem>
          <SelectItem value="240">Próximos 240 días</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="sin_config">Sin configurar</SelectItem>
          <SelectItem value="pendiente">Pendiente</SelectItem>
          <SelectItem value="programada">Programada</SelectItem>
          <SelectItem value="enviada">Enviada</SelectItem>
          <SelectItem value="completada">Completada</SelectItem>
          <SelectItem value="error">Con error</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
