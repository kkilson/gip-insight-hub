import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSaveService, usePartners, type PartnerService } from '@/hooks/usePartnerships';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: PartnerService | null;
  defaultPartnerId?: string;
}

export function ServiceFormDialog({ open, onOpenChange, service, defaultPartnerId }: Props) {
  const [form, setForm] = useState({
    partner_id: '', name: '', description: '', discount_type: 'porcentaje' as 'porcentaje' | 'monto_fijo',
    discount_value: '', is_active: true,
  });
  const save = useSaveService();
  const { data: partners } = usePartners();

  useEffect(() => {
    if (service) {
      setForm({
        partner_id: service.partner_id, name: service.name, description: service.description || '',
        discount_type: service.discount_type, discount_value: String(service.discount_value), is_active: service.is_active,
      });
    } else {
      setForm({ partner_id: defaultPartnerId || '', name: '', description: '', discount_type: 'porcentaje', discount_value: '', is_active: true });
    }
  }, [service, open, defaultPartnerId]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.partner_id) return;
    save.mutate({
      ...(service ? { id: service.id } : {}),
      partner_id: form.partner_id, name: form.name, description: form.description || null,
      discount_type: form.discount_type, discount_value: Number(form.discount_value) || 0, is_active: form.is_active,
    }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Aliado *</Label>
            <Select value={form.partner_id} onValueChange={v => setForm(f => ({ ...f, partner_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar aliado" /></SelectTrigger>
              <SelectContent>{partners?.filter(p => p.is_active).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
          <div><Label>Nombre del servicio *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de descuento</Label>
              <Select value={form.discount_type} onValueChange={(v: any) => setForm(f => ({ ...f, discount_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto_fijo">Monto fijo ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>Activo</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={save.isPending}>{save.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
