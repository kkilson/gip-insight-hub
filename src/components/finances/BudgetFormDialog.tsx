import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, addYears } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useBudget,
  useActiveCostCenters,
  useLeafAccounts,
  useCreateBudget,
  useUpdateBudget,
  type Budget,
  type BudgetFormData,
  type BudgetLineFormData,
} from '@/hooks/useFinances';
import { Skeleton } from '@/components/ui/skeleton';

const periodOptions = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'cuatrimestral', label: 'Cuatrimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'bienal', label: 'Bienal' },
  { value: 'trienal', label: 'Trienal' },
  { value: 'cuatrienal', label: 'Cuatrienal' },
  { value: 'quinquenal', label: 'Quinquenal' },
  { value: 'decenal', label: 'Decenal' },
] as const;

const currencyOptions = [
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'VES', label: 'VES - Bolívar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USDT', label: 'USDT - Tether' },
] as const;

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'pospuesto', label: 'Pospuesto' },
] as const;

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  period: z.enum(['mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual', 'bienal', 'trienal', 'cuatrienal', 'quinquenal', 'decenal']),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().min(1, 'La fecha de fin es requerida'),
  cost_center_id: z.string().nullable(),
  currency: z.enum(['USD', 'VES', 'EUR', 'USDT']),
  notes: z.string().nullable(),
  is_active: z.boolean(),
});

const lineSchema = z.object({
  id: z.string().optional(),
  planned_date: z.string().min(1, 'La fecha es requerida'),
  account_id: z.string().min(1, 'La cuenta es requerida'),
  description: z.string().min(1, 'La descripción es requerida'),
  can_pay_in_ves: z.boolean(),
  amount_usd: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  reference_rate: z.number().nullable(),
  status: z.enum(['pendiente', 'pagado', 'vencido', 'pospuesto']),
});

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Get end date based on period
function getEndDateFromPeriod(startDate: string, period: string): string {
  const start = new Date(startDate);
  switch (period) {
    case 'mensual': return format(addMonths(start, 1), 'yyyy-MM-dd');
    case 'bimestral': return format(addMonths(start, 2), 'yyyy-MM-dd');
    case 'trimestral': return format(addMonths(start, 3), 'yyyy-MM-dd');
    case 'cuatrimestral': return format(addMonths(start, 4), 'yyyy-MM-dd');
    case 'semestral': return format(addMonths(start, 6), 'yyyy-MM-dd');
    case 'anual': return format(addYears(start, 1), 'yyyy-MM-dd');
    case 'bienal': return format(addYears(start, 2), 'yyyy-MM-dd');
    case 'trienal': return format(addYears(start, 3), 'yyyy-MM-dd');
    case 'cuatrienal': return format(addYears(start, 4), 'yyyy-MM-dd');
    case 'quinquenal': return format(addYears(start, 5), 'yyyy-MM-dd');
    case 'decenal': return format(addYears(start, 10), 'yyyy-MM-dd');
    default: return format(addMonths(start, 1), 'yyyy-MM-dd');
  }
}

