import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collection, calculateDaysOverdue, CollectionStatus } from '@/hooks/useCollections';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CollectionDetailDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<CollectionStatus, string> = {
  pendiente: 'Pendiente',
  contacto_asesor: 'Contacto Asesor',
  cobrada: 'Cobrada',
};

const paymentFrequencyLabels: Record<string, string> = {
  mensual: 'Mensual',
  mensual_10_cuotas: 'Mensual (10 cuotas)',
  mensual_12_cuotas: 'Mensual (12 cuotas)',
  bimensual: 'Bimensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export function CollectionDetailDialog({ collection, open, onOpenChange }: CollectionDetailDialogProps) {
  const { data: history } = useQuery({
    queryKey: ['collection-history', collection.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_history')
        .select('*')
        .eq('collection_id', collection.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const daysOverdue = calculateDaysOverdue(collection.due_date, collection.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Cobranza</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Summary */}
          <div className="flex items-center justify-between">
            <Badge
              variant={
                collection.status === 'cobrada'
                  ? 'default'
                  : collection.status === 'contacto_asesor'
                  ? 'secondary'
                  : 'destructive'
              }
              className="text-sm"
            >
              {statusLabels[collection.status]}
            </Badge>
            {collection.status !== 'cobrada' && (
              <span className={`text-sm ${daysOverdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {daysOverdue > 0
                  ? `${daysOverdue} días de mora`
                  : daysOverdue === 0
                  ? 'Vence hoy'
                  : `Vence en ${Math.abs(daysOverdue)} días`}
              </span>
            )}
          </div>

          {/* Client Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Cliente</h4>
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="font-medium">
                {collection.client?.first_name} {collection.client?.last_name}
              </p>
              {collection.client?.email && (
                <p className="text-sm text-muted-foreground">{collection.client.email}</p>
              )}
              {(collection.client?.phone || collection.client?.mobile) && (
                <p className="text-sm text-muted-foreground">
                  {collection.client.phone || collection.client.mobile}
                </p>
              )}
            </div>
          </div>

          {/* Policy Info */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Póliza</h4>
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="font-mono font-medium">{collection.policy?.policy_number || 'Sin número'}</p>
              <p className="text-sm text-muted-foreground">
                {collection.policy?.insurer?.name || 'Sin aseguradora'}
                {collection.policy?.product?.name && ` - ${collection.policy.product.name}`}
              </p>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monto</p>
              <p className="font-medium text-lg">{formatCurrency(collection.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frecuencia</p>
              <p className="font-medium">
                {paymentFrequencyLabels[collection.payment_frequency] || collection.payment_frequency}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
              <p className="font-medium">
                {format(new Date(collection.due_date), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            {collection.promised_date && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha prometida</p>
                <p className="font-medium">
                  {format(new Date(collection.promised_date), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
          </div>

          {/* Advisor Notes */}
          {collection.advisor_notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notas del asesor</h4>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm whitespace-pre-wrap">{collection.advisor_notes}</p>
              </div>
            </div>
          )}

          {/* History */}
          {history && history.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Historial</h4>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {h.previous_status && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {statusLabels[h.previous_status as CollectionStatus]}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {statusLabels[h.new_status as CollectionStatus]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.changed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </span>
                    </div>
                    {h.notes && (
                      <p className="text-muted-foreground">{h.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
