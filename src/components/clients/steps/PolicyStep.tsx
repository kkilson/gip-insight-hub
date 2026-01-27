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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileText } from 'lucide-react';
import { format, parse, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { PolicyFormData, Insurer, Product } from '../types';

interface PolicyStepProps {
  data: PolicyFormData | null;
  onChange: (data: PolicyFormData) => void;
  insurers: Insurer[];
  products: Product[];
}

export function PolicyStep({ data, onChange, insurers, products }: PolicyStepProps) {
  const today = new Date();
  const nextYear = addYears(today, 1);

  const formData: PolicyFormData = data || {
    start_date: format(today, 'yyyy-MM-dd'),
    end_date: format(nextYear, 'yyyy-MM-dd'),
    status: 'en_tramite',
    payment_frequency: 'mensual',
  };

  const updateField = <K extends keyof PolicyFormData>(
    field: K,
    value: PolicyFormData[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  const startDate = formData.start_date
    ? parse(formData.start_date, 'yyyy-MM-dd', new Date())
    : undefined;

  const endDate = formData.end_date
    ? parse(formData.end_date, 'yyyy-MM-dd', new Date())
    : undefined;

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
            <SelectContent>
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
            <SelectContent>
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
            <SelectContent>
              <SelectItem value="en_tramite">En trámite</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <Label>Fecha de inicio *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) =>
                  updateField('start_date', date ? format(date, 'yyyy-MM-dd') : '')
                }
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha de vencimiento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP', { locale: es }) : 'Seleccionar fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) =>
                  updateField('end_date', date ? format(date, 'yyyy-MM-dd') : '')
                }
                disabled={(date) => startDate && date < startDate}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
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
            <SelectContent>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
              <SelectItem value="unico">Pago único</SelectItem>
            </SelectContent>
          </Select>
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
