import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

export interface ClientFiltersState {
  search: string;
  insurerId: string | null;
  productId: string | null;
  status: string | null;
  dateFrom: string;
  dateTo: string;
}

interface ClientFiltersProps {
  filters: ClientFiltersState;
  onFiltersChange: (filters: ClientFiltersState) => void;
}

const statusOptions = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_tramite', label: 'En trámite' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'vencida', label: 'Vencida' },
];

export function ClientFilters({ filters, onFiltersChange }: ClientFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: insurers } = useQuery({
    queryKey: ['insurers-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurers')
        .select('id, name, short_name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-filter', filters.insurerId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, insurer_id')
        .eq('is_active', true)
        .order('name');

      if (filters.insurerId) {
        query = query.eq('insurer_id', filters.insurerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateFilter = <K extends keyof ClientFiltersState>(
    key: K,
    value: ClientFiltersState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    // Reset product when insurer changes
    if (key === 'insurerId') {
      newFilters.productId = null;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      insurerId: null,
      productId: null,
      status: null,
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters =
    filters.insurerId ||
    filters.productId ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula o correo..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showAdvanced ? 'secondary' : 'outline'}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
            <Select
              value={filters.insurerId || 'all'}
              onValueChange={(v) => updateFilter('insurerId', v === 'all' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aseguradora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las aseguradoras</SelectItem>
                {insurers?.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.short_name || i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.productId || 'all'}
              onValueChange={(v) => updateFilter('productId', v === 'all' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Producto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => updateFilter('status', v === 'all' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Desde"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              placeholder="Hasta"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
