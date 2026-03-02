import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCaseTypes, useCreateCase } from '@/hooks/useTracking';
import { supabase } from '@/integrations/supabase/client';

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseFormDialog({ open, onOpenChange }: CaseFormDialogProps) {
  const { data: caseTypes } = useCaseTypes();
  const createCase = useCreateCase();

  const [caseTypeId, setCaseTypeId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [policyId, setPolicyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [affectsConsumption, setAffectsConsumption] = useState(false);
  const [claimedAmountUsd, setClaimedAmountUsd] = useState('');
  const [claimedAmountBs, setClaimedAmountBs] = useState('');

  // Search clients
  useEffect(() => {
    if (clientSearch.trim().length < 1) { setClients([]); return; }
    const timer = setTimeout(async () => {
      const search = clientSearch.trim();
      // Split search into words for better matching
      const words = search.split(/\s+/).filter(Boolean);
      
      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, identification_number, email, mobile, phone')
        .limit(15);

      if (words.length === 1) {
        const w = words[0];
        query = query.or(`first_name.ilike.%${w}%,last_name.ilike.%${w}%,identification_number.ilike.%${w}%,email.ilike.%${w}%`);
      } else {
        // Multi-word: match first_name + last_name combo
        query = query.or(
          `first_name.ilike.%${words[0]}%,last_name.ilike.%${words[0]}%,identification_number.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error buscando clientes:', error);
        setClients([]);
        return;
      }

      // Client-side refinement for multi-word searches
      let results = data || [];
      if (words.length > 1) {
        results = results.filter((c) => {
          const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
          return words.every((w) => fullName.includes(w.toLowerCase()));
        });
      }

      setClients(results);
    }, 200);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  // Load policies for selected client
  useEffect(() => {
    if (!selectedClient) { setPolicies([]); return; }
    (async () => {
      const { data } = await supabase
        .from('policies')
        .select('id, policy_number, insurers(name)')
        .eq('client_id', selectedClient.id);
      setPolicies(data || []);
    })();
  }, [selectedClient]);

  // Auto-set affects_consumption based on case type
  useEffect(() => {
    const ct = caseTypes?.find((t) => t.id === caseTypeId);
    if (ct) setAffectsConsumption(ct.affects_consumption);
  }, [caseTypeId, caseTypes]);

  const handleSubmit = async () => {
    if (!caseTypeId || !selectedClient || !title) return;
    await createCase.mutateAsync({
      case_type_id: caseTypeId,
      client_id: selectedClient.id,
      policy_id: policyId || undefined,
      title,
      description: description || undefined,
      priority,
      due_date: dueDate || undefined,
      affects_consumption: affectsConsumption,
      claimed_amount_usd: claimedAmountUsd ? parseFloat(claimedAmountUsd) : 0,
      claimed_amount_bs: claimedAmountBs ? parseFloat(claimedAmountBs) : 0,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCaseTypeId(''); setClientSearch(''); setSelectedClient(null);
    setPolicyId(''); setTitle(''); setDescription('');
    setPriority('normal'); setDueDate(''); setAffectsConsumption(false);
    setClaimedAmountUsd(''); setClaimedAmountBs('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Caso de Seguimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Case Type */}
          <div className="space-y-2">
            <Label>Tipo de Caso *</Label>
            <Select value={caseTypeId} onValueChange={setCaseTypeId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                {caseTypes?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Search */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {selectedClient ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                <span className="flex-1 text-sm">
                  {selectedClient.first_name} {selectedClient.last_name} — {selectedClient.identification_number}
                </span>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setClientSearch(''); }}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, cédula o email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  autoComplete="off"
                />
                {clientSearch.trim().length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clients.length > 0 ? (
                      clients.map((c) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b last:border-b-0 transition-colors"
                          onClick={() => { setSelectedClient(c); setClients([]); setClientSearch(''); }}
                        >
                          <div className="font-medium">{c.first_name} {c.last_name}</div>
                          <div className="text-xs text-muted-foreground flex gap-3">
                            <span>Cédula: {c.identification_number}</span>
                            {c.email && <span>{c.email}</span>}
                            {(c.mobile || c.phone) && <span>Tel: {c.mobile || c.phone}</span>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                        No se encontraron clientes
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Policy */}
          {policies.length > 0 && (
            <div className="space-y-2">
              <Label>Póliza</Label>
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar póliza" /></SelectTrigger>
                <SelectContent>
                  {policies.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.policy_number || 'Sin número'} — {p.insurers?.name || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descripción breve del caso" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales..." />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Affects Consumption */}
          <div className="flex items-center gap-3">
            <Switch checked={affectsConsumption} onCheckedChange={setAffectsConsumption} />
            <Label>Afecta consumo de póliza</Label>
          </div>

          {/* Amount fields - show when affects consumption */}
          {affectsConsumption && (
            <div className="grid grid-cols-2 gap-4 p-3 border rounded-md bg-muted/30">
              <div className="space-y-2">
                <Label>Monto Reclamado (USD)</Label>
                <Input type="number" step="0.01" min="0" value={claimedAmountUsd} onChange={(e) => setClaimedAmountUsd(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Monto Reclamado (Bs)</Label>
                <Input type="number" step="0.01" min="0" value={claimedAmountBs} onChange={(e) => setClaimedAmountBs(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!caseTypeId || !selectedClient || !title || createCase.isPending}>
              {createCase.isPending ? 'Creando...' : 'Crear Caso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
