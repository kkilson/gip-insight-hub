import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, DollarSign, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Policy {
  id: string;
  policy_number: string | null;
  start_date: string;
  end_date: string;
  premium: number | null;
  status: string | null;
  insurer?: { name: string; short_name: string | null } | null;
  product?: { name: string; category: string | null } | null;
}

interface PolicySelectionStepProps {
  policies: Policy[];
  selectedPolicyId: string | null;
  onSelect: (policyId: string) => void;
}

const statusColors: Record<string, string> = {
  vigente: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  vencida: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  en_tramite: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

const statusLabels: Record<string, string> = {
  vigente: 'Vigente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  en_tramite: 'En trámite',
};

export function PolicySelectionStep({
  policies,
  selectedPolicyId,
  onSelect,
}: PolicySelectionStepProps) {
  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No hay pólizas registradas para este cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Seleccionar Póliza</h3>
        <p className="text-sm text-muted-foreground">
          Este cliente tiene {policies.length} póliza{policies.length > 1 ? 's' : ''}. 
          Selecciona cuál deseas editar.
        </p>
      </div>

      <RadioGroup
        value={selectedPolicyId || undefined}
        onValueChange={onSelect}
        className="space-y-3"
      >
        {policies.map((policy) => (
          <div key={policy.id}>
            <RadioGroupItem
              value={policy.id}
              id={policy.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={policy.id}
              className="block cursor-pointer"
            >
              <Card className={`transition-all ${
                selectedPolicyId === policy.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {policy.insurer?.name || 'Sin aseguradora'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {policy.product?.name || 'Sin producto'}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[policy.status || 'en_tramite']}>
                      {statusLabels[policy.status || 'en_tramite']}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">
                        {policy.policy_number || 'Sin número'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(policy.start_date), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                    {policy.premium && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${parseFloat(String(policy.premium)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
