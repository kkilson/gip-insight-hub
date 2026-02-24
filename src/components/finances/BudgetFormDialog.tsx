import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, addYears } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBudget, useCreateBudget, useUpdateBudget, type Budget, type BudgetFormData, type BudgetLineFormData } from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';

const periodOptions = [
  { value: 'mensual', label: 'Mensual' }, { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' }, { value: 'cuatrimestral', label: 'Cuatrimestral' },
  { value: 'semestral', label: 'Semestral' }, { value: 'anual', label: 'Anual' },
  { value: 'bienal', label: 'Bienal' }, { value: 'trienal', label: 'Trienal' },
  { value: 'cuatrienal', label: 'Cuatrienal' }, { value: 'quinquenal', label: 'Quinquenal' },
  { value: 'decenal', label: 'Decenal' },
] as const;

const currencyOptions = [
  { value: 'USD', label: 'USD - Dólar' }, { value: 'VES', label: 'VES - Bolívar' },
  { value: 'EUR', label: 'EUR - Euro' }, { value: 'USDT', label: 'USDT - Tether' },
] as const;

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' }, { value: 'pagado', label: 'Pagado' },
  { value: 'vencido', label: 'Vencido' }, { value: 'pospuesto', label: 'Pospuesto' },
] as const;

const budgetSchema = z.object({
  name: z.string().min(1, 'Requerido').max(100),
  period: z.enum(['mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual', 'bienal', 'trienal', 'cuatrienal', 'quinquenal', 'decenal']),
  start_date: z.string().min(1, 'Requerido'),
  end_date: z.string().min(1, 'Requerido'),
  currency: z.enum(['USD', 'VES', 'EUR', 'USDT']),
  notes: z.string().nullable(),
  is_active: z.boolean(),
});

function getEndDateFromPeriod(startDate: string, period: string): string {
  const start = new Date(startDate);
  const map: Record<string, Date> = {
    mensual: addMonths(start, 1), bimestral: addMonths(start, 2), trimestral: addMonths(start, 3),
    cuatrimestral: addMonths(start, 4), semestral: addMonths(start, 6), anual: addYears(start, 1),
    bienal: addYears(start, 2), trienal: addYears(start, 3), cuatrienal: addYears(start, 4),
    quinquenal: addYears(start, 5), decenal: addYears(start, 10),
  };
  return format(map[period] || addMonths(start, 1), 'yyyy-MM-dd');
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}

