import { useState } from 'react';
import { CollectionStats } from '@/components/collections/CollectionStats';
import { CollectionFilters } from '@/components/collections/CollectionFilters';
import { CollectionTable } from '@/components/collections/CollectionTable';
import { useCollections, CollectionFilters as Filters } from '@/hooks/useCollections';
import { useSyncCollections } from '@/hooks/useSyncCollections';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Collections() {
  const [filters, setFilters] = useState<Filters>({});
  const { data: collections = [], isLoading } = useCollections(filters);
  const syncCollections = useSyncCollections();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranzas</h1>
          <p className="text-muted-foreground">Gestiona los pagos pendientes y vencidos</p>
        </div>
        <Button
          variant="outline"
          onClick={() => syncCollections.mutate()}
          disabled={syncCollections.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncCollections.isPending ? 'animate-spin' : ''}`} />
          {syncCollections.isPending ? 'Sincronizando...' : 'Sincronizar pólizas'}
        </Button>
      </div>

      {/* Stats */}
      <CollectionStats />

      {/* Filters */}
      <CollectionFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <CollectionTable collections={collections} isLoading={isLoading} />
    </div>
  );
}
