import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceDashboardMetrics, useLatestExchangeRates } from '@/hooks/useFinances';
import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export function FinanceDashboard() {
  const [period, setPeriod] = useState('current-month');
  
  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        };
      case 'last-3-months':
        return {
          start: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'year':
        return {
          start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'),
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
    }
  };
  
  const dates = getPeriodDates();
  const { data: metrics, isLoading } = useFinanceDashboardMetrics(dates.start, dates.end);
  const { data: latestRates } = useLatestExchangeRates();
  
  const bcvRate = latestRates?.['USD_BCV']?.rate || 0;

  const metricCards = [
    {
      title: '¿Cuánto ingresó?',
      value: metrics?.totalIncome || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: metrics?.incomeChange,
    },
    {
      title: '¿Cuánto salió?',
      value: metrics?.totalExpenses || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: metrics?.expenseChange,
    },
    {
      title: '¿Cuánto tengo?',
      value: metrics?.cashAvailable || 0,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '¿Cuánto debo?',
      value: metrics?.accountsPayable || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: '¿Cuánto me deben?',
      value: metrics?.accountsReceivable || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector & Exchange Rates */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Mes actual</SelectItem>
            <SelectItem value="last-month">Mes anterior</SelectItem>
            <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
            <SelectItem value="year">Año actual</SelectItem>
          </SelectContent>
        </Select>

        {bcvRate > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Tasa BCV:</span>
            <span className="font-semibold">1 USD = {bcvRate.toLocaleString('es-VE')} Bs</span>
          </div>
        )}
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(card.value)}
                    </div>
                    {card.change !== undefined && card.change !== 0 && (
                      <p className={`text-xs flex items-center mt-1 ${
                        card.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(card.change).toFixed(1)}% vs período anterior
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado del Período</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className={`text-3xl font-bold ${
                (metrics?.totalIncome || 0) - (metrics?.totalExpenses || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatCurrency((metrics?.totalIncome || 0) - (metrics?.totalExpenses || 0))}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {(metrics?.totalIncome || 0) - (metrics?.totalExpenses || 0) >= 0
                ? 'Utilidad'
                : 'Pérdida'} del período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capital de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(
                  (metrics?.cashAvailable || 0) + (metrics?.accountsReceivable || 0) - (metrics?.accountsPayable || 0)
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Efectivo + CxC - CxP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold">
                  {metrics?.totalIncome
                    ? (((metrics.totalIncome - metrics.totalExpenses) / metrics.totalIncome) * 100).toFixed(1)
                    : '0'}%
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ratio de Liquidez</p>
              {isLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <p className="text-xl font-semibold">
                  {metrics?.accountsPayable
                    ? (((metrics.cashAvailable || 0) + (metrics.accountsReceivable || 0)) / metrics.accountsPayable).toFixed(2)
                    : '∞'}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="text-xl font-semibold">
                {format(new Date(dates.start), 'MMM yyyy', { locale: es })}
                {dates.start !== dates.end && ` - ${format(new Date(dates.end), 'MMM yyyy', { locale: es })}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
