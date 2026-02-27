import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, FileCheck, Users, TrendingUp } from 'lucide-react';
import { useCommissionBatches } from '@/hooks/useCommissions';

export function CommissionDashboard() {
  const { data: batches } = useCommissionBatches();

  const totalCommission = batches?.reduce((s, b) => s + Number(b.total_commission), 0) || 0;
  const totalPremium = batches?.reduce((s, b) => s + Number(b.total_premium), 0) || 0;
  const assignedBatches = batches?.filter(b => b.status === 'asignado') || [];
  const pendingBatches = batches?.filter(b => b.status !== 'asignado') || [];
  const agencyMargin = totalCommission > 0 ? ((totalCommission / totalPremium) * 100) : 0;

  const stats = [
    { label: 'Comisiones Recibidas', value: `$${totalCommission.toLocaleString('es', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Lotes Procesados', value: assignedBatches.length, icon: FileCheck, color: 'text-blue-500' },
    { label: 'Lotes Pendientes', value: pendingBatches.length, icon: Users, color: 'text-amber-500' },
    { label: 'Margen Agencia', value: `${agencyMargin.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Card key={i}>
          <CardContent className="p-4 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
