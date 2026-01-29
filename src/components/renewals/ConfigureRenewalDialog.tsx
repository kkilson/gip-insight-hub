import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { PolicyForRenewal, useUpsertRenewalConfig } from '@/hooks/useRenewals';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ConfigureRenewalDialogProps {
  policy: PolicyForRenewal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigureRenewalDialog({ policy, open, onOpenChange }: ConfigureRenewalDialogProps) {
  const [newAmount, setNewAmount] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const upsertMutation = useUpsertRenewalConfig();

  // Reset form when policy changes
  useEffect(() => {
    if (policy) {
      setNewAmount(policy.renewal_config?.new_amount?.toString() || '');
      setNotes('');
    }
  }, [policy]);

  if (!policy) return null;

  const currentAmount = policy.premium || 0;
  const parsedNewAmount = parseFloat(newAmount) || 0;
  const hasNewAmount = newAmount !== '' && !isNaN(parsedNewAmount);
  const difference = hasNewAmount ? parsedNewAmount - currentAmount : 0;
  const percentage = hasNewAmount && currentAmount > 0
    ? ((parsedNewAmount - currentAmount) / currentAmount) * 100
    : 0;

  const renewalDate = new Date(policy.end_date);
  const scheduledSendDate = subDays(renewalDate, 30);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSave = async () => {
    if (!hasNewAmount) {
      toast({
        title: 'Error',
        description: 'Ingresa el monto de la nueva prima',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        policy_id: policy.id,
        renewal_date: policy.end_date,
        current_amount: currentAmount,
        new_amount: parsedNewAmount,
        status: 'programada',
        scheduled_send_date: format(scheduledSendDate, 'yyyy-MM-dd'),
        notes: notes || undefined,
      });

      toast({
        title: 'Renovación configurada',
        description: `El envío está programado para el ${format(scheduledSendDate, 'dd MMMM yyyy', { locale: es })}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Renovación</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">
                  {policy.client.first_name} {policy.client.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {policy.insurer?.name || '-'} - {policy.product?.name || '-'}
                </p>
              </div>
              <Badge variant="outline">{policy.policy_number || 'Sin número'}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Fecha de renovación: <strong>{format(renewalDate, 'dd MMMM yyyy', { locale: es })}</strong></span>
            </div>
          </div>

          <Separator />

          {/* Current premium */}
          <div className="space-y-2">
            <Label>Prima Anual Actual</Label>
            <div className="text-2xl font-bold">
              {formatCurrency(currentAmount)}
            </div>
          </div>

          {/* New premium input */}
          <div className="space-y-2">
            <Label htmlFor="new-amount">Prima Anual Nuevo Período (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="pl-10 text-lg"
              />
            </div>
          </div>

          {/* Comparison preview */}
          {hasNewAmount && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Vista previa de comparativa</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Prima actual</p>
                  <p className="font-semibold">{formatCurrency(currentAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prima nueva</p>
                  <p className="font-semibold">{formatCurrency(parsedNewAmount)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Diferencia</p>
                  <p className={cn(
                    'font-semibold',
                    difference > 0 ? 'text-destructive' : difference < 0 ? 'text-success' : ''
                  )}>
                    {difference > 0 && '+'}
                    {formatCurrency(difference)}
                  </p>
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full',
                  percentage > 0 ? 'bg-destructive/10 text-destructive' : 
                  percentage < 0 ? 'bg-success/10 text-success' : 
                  'bg-muted text-muted-foreground'
                )}>
                  {percentage > 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : percentage < 0 ? (
                    <TrendingDown className="h-5 w-5" />
                  ) : (
                    <Minus className="h-5 w-5" />
                  )}
                  {percentage > 0 && '+'}
                  {percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Scheduled send info */}
          {hasNewAmount && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-info/10 p-3 rounded-lg">
              <Calendar className="h-4 w-4 text-info" />
              <span>
                El aviso se enviará automáticamente el <strong>{format(scheduledSendDate, 'dd MMMM yyyy', { locale: es })}</strong> (30 días antes)
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsertMutation.isPending || !hasNewAmount}>
            {upsertMutation.isPending ? 'Guardando...' : 'Confirmar y programar envío'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
