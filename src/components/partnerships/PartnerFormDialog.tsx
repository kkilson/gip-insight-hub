import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSavePartner, type Partner } from '@/hooks/usePartnerships';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
}

export function PartnerFormDialog({ open, onOpenChange, partner }: Props) {
  const [form, setForm] = useState({
    name: '', contact_name: '', phone: '', email: '', rif: '', address: '', category: '', notes: '', is_active: true,
  });
  const save = useSavePartner();

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name, contact_name: partner.contact_name || '', phone: partner.phone || '',
        email: partner.email || '', rif: partner.rif || '', address: partner.address || '',
        category: partner.category || '', notes: partner.notes || '', is_active: partner.is_active,
      });
    } else {
      setForm({ name: '', contact_name: '', phone: '', email: '', rif: '', address: '', category: '', notes: '', is_active: true });
    }
  }, [partner, open]);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    save.mutate({ ...(partner ? { id: partner.id } : {}), ...form }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{partner ? 'Editar Aliado' : 'Nuevo Aliado'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nombre empresa *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Categoría</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ej: Salud, Tech, Restaurante" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Persona de contacto</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
            <div><Label>RIF</Label><Input value={form.rif} onChange={e => setForm(f => ({ ...f, rif: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div><Label>Dirección</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
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
