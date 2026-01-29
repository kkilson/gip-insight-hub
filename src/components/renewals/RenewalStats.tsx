import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Calendar, Clock, DollarSign, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RenewalStatsProps {
  stats: {
    total30Days: number;
    thisWeek: number;
    totalPremium: number;
    withoutConfig: number;
    programadas: number;
    enviadas: number;
  } | undefined;
  isLoading: boolean;
}

export function RenewalStats({ stats, isLoading }: RenewalStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      title: 'Próximas 30 días',
      value: stats?.total30Days || 0,
      icon: RefreshCw,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Esta semana',
      value: stats?.thisWeek || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      alert: (stats?.thisWeek || 0) > 0,
    },
    {
      title: 'Programadas',
      value: stats?.programadas || 0,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Enviadas',
      value: stats?.enviadas || 0,
      icon: Send,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Sin configurar',
      value: stats?.withoutConfig || 0,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      alert: (stats?.withoutConfig || 0) > 0,
    },
    {
      title: 'Prima Total',
      value: formatCurrency(stats?.totalPremium || 0),
      icon: DollarSign,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      isText: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={cn(stat.alert && 'border-destructive/50')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-1.5 rounded-md', stat.bgColor)}>
                  <Icon className={cn('h-4 w-4', stat.color)} />
                </div>
                <span className="text-xs text-muted-foreground">{stat.title}</span>
              </div>
              <p className={cn('text-2xl font-bold', stat.alert && 'text-destructive')}>
                {stat.isText ? stat.value : stat.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
