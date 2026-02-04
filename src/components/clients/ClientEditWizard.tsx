import { useState, useEffect, useMemo } from 'react';
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
import { PolicySelectionStep } from './steps/PolicySelectionStep';
import type { ClientFormData, PolicyFormData, BeneficiaryFormData } from './types';
import { getUserFriendlyError } from '@/lib/errorMessages';

interface ClientEditWizardProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientEditWizard({ clientId, open, onOpenChange }: ClientEditWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [policyData, setPolicyData] = useState<PolicyFormData | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryFormData[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

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

  // Fetch ALL policies for this client
  const { data: clientPolicies } = useQuery({
    queryKey: ['client-policies-edit', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('policies')
        .select(`
          *,
          insurer:insurers(name, short_name),
          product:products(name, category)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  // Determine if client has multiple policies
  const hasMultiplePolicies = useMemo(() => {
    return (clientPolicies?.length || 0) > 1;
  }, [clientPolicies]);

  // Dynamic steps based on number of policies
  const steps = useMemo(() => {
    if (hasMultiplePolicies) {
      return [
        { id: 1, name: 'Cliente', description: 'Datos del tomador' },
        { id: 2, name: 'Seleccionar', description: 'Elegir póliza' },
        { id: 3, name: 'Póliza', description: 'Información de la póliza' },
        { id: 4, name: 'Beneficiarios', description: 'Agregar beneficiarios' },
        { id: 5, name: 'Revisión', description: 'Confirmar datos' },
      ];
    }
    return [
      { id: 1, name: 'Cliente', description: 'Datos del tomador' },
      { id: 2, name: 'Póliza', description: 'Información de la póliza' },
      { id: 3, name: 'Beneficiarios', description: 'Agregar beneficiarios' },
      { id: 4, name: 'Revisión', description: 'Confirmar datos' },
    ];
  }, [hasMultiplePolicies]);

  const totalSteps = steps.length;

  // Get the selected policy data
  const selectedPolicy = useMemo(() => {
    if (!selectedPolicyId || !clientPolicies) return null;
    return clientPolicies.find(p => p.id === selectedPolicyId) || null;
  }, [selectedPolicyId, clientPolicies]);

  // Fetch existing beneficiaries for the selected policy
  const { data: existingBeneficiaries } = useQuery({
    queryKey: ['client-beneficiaries-edit', selectedPolicyId],
    queryFn: async () => {
      if (!selectedPolicyId) return [];
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('policy_id', selectedPolicyId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPolicyId,
  });

  // Populate form with existing client data
  useEffect(() => {
    if (existingClient) {
      const idType = existingClient.identification_type === 'ruc' 
        ? 'rif' 
        : existingClient.identification_type;
      
      setClientData({
        identification_type: idType as ClientFormData['identification_type'],
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

  // Auto-select policy if there's only one
  useEffect(() => {
    if (clientPolicies?.length === 1 && !selectedPolicyId) {
      setSelectedPolicyId(clientPolicies[0].id);
    }
  }, [clientPolicies, selectedPolicyId]);

  // Populate policy data when a policy is selected
  useEffect(() => {
    if (selectedPolicy) {
      setPolicyData({
        insurer_id: selectedPolicy.insurer_id || undefined,
        product_id: selectedPolicy.product_id || undefined,
        policy_number: selectedPolicy.policy_number || undefined,
        start_date: selectedPolicy.start_date,
        end_date: selectedPolicy.end_date,
        status: selectedPolicy.status || 'en_tramite',
        premium: selectedPolicy.premium?.toString() || undefined,
        payment_frequency: (selectedPolicy.payment_frequency === 'unico' ? 'mensual' : selectedPolicy.payment_frequency) || 'mensual',
        coverage_amount: selectedPolicy.coverage_amount?.toString() || undefined,
        deductible: selectedPolicy.deductible?.toString() || undefined,
        notes: selectedPolicy.notes || undefined,
        premium_payment_date: (selectedPolicy as any).premium_payment_date || undefined,
      });
    }
  }, [selectedPolicy]);

  // Populate beneficiaries when they load
  useEffect(() => {
    if (existingBeneficiaries?.length) {
      setBeneficiaries(
        existingBeneficiaries.map((b) => {
          const idType = b.identification_type === 'ruc' 
            ? 'rif' 
            : (b.identification_type || 'cedula');
          
          return {
            id: b.id,
            first_name: b.first_name,
            last_name: b.last_name,
            identification_type: idType as BeneficiaryFormData['identification_type'],
            identification_number: b.identification_number || undefined,
            relationship: b.relationship as BeneficiaryFormData['relationship'],
            birth_date: b.birth_date || undefined,
            phone: b.phone || undefined,
            email: b.email || undefined,
          };
        })
      );
    } else {
      setBeneficiaries([]);
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

  const { data: advisors } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing policy advisors
  const { data: existingPolicyAdvisors } = useQuery({
    queryKey: ['policy-advisors', selectedPolicyId],
    queryFn: async () => {
      if (!selectedPolicyId) return [];
      const { data, error } = await supabase
        .from('policy_advisors')
        .select('*')
        .eq('policy_id', selectedPolicyId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPolicyId,
  });

  // Populate advisor data from policy_advisors
  useEffect(() => {
    if (existingPolicyAdvisors?.length && policyData) {
      const primary = existingPolicyAdvisors.find(a => a.advisor_role === 'principal');
      const secondary = existingPolicyAdvisors.find(a => a.advisor_role === 'secundario');
      
      setPolicyData(prev => prev ? {
        ...prev,
        primary_advisor_id: primary?.advisor_id || undefined,
        secondary_advisor_id: secondary?.advisor_id || undefined,
      } : prev);
    }
  }, [existingPolicyAdvisors]);

  const updateClientMutation = useMutation({
    mutationFn: async () => {
      if (!clientData || !policyData || !user || !clientId || !selectedPolicyId) {
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

      // 2. Update the selected policy (including premium_payment_date)
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
          premium_payment_date: policyData.premium_payment_date || null,
        })
        .eq('id', selectedPolicyId);

      if (policyError) throw policyError;

      // 3. Update beneficiaries - delete existing and insert new
      await supabase.from('beneficiaries').delete().eq('policy_id', selectedPolicyId);

      if (beneficiaries.length > 0) {
        const beneficiariesToInsert = beneficiaries.map((b) => ({
          policy_id: selectedPolicyId,
          first_name: b.first_name,
          last_name: b.last_name,
          identification_type: b.identification_type || 'cedula',
          identification_number: b.identification_number || null,
          relationship: b.relationship,
          percentage: 100,
          birth_date: b.birth_date || null,
          phone: b.phone || null,
          email: b.email || null,
        }));

        const { error: beneficiariesError } = await supabase
          .from('beneficiaries')
          .insert(beneficiariesToInsert);

        if (beneficiariesError) throw beneficiariesError;
      }

      // 4. Update policy advisors - delete existing and insert new
      await supabase.from('policy_advisors').delete().eq('policy_id', selectedPolicyId);
      
      const advisorsToInsert = [];
      if (policyData.primary_advisor_id) {
        advisorsToInsert.push({
          policy_id: selectedPolicyId,
          advisor_id: policyData.primary_advisor_id,
          advisor_role: 'principal',
        });
      }
      if (policyData.secondary_advisor_id) {
        advisorsToInsert.push({
          policy_id: selectedPolicyId,
          advisor_id: policyData.secondary_advisor_id,
          advisor_role: 'secundario',
        });
      }
      
      if (advisorsToInsert.length > 0) {
        const { error: advisorsError } = await supabase
          .from('policy_advisors')
          .insert(advisorsToInsert);
        if (advisorsError) throw advisorsError;
      }

      // 5. Create audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        action: 'update',
        module: 'clients',
        record_id: clientId,
        record_type: 'client',
        details: {
          client_name: `${clientData.first_name} ${clientData.last_name}`,
          policy_id: selectedPolicyId,
          policy_number: policyData.policy_number,
          primary_advisor_id: policyData.primary_advisor_id || null,
          secondary_advisor_id: policyData.secondary_advisor_id || null,
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
      queryClient.invalidateQueries({ queryKey: ['client-policies', clientId] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setClientData(null);
    setPolicyData(null);
    setBeneficiaries([]);
    setSelectedPolicyId(null);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
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

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicyId(policyId);
    // Reset beneficiaries when changing policy
    setBeneficiaries([]);
  };

  // Determine which step content to show based on whether we have multiple policies
  const getStepContent = () => {
    if (hasMultiplePolicies) {
      // With multiple policies: 1=Client, 2=PolicySelection, 3=Policy, 4=Beneficiaries, 5=Review
      switch (currentStep) {
        case 1:
          return <ClientStep data={clientData} onChange={setClientData} />;
        case 2:
          return (
            <PolicySelectionStep
              policies={clientPolicies || []}
              selectedPolicyId={selectedPolicyId}
              onSelect={handlePolicySelect}
            />
          );
        case 3:
          return (
            <PolicyStep
              data={policyData}
              onChange={setPolicyData}
              insurers={insurers || []}
              products={products || []}
              advisors={advisors || []}
            />
          );
        case 4:
          return <BeneficiariesStep beneficiaries={beneficiaries} onChange={setBeneficiaries} />;
        case 5:
          return (
            <ReviewStep
              clientData={clientData}
              policyData={policyData}
              beneficiaries={beneficiaries}
              insurers={insurers || []}
              products={products || []}
            />
          );
        default:
          return null;
      }
    } else {
      // Single policy: 1=Client, 2=Policy, 3=Beneficiaries, 4=Review
      switch (currentStep) {
        case 1:
          return <ClientStep data={clientData} onChange={setClientData} />;
        case 2:
          return (
            <PolicyStep
              data={policyData}
              onChange={setPolicyData}
              insurers={insurers || []}
              products={products || []}
              advisors={advisors || []}
            />
          );
        case 3:
          return <BeneficiariesStep beneficiaries={beneficiaries} onChange={setBeneficiaries} />;
        case 4:
          return (
            <ReviewStep
              clientData={clientData}
              policyData={policyData}
              beneficiaries={beneficiaries}
              insurers={insurers || []}
              products={products || []}
            />
          );
        default:
          return null;
      }
    }
  };

  const canProceed = () => {
    if (hasMultiplePolicies) {
      switch (currentStep) {
        case 1:
          return clientData && clientData.identification_number && clientData.first_name && clientData.last_name;
        case 2:
          return !!selectedPolicyId;
        case 3:
          return policyData && policyData.start_date && policyData.end_date;
        case 4:
          return true;
        case 5:
          return true;
        default:
          return false;
      }
    } else {
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
    }
  };

  const progress = (currentStep / totalSteps) * 100;

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
          {getStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {currentStep < totalSteps ? (
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
