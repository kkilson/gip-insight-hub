import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { RenewalStats } from '@/components/renewals/RenewalStats';
import { RenewalFilters } from '@/components/renewals/RenewalFilters';
import { RenewalTable } from '@/components/renewals/RenewalTable';
import { ConfigureRenewalDialog } from '@/components/renewals/ConfigureRenewalDialog';
import { 
  useRenewalPolicies, 
  useRenewalStats, 
  RenewalFilters as FilterType,
  PolicyForRenewal 
} from '@/hooks/useRenewals';
import { useToast } from '@/hooks/use-toast';

export default function Renewals() {
  const [filters, setFilters] = useState<FilterType>({
    daysAhead: 30,
    status: 'all',
    search: '',
  });
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyForRenewal | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useRenewalStats();
  const { data: policies, isLoading: policiesLoading, refetch } = useRenewalPolicies(filters);
  const { toast } = useToast();

  const handleConfigure = (policy: PolicyForRenewal) => {
    setSelectedPolicy(policy);
    setConfigDialogOpen(true);
  };

  const handleViewDetails = (policy: PolicyForRenewal) => {
    // TODO: Implement view details dialog
    toast({
      title: 'Ver detalles',
      description: `Detalles de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleGeneratePdf = (policy: PolicyForRenewal) => {
    // TODO: Implement PDF generation
    toast({
      title: 'Generando PDF',
      description: `Generando PDF de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleSendNow = (policy: PolicyForRenewal) => {
    // TODO: Implement send now
    toast({
      title: 'Enviando renovación',
      description: `Enviando aviso de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleExport = () => {
    // TODO: Implement export
    toast({
      title: 'Exportando',
      description: 'Exportando lista de renovaciones...',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Renovaciones</h1>
          <p className="text-muted-foreground">Gestiona las pólizas próximas a vencer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <RenewalStats stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Renovaciones próximas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RenewalFilters filters={filters} onFiltersChange={setFilters} />
          
          <RenewalTable
            policies={policies}
            isLoading={policiesLoading}
            onConfigure={handleConfigure}
            onViewDetails={handleViewDetails}
            onGeneratePdf={handleGeneratePdf}
            onSendNow={handleSendNow}
          />
        </CardContent>
      </Card>

      {/* Configure Dialog */}
      <ConfigureRenewalDialog
        policy={selectedPolicy}
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </div>
  );
}
