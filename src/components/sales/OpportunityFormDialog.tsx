import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveOpportunity, SALES_STAGES, type SalesOpportunity, type SalesStage } from '@/hooks/useSales';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: SalesOpportunity | null;
}

export function OpportunityFormDialog({ open, onOpenChange, opportunity }: Props) {
  const save = useSaveOpportunity();
  const [form, setForm] = useState({
    prospect_name: '',
    prospect_email: '',
    prospect_phone: '',
    prospect_company: '',
    stage: 'lead_identificado' as SalesStage,
    notes: '',
    expected_close_date: '',
    client_id: '' as string,
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-for-sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, first_name, last_name').order('first_name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (opportunity) {
      setForm({
        prospect_name: opportunity.prospect_name,
        prospect_email: opportunity.prospect_email ?? '',
        prospect_phone: opportunity.prospect_phone ?? '',
        prospect_company: opportunity.prospect_company ?? '',
        stage: opportunity.stage,
        notes: opportunity.notes ?? '',
        expected_close_date: opportunity.expected_close_date ?? '',
        client_id: opportunity.client_id ?? '',
      });
    } else {
      setForm({
        prospect_name: '', prospect_email: '', prospect_phone: '',
        prospect_company: '', stage: 'lead_identificado', notes: '',
        expected_close_date: '', client_id: '',
      });
    }
  }, [opportunity, open]);

  const handleClientSelect = (clientId: string) => {
    setForm(f => ({ ...f, client_id: clientId }));
    if (clientId && clientId !== 'none') {
      const client = clients?.find(c => c.id === clientId);
      if (client && !form.prospect_name) {
        setForm(f => ({ ...f, prospect_name: `${client.first_name} ${client.last_name}` }));
      }
    }
  };

  const handleSubmit = () => {
    if (!form.prospect_name.trim()) return;
    save.mutate({
      ...(opportunity?.id ? { id: opportunity.id } : {}),
      prospect_name: form.prospect_name,
      prospect_email: form.prospect_email || undefined,
      prospect_phone: form.prospect_phone || undefined,
      prospect_company: form.prospect_company || undefined,
      stage: form.stage,
      notes: form.notes || undefined,
      expected_close_date: form.expected_close_date || null,
      client_id: form.client_id && form.client_id !== 'none' ? form.client_id : null,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente existente (opcional)</Label>
            <Select value={form.client_id || 'none'} onValueChange={handleClientSelect}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno (prospecto nuevo)</SelectItem>
                {clients?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nombre del prospecto *</Label>
            <Input value={form.prospect_name} onChange={e => setForm(f => ({ ...f, prospect_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={form.prospect_email} onChange={e => setForm(f => ({ ...f, prospect_email: e.target.value }))} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.prospect_phone} onChange={e => setForm(f => ({ ...f, prospect_phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Empresa</Label>
            <Input value={form.prospect_company} onChange={e => setForm(f => ({ ...f, prospect_company: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Etapa</Label>
              <Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v as SalesStage }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SALES_STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha cierre esperado</Label>
              <Input type="date" value={form.expected_close_date} onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={save.isPending || !form.prospect_name.trim()}>
            {save.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
