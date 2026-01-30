import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddExchangeRate } from '@/hooks/useFinances';
import { useAuthContext } from '@/contexts/AuthContext';

const formSchema = z.object({
  currency: z.enum(['USD', 'EUR', 'USDT']),
  source: z.enum(['BCV', 'Binance', 'Kontigo', 'Manual']),
  rate: z.coerce.number().min(0.0001, 'Tasa debe ser mayor a 0'),
  is_manual: z.boolean(),
  manual_reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExchangeRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExchangeRateFormDialog({ open, onOpenChange }: ExchangeRateFormDialogProps) {
  const { user } = useAuthContext();
  const addRate = useAddExchangeRate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: 'USD',
      source: 'BCV',
      rate: 0,
      is_manual: false,
      manual_reason: '',
    },
  });

  const isManual = form.watch('is_manual');

  const onSubmit = (values: FormValues) => {
    addRate.mutate({
      currency: values.currency,
      source: values.source,
      rate: values.rate,
      is_manual: values.is_manual,
      manual_reason: values.is_manual ? values.manual_reason || null : null,
      recorded_by: user?.id || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Tasa de Cambio</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BCV">BCV</SelectItem>
                        <SelectItem value="Binance">Binance</SelectItem>
                        <SelectItem value="Kontigo">Kontigo</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa (VES por 1 unidad) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.0001" placeholder="45.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_manual"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Es tasa manual</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Requiere justificación
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {isManual && (
              <FormField
                control={form.control}
                name="manual_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de tasa manual</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explique por qué se usa una tasa manual..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addRate.isPending}>
                {addRate.isPending ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
