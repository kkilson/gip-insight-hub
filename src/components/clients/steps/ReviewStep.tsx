import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, FileText, Users, CheckCircle2 } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientFormData, PolicyFormData, BeneficiaryFormData, Insurer, Product } from '../types';
import { formatInstallment } from '@/lib/premiumCalculations';

interface ReviewStepProps {
  clientData: ClientFormData | null;
  policyData: PolicyFormData | null;
  beneficiaries: BeneficiaryFormData[];
  insurers: Insurer[];
  products: Product[];
}

const identificationLabels: Record<string, string> = {
  cedula: 'Cédula',
  pasaporte: 'Pasaporte',
  rif: 'RIF',
  otro: 'Otro',
};

const statusLabels: Record<string, string> = {
  vigente: 'Vigente',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  en_tramite: 'En trámite',
};

const frequencyLabels: Record<string, string> = {
  mensual: 'Mensual',
  mensual_10_cuotas: 'Mensual 10 cuotas',
  mensual_12_cuotas: 'Mensual 12 cuotas',
  bimensual: 'Bimensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const relationshipLabels: Record<string, string> = {
  tomador_titular: 'Tomador y titular',
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  hermano: 'Hermano/a',
  otro: 'Otro',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

function formatCurrency(value?: string) {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function ReviewStep({
  clientData,
  policyData,
  beneficiaries,
  insurers,
  products,
}: ReviewStepProps) {
  const insurer = insurers.find((i) => i.id === policyData?.insurer_id);
  const product = products.find((p) => p.id === policyData?.product_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <CheckCircle2 className="h-5 w-5" />
        <h3 className="font-semibold">Revisión de Datos</h3>
      </div>

      {/* Client Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clientData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>
                <p className="font-medium">{clientData.first_name} {clientData.last_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {identificationLabels[clientData.identification_type]}:
                </span>
                <p className="font-medium">{clientData.identification_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{clientData.email || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Celular:</span>
                <p className="font-medium">{clientData.mobile || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nacimiento:</span>
                <p className="font-medium">{formatDate(clientData.birth_date)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ciudad:</span>
                <p className="font-medium">
                  {clientData.city ? `${clientData.city}, ${clientData.province || ''}` : '-'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos de cliente</p>
          )}
        </CardContent>
      </Card>

      {/* Policy Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Datos de la Póliza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {policyData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Aseguradora:</span>
                <p className="font-medium">{insurer?.name || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Producto:</span>
                <p className="font-medium">{product?.name || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">{policyData.policy_number || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="outline" className="font-normal">
                  {statusLabels[policyData.status]}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Vigencia:</span>
                <p className="font-medium">
                  {formatDate(policyData.start_date)} - {formatDate(policyData.end_date)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Frecuencia:</span>
                <p className="font-medium">{frequencyLabels[policyData.payment_frequency]}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Prima Anual:</span>
                <p className="font-medium">{formatCurrency(policyData.premium)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cuota:</span>
                <p className="font-medium">{formatInstallment(policyData.premium, policyData.payment_frequency)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Suma asegurada:</span>
                <p className="font-medium">{formatCurrency(policyData.coverage_amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deducible:</span>
                <p className="font-medium">{formatCurrency(policyData.deductible)}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos de póliza</p>
          )}
        </CardContent>
      </Card>

      {/* Beneficiaries Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Beneficiarios ({beneficiaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {beneficiaries.length > 0 ? (
            <div className="space-y-3">
              {beneficiaries.map((b, index) => (
                <div key={b.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="font-medium">{b.first_name} {b.last_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parentesco:</span>
                      <p className="font-medium">{relationshipLabels[b.relationship]}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cédula:</span>
                      <p className="font-medium">{b.identification_number || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sin beneficiarios registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
