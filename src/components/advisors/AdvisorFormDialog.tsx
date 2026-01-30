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
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Advisor = Tables<'advisors'>;

const formSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  commission_rate: z.coerce.number().min(0).max(100).optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdvisorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisor: Advisor | null;
}

export function AdvisorFormDialog({
  open,
  onOpenChange,
  advisor,
}: AdvisorFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!advisor;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      commission_rate: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (advisor) {
      form.reset({
        full_name: advisor.full_name,
        email: advisor.email || '',
        phone: advisor.phone || '',
        commission_rate: advisor.commission_rate ?? 0,
        is_active: advisor.is_active ?? true,
      });
    } else {
      form.reset({
        full_name: '',
        email: '',
        phone: '',
        commission_rate: 0,
        is_active: true,
      });
    }
  }, [advisor, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        commission_rate: values.commission_rate ?? 0,
        is_active: values.is_active,
      };

      if (isEditing && advisor) {
        const { error } = await supabase
          .from('advisors')
          .update(payload)
          .eq('id', advisor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('advisors').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast({
        title: isEditing
          ? 'Asesor actualizado correctamente'
          : 'Asesor creado correctamente',
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: isEditing ? 'Error al actualizar' : 'Error al crear',
        description: error.message,
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
          <DialogTitle>
            {isEditing ? 'Editar Asesor' : 'Nuevo Asesor'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+593 99 999 9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de comisión (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Estado activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Los asesores inactivos no aparecerán en las listas de
                      selección
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? 'Guardando...'
                  : isEditing
                  ? 'Actualizar'
                  : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
