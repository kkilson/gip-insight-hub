import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useChartOfAccounts } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

interface TrialBalanceReportProps {
  startDate: string;
  endDate: string;
}

export function TrialBalanceReport({ startDate, endDate }: TrialBalanceReportProps) {
  const { data: accounts, isLoading } = useChartOfAccounts();

  const accountsWithBalances = accounts?.filter(a => a.balance_usd !== 0 || a.level >= 3) || [];
  
  const totalDebit = accountsWithBalances
    .filter(a => a.nature === 'deudora' && a.balance_usd > 0)
    .reduce((sum, a) => sum + a.balance_usd, 0);
  
  const totalCredit = accountsWithBalances
    .filter(a => a.nature === 'acreedora' && a.balance_usd > 0)
    .reduce((sum, a) => sum + a.balance_usd, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance de Comprobación</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance de Comprobación</CardTitle>
        <p className="text-sm text-muted-foreground">
          Período: {startDate} al {endDate}
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right w-[130px]">Saldo Deudor</TableHead>
              <TableHead className="text-right w-[130px]">Saldo Acreedor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsWithBalances.map((account) => {
              const isDebit = account.nature === 'deudora';
              return (
                <TableRow key={account.id} className={account.level === 1 ? 'font-semibold bg-muted/50' : ''}>
                  <TableCell className="font-mono">{account.code}</TableCell>
                  <TableCell style={{ paddingLeft: `${(account.level - 1) * 16}px` }}>
                    {account.name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {isDebit && account.balance_usd > 0 ? formatCurrency(account.balance_usd) : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {!isDebit && account.balance_usd > 0 ? formatCurrency(account.balance_usd) : ''}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <tfoot className="bg-muted font-bold">
            <tr>
              <td colSpan={2} className="p-2 text-right">TOTALES:</td>
              <td className="p-2 text-right font-mono">{formatCurrency(totalDebit)}</td>
              <td className="p-2 text-right font-mono">{formatCurrency(totalCredit)}</td>
            </tr>
          </tfoot>
        </Table>

        {Math.abs(totalDebit - totalCredit) > 0.01 && (
          <p className="mt-4 text-destructive text-sm">
            ⚠️ El balance no cuadra. Diferencia: {formatCurrency(Math.abs(totalDebit - totalCredit))}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
