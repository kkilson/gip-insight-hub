import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerateCode, usePartnerServices } from '@/hooks/usePartnerships';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateCodeDialog({ open, onOpenChange }: Props) {
  const [serviceId, setServiceId] = useState('');
  const [clientId, setClientId] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: services } = usePartnerServices();
  const { data: clients } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, first_name, last_name, email').order('first_name');
      if (error) throw error;
      return data;
    },
  });

  const generate = useGenerateCode();

  const handleGenerate = () => {
    if (!serviceId) return;
    generate.mutate({
      service_id: serviceId,
      client_id: clientId || undefined,
      max_uses: Number(maxUses) || 1,
      expires_at: expiresAt || undefined,
    }, {
      onSuccess: (code) => {
        setGeneratedCode(code);
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setServiceId(''); setClientId(''); setMaxUses('1'); setExpiresAt(''); setGeneratedCode('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Código de Descuento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Servicio *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
              <SelectContent>{services?.filter(s => s.is_active).map(s => (
                <SelectItem key={s.id} value={s.id}>{(s.partner as any)?.name} — {s.name}</SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cliente (opcional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {clients?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Máx. usos</Label><Input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} /></div>
            <div><Label>Expira</Label><Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
          </div>

          {generatedCode ? (
            <div className="bg-muted rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Código generado:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">{generatedCode}</span>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>Cerrar</Button>
            {!generatedCode && (
              <Button onClick={handleGenerate} disabled={generate.isPending || !serviceId}>
                {generate.isPending ? 'Generando...' : 'Generar Código'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
