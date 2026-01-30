import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChartOfAccounts } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

interface IncomeStatementReportProps {
  startDate: string;
  endDate: string;
}

export function IncomeStatementReport({ startDate, endDate }: IncomeStatementReportProps) {
  const { data: accounts, isLoading } = useChartOfAccounts();

  const incomeAccounts = accounts?.filter(a => a.class === 'ingresos' && a.level >= 3) || [];
  const costAccounts = accounts?.filter(a => a.class === 'costos' && a.level >= 2) || [];
  const expenseAccounts = accounts?.filter(a => a.class === 'gastos' && a.level >= 2) || [];

  const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.balance_usd, 0);
  const totalCosts = costAccounts.reduce((sum, a) => sum + a.balance_usd, 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance_usd, 0);
  const grossProfit = totalIncome - totalCosts;
  const netIncome = grossProfit - totalExpenses;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Resultados</CardTitle>
        <p className="text-sm text-muted-foreground">
          Período: {startDate} al {endDate}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ingresos */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-green-700">INGRESOS</h4>
          <div className="space-y-1 pl-4">
            {incomeAccounts.map((account) => (
              <div key={account.id} className="flex justify-between">
                <span>{account.code} - {account.name}</span>
                <span className="font-mono">{formatCurrency(account.balance_usd)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold border-t mt-2 pt-2">
            <span>Total Ingresos</span>
            <span className="font-mono text-green-700">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        {/* Costos */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-orange-700">COSTOS</h4>
          <div className="space-y-1 pl-4">
            {costAccounts.map((account) => (
              <div key={account.id} className="flex justify-between">
                <span>{account.code} - {account.name}</span>
                <span className="font-mono">{formatCurrency(account.balance_usd)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold border-t mt-2 pt-2">
            <span>Total Costos</span>
            <span className="font-mono text-orange-700">{formatCurrency(totalCosts)}</span>
          </div>
        </div>

        {/* Utilidad Bruta */}
        <div className="flex justify-between font-bold text-lg border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
          <span>UTILIDAD BRUTA</span>
          <span className={`font-mono ${grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(grossProfit)}
          </span>
        </div>

        {/* Gastos */}
        <div>
          <h4 className="font-semibold text-lg mb-2 text-amber-700">GASTOS OPERATIVOS</h4>
          <div className="space-y-1 pl-4">
            {expenseAccounts.map((account) => (
              <div key={account.id} className="flex justify-between">
                <span>{account.code} - {account.name}</span>
                <span className="font-mono">{formatCurrency(account.balance_usd)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold border-t mt-2 pt-2">
            <span>Total Gastos</span>
            <span className="font-mono text-amber-700">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Utilidad Neta */}
        <div className={`flex justify-between font-bold text-xl border-2 rounded-lg p-4 ${
          netIncome >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
        }`}>
          <span>{netIncome >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA'}</span>
          <span className={`font-mono ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(netIncome)}
          </span>
        </div>

        {/* Margen */}
        <div className="text-sm text-muted-foreground text-center">
          Margen de utilidad: {totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0}%
        </div>
      </CardContent>
    </Card>
  );
}
