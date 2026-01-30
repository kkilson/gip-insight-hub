import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceDashboard } from '@/components/finances/FinanceDashboard';
import { JournalEntriesTab } from '@/components/finances/JournalEntriesTab';
import { ChartOfAccountsTab } from '@/components/finances/ChartOfAccountsTab';
import { ExchangeRatesTab } from '@/components/finances/ExchangeRatesTab';
import { BudgetsTab } from '@/components/finances/BudgetsTab';
import { ReportsTab } from '@/components/finances/ReportsTab';
import { CostCentersTab } from '@/components/finances/CostCentersTab';

export default function Finances() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground">
          Sistema contable y financiero multimoneda
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="entries">Asientos</TabsTrigger>
          <TabsTrigger value="accounts">Plan de Cuentas</TabsTrigger>
          <TabsTrigger value="rates">Tasas de Cambio</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
          <TabsTrigger value="cost-centers">Centros de Costos</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinanceDashboard />
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <ExchangeRatesTab />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetsTab />
        </TabsContent>

        <TabsContent value="cost-centers" className="space-y-4">
          <CostCentersTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
