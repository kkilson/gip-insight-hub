import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionStats } from '@/hooks/useCollections';
import { DollarSign, Clock, AlertTriangle, PhoneCall } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CollectionStats() {
  const { data: stats, isLoading } = useCollectionStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats?.totalAmount || 0)} en cobranzas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats?.overdue || 0}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats?.overdueAmount || 0)} atrasado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.upcoming || 0}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats?.upcomingAmount || 0)} por cobrar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Gestión</CardTitle>
          <PhoneCall className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{stats?.contactAdvisor || 0}</div>
          <p className="text-xs text-muted-foreground">Contacto con asesor</p>
        </CardContent>
      </Card>
    </div>
  );
}
