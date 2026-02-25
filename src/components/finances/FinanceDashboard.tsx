import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, HandCoins, Landmark } from 'lucide-react';
import { useFinanceIncome, useFinanceExpenses } from '@/hooks/useFinances';
import { useFinanceDebts, useFinanceLoans } from '@/hooks/useFinanceDebtsLoans';

const formatUSD = (n: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
const formatVES = (n: number) => `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(n)}`;

export function FinanceDashboard() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: income } = useFinanceIncome(currentMonth);
  const { data: expenses } = useFinanceExpenses(currentMonth);
  const { data: debts } = useFinanceDebts();
  const { data: loans } = useFinanceLoans();

  const totalIncomeUSD = income?.reduce((s, i) => s + i.amount_usd, 0) || 0;
  const totalIncomeVES = income?.reduce((s, i) => s + i.amount_ves, 0) || 0;
  const totalExpenseUSD = expenses?.reduce((s, e) => s + e.amount_usd, 0) || 0;
  const totalExpenseVES = expenses?.reduce((s, e) => s + e.amount_ves, 0) || 0;
  
  const balanceUSD = totalIncomeUSD - totalExpenseUSD;
  const balanceVES = totalIncomeVES - totalExpenseVES;

  const unpaidDebts = debts?.filter(d => !d.is_paid) || [];
  const totalDebtUSD = unpaidDebts.reduce((s, d) => s + d.amount_usd, 0);
  const totalDebtVES = unpaidDebts.reduce((s, d) => s + d.amount_ves, 0);

  const uncollectedLoans = loans?.filter(l => !l.is_collected) || [];
  const totalLoanUSD = uncollectedLoans.reduce((s, l) => s + l.amount_usd, 0);
  const totalLoanVES = uncollectedLoans.reduce((s, l) => s + l.amount_ves, 0);

  const cards = [
    {
      question: '¿Cuánto me ingresó?',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      usd: totalIncomeUSD,
      ves: totalIncomeVES,
      valueColor: 'text-green-600',
    },
    {
      question: '¿Cuánto me gasté?',
      icon: TrendingDown,
      iconColor: 'text-red-600',
      usd: totalExpenseUSD,
      ves: totalExpenseVES,
      valueColor: 'text-red-600',
    },
    {
      question: '¿Cuánto me quedó?',
      icon: Wallet,
      iconColor: balanceUSD >= 0 ? 'text-green-600' : 'text-red-600',
      usd: balanceUSD,
      ves: balanceVES,
      valueColor: balanceUSD >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      question: '¿Cuánto debo?',
      icon: Landmark,
      iconColor: 'text-red-600',
      usd: totalDebtUSD,
      ves: totalDebtVES,
      valueColor: 'text-red-600',
    },
    {
      question: '¿Cuánto me deben?',
      icon: HandCoins,
      iconColor: 'text-amber-600',
      usd: totalLoanUSD,
      ves: totalLoanVES,
      valueColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Resumen del mes: {format(new Date(), 'MMMM yyyy')}</h2>
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.question}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.question}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueColor}`}>{formatUSD(card.usd)}</div>
              <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>{formatVES(card.ves)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
