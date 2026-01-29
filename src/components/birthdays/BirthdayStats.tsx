import { Card, CardContent } from '@/components/ui/card';
import { Cake, CheckCircle, Clock, AlertCircle, PartyPopper } from 'lucide-react';
import type { BirthdayStats as Stats } from '@/hooks/useBirthdays';

interface BirthdayStatsProps {
  stats: Stats;
  monthName: string;
}

export function BirthdayStats({ stats, monthName }: BirthdayStatsProps) {
  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: Cake,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Hoy',
      value: stats.today,
      icon: PartyPopper,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Enviados',
      value: stats.sent,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Pasados sin enviar',
      value: stats.passed,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statItems.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
