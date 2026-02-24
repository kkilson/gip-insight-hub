import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Receipt, CreditCard } from 'lucide-react';
import { useFinanceIncome, useFinanceExpenses, useFinanceReceivables, usePayables } from '@/hooks/useFinances';

const formatUSD = (n: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
const formatVES = (n: number) => `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(n)}`;

export function FinanceDashboard() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: income } = useFinanceIncome(currentMonth);
  const { data: expenses } = useFinanceExpenses(currentMonth);
  const { data: receivables } = useFinanceReceivables();
  const { data: payables } = usePayables();

  const totalIncomeUSD = income?.reduce((s, i) => s + i.amount_usd, 0) || 0;
  const totalIncomeVES = income?.reduce((s, i) => s + i.amount_ves, 0) || 0;
  const totalExpenseUSD = expenses?.reduce((s, e) => s + e.amount_usd, 0) || 0;
  const totalExpenseVES = expenses?.reduce((s, e) => s + e.amount_ves, 0) || 0;
  const totalReceivableUSD = receivables?.filter(r => !r.is_collected).reduce((s, r) => s + r.amount_usd, 0) || 0;
  const totalReceivableVES = receivables?.filter(r => !r.is_collected).reduce((s, r) => s + r.amount_ves, 0) || 0;
  const totalPayableUSD = payables?.reduce((s, p) => s + p.amount_usd, 0) || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Resumen del mes: {format(new Date(), 'MMMM yyyy')}</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatUSD(totalIncomeUSD)}</div>
            <p className="text-xs text-muted-foreground">{formatVES(totalIncomeVES)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Egresos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatUSD(totalExpenseUSD)}</div>
            <p className="text-xs text-muted-foreground">{formatVES(totalExpenseVES)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatUSD(totalReceivableUSD)}</div>
            <p className="text-xs text-muted-foreground">{formatVES(totalReceivableVES)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cuentas por Pagar</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatUSD(totalPayableUSD)}</div>
            <p className="text-xs text-muted-foreground">Presupuesto pendiente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Balance Neto del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-muted-foreground">USD</p>
              <p className={`text-2xl font-bold ${totalIncomeUSD - totalExpenseUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatUSD(totalIncomeUSD - totalExpenseUSD)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">VES</p>
              <p className={`text-2xl font-bold ${totalIncomeVES - totalExpenseVES >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatVES(totalIncomeVES - totalExpenseVES)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
