import { useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChartOfAccounts, type ChartOfAccount } from '@/hooks/useFinances';
import { getUserFriendlyError } from '@/lib/errorMessages';

const formSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  parent_id: z.string().optional(),
  class: z.enum(['activos', 'pasivos', 'patrimonio', 'ingresos', 'costos', 'gastos', 'ajustes']),
  nature: z.enum(['deudora', 'acreedora', 'variable']),
  requires_cost_center: z.boolean(),
  requires_third_party: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ChartOfAccount | null;
}

const classOptions = [
  { value: 'activos', label: 'Activos' },
  { value: 'pasivos', label: 'Pasivos' },
  { value: 'patrimonio', label: 'Patrimonio' },
  { value: 'ingresos', label: 'Ingresos' },
  { value: 'costos', label: 'Costos' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'ajustes', label: 'Ajustes' },
];

const natureOptions = [
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' },
  { value: 'variable', label: 'Variable' },
];

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!account;
  
  const { data: allAccounts } = useChartOfAccounts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      parent_id: '',
      class: 'activos',
      nature: 'deudora',
      requires_cost_center: false,
      requires_third_party: false,
      is_active: true,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        code: account.code,
        name: account.name,
        parent_id: account.parent_id || '',
        class: account.class,
        nature: account.nature,
        requires_cost_center: account.requires_cost_center,
        requires_third_party: account.requires_third_party,
        is_active: account.is_active,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        parent_id: '',
        class: 'activos',
        nature: 'deudora',
        requires_cost_center: false,
        requires_third_party: false,
        is_active: true,
      });
    }
  }, [account, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parentAccount = allAccounts?.find(a => a.id === values.parent_id);
      const level = parentAccount ? parentAccount.level + 1 : 1;

      const payload = {
        code: values.code,
        name: values.name,
        parent_id: values.parent_id || null,
        level,
        class: values.class,
        nature: values.nature,
        requires_cost_center: values.requires_cost_center,
        requires_third_party: values.requires_third_party,
        is_active: values.is_active,
      };

      if (isEditing && account) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update(payload)
          .eq('id', account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chart_of_accounts')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: isEditing ? 'Cuenta actualizada' : 'Cuenta creada' });
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
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input placeholder="1111" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la cuenta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Padre</FormLabel>
                  <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cuenta padre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta padre</SelectItem>
                      {allAccounts?.filter(a => a.id !== account?.id).map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clase *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naturaleza *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {natureOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requires_cost_center"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Requiere Centro de Costos</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Cuenta Activa</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
