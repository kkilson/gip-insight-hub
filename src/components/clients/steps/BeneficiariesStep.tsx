import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { BeneficiaryFormData } from '../types';

interface BeneficiariesStepProps {
  beneficiaries: BeneficiaryFormData[];
  onChange: (beneficiaries: BeneficiaryFormData[]) => void;
}

const relationshipLabels: Record<string, string> = {
  tomador_titular: 'Tomador y titular',
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  hermano: 'Hermano/a',
  otro: 'Otro',
};

export function BeneficiariesStep({ beneficiaries, onChange }: BeneficiariesStepProps) {
  const addBeneficiary = () => {
    const newBeneficiary: BeneficiaryFormData = {
      id: crypto.randomUUID(),
      first_name: '',
      last_name: '',
      relationship: 'conyuge',
    };
    onChange([...beneficiaries, newBeneficiary]);
  };

  const removeBeneficiary = (id: string) => {
    onChange(beneficiaries.filter((b) => b.id !== id));
  };

  const updateBeneficiary = (id: string, updates: Partial<BeneficiaryFormData>) => {
    onChange(
      beneficiaries.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Beneficiarios</h3>
        </div>
        <Button onClick={addBeneficiary} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {beneficiaries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay beneficiarios agregados.
            </p>
            <p className="text-xs text-muted-foreground">
              Los beneficiarios son opcionales y pueden agregarse después.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {beneficiaries.map((beneficiary, index) => (
            <Card key={beneficiary.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">
                    Beneficiario {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBeneficiary(beneficiary.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nombres *</Label>
                    <Input
                      value={beneficiary.first_name}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, { first_name: e.target.value })
                      }
                      placeholder="Nombres"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Apellidos *</Label>
                    <Input
                      value={beneficiary.last_name}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, { last_name: e.target.value })
                      }
                      placeholder="Apellidos"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Parentesco *</Label>
                    <Select
                      value={beneficiary.relationship}
                      onValueChange={(v) =>
                        updateBeneficiary(beneficiary.id, {
                          relationship: v as BeneficiaryFormData['relationship'],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-popover border shadow-lg" position="popper" sideOffset={4}>
                        {Object.entries(relationshipLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cédula</Label>
                    <Input
                      value={beneficiary.identification_number || ''}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, {
                          identification_number: e.target.value,
                        })
                      }
                      placeholder="Número de cédula"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de nacimiento</Label>
                    <Input
                      type="date"
                      value={beneficiary.birth_date || ''}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, {
                          birth_date: e.target.value || undefined,
                        })
                      }
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={beneficiary.phone || ''}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, { phone: e.target.value })
                      }
                      placeholder="0991234567"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Correo electrónico</Label>
                    <Input
                      type="email"
                      value={beneficiary.email || ''}
                      onChange={(e) =>
                        updateBeneficiary(beneficiary.id, { email: e.target.value })
                      }
                      placeholder="correo@ejemplo.com"
                      maxLength={255}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
