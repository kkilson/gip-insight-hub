import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  FileText, 
  Send, 
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { PolicyForRenewal, RenewalStatus } from '@/hooks/useRenewals';
import { cn } from '@/lib/utils';

interface RenewalTableProps {
  policies: PolicyForRenewal[] | undefined;
  isLoading: boolean;
  onConfigure: (policy: PolicyForRenewal) => void;
  onViewDetails: (policy: PolicyForRenewal) => void;
  onGeneratePdf: (policy: PolicyForRenewal) => void;
  onSendNow: (policy: PolicyForRenewal) => void;
}

const statusConfig: Record<RenewalStatus | 'sin_config', { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  sin_config: { label: 'Sin configurar', variant: 'destructive' },
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  programada: { label: 'Programada', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'outline' },
  completada: { label: 'Completada', variant: 'outline' },
  error: { label: 'Error', variant: 'destructive' },
};

export function RenewalTable({
  policies,
  isLoading,
  onConfigure,
  onViewDetails,
  onGeneratePdf,
  onSendNow,
}: RenewalTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days;
  };

  const getDaysRemainingBadge = (days: number) => {
    if (days <= 7) {
      return <Badge variant="destructive" className="text-xs">{days} días</Badge>;
    }
    if (days <= 15) {
      return <Badge variant="secondary" className="text-xs bg-warning/20 text-warning-foreground">{days} días</Badge>;
    }
    return <span className="text-sm text-muted-foreground">{days} días</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!policies?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No hay renovaciones</h3>
        <p className="text-muted-foreground max-w-sm">
          No se encontraron pólizas que coincidan con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Póliza</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Asesores</TableHead>
            <TableHead>Renovación</TableHead>
            <TableHead className="text-right">Prima Actual</TableHead>
            <TableHead className="text-right">Prima Nueva</TableHead>
            <TableHead className="text-center">Variación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => {
            const status = policy.renewal_config?.status || 'sin_config';
            const statusInfo = statusConfig[status];
            const daysRemaining = getDaysRemaining(policy.end_date);
            const newAmount = policy.renewal_config?.new_amount;
            const currentAmount = policy.premium || 0;
            const hasNewAmount = newAmount !== null && newAmount !== undefined;
            const percentageChange = hasNewAmount && currentAmount > 0
              ? ((newAmount - currentAmount) / currentAmount) * 100
              : null;
            
            const primaryAdvisor = policy.policy_advisors?.find(pa => pa.advisor_role === 'principal')?.advisor;
            const secondaryAdvisor = policy.policy_advisors?.find(pa => pa.advisor_role === 'secundario')?.advisor;

            return (
              <TableRow key={policy.id} className={cn(daysRemaining <= 7 && 'bg-destructive/5')}>
                <TableCell>
                  <div className="font-medium">{policy.policy_number || 'Sin número'}</div>
                  <div className="text-xs text-muted-foreground">
                    {policy.insurer?.short_name || policy.insurer?.name || '-'}
                    {policy.product && ` - ${policy.product.name}`}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {policy.client.first_name} {policy.client.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {policy.client.email || policy.client.phone || policy.client.mobile || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {primaryAdvisor && (
                      <p className="text-xs font-medium">{primaryAdvisor.full_name}</p>
                    )}
                    {secondaryAdvisor && (
                      <p className="text-xs text-muted-foreground">{secondaryAdvisor.full_name}</p>
                    )}
                    {!primaryAdvisor && !secondaryAdvisor && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(policy.end_date), 'dd MMM yyyy', { locale: es })}
                  </div>
                  <div>{getDaysRemainingBadge(daysRemaining)}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(currentAmount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {hasNewAmount ? formatCurrency(newAmount) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {percentageChange !== null ? (
                    <div className={cn(
                      'inline-flex items-center gap-1 text-sm font-medium',
                      percentageChange > 0 ? 'text-destructive' : percentageChange < 0 ? 'text-success' : 'text-muted-foreground'
                    )}>
                      {percentageChange > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : percentageChange < 0 ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      {percentageChange > 0 && '+'}
                      {percentageChange.toFixed(1)}%
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {status === 'sin_config' || status === 'pendiente' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConfigure(policy)}
                        className="gap-1"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Configurar
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(policy)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onGeneratePdf(policy)}
                          title="Generar PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {status === 'programada' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSendNow(policy)}
                            title="Enviar ahora"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
