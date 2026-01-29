import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ConsumptionFilters as FilterType, useUsageTypes } from '@/hooks/useConsumptions';

interface ConsumptionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export function ConsumptionFilters({ filters, onFiltersChange }: ConsumptionFiltersProps) {
  const { data: usageTypes } = useUsageTypes();
  const [fromDate, setFromDate] = useState<Date | undefined>(
    filters.from_date ? new Date(filters.from_date) : undefined
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    filters.to_date ? new Date(filters.to_date) : undefined
  );

  const handleFromDateChange = (date: Date | undefined) => {
    setFromDate(date);
    onFiltersChange({
      ...filters,
      from_date: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleToDateChange = (date: Date | undefined) => {
    setToDate(date);
    onFiltersChange({
      ...filters,
      to_date: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    onFiltersChange({});
  };

  const hasFilters = filters.beneficiary || filters.usage_type_id || filters.from_date || filters.to_date;

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      {/* Beneficiary search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar beneficiario..."
          value={filters.beneficiary || ''}
          onChange={(e) => onFiltersChange({ ...filters, beneficiary: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Usage type filter */}
      <Select
        value={filters.usage_type_id || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          usage_type_id: value === 'all' ? undefined : value 
        })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo de uso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          {usageTypes?.filter(t => t.is_active).map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* From date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !fromDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fromDate ? format(fromDate, "dd/MM/yy") : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={handleFromDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* To date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !toDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {toDate ? format(toDate, "dd/MM/yy") : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={handleToDateChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
