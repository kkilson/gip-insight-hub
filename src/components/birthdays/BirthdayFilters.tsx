import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type MonthFilter = 'previous' | 'current' | 'next';

interface BirthdayFiltersProps {
  monthFilter: MonthFilter;
  onMonthFilterChange: (value: MonthFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function BirthdayFilters({
  monthFilter,
  onMonthFilterChange,
  search,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: BirthdayFiltersProps) {
  const today = new Date();
  
  const getMonthLabel = (filter: MonthFilter): string => {
    let date = today;
    if (filter === 'previous') {
      date = subMonths(today, 1);
    } else if (filter === 'next') {
      date = addMonths(today, 1);
    }
    return format(date, 'MMMM yyyy', { locale: es });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={monthFilter}
          onValueChange={(value) => value && onMonthFilterChange(value as MonthFilter)}
          className="justify-start"
        >
          <ToggleGroupItem value="previous" aria-label="Mes anterior" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline capitalize">{getMonthLabel('previous')}</span>
            <span className="sm:hidden">Anterior</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="current" aria-label="Mes actual" className="font-semibold">
            <span className="capitalize">{getMonthLabel('current')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="next" aria-label="Mes siguiente" className="gap-1">
            <span className="hidden sm:inline capitalize">{getMonthLabel('next')}</span>
            <span className="sm:hidden">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o asesor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
