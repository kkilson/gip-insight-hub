import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, FileSpreadsheet, Plus, Receipt } from 'lucide-react';
import { RenewalStats } from '@/components/renewals/RenewalStats';
import { RenewalFilters } from '@/components/renewals/RenewalFilters';
import { RenewalTable } from '@/components/renewals/RenewalTable';
import { ConfigureRenewalDialog } from '@/components/renewals/ConfigureRenewalDialog';
import { ConsumptionFilters } from '@/components/consumptions/ConsumptionFilters';
import { ConsumptionTable } from '@/components/consumptions/ConsumptionTable';
import { ConsumptionFormDialog } from '@/components/consumptions/ConsumptionFormDialog';
import { ConsumptionSummaryCard } from '@/components/consumptions/ConsumptionSummaryCard';
import { 
  useRenewalPolicies, 
  useRenewalStats, 
  RenewalFilters as FilterType,
  PolicyForRenewal 
} from '@/hooks/useRenewals';
import {
  useConsumptions,
  useConsumptionSummary,
  ConsumptionFilters as ConsumptionFilterType,
  Consumption,
} from '@/hooks/useConsumptions';
import { useToast } from '@/hooks/use-toast';

export default function Renewals() {
  // Renewal state
  const [renewalFilters, setRenewalFilters] = useState<FilterType>({
    daysAhead: 30,
    status: 'all',
    search: '',
  });
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyForRenewal | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Consumption state
  const [consumptionFilters, setConsumptionFilters] = useState<ConsumptionFilterType>({});
  const [selectedConsumption, setSelectedConsumption] = useState<Consumption | null>(null);
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [summaryPolicyId, setSummaryPolicyId] = useState<string | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useRenewalStats();
  const { data: policies, isLoading: policiesLoading, refetch: refetchRenewals } = useRenewalPolicies(renewalFilters);
  const { data: consumptions, isLoading: consumptionsLoading, refetch: refetchConsumptions } = useConsumptions(consumptionFilters);
  const { data: summary, isLoading: summaryLoading } = useConsumptionSummary(summaryPolicyId);
  const { toast } = useToast();

  // Renewal handlers
  const handleConfigure = (policy: PolicyForRenewal) => {
    setSelectedPolicy(policy);
    setConfigDialogOpen(true);
  };

  const handleViewDetails = (policy: PolicyForRenewal) => {
    toast({
      title: 'Ver detalles',
      description: `Detalles de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleGeneratePdf = (policy: PolicyForRenewal) => {
    toast({
      title: 'Generando PDF',
      description: `Generando PDF de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleSendNow = (policy: PolicyForRenewal) => {
    toast({
      title: 'Enviando renovación',
      description: `Enviando aviso de renovación para póliza ${policy.policy_number}`,
    });
  };

  const handleExport = () => {
    toast({
      title: 'Exportando',
      description: 'Exportando lista de renovaciones...',
    });
  };

  // Consumption handlers
  const handleNewConsumption = () => {
    setSelectedConsumption(null);
    setConsumptionDialogOpen(true);
  };

  const handleEditConsumption = (consumption: Consumption) => {
    setSelectedConsumption(consumption);
    setConsumptionDialogOpen(true);
  };

  const handleViewPolicyConsumptions = (policyId: string) => {
    setConsumptionFilters({ ...consumptionFilters, policy_id: policyId });
    setSummaryPolicyId(policyId);
  };

  // Get policy number for summary
  const summaryPolicyNumber = consumptions?.find(c => c.policy_id === summaryPolicyId)?.policy?.policy_number;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Renovaciones</h1>
          <p className="text-muted-foreground">Gestiona renovaciones y consumos de pólizas</p>
        </div>
      </div>

      {/* Stats */}
      <RenewalStats stats={stats} isLoading={statsLoading} />

      {/* Tabs */}
      <Tabs defaultValue="renewals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="renewals" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Renovaciones
          </TabsTrigger>
          <TabsTrigger value="consumptions" className="gap-2">
            <Receipt className="h-4 w-4" />
            Consumos
          </TabsTrigger>
        </TabsList>

        {/* Renewals Tab */}
        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Renovaciones próximas</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchRenewals()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <RenewalFilters filters={renewalFilters} onFiltersChange={setRenewalFilters} />
              
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
        </TabsContent>

        {/* Consumptions Tab */}
        <TabsContent value="consumptions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-medium">Consumos de Pólizas</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchConsumptions()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Button size="sm" onClick={handleNewConsumption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo consumo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ConsumptionFilters 
                    filters={consumptionFilters} 
                    onFiltersChange={(f) => {
                      setConsumptionFilters(f);
                      // Update summary when filtering by policy
                      if (f.policy_id) {
                        setSummaryPolicyId(f.policy_id);
                      }
                    }} 
                  />
                  
                  <ConsumptionTable
                    consumptions={consumptions}
                    isLoading={consumptionsLoading}
                    onEdit={handleEditConsumption}
                    onViewPolicy={handleViewPolicyConsumptions}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary sidebar */}
            <div className="lg:col-span-1">
              <ConsumptionSummaryCard
                summary={summary}
                isLoading={summaryLoading}
                policyNumber={summaryPolicyNumber || undefined}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConfigureRenewalDialog
        policy={selectedPolicy}
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />

      <ConsumptionFormDialog
        consumption={selectedConsumption}
        open={consumptionDialogOpen}
        onOpenChange={setConsumptionDialogOpen}
      />
    </div>
  );
}
