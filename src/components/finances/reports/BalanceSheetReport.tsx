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

interface BalanceSheetReportProps {
  endDate: string;
}

export function BalanceSheetReport({ endDate }: BalanceSheetReportProps) {
  const { data: accounts, isLoading } = useChartOfAccounts();

  const assetAccounts = accounts?.filter(a => a.class === 'activos') || [];
  const liabilityAccounts = accounts?.filter(a => a.class === 'pasivos') || [];
  const equityAccounts = accounts?.filter(a => a.class === 'patrimonio') || [];

  const totalAssets = assetAccounts
    .filter(a => a.code === '1000')[0]?.balance_usd || 
    assetAccounts.filter(a => a.level >= 3).reduce((sum, a) => sum + a.balance_usd, 0);
  
  const totalLiabilities = liabilityAccounts
    .filter(a => a.code === '2000')[0]?.balance_usd ||
    liabilityAccounts.filter(a => a.level >= 3).reduce((sum, a) => sum + a.balance_usd, 0);
  
  const totalEquity = equityAccounts
    .filter(a => a.code === '3000')[0]?.balance_usd ||
    equityAccounts.filter(a => a.level >= 2).reduce((sum, a) => sum + a.balance_usd, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderAccountGroup = (accountList: typeof accounts, title: string, colorClass: string) => {
    const grouped = accountList?.filter(a => a.level <= 3) || [];
    return (
      <div className="space-y-2">
        <h4 className={`font-semibold text-lg ${colorClass}`}>{title}</h4>
        <div className="space-y-1 pl-4">
          {grouped.map((account) => (
            <div 
              key={account.id} 
              className="flex justify-between"
              style={{ paddingLeft: `${(account.level - 1) * 16}px` }}
            >
              <span className={account.level === 1 ? 'font-semibold' : ''}>
                {account.code} - {account.name}
              </span>
              <span className="font-mono">
                {account.balance_usd !== 0 ? formatCurrency(account.balance_usd) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance General</CardTitle>
        <p className="text-sm text-muted-foreground">
          Al {endDate}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activos */}
        {renderAccountGroup(assetAccounts, 'ACTIVOS', 'text-green-700')}
        <div className="flex justify-between font-bold border-t pt-2">
          <span>TOTAL ACTIVOS</span>
          <span className="font-mono text-green-700">{formatCurrency(totalAssets)}</span>
        </div>

        <div className="border-t-2 pt-4" />

        {/* Pasivos */}
        {renderAccountGroup(liabilityAccounts, 'PASIVOS', 'text-red-700')}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total Pasivos</span>
          <span className="font-mono text-red-700">{formatCurrency(totalLiabilities)}</span>
        </div>

        {/* Patrimonio */}
        {renderAccountGroup(equityAccounts, 'PATRIMONIO', 'text-blue-700')}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total Patrimonio</span>
          <span className="font-mono text-blue-700">{formatCurrency(totalEquity)}</span>
        </div>

        {/* Total Pasivo + Patrimonio */}
        <div className="flex justify-between font-bold text-lg border-2 rounded-lg p-3 bg-muted">
          <span>TOTAL PASIVO + PATRIMONIO</span>
          <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity)}</span>
        </div>

        {/* Verificación */}
        {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01 && (
          <p className="text-destructive text-sm text-center">
            ⚠️ El balance no cuadra. Activos ({formatCurrency(totalAssets)}) ≠ Pasivo + Patrimonio ({formatCurrency(totalLiabilities + totalEquity)})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
