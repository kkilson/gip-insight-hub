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
import { type CostCenter } from '@/hooks/useFinances';
import { getUserFriendlyError } from '@/lib/errorMessages';

const formSchema = z.object({
  code: z.string().min(1, 'Código requerido').max(10),
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['operativo', 'comercial', 'administrativo', 'soporte']),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CostCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter: CostCenter | null;
}

const typeOptions = [
  { value: 'operativo', label: 'Operativo' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'soporte', label: 'Soporte' },
];

export function CostCenterFormDialog({ open, onOpenChange, costCenter }: CostCenterFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!costCenter;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'operativo',
      is_active: true,
    },
  });

  useEffect(() => {
    if (costCenter) {
      form.reset({
        code: costCenter.code,
        name: costCenter.name,
        type: costCenter.type,
        is_active: costCenter.is_active,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        type: 'operativo',
        is_active: true,
      });
    }
  }, [costCenter, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        type: values.type as 'operativo' | 'comercial' | 'administrativo' | 'soporte',
        is_active: values.is_active,
      };
      
      if (isEditing && costCenter) {
        const { error } = await supabase
          .from('cost_centers')
          .update(payload)
          .eq('id', costCenter.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cost_centers')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast({ title: isEditing ? 'Centro actualizado' : 'Centro creado' });
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
          <DialogTitle>{isEditing ? 'Editar Centro de Costos' : 'Nuevo Centro de Costos'}</DialogTitle>
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
                    <Input placeholder="ADM" {...field} />
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
                    <Input placeholder="Administración" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map(opt => (
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Activo</FormLabel>
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
