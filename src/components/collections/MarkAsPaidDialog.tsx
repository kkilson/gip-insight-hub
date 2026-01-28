import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collection, useMarkAsPaid, calculateNextPaymentDate } from '@/hooks/useCollections';
import { useAuthContext } from '@/contexts/AuthContext';

interface MarkAsPaidDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarkAsPaidDialog({ collection, open, onOpenChange }: MarkAsPaidDialogProps) {
  const { user } = useAuthContext();
  const markAsPaid = useMarkAsPaid();

  const nextPaymentDate = calculateNextPaymentDate(
    collection.due_date,
    collection.payment_frequency
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleConfirm = async () => {
    if (!user?.id) return;
    
    await markAsPaid.mutateAsync({
      collectionId: collection.id,
      userId: user.id,
    });
    
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Marcar como cobrada?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Esta acción registrará el pago de la cobranza y actualizará la fecha del próximo pago.
              </p>
              <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">
                    {collection.client?.first_name} {collection.client?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Póliza:</span>
                  <span className="font-mono">{collection.policy?.policy_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-medium">{formatCurrency(collection.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próximo pago:</span>
                  <span>{format(nextPaymentDate, 'dd MMM yyyy', { locale: es })}</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={markAsPaid.isPending}
          >
            {markAsPaid.isPending ? 'Registrando...' : 'Confirmar pago'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
