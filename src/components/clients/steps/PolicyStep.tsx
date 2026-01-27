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
import { FileText } from 'lucide-react';
import { format, parse, addYears, addMonths, addDays } from 'date-fns';
import type { PolicyFormData, Insurer, Product } from '../types';

interface PolicyStepProps {
  data: PolicyFormData | null;
  onChange: (data: PolicyFormData) => void;
  insurers: Insurer[];
  products: Product[];
}

// Calculate next premium payment date based on start date and frequency
const calculatePremiumPaymentDate = (startDate: string, frequency: string): string => {
  if (!startDate) return '';
  
  const start = parse(startDate, 'yyyy-MM-dd', new Date());
  const today = new Date();
  let paymentDate = start;
  
  // Calculate interval based on frequency
  const getNextPaymentDate = (current: Date): Date => {
    switch (frequency) {
      case 'mensual':
      case 'mensual_10_cuotas':
      case 'mensual_12_cuotas':
        return addMonths(current, 1);
      case 'bimensual':
        return addMonths(current, 2);
      case 'trimestral':
        return addMonths(current, 3);
      case 'semestral':
        return addMonths(current, 6);
      case 'anual':
        return addYears(current, 1);
      default:
        return addMonths(current, 1);
    }
  };
  
  // Find the next payment date that's >= today
  while (paymentDate < today) {
    paymentDate = getNextPaymentDate(paymentDate);
  }
  
  return format(paymentDate, 'yyyy-MM-dd');
};

export function PolicyStep({ data, onChange, insurers, products }: PolicyStepProps) {
  const today = new Date();
  const nextYear = addYears(today, 1);

  const formData: PolicyFormData = data || {
    start_date: format(today, 'yyyy-MM-dd'),
    end_date: format(nextYear, 'yyyy-MM-dd'),
    status: 'en_tramite',
    payment_frequency: 'mensual',
    premium_payment_date: format(today, 'yyyy-MM-dd'),
  };

  const updateField = <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => {
    const newData = { ...formData, [field]: value };
    
    // Auto-calculate premium payment date when start_date or payment_frequency changes
    if (field === 'start_date' || field === 'payment_frequency') {
      const startDate = field === 'start_date' ? (value as string) : formData.start_date;
      const frequency = field === 'payment_frequency' ? (value as string) : formData.payment_frequency;
      newData.premium_payment_date = calculatePremiumPaymentDate(startDate, frequency);
    }
    
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <FileText className="h-5 w-5" />
        <h3 className="font-semibold">Datos de la Póliza</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insurer & Product */}
        <div className="space-y-2">
          <Label>Aseguradora</Label>
          <Select
            value={formData.insurer_id || ''}
            onValueChange={(v) => {
              updateField('insurer_id', v);
              updateField('product_id', undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar aseguradora" />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-background">
              {insurers.map((insurer) => (
                <SelectItem key={insurer.id} value={insurer.id}>
                  {insurer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Producto</Label>
          <Select
            value={formData.product_id || ''}
            onValueChange={(v) => updateField('product_id', v)}
            disabled={!formData.insurer_id || products.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !formData.insurer_id 
                  ? 'Primero seleccione aseguradora' 
                  : products.length === 0 
                    ? 'Sin productos disponibles'
                    : 'Seleccionar producto'
              } />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-background">
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="policy_number">Número de póliza</Label>
          <Input
            id="policy_number"
            value={formData.policy_number || ''}
            onChange={(e) => updateField('policy_number', e.target.value)}
            placeholder="Ej: POL-2024-001234"
            maxLength={50}
          />
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => updateField('status', v as PolicyFormData['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-background">
              <SelectItem value="en_tramite">En trámite</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dates - Manual Input */}
        <div className="space-y-2">
          <Label htmlFor="start_date">Fecha de inicio *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Fecha de Renovación de póliza *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => updateField('end_date', e.target.value)}
            min={formData.start_date}
            required
          />
        </div>

        {/* Financial */}
        <div className="space-y-2">
          <Label htmlFor="premium">Prima (USD)</Label>
          <Input
            id="premium"
            type="number"
            step="0.01"
            min="0"
            value={formData.premium || ''}
            onChange={(e) => updateField('premium', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Frecuencia de pago</Label>
          <Select
            value={formData.payment_frequency}
            onValueChange={(v) => updateField('payment_frequency', v as PolicyFormData['payment_frequency'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200] bg-background">
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="mensual_10_cuotas">Mensual 10 cuotas</SelectItem>
              <SelectItem value="mensual_12_cuotas">Mensual 12 cuotas</SelectItem>
              <SelectItem value="bimensual">Bimensual</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Premium Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="premium_payment_date">Fecha de pago de prima</Label>
          <Input
            id="premium_payment_date"
            type="date"
            value={formData.premium_payment_date || ''}
            onChange={(e) => updateField('premium_payment_date', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Se calcula automáticamente según fecha de inicio y frecuencia de pago
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverage_amount">Suma asegurada (USD)</Label>
          <Input
            id="coverage_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.coverage_amount || ''}
            onChange={(e) => updateField('coverage_amount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deductible">Deducible (USD)</Label>
          <Input
            id="deductible"
            type="number"
            step="0.01"
            min="0"
            value={formData.deductible || ''}
            onChange={(e) => updateField('deductible', e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="policy_notes">Notas de la póliza</Label>
          <Textarea
            id="policy_notes"
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Coberturas especiales, exclusiones, observaciones..."
            rows={3}
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