export function BudgetFormDialog({ open, onOpenChange, budget }: BudgetFormDialogProps) {
  const isEditing = !!budget;
  const { data: fullBudget, isLoading: loadingBudget } = useBudget(budget?.id || null);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  
  const [lines, setLines] = useState<BudgetLineFormData[]>([]);
  
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '', period: 'mensual',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      currency: 'USD', notes: null, is_active: true,
    },
  });
  
  const watchPeriod = form.watch('period');
  const watchStartDate = form.watch('start_date');
  
  useEffect(() => {
    if (watchStartDate && watchPeriod) {
      form.setValue('end_date', getEndDateFromPeriod(watchStartDate, watchPeriod));
    }
  }, [watchPeriod, watchStartDate, form]);
  
  useEffect(() => {
    if (fullBudget && isEditing) {
      form.reset({
        name: fullBudget.name, period: fullBudget.period as BudgetFormData['period'],
        start_date: fullBudget.start_date, end_date: fullBudget.end_date,
        currency: fullBudget.currency as BudgetFormData['currency'],
        notes: fullBudget.notes, is_active: fullBudget.is_active,
      });
      if (fullBudget.lines) {
        setLines(fullBudget.lines.map(line => ({
          id: line.id, planned_date: line.planned_date, description: line.description,
          can_pay_in_ves: line.can_pay_in_ves, amount_usd: line.amount_usd,
          reference_rate: line.reference_rate,
          status: line.status as BudgetLineFormData['status'],
          reminder_date: line.reminder_date || null, category: line.category || null,
        })));
      }
    } else if (!isEditing) {
      form.reset({
        name: '', period: 'mensual', start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        currency: 'USD', notes: null, is_active: true,
      });
      setLines([]);
    }
  }, [fullBudget, isEditing, form]);
  
  const addLine = () => {
    setLines([...lines, {
      planned_date: form.getValues('start_date'), description: '', can_pay_in_ves: false,
      amount_usd: 0, reference_rate: null, status: 'pendiente', reminder_date: null, category: null,
    }]);
  };
  
  const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));
  const updateLine = (index: number, field: keyof BudgetLineFormData, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };
  
  const totalBudgeted = lines.reduce((sum, line) => sum + (line.amount_usd || 0), 0);
  
  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({ id: budget.id, budget: data, lines });
      } else {
        await createBudget.mutateAsync({ budget: data, lines });
      }
      onOpenChange(false);
    } catch {}
  };
  
  const isPending = createBudget.isPending || updateBudget.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</DialogTitle>
        </DialogHeader>
        
        {isEditing && loadingBudget ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <ScrollArea className="flex-1 px-1">
                <div className="space-y-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Gastos Operativos Q1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="period" render={({ field }) => (
                      <FormItem><FormLabel>Período</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{periodOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="start_date" render={({ field }) => (
                      <FormItem><FormLabel>Fecha Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="end_date" render={({ field }) => (
                      <FormItem><FormLabel>Fecha Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="currency" render={({ field }) => (
                      <FormItem><FormLabel>Moneda Base</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{currencyOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="is_active" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-8">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">Activo</FormLabel>
                      </FormItem>
                    )} />
                  </div>
                  
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Notas</FormLabel><FormControl>
                      <Textarea placeholder="Notas adicionales..." {...field} value={field.value || ''} />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Líneas del Presupuesto</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addLine}>
                        <Plus className="h-4 w-4 mr-1" />Agregar Línea
                      </Button>
                    </div>
                    
                    {lines.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg text-muted-foreground">
                        No hay líneas. Haz clic en "Agregar Línea" para comenzar.
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">Fecha</TableHead>
                              <TableHead className="w-[120px]">Categoría</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="w-[110px] text-right">Monto USD</TableHead>
                              <TableHead className="w-[80px] text-center">VES</TableHead>
                              <TableHead className="w-[110px]">Recordatorio</TableHead>
                              <TableHead className="w-[110px]">Estado</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lines.map((line, i) => (
                              <TableRow key={i}>
                                <TableCell><Input type="date" value={line.planned_date} onChange={e => updateLine(i, 'planned_date', e.target.value)} className="h-8" /></TableCell>
                                <TableCell><Input value={line.category || ''} onChange={e => updateLine(i, 'category', e.target.value)} placeholder="Categoría" className="h-8" /></TableCell>
                                <TableCell><Input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Descripción..." className="h-8" /></TableCell>
                                <TableCell><Input type="number" step="0.01" min="0" value={line.amount_usd || ''} onChange={e => updateLine(i, 'amount_usd', parseFloat(e.target.value) || 0)} className="h-8 text-right" /></TableCell>
                                <TableCell className="text-center"><Checkbox checked={line.can_pay_in_ves} onCheckedChange={c => updateLine(i, 'can_pay_in_ves', !!c)} /></TableCell>
                                <TableCell><Input type="date" value={line.reminder_date || ''} onChange={e => updateLine(i, 'reminder_date', e.target.value || null)} className="h-8" /></TableCell>
                                <TableCell>
                                  <Select value={line.status} onValueChange={val => updateLine(i, 'status', val)}>
                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>{statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(i)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                              <TableCell className="text-right font-mono font-bold">{formatCurrency(totalBudgeted)}</TableCell>
                              <TableCell colSpan={4}><Badge variant="secondary">{lines.length} línea{lines.length !== 1 ? 's' : ''}</Badge></TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? 'Guardar Cambios' : 'Crear Presupuesto'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
