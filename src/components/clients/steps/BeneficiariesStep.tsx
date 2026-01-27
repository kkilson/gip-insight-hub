import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Users, AlertCircle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { BeneficiaryFormData } from '../types';

interface BeneficiariesStepProps {
  beneficiaries: BeneficiaryFormData[];
  onChange: (beneficiaries: BeneficiaryFormData[]) => void;
}

const relationshipLabels: Record<string, string> = {
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
      percentage: '100',
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

  const totalPercentage = beneficiaries.reduce(
    (sum, b) => sum + (parseFloat(b.percentage) || 0),
    0
  );

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
        <>
          {totalPercentage !== 100 && beneficiaries.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">
                El total de porcentajes es {totalPercentage}%. Debería sumar 100%.
              </span>
            </div>
          )}

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
                        <SelectContent>
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
                      <Label>Porcentaje (%) *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={beneficiary.percentage}
                        onChange={(e) =>
                          updateBeneficiary(beneficiary.id, { percentage: e.target.value })
                        }
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de nacimiento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !beneficiary.birth_date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {beneficiary.birth_date
                              ? format(
                                  parse(beneficiary.birth_date, 'yyyy-MM-dd', new Date()),
                                  'dd/MM/yyyy'
                                )
                              : 'Seleccionar'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              beneficiary.birth_date
                                ? parse(beneficiary.birth_date, 'yyyy-MM-dd', new Date())
                                : undefined
                            }
                            onSelect={(date) =>
                              updateBeneficiary(beneficiary.id, {
                                birth_date: date ? format(date, 'yyyy-MM-dd') : undefined,
                              })
                            }
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
                          />
                        </PopoverContent>
                      </Popover>
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
        </>
      )}
    </div>
  );
}
