import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useActiveCostCenters, useLatestExchangeRates, useLeafAccounts, type JournalEntry, type JournalEntryLine } from '@/hooks/useFinances';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getUserFriendlyError } from '@/lib/errorMessages';

const lineSchema = z.object({
  account_id: z.string().min(1, 'Cuenta requerida'),
  transaction_type: z.enum(['deposito', 'retiro', 'transferencia', 'pago', 'cobro', 'ajuste']),
  applies_igtf: z.boolean(),
  debit_usd: z.coerce.number().min(0),
  credit_usd: z.coerce.number().min(0),
  description: z.string().optional(),
});

const formSchema = z.object({
  entry_date: z.string().min(1, 'Fecha requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  base_currency: z.enum(['USD', 'VES', 'EUR', 'USDT']),
  exchange_rate_source: z.enum(['BCV', 'Binance', 'Kontigo', 'Manual']),
  exchange_rate: z.coerce.number().min(0.0001, 'Tasa requerida'),
  cost_center_id: z.string().optional(),
  status: z.enum(['borrador', 'publicado']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JournalEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
}

interface LineItem {
  id: string;
  account_id: string;
  transaction_type: 'deposito' | 'retiro' | 'transferencia' | 'pago' | 'cobro' | 'ajuste';
  applies_igtf: boolean;
  debit_usd: number;
  credit_usd: number;
  description: string;
}

export function JournalEntryFormDialog({ open, onOpenChange, entry }: JournalEntryFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isEditing = !!entry;
  
  const { data: accounts } = useLeafAccounts();
  const { data: costCenters } = useActiveCostCenters();
  const { data: latestRates } = useLatestExchangeRates();
  
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', account_id: '', transaction_type: 'pago', applies_igtf: false, debit_usd: 0, credit_usd: 0, description: '' },
    { id: '2', account_id: '', transaction_type: 'pago', applies_igtf: false, debit_usd: 0, credit_usd: 0, description: '' },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      base_currency: 'USD',
      exchange_rate_source: 'BCV',
      exchange_rate: 1,
      cost_center_id: '',
      status: 'publicado',
      notes: '',
    },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        entry_date: entry.entry_date,
        description: entry.description,
        base_currency: entry.base_currency,
        exchange_rate_source: entry.exchange_rate_source,
        exchange_rate: entry.exchange_rate,
        cost_center_id: entry.cost_center_id || '',
        status: entry.status === 'cerrado' ? 'publicado' : entry.status,
        notes: entry.notes || '',
      });
      if (entry.lines) {
        setLines(entry.lines.map(l => ({
          id: l.id,
          account_id: l.account_id,
          transaction_type: l.transaction_type,
          applies_igtf: l.applies_igtf,
          debit_usd: l.debit_usd,
          credit_usd: l.credit_usd,
          description: l.description || '',
        })));
      }
    } else {
      form.reset({
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        base_currency: 'USD',
        exchange_rate_source: 'BCV',
        exchange_rate: latestRates?.['USD_BCV']?.rate || 1,
        cost_center_id: '',
        status: 'publicado',
        notes: '',
      });
      setLines([
        { id: '1', account_id: '', transaction_type: 'pago', applies_igtf: false, debit_usd: 0, credit_usd: 0, description: '' },
        { id: '2', account_id: '', transaction_type: 'pago', applies_igtf: false, debit_usd: 0, credit_usd: 0, description: '' },
      ]);
    }
  }, [entry, form, latestRates]);

  // Watch source to update rate
  const selectedSource = form.watch('exchange_rate_source');
  const selectedCurrency = form.watch('base_currency');
  
  useEffect(() => {
    if (selectedSource !== 'Manual' && latestRates) {
      const key = `${selectedCurrency}_${selectedSource}`;
      const rate = latestRates[key]?.rate;
      if (rate) {
        form.setValue('exchange_rate', rate);
      }
    }
  }, [selectedSource, selectedCurrency, latestRates, form]);

  const addLine = () => {
    setLines([...lines, {
      id: Date.now().toString(),
      account_id: '',
      transaction_type: 'pago',
      applies_igtf: false,
      debit_usd: 0,
      credit_usd: 0,
      description: '',
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof LineItem, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalDebit = lines.reduce((sum, l) => sum + l.debit_usd, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit_usd, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const exchangeRate = values.exchange_rate;
      const entryData = {
        entry_date: values.entry_date,
        description: values.description,
        base_currency: values.base_currency,
        exchange_rate_source: values.exchange_rate_source,
        exchange_rate: exchangeRate,
        cost_center_id: values.cost_center_id || null,
        status: values.status,
        notes: values.notes || null,
        total_debit_usd: totalDebit,
        total_credit_usd: totalCredit,
        total_debit_ves: totalDebit * exchangeRate,
        total_credit_ves: totalCredit * exchangeRate,
        updated_by: user?.id,
      };

      if (isEditing && entry) {
        const { error: entryError } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', entry.id);
        if (entryError) throw entryError;

        // Delete existing lines and recreate
        await supabase.from('journal_entry_lines').delete().eq('entry_id', entry.id);
        
        const linesData = lines.map((l, idx) => ({
          entry_id: entry.id,
          line_number: idx + 1,
          account_id: l.account_id,
          transaction_type: l.transaction_type,
          applies_igtf: l.applies_igtf,
          debit_usd: l.debit_usd,
          credit_usd: l.credit_usd,
          debit_ves: l.debit_usd * exchangeRate,
          credit_ves: l.credit_usd * exchangeRate,
          description: l.description || null,
        }));
        
        const { error: linesError } = await supabase.from('journal_entry_lines').insert(linesData);
        if (linesError) throw linesError;
      } else {
        const { data: newEntry, error: entryError } = await supabase
          .from('journal_entries')
          .insert({ ...entryData, created_by: user?.id })
          .select()
          .single();
        if (entryError) throw entryError;

        const linesData = lines.map((l, idx) => ({
          entry_id: newEntry.id,
          line_number: idx + 1,
          account_id: l.account_id,
          transaction_type: l.transaction_type,
          applies_igtf: l.applies_igtf,
          debit_usd: l.debit_usd,
          credit_usd: l.credit_usd,
          debit_ves: l.debit_usd * exchangeRate,
          credit_ves: l.credit_usd * exchangeRate,
          description: l.description || null,
        }));
        
        const { error: linesError } = await supabase.from('journal_entry_lines').insert(linesData);
        if (linesError) throw linesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: isEditing ? 'Asiento actualizado' : 'Asiento creado' });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!isBalanced) {
      toast({
        title: 'Error de cuadre',
        description: 'El total de débitos debe ser igual al total de créditos',
        variant: 'destructive',
      });
      return;
    }
    
    if (lines.some(l => !l.account_id)) {
      toast({
        title: 'Error',
        description: 'Todas las líneas deben tener una cuenta seleccionada',
        variant: 'destructive',
      });
      return;
    }
    
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Asiento' : 'Nuevo Asiento Contable'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="VES">VES</SelectItem>
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
                name="exchange_rate_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuente Tasa</FormLabel>
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

              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.0001" 
                        {...field} 
                        disabled={form.watch('exchange_rate_source') !== 'Manual'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del asiento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_center_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de Costos</FormLabel>
                    <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar centro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin centro</SelectItem>
                        {costCenters?.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.code} - {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lines */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Líneas del Asiento</h4>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar Línea
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Cuenta</th>
                      <th className="p-2 text-left w-[120px]">Tipo</th>
                      <th className="p-2 text-right w-[100px]">Débito</th>
                      <th className="p-2 text-right w-[100px]">Crédito</th>
                      <th className="p-2 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-t">
                        <td className="p-1">
                          <Select 
                            value={line.account_id || 'none'} 
                            onValueChange={(v) => updateLine(line.id, 'account_id', v === 'none' ? '' : v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Seleccionar cuenta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Seleccionar...</SelectItem>
                              {accounts?.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1">
                          <Select 
                            value={line.transaction_type} 
                            onValueChange={(v) => updateLine(line.id, 'transaction_type', v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="deposito">Depósito</SelectItem>
                              <SelectItem value="retiro">Retiro</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="pago">Pago</SelectItem>
                              <SelectItem value="cobro">Cobro</SelectItem>
                              <SelectItem value="ajuste">Ajuste</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-right"
                            value={line.debit_usd || ''}
                            onChange={(e) => updateLine(line.id, 'debit_usd', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-right"
                            value={line.credit_usd || ''}
                            onChange={(e) => updateLine(line.id, 'credit_usd', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length <= 2}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-medium">
                    <tr>
                      <td colSpan={2} className="p-2 text-right">TOTALES:</td>
                      <td className="p-2 text-right">${totalDebit.toFixed(2)}</td>
                      <td className="p-2 text-right">${totalCredit.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {!isBalanced && (
                <p className="text-sm text-destructive">
                  ⚠️ El asiento no cuadra. Diferencia: ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || !isBalanced}>
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Asiento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
