import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Printer } from 'lucide-react';
import { useJournalEntries, useChartOfAccounts } from '@/hooks/useFinances';
import { TrialBalanceReport } from './reports/TrialBalanceReport';
import { IncomeStatementReport } from './reports/IncomeStatementReport';
import { BalanceSheetReport } from './reports/BalanceSheetReport';
import { GeneralLedgerReport } from './reports/GeneralLedgerReport';

export function ReportsTab() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportType, setReportType] = useState('trial-balance');
  
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: es }),
    });
  }
  
  const startDate = format(startOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(selectedMonth + '-01')), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Report Types */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trial-balance">Balance de Comprobación</TabsTrigger>
          <TabsTrigger value="income-statement">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance General</TabsTrigger>
          <TabsTrigger value="general-ledger">Libro Mayor</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="mt-4">
          <TrialBalanceReport startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="income-statement" className="mt-4">
          <IncomeStatementReport startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="balance-sheet" className="mt-4">
          <BalanceSheetReport endDate={endDate} />
        </TabsContent>

        <TabsContent value="general-ledger" className="mt-4">
          <GeneralLedgerReport startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
