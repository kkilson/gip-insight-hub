import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useTrackingCases } from '@/hooks/useTracking';
import { TrackingFilters } from '@/components/tracking/TrackingFilters';
import { TrackingStats } from '@/components/tracking/TrackingStats';
import { TrackingTable } from '@/components/tracking/TrackingTable';
import { CaseFormDialog } from '@/components/tracking/CaseFormDialog';
import { CaseDetailDialog } from '@/components/tracking/CaseDetailDialog';
import { ConfigPanel } from '@/components/tracking/ConfigPanel';

export default function Tracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [showNewCase, setShowNewCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const { data: cases = [], isLoading } = useTrackingCases({
    status: statusFilter,
    caseTypeId: typeFilter,
    search,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimientos</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de casos por cliente y póliza
          </p>
        </div>
        <Button onClick={() => setShowNewCase(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Caso
        </Button>
      </div>

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Casos</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <TrackingStats cases={cases} />
          <TrackingFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando casos...</div>
          ) : (
            <TrackingTable cases={cases} onViewCase={setSelectedCase} />
          )}
        </TabsContent>

        <TabsContent value="config">
          <ConfigPanel />
        </TabsContent>
      </Tabs>

      <CaseFormDialog open={showNewCase} onOpenChange={setShowNewCase} />
      <CaseDetailDialog
        open={!!selectedCase}
        onOpenChange={(open) => !open && setSelectedCase(null)}
        caseData={selectedCase}
      />
    </div>
  );
}
