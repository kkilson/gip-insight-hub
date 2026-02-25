import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceDashboard } from '@/components/finances/FinanceDashboard';
import { BudgetsTab } from '@/components/finances/BudgetsTab';
import { IncomeTab } from '@/components/finances/IncomeTab';
import { ExpensesTab } from '@/components/finances/ExpensesTab';
import { InvoicesTab } from '@/components/finances/InvoicesTab';
import { ExchangeRatesTab } from '@/components/finances/ExchangeRatesTab';
import { DebtsTab } from '@/components/finances/DebtsTab';
import { LoansTab } from '@/components/finances/LoansTab';

export default function Finances() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="p-6 pb-0 shrink-0">
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground">
          Gestión financiera: presupuestos, ingresos, egresos, deudas y préstamos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden px-6 pt-4">
        <TabsList className="flex-wrap h-auto gap-1 shrink-0">
          <TabsTrigger value="dashboard">Resumen</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Egresos</TabsTrigger>
          <TabsTrigger value="invoices">Facturación</TabsTrigger>
          <TabsTrigger value="debts">Deudas</TabsTrigger>
          <TabsTrigger value="loans">Préstamos</TabsTrigger>
          <TabsTrigger value="rates">Tasas de Cambio</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mt-4 pb-6">
          <TabsContent value="dashboard" className="mt-0"><FinanceDashboard /></TabsContent>
          <TabsContent value="budgets" className="mt-0"><BudgetsTab /></TabsContent>
          <TabsContent value="income" className="mt-0"><IncomeTab /></TabsContent>
          <TabsContent value="expenses" className="mt-0"><ExpensesTab /></TabsContent>
          <TabsContent value="invoices" className="mt-0"><InvoicesTab /></TabsContent>
          <TabsContent value="debts" className="mt-0"><DebtsTab /></TabsContent>
          <TabsContent value="loans" className="mt-0"><LoansTab /></TabsContent>
          <TabsContent value="rates" className="mt-0"><ExchangeRatesTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
