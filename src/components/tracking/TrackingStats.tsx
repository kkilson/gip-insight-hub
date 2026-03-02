import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface TrackingStatsProps {
  cases: any[];
}

export function TrackingStats({ cases }: TrackingStatsProps) {
  const open = cases.filter((c) => c.status === 'abierto').length;
  const inProgress = cases.filter((c) => c.status === 'en_progreso').length;
  const completed = cases.filter((c) => c.status === 'completado').length;
  const waiting = cases.filter((c) => c.status === 'en_espera').length;

  const stats = [
    { label: 'Abiertos', value: open, icon: FolderOpen, color: 'text-blue-600' },
    { label: 'En Progreso', value: inProgress, icon: Clock, color: 'text-amber-600' },
    { label: 'En Espera', value: waiting, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Completados', value: completed, icon: CheckCircle, color: 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