export function BudgetFormDialog({ open, onOpenChange, budget }: BudgetFormDialogProps) {
  const isEditing = !!budget;
  const { data: fullBudget, isLoading: loadingBudget } = useBudget(budget?.id || null);
  const { data: costCenters } = useActiveCostCenters();
  const { data: accounts } = useLeafAccounts();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  
  const [lines, setLines] = useState<BudgetLineFormData[]>([]);
  
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      period: 'mensual',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
      cost_center_id: null,
      currency: 'USD',
      notes: null,
      is_active: true,
    },
  });
  
  // Update end_date when period or start_date changes
  const watchPeriod = form.watch('period');
  const watchStartDate = form.watch('start_date');
  
  useEffect(() => {
    if (watchStartDate && watchPeriod) {
      const newEndDate = getEndDateFromPeriod(watchStartDate, watchPeriod);
      form.setValue('end_date', newEndDate);
    }
  }, [watchPeriod, watchStartDate, form]);
  
  // Load budget data when editing
  useEffect(() => {
    if (fullBudget && isEditing) {
      form.reset({
        name: fullBudget.name,
        period: fullBudget.period as BudgetFormData['period'],
        start_date: fullBudget.start_date,
        end_date: fullBudget.end_date,
        cost_center_id: fullBudget.cost_center_id,
        currency: fullBudget.currency as BudgetFormData['currency'],
        notes: fullBudget.notes,
        is_active: fullBudget.is_active,
      });
      
      if (fullBudget.lines) {
        setLines(fullBudget.lines.map(line => ({
          id: line.id,
          planned_date: line.planned_date,
          account_id: line.account_id,
          description: line.description,
          can_pay_in_ves: line.can_pay_in_ves,
          amount_usd: line.amount_usd,
          reference_rate: line.reference_rate,
          status: line.status as BudgetLineFormData['status'],
        })));
      }
    } else if (!isEditing) {
      form.reset({
        name: '',
        period: 'mensual',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        cost_center_id: null,
        currency: 'USD',
        notes: null,
        is_active: true,
      });
      setLines([]);
    }
  }, [fullBudget, isEditing, form]);
  
  const addLine = () => {
    const startDate = form.getValues('start_date');
    setLines([...lines, {
      planned_date: startDate,
      account_id: '',
      description: '',
      can_pay_in_ves: false,
      amount_usd: 0,
      reference_rate: null,
      status: 'pendiente',
    }]);
  };
  
  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };
  
  const updateLine = (index: number, field: keyof BudgetLineFormData, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };
  
  const totalBudgeted = lines.reduce((sum, line) => sum + (line.amount_usd || 0), 0);
  
  const validateLines = (): boolean => {
    for (const line of lines) {
      try {
        lineSchema.parse(line);
      } catch {
        return false;
      }
    }
    return true;
  };
  
  const onSubmit = async (data: BudgetFormData) => {
    if (!validateLines()) {
      return;
    }
    
    try {
      if (isEditing && budget) {
        await updateBudget.mutateAsync({ id: budget.id, budget: data, lines });
      } else {
        await createBudget.mutateAsync({ budget: data, lines });
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };
  
  const isPending = createBudget.isPending || updateBudget.isPending;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </DialogTitle>
        </DialogHeader>
        
        {isEditing && loadingBudget ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <ScrollArea className="flex-1 px-1">
                <div className="space-y-6 pb-4">
                  {/* Header Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Presupuesto</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Gastos Operativos Q1 2026" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar período" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {periodOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Fin</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Centro de Costos (Opcional)</FormLabel>
                          <Select 
                            onValueChange={(val) => field.onChange(val === 'none' ? null : val)} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin centro de costos" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin centro de costos</SelectItem>
                              {costCenters?.map((cc) => (
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
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moneda Base</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Presupuesto Activo</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas adicionales sobre el presupuesto..." 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Budget Lines */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Líneas del Presupuesto</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addLine}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Línea
                      </Button>
                    </div>
                    
                    {lines.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg text-muted-foreground">
                        No hay líneas agregadas. Haz clic en "Agregar Línea" para comenzar.
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[130px]">Fecha</TableHead>
                              <TableHead className="w-[200px]">Cuenta</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="w-[120px] text-right">Monto USD</TableHead>
                              <TableHead className="w-[80px] text-center">VES</TableHead>
                              <TableHead className="w-[110px]">Estado</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lines.map((line, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Input
                                    type="date"
                                    value={line.planned_date}
                                    onChange={(e) => updateLine(index, 'planned_date', e.target.value)}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={line.account_id}
                                    onValueChange={(val) => updateLine(index, 'account_id', val)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Cuenta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {accounts?.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                          {account.code} - {account.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={line.description}
                                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                                    placeholder="Descripción..."
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={line.amount_usd || ''}
                                    onChange={(e) => updateLine(index, 'amount_usd', parseFloat(e.target.value) || 0)}
                                    className="h-8 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={line.can_pay_in_ves}
                                    onCheckedChange={(checked) => updateLine(index, 'can_pay_in_ves', !!checked)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={line.status}
                                    onValueChange={(val) => updateLine(index, 'status', val)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeLine(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-semibold">
                                Total Presupuestado:
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {formatCurrency(totalBudgeted)}
                              </TableCell>
                              <TableCell colSpan={3}>
                                <Badge variant="secondary">
                                  {lines.length} línea{lines.length !== 1 ? 's' : ''}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
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
