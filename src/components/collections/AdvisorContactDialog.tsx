import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Collection, useMarkAsAdvisorContact } from '@/hooks/useCollections';
import { useAuthContext } from '@/contexts/AuthContext';

interface AdvisorContactDialogProps {
  collection: Collection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvisorContactDialog({ collection, open, onOpenChange }: AdvisorContactDialogProps) {
  const { user } = useAuthContext();
  const markAsAdvisorContact = useMarkAsAdvisorContact();
  
  const defaultDate = collection.promised_date 
    ? new Date(collection.promised_date) 
    : addDays(new Date(), 7);
  
  const [promisedDate, setPromisedDate] = useState<Date>(defaultDate);
  const [notes, setNotes] = useState(collection.advisor_notes || '');

  const handleConfirm = async () => {
    if (!user?.id || !promisedDate) return;
    
    await markAsAdvisorContact.mutateAsync({
      collectionId: collection.id,
      promisedDate: format(promisedDate, 'yyyy-MM-dd'),
      notes,
      userId: user.id,
    });
    
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contacto con Asesor</DialogTitle>
          <DialogDescription>
            Registra el contacto del cliente con su asesor y la fecha prometida de pago.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
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
          </div>

          {/* Promised Date */}
          <div className="space-y-2">
            <Label>Fecha prometida de pago *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !promisedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {promisedDate ? (
                    format(promisedDate, 'PPP', { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={promisedDate}
                  onSelect={(date) => date && setPromisedDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas del contacto</Label>
            <Textarea
              id="notes"
              placeholder="Detalles del contacto, acuerdos realizados, observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!promisedDate || markAsAdvisorContact.isPending}
          >
            {markAsAdvisorContact.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
