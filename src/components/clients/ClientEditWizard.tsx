import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ClientStep } from './steps/ClientStep';
import { PolicyStep } from './steps/PolicyStep';
import { BeneficiariesStep } from './steps/BeneficiariesStep';
import { ReviewStep } from './steps/ReviewStep';
import type { ClientFormData, PolicyFormData, BeneficiaryFormData } from './types';

interface ClientEditWizardProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, name: 'Cliente', description: 'Datos del tomador' },
  { id: 2, name: 'Póliza', description: 'Información de la póliza' },
  { id: 3, name: 'Beneficiarios', description: 'Agregar beneficiarios' },
  { id: 4, name: 'Revisión', description: 'Confirmar datos' },
];

export function ClientEditWizard({ clientId, open, onOpenChange }: ClientEditWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [policyData, setPolicyData] = useState<PolicyFormData | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryFormData[]>([]);
  const [policyId, setPolicyId] = useState<string | null>(null);

  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing client data
  const { data: existingClient } = useQuery({
    queryKey: ['client-edit', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  // Fetch existing policy
  const { data: existingPolicy } = useQuery({
    queryKey: ['client-policy-edit', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  // Fetch existing beneficiaries
  const { data: existingBeneficiaries } = useQuery({
    queryKey: ['client-beneficiaries-edit', policyId],
    queryFn: async () => {
      if (!policyId) return [];
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('policy_id', policyId);
      if (error) throw error;
      return data;
    },
    enabled: !!policyId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingClient) {
      setClientData({
        identification_type: existingClient.identification_type,
        identification_number: existingClient.identification_number,
        first_name: existingClient.first_name,
        last_name: existingClient.last_name,
        email: existingClient.email || undefined,
        phone: existingClient.phone || undefined,
        mobile: existingClient.mobile || undefined,
        address: existingClient.address || undefined,
        city: existingClient.city || undefined,
        province: existingClient.province || undefined,
        birth_date: existingClient.birth_date || undefined,
        occupation: existingClient.occupation || undefined,
        workplace: existingClient.workplace || undefined,
        notes: existingClient.notes || undefined,
      });
    }
  }, [existingClient]);

  useEffect(() => {
    if (existingPolicy) {
      setPolicyId(existingPolicy.id);
      setPolicyData({
        insurer_id: existingPolicy.insurer_id || undefined,
        product_id: existingPolicy.product_id || undefined,
        policy_number: existingPolicy.policy_number || undefined,
        start_date: existingPolicy.start_date,
        end_date: existingPolicy.end_date,
        status: existingPolicy.status || 'en_tramite',
        premium: existingPolicy.premium?.toString() || undefined,
        payment_frequency: (existingPolicy.payment_frequency === 'unico' ? 'mensual' : existingPolicy.payment_frequency) || 'mensual',
        coverage_amount: existingPolicy.coverage_amount?.toString() || undefined,
        deductible: existingPolicy.deductible?.toString() || undefined,
        notes: existingPolicy.notes || undefined,
        premium_payment_date: (existingPolicy as any).premium_payment_date || undefined,
      });
    }
  }, [existingPolicy]);

  useEffect(() => {
    if (existingBeneficiaries?.length) {
      setBeneficiaries(
        existingBeneficiaries.map((b) => ({
          id: b.id,
          first_name: b.first_name,
          last_name: b.last_name,
          identification_type: b.identification_type || 'cedula',
          identification_number: b.identification_number || undefined,
          relationship: b.relationship,
          percentage: b.percentage.toString(),
          birth_date: b.birth_date || undefined,
          phone: b.phone || undefined,
          email: b.email || undefined,
        }))
      );
    }
  }, [existingBeneficiaries]);

  const { data: insurers } = useQuery({
    queryKey: ['insurers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products', policyData?.insurer_id],
    queryFn: async () => {
      if (!policyData?.insurer_id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('insurer_id', policyData.insurer_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!policyData?.insurer_id,
  });

  const updateClientMutation = useMutation({
    mutationFn: async () => {
      if (!clientData || !policyData || !user || !clientId) {
        throw new Error('Datos incompletos');
      }

      // 1. Update client
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          identification_type: clientData.identification_type,
          identification_number: clientData.identification_number,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          mobile: clientData.mobile || null,
          address: clientData.address || null,
          city: clientData.city || null,
          province: clientData.province || null,
          birth_date: clientData.birth_date || null,
          occupation: clientData.occupation || null,
          workplace: clientData.workplace || null,
          notes: clientData.notes || null,
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      // 2. Update or create policy
      if (policyId) {
        const { error: policyError } = await supabase
          .from('policies')
          .update({
            insurer_id: policyData.insurer_id || null,
            product_id: policyData.product_id || null,
            policy_number: policyData.policy_number || null,
            start_date: policyData.start_date,
            end_date: policyData.end_date,
            status: policyData.status,
            premium: policyData.premium ? parseFloat(policyData.premium) : null,
            payment_frequency: policyData.payment_frequency,
            coverage_amount: policyData.coverage_amount ? parseFloat(policyData.coverage_amount) : null,
            deductible: policyData.deductible ? parseFloat(policyData.deductible) : null,
            notes: policyData.notes || null,
          })
          .eq('id', policyId);

        if (policyError) throw policyError;
      }

      // 3. Update beneficiaries - delete existing and insert new
      if (policyId) {
        await supabase.from('beneficiaries').delete().eq('policy_id', policyId);

        if (beneficiaries.length > 0) {
          const beneficiariesToInsert = beneficiaries.map((b) => ({
            policy_id: policyId,
            first_name: b.first_name,
            last_name: b.last_name,
            identification_type: b.identification_type || 'cedula',
            identification_number: b.identification_number || null,
            relationship: b.relationship,
            percentage: parseFloat(b.percentage),
            birth_date: b.birth_date || null,
            phone: b.phone || null,
            email: b.email || null,
          }));

          const { error: beneficiariesError } = await supabase
            .from('beneficiaries')
            .insert(beneficiariesToInsert);

          if (beneficiariesError) throw beneficiariesError;
        }
      }

      // 4. Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'update',
        module: 'clients',
        record_id: clientId,
        record_type: 'client',
        details: {
          client_name: `${clientData.first_name} ${clientData.last_name}`,
          policy_number: policyData.policy_number,
        },
      });

      return { clientId };
    },
    onSuccess: () => {
      toast({
        title: 'Cliente actualizado',
        description: 'Los datos del cliente han sido actualizados exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el cliente',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setClientData(null);
    setPolicyData(null);
    setBeneficiaries([]);
    setPolicyId(null);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    updateClientMutation.mutate();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return clientData && clientData.identification_number && clientData.first_name && clientData.last_name;
      case 2:
        return policyData && policyData.start_date && policyData.end_date;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center flex-1 ${
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {currentStep === 1 && <ClientStep data={clientData} onChange={setClientData} />}
          {currentStep === 2 && (
            <PolicyStep
              data={policyData}
              onChange={setPolicyData}
              insurers={insurers || []}
              products={products || []}
            />
          )}
          {currentStep === 3 && (
            <BeneficiariesStep beneficiaries={beneficiaries} onChange={setBeneficiaries} />
          )}
          {currentStep === 4 && (
            <ReviewStep
              clientData={clientData}
              policyData={policyData}
              beneficiaries={beneficiaries}
              insurers={insurers || []}
              products={products || []}
            />
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={updateClientMutation.isPending}>
              {updateClientMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
