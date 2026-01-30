import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collection, CollectionStatus, useRevertToPending } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';

interface ChangeStatusDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<CollectionStatus, string> = {
  pendiente: 'Pendiente',
  contacto_asesor: 'Contacto Asesor',
  cobrada: 'Cobrada',
};

export function ChangeStatusDialog({ collection, open, onOpenChange }: ChangeStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<CollectionStatus>('pendiente');
  const [reason, setReason] = useState('');
  const { user } = useAuth();
  const revertToPending = useRevertToPending();

  // Get available status options based on current status
  const getAvailableStatuses = (): CollectionStatus[] => {
    // From any status, can go back to pendiente
    if (collection.status === 'cobrada' || collection.status === 'contacto_asesor') {
      return ['pendiente'];
    }
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async () => {
    if (!user?.id || !newStatus) return;

    if (newStatus === 'pendiente') {
      await revertToPending.mutateAsync({
        collectionId: collection.id,
        userId: user.id,
      });
    }

    onOpenChange(false);
    setReason('');
    setNewStatus('pendiente');
  };

  const isPending = revertToPending.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Estado de Cobranza</DialogTitle>
          <DialogDescription>
            Cambia el estado de la cobranza de{' '}
            <span className="font-medium">{statusLabels[collection.status]}</span> a un nuevo estado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Estado actual</Label>
            <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              {statusLabels[collection.status]}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">Nuevo estado</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as CollectionStatus)}>
              <SelectTrigger id="new-status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del cambio (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Describe el motivo del cambio de estado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || availableStatuses.length === 0}>
            {isPending ? 'Guardando...' : 'Cambiar Estado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
