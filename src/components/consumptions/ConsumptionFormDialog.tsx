import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Consumption,
  useUsageTypes,
  useCreateConsumption,
  useUpdateConsumption,
  useCreateUsageType,
} from '@/hooks/useConsumptions';
import { useToast } from '@/hooks/use-toast';

interface PolicyOption {
  id: string;
  policy_number: string | null;
  client_name: string;
}

interface BeneficiaryOption {
  id: string;
  name: string;
}

interface ConsumptionFormDialogProps {
  consumption?: Consumption | null;
  preselectedPolicyId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsumptionFormDialog({
  consumption,
  preselectedPolicyId,
  open,
  onOpenChange,
}: ConsumptionFormDialogProps) {
  const isEditing = !!consumption;
  const { toast } = useToast();
  const { data: usageTypes } = useUsageTypes();
  const createMutation = useCreateConsumption();
  const updateMutation = useUpdateConsumption();
  const createTypeMutation = useCreateUsageType();

  // Form state
  const [policyId, setPolicyId] = useState('');
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policies, setPolicies] = useState<PolicyOption[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [usageTypeId, setUsageTypeId] = useState('');
  const [usageDate, setUsageDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [amountBs, setAmountBs] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [showNewType, setShowNewType] = useState(false);

  // Load policies
  useEffect(() => {
    const loadPolicies = async () => {
      const { data } = await supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          client:clients(first_name, last_name)
        `)
        .eq('status', 'vigente')
        .order('policy_number');

      if (data) {
        setPolicies(
          data.map((p) => {
            const client = Array.isArray(p.client) ? p.client[0] : p.client;
            return {
              id: p.id,
              policy_number: p.policy_number,
              client_name: client ? `${client.first_name} ${client.last_name}` : '-',
            };
          })
        );
      }
    };
    if (open) loadPolicies();
  }, [open]);

  // Load beneficiaries when policy changes
  useEffect(() => {
    const loadBeneficiaries = async () => {
      if (!policyId) {
        setBeneficiaries([]);
        return;
      }

      // Get policy client as "Tomador/Titular"
      const { data: policy } = await supabase
        .from('policies')
        .select('client:clients(first_name, last_name)')
        .eq('id', policyId)
        .single();

      const client = Array.isArray(policy?.client) ? policy.client[0] : policy?.client;
      const clientName = client ? `${client.first_name} ${client.last_name}` : '';

      // Get beneficiaries
      const { data: bens } = await supabase
        .from('beneficiaries')
        .select('id, first_name, last_name')
        .eq('policy_id', policyId);

      const options: BeneficiaryOption[] = [];
      
      if (clientName) {
        options.push({ id: 'tomador', name: `${clientName} (Tomador)` });
      }

      if (bens) {
        bens.forEach((b) => {
          options.push({ id: b.id, name: `${b.first_name} ${b.last_name}` });
        });
      }

      setBeneficiaries(options);
    };

    loadBeneficiaries();
  }, [policyId]);

  // Initialize form when editing or preselecting policy
  useEffect(() => {
    if (consumption) {
      setPolicyId(consumption.policy_id);
      setBeneficiaryName(consumption.beneficiary_name || '');
      setUsageTypeId(consumption.usage_type_id);
      setUsageDate(new Date(consumption.usage_date));
      setDescription(consumption.description);
      setAmountBs(consumption.amount_bs?.toString() || '');
      setAmountUsd(consumption.amount_usd?.toString() || '');
    } else if (preselectedPolicyId) {
      setPolicyId(preselectedPolicyId);
    } else {
      resetForm();
    }
  }, [consumption, preselectedPolicyId, open]);

  const resetForm = () => {
    setPolicyId('');
    setBeneficiaryName('');
    setUsageTypeId('');
    setUsageDate(new Date());
    setDescription('');
    setAmountBs('');
    setAmountUsd('');
    setNewTypeName('');
    setShowNewType(false);
  };

  const handleAddNewType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const result = await createTypeMutation.mutateAsync(newTypeName.trim());
      setUsageTypeId(result.id);
      setNewTypeName('');
      setShowNewType(false);
      toast({
        title: 'Tipo agregado',
        description: `Se ha creado el tipo "${result.name}"`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el tipo',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!policyId) {
      toast({ title: 'Error', description: 'Selecciona una póliza', variant: 'destructive' });
      return;
    }
    if (!beneficiaryName.trim()) {
      toast({ title: 'Error', description: 'Selecciona o ingresa el beneficiario', variant: 'destructive' });
      return;
    }
    if (!usageTypeId) {
      toast({ title: 'Error', description: 'Selecciona el tipo de uso', variant: 'destructive' });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast({ title: 'Error', description: 'La descripción debe tener al menos 10 caracteres', variant: 'destructive' });
      return;
    }
    const parsedBs = amountBs ? parseFloat(amountBs) : null;
    const parsedUsd = amountUsd ? parseFloat(amountUsd) : null;
    if (!parsedBs && !parsedUsd) {
      toast({ title: 'Error', description: 'Ingresa al menos un monto (Bs o USD)', variant: 'destructive' });
      return;
    }
    if (usageDate > new Date()) {
      toast({ title: 'Error', description: 'La fecha de uso no puede ser futura', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        policy_id: policyId,
        beneficiary_name: beneficiaryName.trim(),
        usage_type_id: usageTypeId,
        usage_date: format(usageDate, 'yyyy-MM-dd'),
        description: description.trim(),
        amount_bs: parsedBs,
        amount_usd: parsedUsd,
      };

      if (isEditing && consumption) {
        await updateMutation.mutateAsync({ id: consumption.id, ...data });
        toast({ title: 'Consumo actualizado', description: 'El registro ha sido actualizado correctamente.' });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'Consumo registrado', description: 'El consumo ha sido registrado correctamente.' });
      }

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el consumo',
        variant: 'destructive',
      });
    }
  };

  const selectedPolicy = policies.find((p) => p.id === policyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Consumo' : 'Registrar Consumo de Póliza'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Policy selector */}
          <div className="space-y-2">
            <Label>Póliza *</Label>
            <Popover open={policyOpen} onOpenChange={setPolicyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={policyOpen}
                  className="w-full justify-between font-normal"
                  disabled={isEditing}
                >
                  {selectedPolicy
                    ? `${selectedPolicy.policy_number || 'Sin número'} - ${selectedPolicy.client_name}`
                    : 'Seleccionar póliza...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar póliza..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron pólizas.</CommandEmpty>
                    <CommandGroup>
                      {policies.map((policy) => (
                        <CommandItem
                          key={policy.id}
                          value={`${policy.policy_number} ${policy.client_name}`}
                          onSelect={() => {
                            setPolicyId(policy.id);
                            setPolicyOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              policyId === policy.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div>
                            <div className="font-medium">{policy.policy_number || 'Sin número'}</div>
                            <div className="text-xs text-muted-foreground">{policy.client_name}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Beneficiary */}
          <div className="space-y-2">
            <Label>Beneficiario *</Label>
            {beneficiaries.length > 0 ? (
              <Select
                value={beneficiaryName}
                onValueChange={setBeneficiaryName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar beneficiario" />
                </SelectTrigger>
                <SelectContent>
                  {beneficiaries.map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nombre del beneficiario"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
              />
            )}
          </div>

          {/* Usage type */}
          <div className="space-y-2">
            <Label>Tipo de uso *</Label>
            <div className="flex gap-2">
              <Select value={usageTypeId} onValueChange={setUsageTypeId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {usageTypes?.filter((t) => t.is_active).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowNewType(!showNewType)}
                title="Agregar nuevo tipo"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showNewType && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nombre del nuevo tipo"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNewType}
                  disabled={createTypeMutation.isPending}
                >
                  Agregar
                </Button>
              </div>
            )}
          </div>

          {/* Usage date */}
          <div className="space-y-2">
            <Label>Fecha del uso *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !usageDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {usageDate ? format(usageDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={usageDate}
                  onSelect={(date) => date && setUsageDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descripción * (mín. 10 caracteres)</Label>
            <Textarea
              placeholder="Detalle del uso de la póliza..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{description.length}/10 caracteres mínimo</p>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto en Bolívares</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountBs}
                onChange={(e) => setAmountBs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Monto en USD</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">* Al menos uno de los montos debe ser ingresado</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEditing
              ? 'Actualizar'
              : 'Guardar consumo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
