import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceDashboard } from '@/components/finances/FinanceDashboard';
import { BudgetsTab } from '@/components/finances/BudgetsTab';
import { IncomeTab } from '@/components/finances/IncomeTab';
import { ExpensesTab } from '@/components/finances/ExpensesTab';
import { InvoicesTab } from '@/components/finances/InvoicesTab';
import { ReceivablesTab } from '@/components/finances/ReceivablesTab';
import { PayablesTab } from '@/components/finances/PayablesTab';
import { ExchangeRatesTab } from '@/components/finances/ExchangeRatesTab';

export default function Finances() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground">
          Gestión financiera: presupuestos, ingresos, egresos y facturación
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Resumen</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Egresos</TabsTrigger>
          <TabsTrigger value="invoices">Facturación</TabsTrigger>
          <TabsTrigger value="receivables">Cuentas x Cobrar</TabsTrigger>
          <TabsTrigger value="payables">Cuentas x Pagar</TabsTrigger>
          <TabsTrigger value="rates">Tasas de Cambio</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><FinanceDashboard /></TabsContent>
        <TabsContent value="budgets"><BudgetsTab /></TabsContent>
        <TabsContent value="income"><IncomeTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="receivables"><ReceivablesTab /></TabsContent>
        <TabsContent value="payables"><PayablesTab /></TabsContent>
        <TabsContent value="rates"><ExchangeRatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
